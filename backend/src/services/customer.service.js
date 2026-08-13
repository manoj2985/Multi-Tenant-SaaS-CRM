const customerRepository = require('../repositories/customer.repository');
const userRepository = require('../repositories/user.repository');
const ApiError = require('../utils/apiError');

class CustomerService {
  async createCustomer(requestingUser, dto) {
    // If assignedToId provided, verify target user exists in same company
    if (dto.assignedToId) {
      const assignedUser = await userRepository.findByIdAndCompany(dto.assignedToId, requestingUser.companyId);
      if (!assignedUser) {
        throw new ApiError(400, 'Assigned user does not exist in this tenant company', true, '', 'TENANT_ACCESS_DENIED');
      }
    }

    const customerData = {
      companyId: requestingUser.companyId,
      name: dto.name,
      email: dto.email || null,
      phone: dto.phone || null,
      companyName: dto.companyName || null,
      industry: dto.industry || null,
      address: dto.address || null,
      website: dto.website || null,
      status: dto.status || 'PROSPECT',
      assignedToId: dto.assignedToId || null
    };

    const customer = await customerRepository.create(customerData);

    return {
      success: true,
      message: 'Customer created successfully',
      data: customer
    };
  }

  async getCustomers(requestingUser, query) {
    const { page, limit, search, status, sortBy, sortOrder } = query;
    const result = await customerRepository.findManyWithPagination({
      companyId: requestingUser.companyId,
      page,
      limit,
      search,
      status,
      sortBy,
      sortOrder
    });

    const totalPages = Math.ceil(result.total / limit) || 0;

    return {
      success: true,
      data: result.data,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages
      }
    };
  }

  async getCustomerById(requestingUser, customerId) {
    const customer = await customerRepository.findByIdAndCompany(customerId, requestingUser.companyId);
    if (!customer) {
      throw new ApiError(404, 'Customer not found or access denied', true, '', 'NOT_FOUND');
    }

    return {
      success: true,
      data: customer
    };
  }

  async updateCustomer(requestingUser, customerId, dto) {
    const existing = await customerRepository.findByIdAndCompany(customerId, requestingUser.companyId);
    if (!existing) {
      throw new ApiError(404, 'Customer not found or access denied', true, '', 'NOT_FOUND');
    }

    if (dto.assignedToId) {
      const assignedUser = await userRepository.findByIdAndCompany(dto.assignedToId, requestingUser.companyId);
      if (!assignedUser) {
        throw new ApiError(400, 'Assigned user does not exist in this tenant company', true, '', 'TENANT_ACCESS_DENIED');
      }
    }

    await customerRepository.update(customerId, requestingUser.companyId, dto);
    const updated = await customerRepository.findByIdAndCompany(customerId, requestingUser.companyId);

    return {
      success: true,
      message: 'Customer updated successfully',
      data: updated
    };
  }

  async deleteCustomer(requestingUser, customerId) {
    if (requestingUser.role === 'SALES_EXECUTIVE') {
      throw new ApiError(403, 'Sales executives cannot delete customers', true, '', 'FORBIDDEN');
    }

    const existing = await customerRepository.findByIdAndCompany(customerId, requestingUser.companyId);
    if (!existing) {
      throw new ApiError(404, 'Customer not found or access denied', true, '', 'NOT_FOUND');
    }

    await customerRepository.softDelete(customerId, requestingUser.companyId);

    return {
      success: true,
      message: 'Customer deleted successfully'
    };
  }
}

module.exports = new CustomerService();
