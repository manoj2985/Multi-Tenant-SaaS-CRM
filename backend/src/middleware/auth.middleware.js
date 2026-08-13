const { verifyAccessToken } = require('../utils/token');
const userRepository = require('../repositories/user.repository');
const ApiError = require('../utils/apiError');

/**
 * Authentication Middleware
 * Validates JWT access token, verifies user status and tenant company status.
 */
async function authenticateToken(req, res, next) {
  try {
    if (req.user && (req.user.role === 'API_CLIENT' || req.apiKey)) {
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new ApiError(401, 'Authentication required', true, '', 'UNAUTHORIZED'));
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch {
      return next(new ApiError(401, 'Invalid or expired access token', true, '', 'UNAUTHORIZED'));
    }

    // Fetch user with company from repository to guarantee real-time account & tenant status
    const user = await userRepository.findById(decoded.userId);
    if (!user) {
      return next(new ApiError(401, 'User account no longer exists', true, '', 'UNAUTHORIZED'));
    }

    if (user.status !== 'ACTIVE') {
      return next(new ApiError(401, `User account is ${user.status.toLowerCase()}`, true, '', 'ACCOUNT_INACTIVE'));
    }

    // Check Company status if user belongs to a company (SUPER_ADMIN bypasses suspension)
    if (user.role !== 'SUPER_ADMIN' && user.company) {
      if (user.company.status === 'SUSPENDED') {
        return next(new ApiError(403, 'Access to this resource is not allowed. Company account is suspended', true, '', 'TENANT_SUSPENDED'));
      }
      if (user.company.status === 'INACTIVE') {
        return next(new ApiError(403, 'Company account is inactive', true, '', 'TENANT_INACTIVE'));
      }
    }

    req.user = {
      id: user.id,
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
      name: user.name,
      email: user.email
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Role-Based Access Control (RBAC) Middleware
 * @param  {...string} allowedRoles
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required', true, '', 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action', true, '', 'FORBIDDEN'));
    }

    next();
  };
}

/**
 * Tenant Isolation Enforcement Middleware
 * Ensures user can only access resources belonging to their own companyId
 * (SUPER_ADMIN bypasses this check)
 */
function enforceTenantIsolation(targetCompanyIdParamName = 'id') {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required', true, '', 'UNAUTHORIZED'));
    }

    // SUPER_ADMIN can access arbitrary tenants
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    const requestedCompanyId = req.params[targetCompanyIdParamName] || req.body.companyId || req.query.companyId;

    if (requestedCompanyId && requestedCompanyId !== req.user.companyId) {
      return next(new ApiError(403, 'Access to this resource is not allowed', true, '', 'TENANT_ACCESS_DENIED'));
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
  enforceTenantIsolation
};
