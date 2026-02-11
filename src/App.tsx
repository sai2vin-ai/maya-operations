import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { OfflineProvider } from './contexts/OfflineContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/layout';
import { SyncStatusIndicator, OfflineBanner } from './components/SyncStatus';
import { LoadingSpinner, ToastProvider } from './components/ui';
import { queryClient } from './lib/queryClient';
import './index.css';

// Lazy load all pages - Platform pages stay in src/pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

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
const UserActivityPage = lazy(() => import('./features/audit/pages/UserActivityPage'));
const ReportsDashboardPage = lazy(() => import('./features/reports/pages/ReportsDashboardPage'));

// Webhooks
const WebhooksPage = lazy(() => import('./features/webhooks/pages/WebhooksPage'));
const WebhookCreatePage = lazy(() => import('./features/webhooks/pages/WebhookCreatePage'));

// Bug Reports
const BugReportCreatePage = lazy(() => import('./features/bug-reports/pages/BugReportCreatePage'));
const BugReportsPage = lazy(() => import('./features/bug-reports/pages/BugReportsPage'));
const BugReportDetailPage = lazy(() => import('./features/bug-reports/pages/BugReportDetailPage'));

// User Guide & Workflows
const UserGuidePage = lazy(() => import('./pages/UserGuidePage'));
const WorkflowsPage = lazy(() => import('./pages/WorkflowsPage'));

// Shifts
const ShiftsPage = lazy(() => import('./features/shifts/pages/ShiftsPage'));

// Batch Analytics & Vehicle Tracking
const BatchAnalyticsPage = lazy(() => import('./features/reactor/pages/BatchAnalyticsPage'));
const VehicleTrackingPage = lazy(() => import('./features/gate/pages/VehicleTrackingPage'));

// Quality Control
const QualityDashboardPage = lazy(() => import('./features/quality/pages/QualityDashboardPage'));
const QualityCheckCreatePage = lazy(() => import('./features/quality/pages/QualityCheckCreatePage'));
const QualityCheckDetailPage = lazy(() => import('./features/quality/pages/QualityCheckDetailPage'));

// Asset Register
const AssetListPage = lazy(() => import('./features/asset-register/pages/AssetListPage'));
const AssetCreatePage = lazy(() => import('./features/asset-register/pages/AssetCreatePage'));
const AssetDetailPage = lazy(() => import('./features/asset-register/pages/AssetDetailPage'));

// Maintenance (Work Orders)
const MaintenanceDashboardPage = lazy(() => import('./features/maintenance/pages/MaintenanceDashboardPage'));
const JobCreatePage = lazy(() => import('./features/maintenance/pages/JobCreatePage'));
const JobDetailPage = lazy(() => import('./features/maintenance/pages/JobDetailPage'));

