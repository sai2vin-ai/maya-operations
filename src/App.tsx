import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { OfflineProvider } from './contexts/OfflineContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import { SyncStatusIndicator, OfflineBanner } from './components/SyncStatus';
import { LoadingSpinner, ToastProvider } from './components/ui';
import { queryClient } from './lib/queryClient';
import './index.css';

// Lazy load all pages - Platform pages stay in src/pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const RolesPage = lazy(() => import('./pages/RolesPage'));

// Feature pages - lazy loaded from feature modules
const UsersPage = lazy(() => import('./features/users/pages/UsersPage'));
const UserDetailPage = lazy(() => import('./features/users/pages/UserDetailPage'));
const UserCreatePage = lazy(() => import('./features/users/pages/UserCreatePage'));

const DevicesPage = lazy(() => import('./features/devices/pages/DevicesPage'));
const DeviceDetailPage = lazy(() => import('./features/devices/pages/DeviceDetailPage'));
const DeviceCreatePage = lazy(() => import('./features/devices/pages/DeviceCreatePage'));

const GateEntriesPage = lazy(() => import('./features/gate/pages/GateEntriesPage'));
const GateEntryCreatePage = lazy(() => import('./features/gate/pages/GateEntryCreatePage'));
const GateEntryDetailPage = lazy(() => import('./features/gate/pages/GateEntryDetailPage'));

const ReactorDashboardPage = lazy(() => import('./features/reactor/pages/ReactorDashboardPage'));
const BatchCreatePage = lazy(() => import('./features/reactor/pages/BatchCreatePage'));
const BatchWorkflowPage = lazy(() => import('./features/reactor/pages/BatchWorkflowPage'));
const ReactorOutputPage = lazy(() => import('./features/reactor/pages/ReactorOutputPage'));

const InventoryPage = lazy(() => import('./features/inventory/pages/InventoryPage'));
const InventoryItemCreatePage = lazy(() => import('./features/inventory/pages/InventoryItemCreatePage'));
const InventoryItemDetailPage = lazy(() => import('./features/inventory/pages/InventoryItemDetailPage'));

const SparePartsPage = lazy(() => import('./features/spare-parts/pages/SparePartsPage'));
const SparePartCreatePage = lazy(() => import('./features/spare-parts/pages/SparePartCreatePage'));
const SparePartDetailPage = lazy(() => import('./features/spare-parts/pages/SparePartDetailPage'));

const WeighbridgePage = lazy(() => import('./features/weighbridge/pages/WeighbridgePage'));
const WeighbridgeEntryPage = lazy(() => import('./features/weighbridge/pages/WeighbridgeEntryPage'));

// Audit & Reports
const AuditLogsPage = lazy(() => import('./features/audit/pages/AuditLogsPage'));
const ReportsDashboardPage = lazy(() => import('./features/reports/pages/ReportsDashboardPage'));

// Webhooks
const WebhooksPage = lazy(() => import('./features/webhooks/pages/WebhooksPage'));
const WebhookCreatePage = lazy(() => import('./features/webhooks/pages/WebhookCreatePage'));

// Bug Reports
const BugReportCreatePage = lazy(() => import('./features/bug-reports/pages/BugReportCreatePage'));
const BugReportsPage = lazy(() => import('./features/bug-reports/pages/BugReportsPage'));
const BugReportDetailPage = lazy(() => import('./features/bug-reports/pages/BugReportDetailPage'));

