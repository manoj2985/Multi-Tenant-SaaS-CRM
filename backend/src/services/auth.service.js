const crypto = require('crypto');
const { prisma } = require('../config/db');
const config = require('../config/env');
const userRepository = require('../repositories/user.repository');
const companyRepository = require('../repositories/company.repository');
const refreshTokenRepository = require('../repositories/refreshToken.repository');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, hashToken } = require('../utils/token');
const ApiError = require('../utils/apiError');
const auditService = require('./audit.service');
const emailService = require('./email.service');
const { checkLockout, recordFailedLogin, resetFailedLogins } = require('../middleware/lockout.middleware');

class AuthService {
  /**
   * Registers a new Company and its initial COMPANY_ADMIN user atomically
   */
  async registerCompany(dto) {
    const existingUser = await userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ApiError(400, 'User email is already registered', true, null, 'DUPLICATE_EMAIL');
    }

    const existingCompany = await companyRepository.findByEmail(dto.email);
    if (existingCompany) {
      throw new ApiError(400, 'Company with this email is already registered', true, null, 'DUPLICATE_COMPANY_EMAIL');
    }

    const passHash = await hashPassword(dto.password);

    const result = await prisma.$transaction(async (tx) => {
      const company = await companyRepository.create({
        name: dto.companyName,
        email: dto.email,
        phone: dto.phone || null,
        industry: dto.industry || null,
        address: dto.address || null,
        subscriptionPlan: 'FREE',
        status: 'ACTIVE'
      }, tx);

      const user = await userRepository.create({
        companyId: company.id,
        name: dto.name,
        email: dto.email,
        phone: dto.phone || null,
        passwordHash: passHash,
        role: 'COMPANY_ADMIN',
        status: 'ACTIVE'
      }, tx);

      await tx.subscription.create({
        data: {
          companyId: company.id,
          plan: 'FREE',
          status: 'ACTIVE'
        }
      });

      await tx.usage.create({
        data: {
          companyId: company.id,
          usersCount: 1,
          customersCount: 0,
          leadsCount: 0,
          dealsCount: 0,
          tasksCount: 0,
          storageBytes: 0
        }
      });

      return { company, user };
    });

    const tokenPayload = {
      userId: result.user.id,
      companyId: result.company.id,
      role: result.user.role
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await refreshTokenRepository.createToken({
      tokenHash,
      userId: result.user.id,
      expiresAt
    });

    // Send Welcome Email asynchronously
    emailService.sendWelcomeEmail({
      to: result.user.email,
      name: result.user.name,
      companyName: result.company.name,
      loginUrl: `${config.frontendUrl}/login`
    }).catch(() => {});

    return {
      success: true,
      message: 'Company and administrator registered successfully',
      accessToken,
      refreshToken,
      user: {
        id: result.user.id,
        companyId: result.company.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        status: result.user.status
      },
      company: {
        id: result.company.id,
        name: result.company.name,
        status: result.company.status,
        subscriptionPlan: result.company.subscriptionPlan
      }
    };
  }

  /**
   * User Login Verification with Brute-Force Lockout Protection
   */
  async login(dto, req = null) {
    // Check Brute-force Lockout
    checkLockout(dto.email);

    const user = await userRepository.findByEmail(dto.email);
    if (!user) {
      recordFailedLogin(dto.email);
      throw new ApiError(401, 'Invalid credentials', true, null, 'INVALID_CREDENTIALS');
    }

    const isMatch = await comparePassword(dto.password, user.passwordHash);
    if (!isMatch) {
      recordFailedLogin(dto.email);
      await auditService.logAudit({
        companyId: user.companyId,
        userId: user.id,
        action: 'LOGIN_FAILED',
        entityType: 'User',
        entityId: user.id,
        description: `Failed login attempt for ${user.email}`,
        req
      });
      throw new ApiError(401, 'Invalid credentials', true, null, 'INVALID_CREDENTIALS');
    }

    if (user.status !== 'ACTIVE') {
      throw new ApiError(401, `User account is ${user.status.toLowerCase()}`, true, null, 'ACCOUNT_INACTIVE');
    }

    if (user.company && user.company.status === 'SUSPENDED') {
      throw new ApiError(403, 'Company account is suspended', true, null, 'TENANT_SUSPENDED');
    }

    // Reset failed login counter on successful login
    resetFailedLogins(dto.email);

    const tokenPayload = {
      userId: user.id,
      companyId: user.companyId,
      role: user.role
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await refreshTokenRepository.createToken({
      tokenHash,
      userId: user.id,
      expiresAt
    });

    await auditService.logAudit({
      companyId: user.companyId,
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      entityType: 'User',
      entityId: user.id,
      description: `User ${user.email} logged in successfully`,
      req
    });

    return {
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        companyId: user.companyId,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    };
  }

  /**
   * Refresh Access Token with Token Rotation
   */
  async refreshToken(refreshTokenString) {
    try {
      verifyRefreshToken(refreshTokenString);
    } catch {
      throw new ApiError(401, 'Invalid or expired refresh token', true, null, 'INVALID_REFRESH_TOKEN');
    }

    const tokenHash = hashToken(refreshTokenString);
    const storedToken = await refreshTokenRepository.findByHash(tokenHash);

    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
      throw new ApiError(401, 'Refresh token has been revoked or expired', true, null, 'INVALID_REFRESH_TOKEN');
    }

    const user = storedToken.user;
    if (!user || user.status !== 'ACTIVE' || (user.company && user.company.status === 'SUSPENDED')) {
      throw new ApiError(403, 'User account or company is inactive or suspended', true, null, 'TENANT_SUSPENDED');
    }

    const tokenPayload = {
      userId: user.id,
      companyId: user.companyId,
      role: user.role
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    // Revoke current refresh token and save new token (Token Rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true, revokedAt: new Date() }
    });

