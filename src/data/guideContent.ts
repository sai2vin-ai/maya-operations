import type { UserRole } from '../types';
import { ROLE_DEFINITIONS } from '../config/roles';

export interface GuideSection {
    id: string;
    title: string;
    description: string;
    moduleKey: string;
    steps: string[];
    tips: string[];
}

const allGuideSections: GuideSection[] = [
    {
        id: 'dashboard',
        title: 'Dashboard',
        description: 'The dashboard is your home screen. It shows quick stats, active reactors, today\'s batches, gate entries, and pending jobs. Use the Quick Access cards to navigate to any module.',
        moduleKey: 'DASHBOARD',
        steps: [
            'After logging in, you arrive at the Dashboard automatically.',
            'Review the quick stats cards at the top for a system overview.',
            'Click any module card in the Quick Access section to navigate there.',
            'Recently visited modules are highlighted with a "Recent" badge.',
            'Use the "Report Bug" button to submit issues you encounter.',
            'Use the "Guide" button to access this user guide at any time.',
        ],
        tips: [
            'The dashboard refreshes data in real-time when you navigate back to it.',
            'Your most recently visited modules appear first for quick access.',
        ],
    },
    {
        id: 'gate',
        title: 'Gate Operations',
        description: 'Manage vehicle entry and exit at the plant gate. Record incoming materials, track vehicle details, and manage gate passes.',
        moduleKey: 'GATE',
        steps: [
            'Navigate to Gate Operations from the dashboard.',
            'Click "New Entry" to create a gate entry for an arriving vehicle.',
            'Fill in vehicle number, driver name, material type, and supplier.',
            'Submit the entry - it will appear in the gate entries list.',
            'Click on any entry to view details or update its status.',
            'Mark entries as completed when the vehicle exits the plant.',
        ],
        tips: [
            'Vehicle numbers are validated automatically for correct format.',
            'You can filter gate entries by status (Active, Completed, Cancelled).',
            'Each gate entry gets a unique reference number for tracking.',
        ],
    },
    {
        id: 'weighbridge',
        title: 'Weighbridge',
        description: 'Record first and second weights for vehicles at the weighbridge. Calculate net weight for material tracking.',
        moduleKey: 'WEIGHBRIDGE',
        steps: [
            'Navigate to Weighbridge from the dashboard.',
            'Click "New Entry" to start a weighbridge record.',
            'Record the first weight (gross or tare) when the vehicle arrives.',
            'After loading/unloading, record the second weight.',
            'The system automatically calculates the net weight.',
            'Review the entry details and confirm the record.',
        ],
        tips: [
            'You can specify whether each weight is gross or tare.',
            'Net weight = |First Weight - Second Weight|.',
            'Weighbridge entries can be linked to gate entries for full tracking.',
        ],
    },
    {
        id: 'reactor',
        title: 'Reactor Operations',
        description: 'Manage pyrolysis reactors, create batches, track the multi-step batch workflow, and record reactor outputs.',
        moduleKey: 'REACTOR',
        steps: [
            'Navigate to Reactor Dashboard to see all reactors and their status.',
            'Click on a reactor to view its details and current batch.',
            'Click "New Batch" to start a new pyrolysis batch on a reactor.',
            'Select the input material and fill in batch parameters.',
            'Progress through batch steps: Charging, Heating, Pyrolysis, Cooling, Discharging.',
            'At each step, record readings (temperature, pressure, etc.).',
            'Complete the batch to record final outputs.',
        ],
        tips: [
            'Only one active batch per reactor at a time.',
            'Each step requires confirmation before moving to the next.',
            'You can cancel a batch if needed (with supervisor approval).',
            'Use the Reactor Output page to view production records across all reactors.',
        ],
    },
    {
        id: 'inventory',
        title: 'Inventory Management',
        description: 'Track raw materials, products, and other inventory items. Record stock transactions and monitor levels.',
        moduleKey: 'INVENTORY',
        steps: [
            'Navigate to Inventory from the dashboard.',
            'View all inventory items with current stock levels.',
            'Click "Add Item" to create a new inventory item.',
            'Enter item name, category, unit of measure, and initial quantity.',
            'Click on any item to view its transaction history.',
            'Record stock-in or stock-out transactions to update quantities.',
        ],
        tips: [
            'Items show low stock warnings based on minimum threshold settings.',
            'Transaction history provides a full audit trail.',
            'You can filter inventory by category or search by name.',
        ],
    },
    {
        id: 'spare-parts',
        title: 'Spare Parts / Store',
        description: 'Manage spare parts inventory, track usage for maintenance, and monitor stock levels.',
        moduleKey: 'SPARE_PARTS',
        steps: [
            'Navigate to Store from the dashboard.',
            'View all spare parts with quantities and locations.',
            'Click "Add Part" to register a new spare part.',
            'Enter part details: name, part number, category, location, quantity.',
            'Click on a part to view details and record transactions.',
            'Record issue/return transactions for maintenance use.',
        ],
        tips: [
            'Maintenance technicians can view parts but need a stores keeper to issue them.',
            'Part numbers should be unique across the system.',
            'Low stock alerts help prevent maintenance delays.',
        ],
    },
    {
        id: 'reports',
        title: 'Reports',
        description: 'View aggregated reports and analytics across all plant operations.',
        moduleKey: 'DASHBOARD',
        steps: [
            'Navigate to Reports from the dashboard (Super Admin only).',
            'Select the report type you want to view.',
            'Set date range filters to narrow down the data.',
            'Export reports as needed for external use.',
        ],
        tips: [
            'Reports pull data from all operational modules.',
            'Use date filters to focus on specific periods.',
        ],
    },
    {
        id: 'users',
        title: 'User Management',
        description: 'Create and manage user accounts, assign roles, and control access permissions.',
        moduleKey: 'USERS',
        steps: [
            'Navigate to User Management from the dashboard.',
            'View all users with their roles and status.',
            'Click "Add User" to create a new account.',
            'Fill in name, email, and select the appropriate role.',
            'The role determines which modules the user can access.',
            'Click on a user to edit their details or change their status.',
        ],
        tips: [
            'Each role has specific permissions - see the Roles page for details.',
            'Suspended users cannot log in until reactivated.',
            'Only Super Admin and Plant Manager can manage users.',
        ],
    },
    {
        id: 'devices',
        title: 'Device Management',
        description: 'Register and manage devices used across the plant for data collection and monitoring.',
        moduleKey: 'DEVICES',
        steps: [
            'Navigate to Device Management from the dashboard (Super Admin only).',
            'View all registered devices and their status.',
            'Click "Add Device" to register a new device.',
            'Enter device details: name, type, location, and configuration.',
            'Click on a device to update its settings or status.',
        ],
        tips: [
            'Devices can be temporarily deactivated without deleting them.',
            'Only Super Admin has access to device management.',
        ],
    },
    {
        id: 'webhooks',
        title: 'Webhooks',
        description: 'Configure webhook integrations to receive real-time notifications about plant events.',
        moduleKey: 'DASHBOARD',
        steps: [
            'Navigate to Webhooks from the dashboard (Super Admin only).',
            'Click "Create Webhook" to set up a new integration.',
            'Enter the webhook URL (must be HTTPS), name, and description.',
            'Select which events should trigger the webhook.',
            'Optionally add custom headers and a signing secret.',
            'Test the webhook to verify it works before going live.',
        ],
        tips: [
            'Use signing secrets to verify webhook authenticity.',
            'Failed webhooks will retry up to 3 times automatically.',
            'Monitor the delivery logs to troubleshoot issues.',
        ],
    },
    {
        id: 'audit',
        title: 'Audit Logs',
        description: 'Review the audit trail of all actions performed in the system for compliance and security.',
        moduleKey: 'DASHBOARD',
        steps: [
            'Navigate to Audit Logs from the dashboard.',
            'View a chronological list of all system actions.',
            'Use filters to narrow down by user, action type, or date range.',
            'Click on an entry to see full details of the action.',
        ],
        tips: [
            'Audit logs are immutable and cannot be edited or deleted.',
            'Use date range filters to find specific events quickly.',
            'Export audit logs for compliance reporting.',
        ],
    },
    {
        id: 'roles',
        title: 'Roles & Permissions',
        description: 'View the role hierarchy and understand what each role can access in the system.',
        moduleKey: 'ROLES',
        steps: [
            'Navigate to Roles from the dashboard (Super Admin only).',
            'View all roles with their descriptions and permissions.',
            'Each role shows which modules it can access and what actions are allowed.',
            'Use this as a reference when assigning roles to new users.',
        ],
        tips: [
            'Roles are predefined and cannot be customized at this time.',
            'Refer to this page to understand the principle of least privilege.',
        ],
    },
];

export function getFilteredGuideContent(role: UserRole): GuideSection[] {
    const roleDef = ROLE_DEFINITIONS.find(r => r.value === role);
    if (!roleDef) return [allGuideSections[0]]; // At least dashboard

    return allGuideSections.filter(section => {
        // Dashboard and general sections are always shown
        if (section.moduleKey === 'DASHBOARD') return true;

        // Check if role has any permission for this module
        const modulePerms = roleDef.permissions[section.moduleKey];
        return modulePerms && modulePerms.length > 0;
    });
}

export function getAllGuideContent(): GuideSection[] {
    return allGuideSections;
}