// Notifications
const NotificationsPage = lazy(() => import('./features/notifications/pages/NotificationsPage'));

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <AuthProvider>
                    <OfflineProvider>
                        <ToastProvider>
                            <OfflineBanner />
                            <SidebarProvider>
                                <Suspense fallback={<LoadingSpinner fullScreen message="Loading..." />}>
                                    <Routes>
                                        {/* Public Routes (no sidebar/topbar) */}
                                        <Route
                                            path="/login"
                                            element={
                                                <PublicRoute>
                                                    <LoginPage />
                                                </PublicRoute>
                                            }
                                        />

                                        {/* All protected routes wrapped in AppLayout */}
                                        <Route
                                            element={
                                                <ProtectedRoute>
                                                    <AppLayout />
                                                </ProtectedRoute>
                                            }
                                        >
                                            {/* Dashboard */}
                                            <Route path="/dashboard" element={<DashboardPage />} />

                                            {/* User Management */}
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

                                            {/* Device Management */}
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

                                            {/* Gate Operations */}
                                            <Route
                                                path="/gate"
                                                element={
                                                    <ProtectedRoute
                                                        allowedRoles={[
                                                            'SUPER_ADMIN',
                                                            'PLANT_MANAGER',
                                                            'SHIFT_SUPERVISOR',
                                                            'GATE_OPERATOR',
                                                        ]}
                                                    >
                                                        <GateEntriesPage />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/gate/new"
                                                element={
                                                    <ProtectedRoute
                                                        allowedRoles={[
                                                            'SUPER_ADMIN',
                                                            'PLANT_MANAGER',
                                                            'SHIFT_SUPERVISOR',
                                                            'GATE_OPERATOR',
                                                        ]}
                                                    >
                                                        <GateEntryCreatePage />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/gate/:id"
                                                element={
                                                    <ProtectedRoute
                                                        allowedRoles={[
                                                            'SUPER_ADMIN',
                                                            'PLANT_MANAGER',
                                                            'SHIFT_SUPERVISOR',
                                                            'GATE_OPERATOR',
                                                        ]}
                                                    >
                                                        <GateEntryDetailPage />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/gate/vehicles"
                                                element={
                                                    <ProtectedRoute
                                                        allowedRoles={[
                                                            'SUPER_ADMIN',
                                                            'PLANT_MANAGER',
                                                            'SHIFT_SUPERVISOR',
                                                            'GATE_OPERATOR',
                                                        ]}
                                                    >
                                                        <VehicleTrackingPage />
                                                    </ProtectedRoute>
                                                }
                                            />

                                            {/* Reactor Operations */}
                                            <Route
                                                path="/reactor"
                                                element={
                                                    <ProtectedRoute
                                                        allowedRoles={[
                                                            'SUPER_ADMIN',
                                                            'PLANT_MANAGER',
                                                            'SHIFT_SUPERVISOR',
                                                            'REACTOR_OPERATOR',
                                                        ]}
                                                    >
                                                        <ReactorDashboardPage />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/reactor/:reactorId/new-batch"
                                                element={
                                                    <ProtectedRoute
                                                        allowedRoles={[
                                                            'SUPER_ADMIN',
                                                            'PLANT_MANAGER',
                                                            'SHIFT_SUPERVISOR',
                                                            'REACTOR_OPERATOR',
                                                        ]}
                                                    >
                                                        <BatchCreatePage />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/batch/:batchId"
                                                element={
                                                    <ProtectedRoute
                                                        allowedRoles={[
                                                            'SUPER_ADMIN',
                                                            'PLANT_MANAGER',
                                                            'SHIFT_SUPERVISOR',
                                                            'REACTOR_OPERATOR',
                                                        ]}
                                                    >
                                                        <BatchWorkflowPage />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/reactor/output"
                                                element={
                                                    <ProtectedRoute
                                                        allowedRoles={[
                                                            'SUPER_ADMIN',
                                                            'PLANT_MANAGER',
                                                            'SHIFT_SUPERVISOR',
                                                            'REACTOR_OPERATOR',
                                                        ]}
                                                    >
                                                        <ReactorOutputPage />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/reactor/analytics"
                                                element={
                                                    <ProtectedRoute
                                                        allowedRoles={[
                                                            'SUPER_ADMIN',
                                                            'PLANT_MANAGER',
                                                            'SHIFT_SUPERVISOR',
                                                            'REACTOR_OPERATOR',
                                                        ]}
                                                    >
                                                        <BatchAnalyticsPage />
                                                    </ProtectedRoute>
                                                }
                                            />

                                            {/* Inventory */}
                                            <Route
                                                path="/inventory"
                                                element={
                                                    <ProtectedRoute
                                                        allowedRoles={['SUPER_ADMIN', 'PLANT_MANAGER', 'STORES_KEEPER']}
                                                    >
                                                        <InventoryPage />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/inventory/new"
                                                element={
                                                    <ProtectedRoute
                                                        allowedRoles={['SUPER_ADMIN', 'PLANT_MANAGER', 'STORES_KEEPER']}
                                                    >
                                                        <InventoryItemCreatePage />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/inventory/:id"
                                                element={
                                                    <ProtectedRoute
                                                        allowedRoles={['SUPER_ADMIN', 'PLANT_MANAGER', 'STORES_KEEPER']}
                                                    >
                                                        <InventoryItemDetailPage />
                                                    </ProtectedRoute>
                                                }
                                            />

                                            {/* Spare Parts */}
                                            <Route
                                                path="/spare-parts"
                                                element={
                                                    <ProtectedRoute
                                                        allowedRoles={[
                                                            'SUPER_ADMIN',
                                                            'PLANT_MANAGER',
                                                            'STORES_KEEPER',
                                                            'MAINTENANCE_TECH',
                                                        ]}
                                                    >
                                                        <SparePartsPage />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/spare-parts/new"
                                                element={
                                                    <ProtectedRoute
                                                        allowedRoles={['SUPER_ADMIN', 'PLANT_MANAGER', 'STORES_KEEPER']}
                                                    >
                                                        <SparePartCreatePage />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/spare-parts/:partId"
                                                element={
                                                    <ProtectedRoute
                                                        allowedRoles={[
                                                            'SUPER_ADMIN',
                                                            'PLANT_MANAGER',
                                                            'STORES_KEEPER',
                                                            'MAINTENANCE_TECH',
                                                        ]}
                                                    >
                                                        <SparePartDetailPage />
                                                    </ProtectedRoute>
                                                }
                                            />

                                            {/* Asset Register */}
                                            <Route
                                                path="/assets"
                                                element={
                                                    <ProtectedRoute
                                                        allowedRoles={[
                                                            'SUPER_ADMIN',
                                                            'PLANT_MANAGER',
                                                            'MAINTENANCE_TECH',
                                                        ]}
                                                    >
                                                        <AssetListPage />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/assets/new"
                                                element={
                                                    <ProtectedRoute
                                                        allowedRoles={[
                                                            'SUPER_ADMIN',
                                                            'PLANT_MANAGER',
                                                            'MAINTENANCE_TECH',
                                                        ]}
                                                    >
                                                        <AssetCreatePage />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/assets/:id"
                                                element={
                                                    <ProtectedRoute
                                                        allowedRoles={[
                                                            'SUPER_ADMIN',
                                                            'PLANT_MANAGER',
                                                            'MAINTENANCE_TECH',
                                                        ]}
                                                    >
                                                        <AssetDetailPage />
                                                    </ProtectedRoute>
                                                }
                                            />

                                            {/* Work Orders (Maintenance) */}
                                            <Route
                                                path="/maintenance"
                                                element={
                                                    <ProtectedRoute
                                                        allowedRoles={[
                                                            'SUPER_ADMIN',
                                                            'PLANT_MANAGER',
                                                            'MAINTENANCE_TECH',
                                                        ]}
                                                    >
                                                        <MaintenanceDashboardPage />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/maintenance/new"
                                                element={
                                                    <ProtectedRoute
                                                        allowedRoles={[
                                                            'SUPER_ADMIN',
                                                            'PLANT_MANAGER',
                                                            'MAINTENANCE_TECH',
                                                        ]}
                                                    >
                                                        <JobCreatePage />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/maintenance/:id"
                                                element={
                                                    <ProtectedRoute
                                                        allowedRoles={[
                                                            'SUPER_ADMIN',
                                                            'PLANT_MANAGER',
                                                            'MAINTENANCE_TECH',
                                                        ]}
                                                    >
                                                        <JobDetailPage />
                                                    </ProtectedRoute>
                                                }
                                            />

                                            {/* Shift Management */}
                                            <Route
                                                path="/shifts"
                                                element={
                                                    <ProtectedRoute
                                                        allowedRoles={[
                                                            'SUPER_ADMIN',
                                                            'PLANT_MANAGER',
                                                            'SHIFT_SUPERVISOR',
                                                        ]}
                                                    >
                                                        <ShiftsPage />
                                                    </ProtectedRoute>
                                                }
                                            />

                                            {/* Settings */}
                                            <Route
                                                path="/settings"
                                                element={
                                                    <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                                                        <SettingsPage />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route path="/roles" element={<Navigate to="/settings" replace />} />

                                            {/* Weighbridge */}
                                            <Route
                                                path="/weighbridge"
                                                element={
                                                    <ProtectedRoute
                                                        allowedRoles={[
                                                            'SUPER_ADMIN',
                                                            'PLANT_MANAGER',
                                                            'WEIGHBRIDGE_OPERATOR',
                                                            'GATE_OPERATOR',
                                                        ]}
                                                    >
                                                        <WeighbridgePage />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/weighbridge/new"
                                                element={
                                                    <ProtectedRoute
                                                        allowedRoles={[
                                                            'SUPER_ADMIN',
                                                            'PLANT_MANAGER',
                                                            'WEIGHBRIDGE_OPERATOR',
                                                            'GATE_OPERATOR',
                                                        ]}
                                                    >
                                                        <WeighbridgeEntryPage />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/weighbridge/:entryId"
                                                element={
                                                    <ProtectedRoute
                                                        allowedRoles={[
                                                            'SUPER_ADMIN',
                                                            'PLANT_MANAGER',
                                                            'WEIGHBRIDGE_OPERATOR',
                                                            'GATE_OPERATOR',
                                                        ]}
                                                    >
                                                        <WeighbridgeEntryPage />
                                                    </ProtectedRoute>
                                                }
                                            />

                                            {/* Quality Control */}
                                            <Route
                                                path="/quality"
                                                element={
                                                    <ProtectedRoute
                                                        allowedRoles={[
                                                            'SUPER_ADMIN',
                                                            'PLANT_MANAGER',
                                                            'SHIFT_SUPERVISOR',
                                                            'REACTOR_OPERATOR',
                                                        ]}
                                                    >
                                                        <QualityDashboardPage />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/quality/new"
                                                element={
                                                    <ProtectedRoute
                                                        allowedRoles={[
                                                            'SUPER_ADMIN',
                                                            'PLANT_MANAGER',
                                                            'SHIFT_SUPERVISOR',
                                                            'REACTOR_OPERATOR',
                                                        ]}
                                                    >
                                                        <QualityCheckCreatePage />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/quality/:id"
                                                element={
                                                    <ProtectedRoute
                                                        allowedRoles={[
                                                            'SUPER_ADMIN',
                                                            'PLANT_MANAGER',
                                                            'SHIFT_SUPERVISOR',
                                                            'REACTOR_OPERATOR',
                                                        ]}
                                                    >
                                                        <QualityCheckDetailPage />
                                                    </ProtectedRoute>
                                                }
                                            />

                                            {/* Audit Logs */}
                                            <Route
                                                path="/audit"
                                                element={
                                                    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PLANT_MANAGER']}>
                                                        <AuditLogsPage />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/activity"
                                                element={
                                                    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PLANT_MANAGER']}>
                                                        <UserActivityPage />
                                                    </ProtectedRoute>
                                                }
                                            />

                                            {/* Reports */}
                                            <Route
                                                path="/reports"
                                                element={
                                                    <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                                                        <ReportsDashboardPage />
                                                    </ProtectedRoute>
                                                }
                                            />

                                            {/* Webhooks */}
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

                                            {/* Bug Reports */}
                                            <Route path="/bug-reports/new" element={<BugReportCreatePage />} />
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

                                            {/* User Guide & Workflows */}
                                            <Route path="/guide" element={<UserGuidePage />} />
                                            <Route path="/workflows" element={<WorkflowsPage />} />

                                            {/* Notifications */}
                                            <Route path="/notifications" element={<NotificationsPage />} />
                                        </Route>

                                        {/* Redirect root to dashboard */}
                                        <Route path="/" element={<Navigate to="/dashboard" replace />} />

                                        {/* 404 - Not Found */}
                                        <Route path="*" element={<NotFound />} />
                                    </Routes>
                                </Suspense>
                            </SidebarProvider>
                            <SyncStatusIndicator />
                        </ToastProvider>
                    </OfflineProvider>
                </AuthProvider>
            </BrowserRouter>
        </QueryClientProvider>
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
                <Link to="/dashboard" className="btn-primary inline-block">
                    Go to Dashboard
                </Link>
            </div>
        </div>
    );
}

export default App;