// User Guide
const UserGuidePage = lazy(() => import('./pages/UserGuidePage'));

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <OfflineProvider>
            <ToastProvider>
            <OfflineBanner />
            <Suspense fallback={<LoadingSpinner fullScreen message="Loading..." />}>
              <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            {/* User Management Routes */}
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PLANT_MANAGER']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/new"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PLANT_MANAGER']}>
                  <UserCreatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/:id"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PLANT_MANAGER']}>
                  <UserDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Device Management Routes */}
            <Route
              path="/devices"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <DevicesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/devices/new"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <DeviceCreatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/devices/:id"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <DeviceDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Gate Operations Routes */}
            <Route
              path="/gate"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PLANT_MANAGER', 'SHIFT_SUPERVISOR', 'GATE_OPERATOR']}>
                  <GateEntriesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gate/new"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PLANT_MANAGER', 'SHIFT_SUPERVISOR', 'GATE_OPERATOR']}>
                  <GateEntryCreatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gate/:id"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PLANT_MANAGER', 'SHIFT_SUPERVISOR', 'GATE_OPERATOR']}>
                  <GateEntryDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Reactor Operations Routes */}
            <Route
              path="/reactor"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PLANT_MANAGER', 'SHIFT_SUPERVISOR', 'REACTOR_OPERATOR']}>
                  <ReactorDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reactor/:reactorId/new-batch"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PLANT_MANAGER', 'SHIFT_SUPERVISOR', 'REACTOR_OPERATOR']}>
                  <BatchCreatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/batch/:batchId"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PLANT_MANAGER', 'SHIFT_SUPERVISOR', 'REACTOR_OPERATOR']}>
                  <BatchWorkflowPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reactor/output"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PLANT_MANAGER', 'SHIFT_SUPERVISOR', 'REACTOR_OPERATOR']}>
                  <ReactorOutputPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/inventory"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PLANT_MANAGER', 'STORES_KEEPER']}>
                  <InventoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/new"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PLANT_MANAGER', 'STORES_KEEPER']}>
                  <InventoryItemCreatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/:id"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PLANT_MANAGER', 'STORES_KEEPER']}>
                  <InventoryItemDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Spare Parts Routes */}
            <Route
              path="/spare-parts"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PLANT_MANAGER', 'STORES_KEEPER', 'MAINTENANCE_TECH']}>
                  <SparePartsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/spare-parts/new"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PLANT_MANAGER', 'STORES_KEEPER']}>
                  <SparePartCreatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/spare-parts/:partId"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PLANT_MANAGER', 'STORES_KEEPER', 'MAINTENANCE_TECH']}>
                  <SparePartDetailPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/maintenance"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PLANT_MANAGER', 'MAINTENANCE_TECH']}>
                  <ComingSoon title="Maintenance" />
                </ProtectedRoute>
              }
            />

            {/* Roles & Permissions Route */}
            <Route
              path="/roles"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <RolesPage />
                </ProtectedRoute>
              }
            />

            {/* Weighbridge Routes */}
            <Route
              path="/weighbridge"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PLANT_MANAGER', 'WEIGHBRIDGE_OPERATOR', 'GATE_OPERATOR']}>
                  <WeighbridgePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/weighbridge/new"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PLANT_MANAGER', 'WEIGHBRIDGE_OPERATOR', 'GATE_OPERATOR']}>
                  <WeighbridgeEntryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/weighbridge/:entryId"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PLANT_MANAGER', 'WEIGHBRIDGE_OPERATOR', 'GATE_OPERATOR']}>
                  <WeighbridgeEntryPage />
                </ProtectedRoute>
              }
            />

            {/* Audit Logs Route */}
            <Route
              path="/audit"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PLANT_MANAGER']}>
                  <AuditLogsPage />
                </ProtectedRoute>
              }
            />

            {/* Reports Route */}
            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <ReportsDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Webhooks Routes */}
            <Route
              path="/webhooks"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <WebhooksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/webhooks/new"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <WebhookCreatePage />
                </ProtectedRoute>
              }
            />

            {/* Bug Reports Routes */}
            <Route
              path="/bug-reports/new"
              element={
                <ProtectedRoute>
                  <BugReportCreatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bug-reports"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PLANT_MANAGER']}>
                  <BugReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bug-reports/:id"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PLANT_MANAGER']}>
                  <BugReportDetailPage />
                </ProtectedRoute>
              }
            />

            {/* User Guide Route */}
            <Route
              path="/guide"
              element={
                <ProtectedRoute>
                  <UserGuidePage />
                </ProtectedRoute>
              }
            />

            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* 404 - Not Found */}
            <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <SyncStatusIndicator />
            </ToastProvider>
          </OfflineProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// Coming Soon placeholder component
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="min-h-screen page-bg flex items-center justify-center">
      <div className="glass-card p-8 text-center max-w-md">
        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
        <p className="text-foreground-muted mb-4">This module is coming soon in the next sprint.</p>
        <a href="/dashboard" className="btn-primary inline-block">
          Back to Dashboard
        </a>
      </div>
    </div>
  );
}

// 404 Not Found component
function NotFound() {
  return (
    <div className="min-h-screen page-bg flex items-center justify-center">
      <div className="glass-card p-8 text-center max-w-md">
        <div className="text-6xl font-bold text-foreground-faint mb-4">404</div>
        <h2 className="text-xl font-bold text-foreground mb-2">Page Not Found</h2>
        <p className="text-foreground-muted mb-4">The page you're looking for doesn't exist.</p>
        <a href="/dashboard" className="btn-primary inline-block">
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}

export default App;
