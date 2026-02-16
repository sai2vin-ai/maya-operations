import type { ComponentType, LazyExoticComponent } from 'react';
import type { ModuleKey, Permission } from '../config/roles';
import * as Pages from './pages';

export interface RouteConfig {
    path: string;
    page: LazyExoticComponent<ComponentType>;
    module?: ModuleKey;
    permission?: Permission;
}

// Routes inside AppLayout with ProtectedRoute wrapper.
// When `module` is set, allowedRoles are derived from roles.ts via getRolesWithPermission().
// When `module` is omitted, the route is accessible to all authenticated users.
export const appRoutes: RouteConfig[] = [
    // Dashboard (all authenticated users)
    { path: '/dashboard', page: Pages.DashboardPage },

    // User Management
    { path: '/users', page: Pages.UsersPage, module: 'USERS' },
    { path: '/users/new', page: Pages.UserCreatePage, module: 'USERS', permission: 'create' },
    { path: '/users/:id', page: Pages.UserDetailPage, module: 'USERS' },

    // Device Management
    { path: '/devices', page: Pages.DevicesPage, module: 'DEVICES' },
    { path: '/devices/new', page: Pages.DeviceCreatePage, module: 'DEVICES', permission: 'create' },
    { path: '/devices/:id', page: Pages.DeviceDetailPage, module: 'DEVICES' },

    // Gate Operations
    { path: '/gate', page: Pages.GateEntriesPage, module: 'GATE' },
    { path: '/gate/new', page: Pages.GateEntryCreatePage, module: 'GATE', permission: 'create' },
    { path: '/gate/:id', page: Pages.GateEntryDetailPage, module: 'GATE' },
    { path: '/gate/vehicles', page: Pages.VehicleTrackingPage, module: 'GATE' },

    // Reactor Operations
    { path: '/reactor', page: Pages.ReactorDashboardPage, module: 'REACTOR' },
    { path: '/reactor/:reactorId/new-batch', page: Pages.BatchCreatePage, module: 'REACTOR', permission: 'create' },
    { path: '/batch/:batchId', page: Pages.BatchWorkflowPage, module: 'REACTOR' },
    { path: '/reactor/output', page: Pages.ReactorOutputPage, module: 'REACTOR' },
    { path: '/reactor/analytics', page: Pages.BatchAnalyticsPage, module: 'REACTOR' },

    // Inventory
    { path: '/inventory', page: Pages.InventoryPage, module: 'INVENTORY' },
    { path: '/inventory/new', page: Pages.InventoryItemCreatePage, module: 'INVENTORY', permission: 'create' },
    { path: '/inventory/:id', page: Pages.InventoryItemDetailPage, module: 'INVENTORY' },

    // Spare Parts
    { path: '/spare-parts', page: Pages.SparePartsPage, module: 'SPARE_PARTS' },
    { path: '/spare-parts/new', page: Pages.SparePartCreatePage, module: 'SPARE_PARTS', permission: 'create' },
    { path: '/spare-parts/:partId', page: Pages.SparePartDetailPage, module: 'SPARE_PARTS' },

    // Asset Register
    { path: '/assets', page: Pages.AssetListPage, module: 'ASSETS' },
    { path: '/assets/new', page: Pages.AssetCreatePage, module: 'ASSETS', permission: 'create' },
    { path: '/assets/:id', page: Pages.AssetDetailPage, module: 'ASSETS' },

    // Maintenance
    { path: '/maintenance', page: Pages.MaintenanceDashboardPage, module: 'MAINTENANCE' },
    { path: '/maintenance/new', page: Pages.JobCreatePage, module: 'MAINTENANCE', permission: 'create' },
    { path: '/maintenance/:id', page: Pages.JobDetailPage, module: 'MAINTENANCE' },

    // Shift Management
    { path: '/shifts', page: Pages.ShiftsPage, module: 'SHIFTS' },

    // Settings (admin only — uses ROLES module)
    { path: '/settings', page: Pages.SettingsPage, module: 'ROLES' },

    // Weighbridge
    { path: '/weighbridge', page: Pages.WeighbridgePage, module: 'WEIGHBRIDGE' },
    { path: '/weighbridge/new', page: Pages.WeighbridgeEntryPage, module: 'WEIGHBRIDGE', permission: 'create' },
    { path: '/weighbridge/:entryId', page: Pages.WeighbridgeEntryPage, module: 'WEIGHBRIDGE' },

    // Quality Control
    { path: '/quality', page: Pages.QualityDashboardPage, module: 'QUALITY' },
    { path: '/quality/new', page: Pages.QualityCheckCreatePage, module: 'QUALITY', permission: 'create' },
    { path: '/quality/:id', page: Pages.QualityCheckDetailPage, module: 'QUALITY' },

    // Audit & Logs
    { path: '/audit', page: Pages.AuditLogsPage, module: 'AUDIT' },
    { path: '/activity', page: Pages.UserActivityPage, module: 'AUDIT' },

    // Reports
    { path: '/reports', page: Pages.ReportsDashboardPage, module: 'REPORTS' },

    // Webhooks
    { path: '/webhooks', page: Pages.WebhooksPage, module: 'WEBHOOKS' },
    { path: '/webhooks/new', page: Pages.WebhookCreatePage, module: 'WEBHOOKS', permission: 'create' },

    // Bug Reports — create is open to all, list/detail is restricted
    { path: '/bug-reports/new', page: Pages.BugReportCreatePage },
    { path: '/bug-reports', page: Pages.BugReportsPage, module: 'BUG_REPORTS' },
    { path: '/bug-reports/:id', page: Pages.BugReportDetailPage, module: 'BUG_REPORTS' },

    // User Guide & Workflows (all authenticated users)
    { path: '/guide', page: Pages.UserGuidePage },
    { path: '/workflows', page: Pages.WorkflowsPage },

    // Notifications (all authenticated users)
    { path: '/notifications', page: Pages.NotificationsPage },
];
