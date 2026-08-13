/**
 * Centralized Plan Configuration
 * -1 represents UNLIMITED
 */
const PLANS = {
  FREE: {
    name: 'Free Plan',
    code: 'FREE',
    priceMonthly: 0,
    currency: 'USD',
    maxUsers: 3,
    maxCustomers: 100,
    maxLeads: 250,
    maxDeals: 100,
    maxStorageMB: 100,
    features: [
      'Up to 3 Users',
      '100 Customers & 250 Leads',
      '100 Deals & Basic Pipeline',
      '100 MB File Storage',
      'Standard Support'
    ]
  },
  PREMIUM: {
    name: 'Premium Growth',
    code: 'PREMIUM',
    priceMonthly: 49,
    currency: 'USD',
    maxUsers: 15,
    maxCustomers: 5000,
    maxLeads: 10000,
    maxDeals: 5000,
    maxStorageMB: 5000, // 5 GB
    features: [
      'Up to 15 Users',
      '5,000 Customers & 10,000 Leads',
      '5,000 Deals & Custom Stages',
      '5 GB File Storage',
      'Real-Time WebSocket Notifications',
      'Priority Email & Chat Support'
    ]
  },
  ENTERPRISE: {
    name: 'Enterprise Scale',
    code: 'ENTERPRISE',
    priceMonthly: 199,
    currency: 'USD',
    maxUsers: -1, // Unlimited
    maxCustomers: -1,
    maxLeads: -1,
    maxDeals: -1,
    maxStorageMB: -1, // Unlimited
    features: [
      'Unlimited Users',
      'Unlimited Customers, Leads & Deals',
      'Unlimited File Storage',
      'Enterprise Audit Logging',
      'Custom Role Permissions & Security',
      'Dedicated Account Manager (24/7)'
    ]
  }
};

module.exports = PLANS;
