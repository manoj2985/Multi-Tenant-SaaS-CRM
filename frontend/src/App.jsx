import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { MainLayout } from './layouts/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

import DashboardPage from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { LeadsPage } from './pages/LeadsPage';
import { DealsPage } from './pages/DealsPage';
import TasksPage from './pages/TasksPage';
import MeetingsPage from './pages/MeetingsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import NotificationsPage from './pages/NotificationsPage';
import NotificationSettingsPage from './pages/NotificationSettingsPage';
import SubscriptionPage from './pages/SubscriptionPage';
import UsagePage from './pages/UsagePage';
import AdminCompaniesPage from './pages/AdminCompaniesPage';
import AdminCompanyDetailPage from './pages/AdminCompanyDetailPage';
import { UsersPage } from './pages/UsersPage';
import { CompanySettingsPage } from './pages/CompanySettingsPage';
import { useHealth } from './hooks/useHealth';

import WorkflowsPage from './pages/WorkflowsPage';
import CustomFieldsPage from './pages/CustomFieldsPage';
import TagsPage from './pages/TagsPage';
import ApiKeysPage from './pages/ApiKeysPage';
import WebhooksPage from './pages/WebhooksPage';
import DeveloperPortalPage from './pages/DeveloperPortalPage';
import ImportPage from './pages/ImportPage';

function AppContent() {
  const { data } = useHealth(10000);
  const isConnected = !!data?.success;

  return (
    <MainLayout healthData={data} isConnected={isConnected}>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected Core SaaS Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/deals" element={<DealsPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/meetings" element={<MeetingsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings/notifications" element={<NotificationSettingsPage />} />
          <Route path="/settings/subscription" element={<SubscriptionPage />} />
          <Route path="/settings/usage" element={<UsagePage />} />
          <Route path="/workflows" element={<WorkflowsPage />} />
          <Route path="/developer" element={<DeveloperPortalPage />} />
          <Route path="/import" element={<ImportPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['COMPANY_ADMIN', 'SALES_MANAGER', 'SUPER_ADMIN']} />}>
          <Route path="/users" element={<UsersPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['COMPANY_ADMIN', 'SUPER_ADMIN']} />}>
          <Route path="/settings" element={<CompanySettingsPage />} />
          <Route path="/settings/custom-fields" element={<CustomFieldsPage />} />
          <Route path="/settings/tags" element={<TagsPage />} />
          <Route path="/settings/api-keys" element={<ApiKeysPage />} />
          <Route path="/settings/webhooks" element={<WebhooksPage />} />
        </Route>

        {/* Platform Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
          <Route path="/admin/companies" element={<AdminCompaniesPage />} />
          <Route path="/admin/companies/:id" element={<AdminCompanyDetailPage />} />
        </Route>
      </Routes>
    </MainLayout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <AppContent />
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
