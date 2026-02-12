export interface WorkflowStep {
    actor: string;
    action: string;
}

export interface DataEffect {
    type: 'create' | 'update' | 'event';
    description: string;
}

export interface WorkflowSection {
    id: string;
    title: string;
    description: string;
    icon: string;
    gradient: string;
    modules: { label: string; color: string }[];
    statusFlow: { label: string; color: string }[];
    steps: WorkflowStep[];
    dataEffects: DataEffect[];
}

export const workflowSections: WorkflowSection[] = [
    {
        id: 'raw-material-inbound',
        title: 'Raw Material Inbound',
        description:
            'End-to-end flow for receiving raw materials: vehicle arrives at gate, gets weighed at the weighbridge, and inventory is automatically updated.',
        icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
        gradient: 'from-green-500 to-emerald-600',
        modules: [
            { label: 'Gate', color: 'bg-green-500/20 text-green-400' },
            { label: 'Weighbridge', color: 'bg-teal-500/20 text-teal-400' },
            { label: 'Inventory', color: 'bg-cyan-500/20 text-cyan-400' },
        ],
        statusFlow: [
            { label: 'PENDING', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
            { label: 'FIRST_WEIGHT', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
            { label: 'COMPLETED', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
        ],
        steps: [
            {
                actor: 'Gate Operator',
                action: 'Creates Gate Entry (IN) with vehicle number, material category, supplier info, and optional photo.',
            },
            {
                actor: 'Gate Operator',
                action: 'Validates vehicle number format and checks no duplicate PENDING entry exists for the same vehicle.',
            },
            {
                actor: 'Weighbridge Operator',
                action: 'Creates Weighbridge Entry (RM_IN), links it to the Gate Entry and an Inventory Item.',
            },
            {
                actor: 'Weighbridge Operator',
                action: 'Records first weight (gross or tare). Status moves to FIRST_WEIGHT.',
            },
            {
                actor: 'Weighbridge Operator',
                action: 'Records second weight. System calculates net weight = |gross - tare|.',
            },
            {
                actor: 'System',
                action: 'Automatically creates an Inventory RECEIPT transaction. Converts units (TONS/KL to KG) and atomically updates currentStock.',
            },
            { actor: 'Gate Operator', action: 'Marks Gate Entry as COMPLETED when the vehicle exits.' },
        ],
        dataEffects: [
            { type: 'create', description: 'GateEntry created with status PENDING' },
            { type: 'create', description: 'WeighbridgeEntry created, linked via gateEntryId' },
            { type: 'update', description: 'InventoryItem.currentStock += netWeight (atomic)' },
            { type: 'create', description: 'InventoryTransaction (RECEIPT, referenceType: WEIGHBRIDGE_ENTRY)' },
            { type: 'event', description: 'Webhooks: gate_entry.created, weighbridge.completed' },
            { type: 'event', description: 'Audit: GATE_ENTRY_CREATED, GATE_ENTRY_COMPLETED' },
        ],
    },
    {
        id: 'batch-production',
        title: 'Batch Production (14-Step Pyrolysis)',
        description:
            'Complete pyrolysis batch workflow from reactor setup through 14 sequential steps to material output recording. Each batch locks a reactor and produces oil, carbon, and steel.',
        icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
        gradient: 'from-orange-500 to-amber-600',
        modules: [
            { label: 'Reactor', color: 'bg-orange-500/20 text-orange-400' },
            { label: 'Batch', color: 'bg-amber-500/20 text-amber-400' },
            { label: 'Inventory', color: 'bg-cyan-500/20 text-cyan-400' },
            { label: 'Gate', color: 'bg-green-500/20 text-green-400' },
        ],
        statusFlow: [
            { label: 'CREATED', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
            { label: 'IN_PROGRESS', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
            { label: 'COOLING', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
            { label: 'COMPLETED', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
        ],
        steps: [
            {
                actor: 'Reactor Operator',
                action: 'Creates a new batch on an IDLE reactor. Atomic transaction: batch created + reactor locked to IN_BATCH.',
            },
            {
                actor: 'Reactor Operator',
                action: 'Steps 1-2 (Cleaning, Inspection): Safety checks with required photos.',
            },
            {
                actor: 'Reactor Operator',
                action: 'Step 3 (Loading): Records input weight and links Gate Entry IDs for input materials.',
            },
            {
                actor: 'Reactor Operator',
                action: 'Steps 4-7 (Sealing, Oil Seal, Water Seal, Pre-Heating): Sequential preparation with photos.',
            },
            {
                actor: 'Reactor Operator',
                action: 'Step 8 (Pyrolysis): Records temperature and pressure readings (reactor, tank, panel). Status becomes IN_PROGRESS.',
            },
            {
                actor: 'System',
                action: 'Steps 9-13 (Cooling phase): Controlled cooldown, venting at 200C, carbon discharge at 70C, steel discharge, oil transfer. Status becomes COOLING.',
            },
            {
                actor: 'Reactor Operator',
                action: 'Step 14 (Complete): Records final weights. Atomic transaction: batch COMPLETED + reactor reset to IDLE + totalBatches incremented.',
            },
            {
                actor: 'Reactor Operator',
                action: 'Records outputs (oil, carbon, steel) with quantities. Each output with an inventoryItemId triggers an automatic RECEIPT transaction.',
            },
        ],
        dataEffects: [
            { type: 'create', description: 'Batch created with 14-step workflow' },
            { type: 'update', description: 'Reactor.status: IDLE -> IN_BATCH -> IDLE (atomic)' },
            { type: 'update', description: 'Batch.currentStep incremented (0 -> 1 -> ... -> 14)' },
            { type: 'create', description: 'InventoryTransactions (RECEIPT) for each output material' },
            { type: 'event', description: 'Webhooks: batch.started, batch.completed' },
            { type: 'event', description: 'Audit: BATCH_CREATED, BATCH_STEP_COMPLETED (x13), BATCH_COMPLETED' },
        ],
    },
    {
        id: 'finished-goods-outbound',
        title: 'Finished Goods Outbound',
        description:
            'Dispatch finished products (oil, carbon, steel) to customers. Vehicle is weighed out and inventory is automatically reduced.',
        icon: 'M17 8l4 4m0 0l-4 4m4-4H3',
        gradient: 'from-red-500 to-rose-600',
        modules: [
            { label: 'Gate', color: 'bg-green-500/20 text-green-400' },
            { label: 'Weighbridge', color: 'bg-teal-500/20 text-teal-400' },
            { label: 'Inventory', color: 'bg-cyan-500/20 text-cyan-400' },
        ],
        statusFlow: [
            { label: 'PENDING', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
            { label: 'FIRST_WEIGHT', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
            { label: 'COMPLETED', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
        ],
        steps: [
            { actor: 'Gate Operator', action: 'Creates Gate Entry (OUT) with customer info and vehicle details.' },
            {
                actor: 'Weighbridge Operator',
                action: 'Creates Weighbridge Entry (FG_OUT), links to a finished product Inventory Item and optionally a Batch.',
            },
            { actor: 'Weighbridge Operator', action: 'Records first weight, then second weight after loading.' },
            {
                actor: 'System',
                action: 'Calculates net weight and creates an Inventory ISSUE transaction. Atomically reduces currentStock. Validates stock cannot go negative.',
            },
            { actor: 'Gate Operator', action: 'Completes Gate Entry when vehicle exits the facility.' },
        ],
        dataEffects: [
            { type: 'create', description: 'GateEntry (OUT) + WeighbridgeEntry (FG_OUT)' },
            { type: 'update', description: 'InventoryItem.currentStock -= netWeight (atomic)' },
            { type: 'create', description: 'InventoryTransaction (ISSUE, referenceType: WEIGHBRIDGE_ENTRY)' },
            { type: 'event', description: 'Webhooks: gate_entry.created, weighbridge.completed' },
        ],
    },
    {
        id: 'inventory-management',
        title: 'Inventory Management',
        description:
            'Track stock levels for raw materials, finished products, consumables, and spare parts. Supports manual transactions and automated updates from weighbridge and batch operations.',
        icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
        gradient: 'from-cyan-500 to-blue-600',
        modules: [{ label: 'Inventory', color: 'bg-cyan-500/20 text-cyan-400' }],
        statusFlow: [
            { label: 'RECEIPT', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
            { label: 'ISSUE', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
            { label: 'ADJUSTMENT', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
            { label: 'TRANSFER', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
        ],
        steps: [
            {
                actor: 'Stores Keeper',
                action: 'Creates inventory items with code, category (RAW_MATERIAL, FINISHED_PRODUCT, CONSUMABLE, SPARE_PART), unit, and stock thresholds.',
            },
            {
                actor: 'Stores Keeper',
                action: 'Records RECEIPT transactions to increase stock. Validates new balance does not exceed maximumStock.',
            },
            {
                actor: 'Stores Keeper',
                action: 'Records ISSUE transactions to decrease stock. Validates stock cannot go negative.',
            },
            {
                actor: 'Stores Keeper',
                action: 'Records ADJUSTMENT transactions for stock corrections with required reason.',
            },
            {
                actor: 'System',
                action: 'All transactions are atomic: validates, creates transaction record, and updates currentStock in a single Firestore transaction.',
            },
            {
                actor: 'System',
                action: 'Tracks low-stock items (currentStock <= minimumStock) and triggers webhook alerts.',
            },
        ],
        dataEffects: [
            { type: 'create', description: 'InventoryTransaction with balanceAfter snapshot' },
            { type: 'update', description: 'InventoryItem.currentStock updated atomically' },
            { type: 'event', description: 'Webhook: inventory.low_stock when threshold breached' },
        ],
    },
    {
        id: 'spare-parts',
        title: 'Spare Parts Management',
        description:
            'Separate inventory for machine parts and consumables. Track receipts, issue parts to maintenance tasks with automatic stock deduction, and monitor low-stock levels.',
        icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
        gradient: 'from-indigo-500 to-violet-600',
        modules: [
            { label: 'Spare Parts', color: 'bg-indigo-500/20 text-indigo-400' },
            { label: 'Maintenance', color: 'bg-yellow-500/20 text-yellow-400' },
        ],
        statusFlow: [
            { label: 'RECEIPT', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
            { label: 'ISSUE', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
        ],
        steps: [
            {
                actor: 'Stores Keeper',
                action: 'Creates spare parts with auto-generated part number (CATEGORY-NNN), category (MOTOR, PUMP, VALVE, etc.), and stock levels.',
            },
            { actor: 'Stores Keeper', action: 'Records RECEIPT when new parts arrive. Updates currentStock.' },
            {
                actor: 'Maintenance Tech',
                action: 'Opens parts picker on a maintenance task (IN_PROGRESS or PENDING_PARTS). Searches by name or category and selects quantities.',
            },
            {
                actor: 'System',
                action: "issuePartsToJob runs as a Firestore transaction: validates stock, deducts currentStock on each part, creates SparePartTransaction (ISSUE) with jobId/jobNumber, and merges parts into the job's partsUsed array.",
            },
            { actor: 'System', action: 'Tracks low-stock parts (currentStock <= minimumStock) after deduction.' },
        ],
        dataEffects: [
            { type: 'create', description: 'SparePartTransaction (ISSUE) with jobId and jobNumber linkback' },
            { type: 'update', description: 'SparePart.currentStock deducted atomically per part' },
            { type: 'update', description: 'MaintenanceJob.partsUsed array updated with part details and cost' },
        ],
    },
    {
        id: 'asset-register',
        title: 'Asset Register',
        description:
            'Register and track all plant assets (reactors, pumps, conveyors, etc.) through their lifecycle. Monitor operational status, schedule preventive maintenance, and link assets to maintenance tasks.',
        icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
        gradient: 'from-emerald-500 to-teal-600',
        modules: [
            { label: 'Asset Register', color: 'bg-emerald-500/20 text-emerald-400' },
            { label: 'Maintenance', color: 'bg-yellow-500/20 text-yellow-400' },
        ],
        statusFlow: [
            { label: 'OPERATIONAL', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
            { label: 'BREAKDOWN', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
            { label: 'UNDER_MAINTENANCE', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
            { label: 'DECOMMISSIONED', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
        ],
        steps: [
            {
                actor: 'Plant Manager',
                action: 'Creates asset with auto-generated code (AST-0001), category (REACTOR, PUMP, CONVEYOR, etc.), location, and criticality level (HIGH/MEDIUM/LOW).',
            },
            {
                actor: 'Plant Manager',
                action: 'Sets PM frequency in days. System calculates nextPmDate from installation date.',
            },
            {
                actor: 'System',
                action: 'Dashboard shows asset stats: total count, operational count, breakdown count, and assets with PM due.',
            },
            {
                actor: 'Maintenance Tech',
                action: 'Creates a maintenance task from the asset detail page. If job type is BREAKDOWN, asset status automatically changes to BREAKDOWN.',
            },
            {
                actor: 'Maintenance Tech',
                action: 'When the linked maintenance task is completed, asset status reverts to OPERATIONAL and lastPmDate is updated.',
            },
            { actor: 'Plant Manager', action: 'Can manually set status to UNDER_MAINTENANCE or DECOMMISSIONED.' },
        ],
        dataEffects: [
            { type: 'create', description: 'Asset document with auto-generated assetCode' },
            { type: 'update', description: 'Asset.status transitions driven by maintenance task lifecycle' },
            { type: 'update', description: 'Asset.nextPmDate recalculated when PM frequency changes' },
            { type: 'event', description: 'Dashboard alerts for breakdowns and PM due assets' },
        ],
    },
    {
        id: 'work-order-lifecycle',
        title: 'Maintenance Task Lifecycle',
        description:
            'Full maintenance task workflow from reporting a fault through assignment, parts issuance, and completion. Supports breakdown, preventive, and corrective job types with priority levels.',
        icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
        gradient: 'from-yellow-500 to-amber-600',
        modules: [
            { label: 'Maintenance', color: 'bg-yellow-500/20 text-yellow-400' },
            { label: 'Asset Register', color: 'bg-emerald-500/20 text-emerald-400' },
            { label: 'Spare Parts', color: 'bg-indigo-500/20 text-indigo-400' },
        ],
        statusFlow: [
            { label: 'OPEN', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
            { label: 'ASSIGNED', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
            { label: 'IN_PROGRESS', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
            { label: 'PENDING_PARTS', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
        ],
        steps: [
            {
                actor: 'Maintenance Tech',
                action: 'Creates maintenance task: selects asset, job type (BREAKDOWN, PREVENTIVE, CORRECTIVE), priority (CRITICAL, HIGH, MEDIUM, LOW), and description.',
            },
            {
                actor: 'System',
                action: 'If job type is BREAKDOWN, linked asset status automatically changes to BREAKDOWN via atomic write.',
            },
            {
                actor: 'Plant Manager',
                action: 'Assigns technician to the job. Status moves to ASSIGNED, then IN_PROGRESS when work begins.',
            },
            {
                actor: 'Maintenance Tech',
                action: 'Opens spare parts picker to issue parts. Selects parts by search or category, enters quantities. Stock is validated client-side.',
            },
            {
                actor: 'System',
                action: 'issuePartsToJob runs as an atomic Firestore transaction: deducts stock, creates SparePartTransactions, merges into job partsUsed array.',
            },
            {
                actor: 'Maintenance Tech',
                action: 'If parts are unavailable, sets status to PENDING_PARTS until stock is replenished.',
            },
            {
                actor: 'Maintenance Tech',
                action: 'Completes maintenance task with resolution notes. Asset status reverts to OPERATIONAL. Job status moves to COMPLETED, then CLOSED.',
            },
        ],
        dataEffects: [
            { type: 'create', description: 'MaintenanceJob with assetId, priority, and type' },
            { type: 'update', description: 'Asset.status: OPERATIONAL → BREAKDOWN (if breakdown job)' },
            { type: 'update', description: 'SparePart.currentStock deducted via atomic transaction' },
            { type: 'create', description: 'SparePartTransaction (ISSUE) per part with job linkback' },
            { type: 'update', description: 'Asset.status: BREAKDOWN → OPERATIONAL on job completion' },
            { type: 'event', description: 'Dashboard stats: active jobs, critical count, pending parts' },
        ],
    },
    {
        id: 'shift-management',
        title: 'Shift Management',
        description:
            'Manage operational shifts with structured handover process. Three shift types (Morning, Afternoon, Night) with supervisor tracking and handover acknowledgment.',
        icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
        gradient: 'from-emerald-500 to-green-600',
        modules: [{ label: 'Shifts', color: 'bg-emerald-500/20 text-emerald-400' }],
        statusFlow: [
            { label: 'ACTIVE', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
            { label: 'ENDED', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
            { label: 'ACKNOWLEDGED', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
        ],
        steps: [
            {
                actor: 'Shift Supervisor',
                action: 'Starts a new shift, selecting type: Shift A (06:00-14:00), Shift B (14:00-22:00), or Shift C (22:00-06:00).',
            },
            {
                actor: 'Shift Supervisor',
                action: 'During the shift, batches and operations can be optionally linked to the active shift for traceability.',
            },
            {
                actor: 'Shift Supervisor',
                action: 'Ends the shift with handover notes for the incoming supervisor. Records endTime and incoming supervisor ID.',
            },
            {
                actor: 'Incoming Supervisor',
                action: 'Acknowledges the handover, confirming they have read the notes. System records acknowledgment timestamp.',
            },
        ],
        dataEffects: [
            { type: 'create', description: 'Shift document with type, supervisorId, startTime' },
            { type: 'update', description: 'Shift.endTime and handoverNotes set on shift end' },
            { type: 'update', description: 'Shift.handoverAcknowledgedAt set on acknowledgment' },
        ],
    },
    {
        id: 'quality-control',
        title: 'Quality Control',
        description:
            'Inspect batch outputs (oil, carbon, steel) against material-specific quality parameters. Auto-determines pass/fail status based on parameter results and tracks pass rates over time.',
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
        gradient: 'from-lime-500 to-green-600',
        modules: [
            { label: 'Quality', color: 'bg-lime-500/20 text-lime-400' },
            { label: 'Batch', color: 'bg-amber-500/20 text-amber-400' },
        ],
        statusFlow: [
            { label: 'PENDING', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
            { label: 'PASSED', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
            { label: 'FAILED', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
            { label: 'ON_HOLD', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
        ],
        steps: [
            {
                actor: 'Shift Supervisor',
                action: 'Creates QC check linked to a batch. System auto-generates check number (QC-YYYY-NNNN) and loads default parameters for the material type.',
            },
            {
                actor: 'Shift Supervisor',
                action: 'For OIL: checks Color, Viscosity (<5 cSt), Water Content (<1%), Density (0.85-0.95 g/ml). For CARBON: Particle Size (<100 mesh), Moisture (<2%), Ash Content (<15%). For STEEL: Contamination, Rust Level.',
            },
            {
                actor: 'Shift Supervisor',
                action: 'Records actual values and marks each parameter as passed or failed.',
            },
            {
                actor: 'System',
                action: 'Auto-determines overall status: PASSED if all parameters pass, FAILED if any parameter fails, PENDING if results incomplete.',
            },
            {
                actor: 'Plant Manager',
                action: 'Can override status to ON_HOLD for further investigation or update findings.',
            },
        ],
        dataEffects: [
            { type: 'create', description: 'QualityCheck with auto-generated checkNumber and batchId link' },
            { type: 'update', description: 'QualityCheck.status auto-determined from parameter results' },
            { type: 'event', description: 'Dashboard stats: pass rate percentage over last 30 days' },
        ],
    },
    {
        id: 'user-device-management',
        title: 'User & Device Management',
        description:
            'Manage user accounts with role-based access control (9 roles) and track device registrations for mobile/tablet access.',
        icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
        gradient: 'from-blue-500 to-indigo-600',
        modules: [
            { label: 'Users', color: 'bg-blue-500/20 text-blue-400' },
            { label: 'Devices', color: 'bg-purple-500/20 text-purple-400' },
        ],
        statusFlow: [
            { label: 'ACTIVE', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
            { label: 'INACTIVE', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
            { label: 'SUSPENDED', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
            { label: 'REVOKED', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
        ],
        steps: [
            {
                actor: 'Super Admin',
                action: 'Creates user with Firebase Auth account + Firestore document. Assigns role and default shift.',
            },
            {
                actor: 'Plant Manager',
                action: 'Updates user status (ACTIVE/INACTIVE/SUSPENDED) or changes role. Both trigger audit logs.',
            },
            {
                actor: 'Super Admin',
                action: 'Registers devices (TABLET, MOBILE, DESKTOP, SCANNER) and assigns to users.',
            },
            {
                actor: 'Super Admin',
                action: 'Revokes device access when needed. Cloud Function logs DEVICE_REVOKED audit entry.',
            },
        ],
        dataEffects: [
            { type: 'create', description: 'Firebase Auth account + User document' },
            { type: 'update', description: 'User role/status changes tracked' },
            { type: 'event', description: 'Audit: USER_CREATED, USER_ROLE_CHANGED, DEVICE_REVOKED' },
            { type: 'event', description: 'Webhooks: user.created, user.status_changed' },
        ],
    },
    {
        id: 'webhooks-notifications',
        title: 'Webhooks & Notifications',
        description:
            'Subscribe external systems to operational events. Supports HMAC-SHA256 signatures, automatic retries (up to 3), and delivery tracking.',
        icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
        gradient: 'from-purple-500 to-fuchsia-600',
        modules: [{ label: 'Webhooks', color: 'bg-purple-500/20 text-purple-400' }],
        statusFlow: [
            { label: 'ACTIVE', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
            { label: 'INACTIVE', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
            { label: 'FAILED', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
        ],
        steps: [
            {
                actor: 'Super Admin',
                action: 'Creates webhook with URL, HTTP method (POST/PUT), subscribed events, and optional secret for HMAC signing.',
            },
            {
                actor: 'System',
                action: 'When a subscribed event fires (e.g. batch.completed), system prepares payload and sends HTTP request.',
            },
            {
                actor: 'System',
                action: 'If delivery fails, retries up to 3 times. Logs each attempt with response code, duration, and error.',
            },
            {
                actor: 'Super Admin',
                action: 'Reviews delivery logs, tests webhooks, and updates or disables failing endpoints.',
            },
        ],
        dataEffects: [
            { type: 'create', description: 'WebhookDelivery record for each attempt' },
            { type: 'update', description: 'Webhook.successCount / failureCount incremented' },
            { type: 'update', description: 'Webhook.status set to FAILED after max retries exhausted' },
        ],
    },
    {
        id: 'audit-trail',
        title: 'Audit Trail & Daily Stats',
        description:
            'Immutable audit logging via Cloud Functions. Every create, update, and status change across key collections is recorded automatically. Logs are retained for 90 days.',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
        gradient: 'from-slate-500 to-gray-600',
        modules: [
            { label: 'Audit', color: 'bg-slate-500/20 text-slate-400' },
            { label: 'Cloud Functions', color: 'bg-gray-500/20 text-gray-400' },
        ],
        statusFlow: [
            { label: 'CREATE', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
            { label: 'UPDATE', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
            { label: 'STATUS_CHANGE', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
            { label: 'CLEANUP', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
        ],
        steps: [
            {
                actor: 'Cloud Function',
                action: 'Firestore triggers fire on document create/update in: gateEntries, batches, users, reactors, devices.',
            },
            {
                actor: 'Cloud Function',
                action: 'Creates AuditLog entry with action, collection, documentId, userId, and relevant data snapshot.',
            },
            {
                actor: 'Cloud Function',
                action: 'Daily at 02:00 UTC: Deletes audit logs older than 90 days (batch of 500).',
            },
            {
                actor: 'Cloud Function',
                action: "Daily at 00:05 UTC: Aggregates yesterday's gate entries and completed batches into dailyStats collection.",
            },
        ],
        dataEffects: [
            { type: 'create', description: 'AuditLog entries (immutable, server-timestamped)' },
            { type: 'create', description: 'DailyStats document (YYYY-MM-DD key)' },
            { type: 'update', description: 'Old audit logs deleted after 90-day retention' },
        ],
    },
];