    const newHash = hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await refreshTokenRepository.createToken({
      tokenHash: newHash,
      userId: user.id,
      expiresAt
    });

    return {
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  /**
   * Logout user by revoking current refresh token
   */
  async logout(refreshTokenString, req = null) {
    if (refreshTokenString) {
      const tokenHash = hashToken(refreshTokenString);
      const tokenRecord = await refreshTokenRepository.findByHash(tokenHash);
      if (tokenRecord) {
        await prisma.refreshToken.update({
          where: { id: tokenRecord.id },
          data: { revoked: true, revokedAt: new Date() }
        });
        if (req && req.user) {
          await auditService.logAudit({
            companyId: req.user.companyId,
            userId: req.user.id,
            action: 'LOGOUT',
            entityType: 'User',
            entityId: req.user.id,
            description: `User ${req.user.email} logged out`,
            req
          });
        }
      }
    }
    return { success: true, message: 'Logged out successfully' };
  }

  /**
   * Invalidate ALL active refresh tokens for the user
   */
  async logoutAll(userId, req = null) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found', true, null, 'USER_NOT_FOUND');
    }

    await prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true, revokedAt: new Date() }
    });

    await auditService.logAudit({
      companyId: user.companyId,
      userId: user.id,
      action: 'LOGOUT_ALL',
      entityType: 'User',
      entityId: user.id,
      description: `User ${user.email} invalidated all active sessions`,
      req
    });

    return { success: true, message: 'All active sessions logged out successfully' };
  }

  /**
   * Password Reset Request (Forgot Password)
   */
  async forgotPassword(dto, req = null) {
    const genericResponse = {
      success: true,
      message: 'If an account exists for this email, a password reset link has been sent.'
    };

    if (!dto.email) return genericResponse;

    const user = await userRepository.findByEmail(dto.email);
    if (!user) return genericResponse;

    // Generate secure random reset token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: resetTokenHash,
        expiresAt
      }
    });

    const resetUrl = `${config.frontendUrl}/reset-password?token=${rawToken}`;

    // Send email asynchronously
    emailService.sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
      expiresInMinutes: 60
    }).catch(() => {});

    await auditService.logAudit({
      companyId: user.companyId,
      userId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      entityType: 'User',
      entityId: user.id,
      description: `Password reset requested for ${user.email}`,
      req
    });

    return genericResponse;
  }

  /**
   * Perform Password Reset with Token Verification & Session Revocation
   */
  async resetPassword(dto, req = null) {
    const { token, newPassword } = dto;
    if (!token || !newPassword) {
      throw new ApiError(400, 'Token and new password are required', true, null, 'VALIDATION_ERROR');
    }

    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const storedToken = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash: resetTokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    });

    if (!storedToken) {
      throw new ApiError(400, 'Invalid or expired password reset token', true, null, 'INVALID_RESET_TOKEN');
    }

    const newPassHash = await hashPassword(newPassword);

    await prisma.$transaction([
      // Update password hash
      prisma.user.update({
        where: { id: storedToken.userId },
        data: { passwordHash: newPassHash }
      }),
      // Mark reset token used
      prisma.passwordResetToken.update({
        where: { id: storedToken.id },
        data: { usedAt: new Date() }
      }),
      // Revoke all existing refresh tokens for security
      prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId, revoked: false },
        data: { revoked: true, revokedAt: new Date() }
      })
    ]);

    await auditService.logAudit({
      companyId: storedToken.user.companyId,
      userId: storedToken.user.id,
      action: 'PASSWORD_RESET_COMPLETED',
      entityType: 'User',
      entityId: storedToken.user.id,
      description: `Password reset successfully completed for ${storedToken.user.email}`,
      req
    });

    return {
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    };
  }
}

module.exports = new AuthService();
