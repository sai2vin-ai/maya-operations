import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { OfflineProvider } from './contexts/OfflineContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import { SyncStatusIndicator, OfflineBanner } from './components/SyncStatus';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { UserDetailPage } from './pages/UserDetailPage';
import { UserCreatePage } from './pages/UserCreatePage';
import { DevicesPage } from './pages/DevicesPage';
import { DeviceDetailPage } from './pages/DeviceDetailPage';
import { DeviceCreatePage } from './pages/DeviceCreatePage';
import { GateEntriesPage } from './pages/GateEntriesPage';
import { GateEntryCreatePage } from './pages/GateEntryCreatePage';
import { GateEntryDetailPage } from './pages/GateEntryDetailPage';
import { ReactorDashboardPage } from './pages/ReactorDashboardPage';
import { BatchCreatePage } from './pages/BatchCreatePage';
import { BatchWorkflowPage } from './pages/BatchWorkflowPage';
import { ReactorOutputPage } from './pages/ReactorOutputPage';
import { InventoryPage } from './pages/InventoryPage';
import { InventoryItemCreatePage } from './pages/InventoryItemCreatePage';
import { InventoryItemDetailPage } from './pages/InventoryItemDetailPage';
import { SparePartsPage } from './pages/SparePartsPage';
import { SparePartCreatePage } from './pages/SparePartCreatePage';
import { SparePartDetailPage } from './pages/SparePartDetailPage';
import { WeighbridgePage } from './pages/WeighbridgePage';
import { WeighbridgeEntryPage } from './pages/WeighbridgeEntryPage';
import { RolesPage } from './pages/RolesPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OfflineProvider>
          <OfflineBanner />
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
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PLANT_MANAGER']}>
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

            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* 404 - Not Found */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <SyncStatusIndicator />
        </OfflineProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

// Coming Soon placeholder component
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="glass-card p-8 text-center max-w-md">
        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-slate-400 mb-4">This module is coming soon in the next sprint.</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="glass-card p-8 text-center max-w-md">
        <div className="text-6xl font-bold text-slate-600 mb-4">404</div>
        <h2 className="text-xl font-bold text-white mb-2">Page Not Found</h2>
        <p className="text-slate-400 mb-4">The page you're looking for doesn't exist.</p>
        <a href="/dashboard" className="btn-primary inline-block">
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}

export default App;
