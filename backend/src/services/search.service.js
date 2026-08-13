const searchRepository = require('../repositories/search.repository');

class SearchService {
  async globalSearch(requestingUser, queryStr) {
    const companyId = requestingUser.companyId;
    const results = await searchRepository.searchAll(companyId, queryStr || '');

    return {
      success: true,
      data: results
    };
  }
}

module.exports = new SearchService();
