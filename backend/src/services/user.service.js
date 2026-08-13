const userRepository = require('../repositories/user.repository');
const { hashPassword } = require('../utils/password');
const ApiError = require('../utils/apiError');

class UserService {
  /**
   * Create new user within company
   */
  async createUser(requestingUser, dto) {
    // Role Hierarchy & Permission Check
    if (requestingUser.role === 'SALES_EXECUTIVE') {
      throw new ApiError(403, 'Sales executives cannot manage users', true, '', 'FORBIDDEN');
    }

    if (requestingUser.role === 'SALES_MANAGER' && dto.role === 'COMPANY_ADMIN') {
      throw new ApiError(403, 'Sales managers cannot create company administrators', true, '', 'FORBIDDEN');
    }

    if (dto.role === 'SUPER_ADMIN' && requestingUser.role !== 'SUPER_ADMIN') {
      throw new ApiError(403, 'Only super administrators can assign super admin role', true, '', 'FORBIDDEN');
    }

    const existingUser = await userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ApiError(400, 'User with this email already exists', true, '', 'DUPLICATE_EMAIL');
    }

    const passwordHash = await hashPassword(dto.password);

    const newUser = await userRepository.create({
      companyId: requestingUser.companyId,
      name: dto.name,
      email: dto.email,
      phone: dto.phone || null,
      passwordHash,
      role: dto.role || 'SALES_EXECUTIVE',
      status: 'ACTIVE'
    });

    const { passwordHash: _, ...userWithoutPassword } = newUser; // eslint-disable-line no-unused-vars
    return {
      success: true,
      message: 'User created successfully',
      data: userWithoutPassword
    };
  }

  /**
   * Get Current Authenticated User Profile
   */
  async getCurrentUserProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found', true, '', 'NOT_FOUND');
    }

    const { passwordHash: _, refreshTokens: __, ...userWithoutSecrets } = user; // eslint-disable-line no-unused-vars
    return {
      success: true,
      data: userWithoutSecrets
    };
  }

  /**
   * Get List of Users for Requesting User's Tenant Company
   */
  async getCompanyUsers(requestingUser) {
    const users = await userRepository.findByCompany(requestingUser.companyId);
    return {
      success: true,
      data: users
    };
  }

  /**
   * Get Specific User by ID with Tenant Isolation Enforcement
   */
  async getUserById(requestingUser, targetUserId) {
    const user = await userRepository.findById(targetUserId);
    if (!user) {
      throw new ApiError(404, 'User not found', true, '', 'NOT_FOUND');
    }

    // Tenant Isolation Check
    if (requestingUser.role !== 'SUPER_ADMIN' && user.companyId !== requestingUser.companyId) {
      throw new ApiError(403, 'Access to this resource is not allowed', true, '', 'TENANT_ACCESS_DENIED');
    }

    const { passwordHash: _, ...userWithoutPassword } = user; // eslint-disable-line no-unused-vars
    return {
      success: true,
      data: userWithoutPassword
    };
  }

  /**
   * Update User Information
   */
  async updateUser(requestingUser, targetUserId, dto) {
    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      throw new ApiError(404, 'User not found', true, '', 'NOT_FOUND');
    }

    // Tenant Isolation Check
    if (requestingUser.role !== 'SUPER_ADMIN' && targetUser.companyId !== requestingUser.companyId) {
      throw new ApiError(403, 'Access to this resource is not allowed', true, '', 'TENANT_ACCESS_DENIED');
    }

    // Role Hierarchy Checks
    if (requestingUser.role === 'SALES_EXECUTIVE') {
      throw new ApiError(403, 'Sales executives cannot update users', true, '', 'FORBIDDEN');
    }

    if (requestingUser.role === 'SALES_MANAGER' && targetUser.role === 'COMPANY_ADMIN') {
      throw new ApiError(403, 'Sales managers cannot modify company administrators', true, '', 'FORBIDDEN');
    }

    // Prevent Users from changing their own role unless explicitly SUPER_ADMIN
    if (dto.role && requestingUser.userId === targetUserId && requestingUser.role !== 'SUPER_ADMIN') {
      throw new ApiError(403, 'Users cannot modify their own role', true, '', 'FORBIDDEN');
    }

    await userRepository.update(targetUserId, targetUser.companyId, dto);

    const updatedUser = await userRepository.findById(targetUserId);
    const { passwordHash: _, ...userWithoutPassword } = updatedUser; // eslint-disable-line no-unused-vars

    return {
      success: true,
      message: 'User updated successfully',
      data: userWithoutPassword
    };
  }

  /**
   * Update User Active Status
   */
  async updateUserStatus(requestingUser, targetUserId, status) {
    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      throw new ApiError(404, 'User not found', true, '', 'NOT_FOUND');
    }

    if (requestingUser.role !== 'SUPER_ADMIN' && targetUser.companyId !== requestingUser.companyId) {
      throw new ApiError(403, 'Access to this resource is not allowed', true, '', 'TENANT_ACCESS_DENIED');
    }

    if (requestingUser.role === 'SALES_EXECUTIVE' || requestingUser.role === 'SALES_MANAGER') {
      throw new ApiError(403, 'Only administrators can update user account status', true, '', 'FORBIDDEN');
    }

    await userRepository.updateStatus(targetUserId, targetUser.companyId, status);

    return {
      success: true,
      message: `User status updated to ${status}`
    };
  }
}

module.exports = new UserService();
