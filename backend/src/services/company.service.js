const companyRepository = require('../repositories/company.repository');
const ApiError = require('../utils/apiError');

class CompanyService {
  /**
   * Fetch company details by ID with tenant isolation check
   */
  async getCompanyById(requestingUser, companyId) {
    // Tenant Isolation Check
    if (requestingUser.role !== 'SUPER_ADMIN' && requestingUser.companyId !== companyId) {
      throw new ApiError(403, 'Access to this resource is not allowed', true, '', 'TENANT_ACCESS_DENIED');
    }

    const company = await companyRepository.findById(companyId);
    if (!company) {
      throw new ApiError(404, 'Company not found', true, '', 'NOT_FOUND');
    }

    return {
      success: true,
      data: company
    };
  }

  /**
   * Update Company Settings
   */
  async updateCompany(requestingUser, companyId, dto) {
    if (requestingUser.role !== 'SUPER_ADMIN' && requestingUser.role !== 'COMPANY_ADMIN') {
      throw new ApiError(403, 'You do not have permission to perform this action', true, '', 'FORBIDDEN');
    }

    if (requestingUser.role !== 'SUPER_ADMIN' && requestingUser.companyId !== companyId) {
      throw new ApiError(403, 'Access to this resource is not allowed', true, '', 'TENANT_ACCESS_DENIED');
    }

    const company = await companyRepository.findById(companyId);
    if (!company) {
      throw new ApiError(404, 'Company not found', true, '', 'NOT_FOUND');
    }

    const updatedCompany = await companyRepository.update(companyId, dto);

    return {
      success: true,
      message: 'Company settings updated successfully',
      data: updatedCompany
    };
  }

  /**
   * Update Company Status (SUPER_ADMIN only)
   */
  async updateCompanyStatus(requestingUser, companyId, status) {
    if (requestingUser.role !== 'SUPER_ADMIN') {
      throw new ApiError(403, 'Only super administrators can modify company status', true, '', 'FORBIDDEN');
    }

    const company = await companyRepository.findById(companyId);
    if (!company) {
      throw new ApiError(404, 'Company not found', true, '', 'NOT_FOUND');
    }

    const updatedCompany = await companyRepository.updateStatus(companyId, status);

    return {
      success: true,
      message: `Company status changed to ${status}`,
      data: updatedCompany
    };
  }

  /**
   * Get all companies (SUPER_ADMIN only)
   */
  async getAllCompanies(requestingUser) {
    if (requestingUser.role !== 'SUPER_ADMIN') {
      throw new ApiError(403, 'Only super administrators can view all companies', true, '', 'FORBIDDEN');
    }

    const companies = await companyRepository.findAll();
    return {
      success: true,
      data: companies
    };
  }
}

module.exports = new CompanyService();
