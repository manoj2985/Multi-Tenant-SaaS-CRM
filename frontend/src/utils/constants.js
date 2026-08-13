export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const SYSTEM_MODULES = [
  { id: 'auth', name: 'Multi-Tenant Auth', phase: 'Phase 2', status: 'Upcoming' },
  { id: 'tenants', name: 'Organization & Tenants', phase: 'Phase 2', status: 'Upcoming' },
  { id: 'contacts', name: 'Leads & Contacts CRM', phase: 'Phase 3', status: 'Upcoming' },
  { id: 'deals', name: 'Pipelines & Deals', phase: 'Phase 4', status: 'Upcoming' },
  { id: 'tasks', name: 'Activities & Meetings', phase: 'Phase 5', status: 'Upcoming' },
  { id: 'analytics', name: 'Analytics & Reporting', phase: 'Phase 6', status: 'Upcoming' },
];
