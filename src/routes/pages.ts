import { lazy } from 'react';

// Platform pages
export const LoginPage = lazy(() => import('../pages/LoginPage'));
export const DashboardPage = lazy(() => import('../pages/DashboardPage'));
export const SettingsPage = lazy(() => import('../pages/SettingsPage'));
export const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

// User Management
export const UsersPage = lazy(() => import('../features/users/pages/UsersPage'));
export const UserDetailPage = lazy(() => import('../features/users/pages/UserDetailPage'));
export const UserCreatePage = lazy(() => import('../features/users/pages/UserCreatePage'));

// Device Management
export const DevicesPage = lazy(() => import('../features/devices/pages/DevicesPage'));
export const DeviceDetailPage = lazy(() => import('../features/devices/pages/DeviceDetailPage'));
export const DeviceCreatePage = lazy(() => import('../features/devices/pages/DeviceCreatePage'));

// Gate Operations
export const GateEntriesPage = lazy(() => import('../features/gate/pages/GateEntriesPage'));
export const GateEntryCreatePage = lazy(() => import('../features/gate/pages/GateEntryCreatePage'));
export const GateEntryDetailPage = lazy(() => import('../features/gate/pages/GateEntryDetailPage'));
export const VehicleTrackingPage = lazy(() => import('../features/gate/pages/VehicleTrackingPage'));

// Reactor Operations
export const ReactorDashboardPage = lazy(() => import('../features/reactor/pages/ReactorDashboardPage'));
export const BatchCreatePage = lazy(() => import('../features/reactor/pages/BatchCreatePage'));
export const BatchWorkflowPage = lazy(() => import('../features/reactor/pages/BatchWorkflowPage'));
export const ReactorOutputPage = lazy(() => import('../features/reactor/pages/ReactorOutputPage'));
export const BatchAnalyticsPage = lazy(() => import('../features/reactor/pages/BatchAnalyticsPage'));

// Inventory
export const InventoryPage = lazy(() => import('../features/inventory/pages/InventoryPage'));
export const InventoryItemCreatePage = lazy(() => import('../features/inventory/pages/InventoryItemCreatePage'));
export const InventoryItemDetailPage = lazy(() => import('../features/inventory/pages/InventoryItemDetailPage'));

// Spare Parts
export const SparePartsPage = lazy(() => import('../features/spare-parts/pages/SparePartsPage'));
export const SparePartCreatePage = lazy(() => import('../features/spare-parts/pages/SparePartCreatePage'));
export const SparePartDetailPage = lazy(() => import('../features/spare-parts/pages/SparePartDetailPage'));

// Weighbridge
export const WeighbridgePage = lazy(() => import('../features/weighbridge/pages/WeighbridgePage'));
export const WeighbridgeEntryPage = lazy(() => import('../features/weighbridge/pages/WeighbridgeEntryPage'));

// Asset Register
export const AssetListPage = lazy(() => import('../features/asset-register/pages/AssetListPage'));
export const AssetCreatePage = lazy(() => import('../features/asset-register/pages/AssetCreatePage'));
export const AssetDetailPage = lazy(() => import('../features/asset-register/pages/AssetDetailPage'));

// Maintenance
export const MaintenanceDashboardPage = lazy(() => import('../features/maintenance/pages/MaintenanceDashboardPage'));
export const JobCreatePage = lazy(() => import('../features/maintenance/pages/JobCreatePage'));
export const JobDetailPage = lazy(() => import('../features/maintenance/pages/JobDetailPage'));

// Quality Control
export const QualityDashboardPage = lazy(() => import('../features/quality/pages/QualityDashboardPage'));
export const QualityCheckCreatePage = lazy(() => import('../features/quality/pages/QualityCheckCreatePage'));
export const QualityCheckDetailPage = lazy(() => import('../features/quality/pages/QualityCheckDetailPage'));

// Shifts
export const ShiftsPage = lazy(() => import('../features/shifts/pages/ShiftsPage'));

// Audit & Reports
export const AuditLogsPage = lazy(() => import('../features/audit/pages/AuditLogsPage'));
export const UserActivityPage = lazy(() => import('../features/audit/pages/UserActivityPage'));
export const ReportsDashboardPage = lazy(() => import('../features/reports/pages/ReportsDashboardPage'));

// Webhooks
export const WebhooksPage = lazy(() => import('../features/webhooks/pages/WebhooksPage'));
export const WebhookCreatePage = lazy(() => import('../features/webhooks/pages/WebhookCreatePage'));

// Bug Reports
export const BugReportCreatePage = lazy(() => import('../features/bug-reports/pages/BugReportCreatePage'));
export const BugReportsPage = lazy(() => import('../features/bug-reports/pages/BugReportsPage'));
export const BugReportDetailPage = lazy(() => import('../features/bug-reports/pages/BugReportDetailPage'));

// User Guide & Workflows
export const UserGuidePage = lazy(() => import('../pages/UserGuidePage'));
export const WorkflowsPage = lazy(() => import('../pages/WorkflowsPage'));

// Notifications
export const NotificationsPage = lazy(() => import('../features/notifications/pages/NotificationsPage'));
