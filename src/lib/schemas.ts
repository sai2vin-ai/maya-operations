import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

// Custom Zod type for Firestore Timestamps
// Duck-type check first (works in test env where Timestamp is mocked), then instanceof
const timestampSchema = z.custom<Timestamp>(
    (val) => val !== null && typeof val === 'object' && 'seconds' in (val as Record<string, unknown>),
    { message: 'Expected a Firestore Timestamp' },
);

const optionalTimestamp = timestampSchema.optional();

// ============================================
// COMMON
// ============================================

const auditFieldsSchema = z.object({
    createdAt: timestampSchema,
    createdBy: z.string(),
    updatedAt: timestampSchema,
    updatedBy: z.string(),
});

// ============================================
// USER
// ============================================

export const userRoleSchema = z.enum([
    'SUPER_ADMIN',
    'PLANT_MANAGER',
    'SHIFT_SUPERVISOR',
    'GATE_OPERATOR',
    'WEIGHBRIDGE_OPERATOR',
    'REACTOR_OPERATOR',
    'STORES_KEEPER',
    'MAINTENANCE_TECH',
    'VIEWER',
]);

export const userSchema = auditFieldsSchema.extend({
    id: z.string(),
    uid: z.string().optional(),
    employeeId: z.string(),
    name: z.string(),
    phone: z.string(),
    email: z.string().optional(),
    role: userRoleSchema,
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
    defaultShift: z.enum(['A', 'B', 'C']).optional(),
    photoUrl: z.string().optional(),
    allowedDeviceIds: z.array(z.string()).optional(),
});

// ============================================
// DEVICE
// ============================================

export const deviceSchema = z.object({
    id: z.string(),
    deviceId: z.string(),
    name: z.string(),
    deviceType: z.enum(['TABLET', 'MOBILE', 'DESKTOP', 'SCANNER']),
    os: z.enum(['ANDROID', 'IOS', 'WINDOWS', 'MACOS', 'LINUX']),
    osVersion: z.string().optional(),
    appVersion: z.string().optional(),
    fcmToken: z.string().optional(),
    status: z.enum(['REGISTERED', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'REVOKED']),
    assignedUserId: z.string().optional(),
    lastSeen: optionalTimestamp,
    location: z.string().optional(),
    registeredAt: optionalTimestamp,
    registeredBy: z.string().optional(),
});

// ============================================
// GATE ENTRY
// ============================================

export const materialCategorySchema = z.enum([
    'TW-WHOLE',
    'TW-SHRED',
    'CB-STD',
    'CB-HG',
    'PO-CRD',
    'SW-MIX',
    'PYROLYSIS_OIL',
    'CARBON_BLACK',
    'SCRAP_STEEL',
]);

export const gateEntrySchema = auditFieldsSchema.extend({
    id: z.string(),
    entryNumber: z.string(),
    entryType: z.enum(['IN', 'OUT']),
    vehicleNumber: z.string(),
    vehiclePhoto: z.string().optional(),
    materialCategory: materialCategorySchema.optional(),
    quantity: z.number().optional(),
    unit: z.enum(['KG', 'TONS', 'PIECES']).optional(),
    weighbridgeReading: z.number().optional(),
    tareWeight: z.number().optional(),
    netWeight: z.number().optional(),
    supplierName: z.string().optional(),
    driverName: z.string().optional(),
    driverPhone: z.string().optional(),
    purpose: z.string().optional(),
    status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']),
    entryTime: timestampSchema,
    exitTime: optionalTimestamp,
    notes: z.string().optional(),
});

// ============================================
// WEIGHBRIDGE
// ============================================

export const weighbridgeEntrySchema = auditFieldsSchema.extend({
    id: z.string(),
    entryNumber: z.string(),
    entryType: z.enum(['RM_IN', 'FG_OUT']),
    vehicleNumber: z.string(),
    driverName: z.string().optional(),
    driverPhone: z.string().optional(),
    partyName: z.string().optional(),
    inventoryItemId: z.string().optional(),
    materialName: z.string().optional(),
    grossWeight: z.number().optional(),
    tareWeight: z.number().optional(),
    netWeight: z.number().optional(),
    unit: z.enum(['KG', 'TONS', 'KL']),
    firstWeightTime: optionalTimestamp,
    secondWeightTime: optionalTimestamp,
    status: z.enum(['PENDING', 'FIRST_WEIGHT', 'COMPLETED', 'CANCELLED']),
    notes: z.string().optional(),
});

// ============================================
// ASSET
// ============================================

export const assetSchema = auditFieldsSchema.extend({
    id: z.string(),
    assetCode: z.string(),
    name: z.string(),
    category: z.string(),
    location: z.string(),
    criticality: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    status: z.enum(['OPERATIONAL', 'BREAKDOWN', 'UNDER_MAINTENANCE', 'DECOMMISSIONED']),
    installationDate: optionalTimestamp,
    lastPmDate: optionalTimestamp,
    nextPmDate: optionalTimestamp,
    pmFrequencyDays: z.number().optional(),
    parentAssetIds: z.array(z.string()).optional(),
    reactorNumber: z.string().optional(),
    reactorStatus: z.enum(['IDLE', 'IN_BATCH', 'MAINTENANCE', 'OFFLINE']).optional(),
    currentBatchId: z.string().optional(),
    totalBatches: z.number().optional(),
    lastMaintenanceDate: optionalTimestamp,
    inputItemIds: z.array(z.string()).optional(),
    outputItemIds: z.array(z.string()).optional(),
});

// ============================================
// BATCH
// ============================================

export const batchSchema = auditFieldsSchema.extend({
    id: z.string(),
    batchNumber: z.string(),
    reactorId: z.string(),
    status: z.enum(['CREATED', 'IN_PROGRESS', 'COOLING', 'COMPLETED', 'CANCELLED']),
    currentStep: z.number(),
    totalSteps: z.number(),
    stepHistory: z.array(
        z.object({
            stepNumber: z.number(),
            stepName: z.string(),
            completedAt: optionalTimestamp,
            completedBy: z.string().optional(),
            photoUrls: z.array(z.string()).optional(),
            notes: z.string().optional(),
            temperature: z.number().optional(),
            pressure: z.number().optional(),
            inputWeight: z.number().optional(),
            nitrogenPurged: z.boolean().optional(),
            pyrolysisReadings: z
                .array(
                    z.object({
                        timestamp: timestampSchema,
                        reactorTemp: z.number(),
                        reactorPressure: z.number(),
                        firstTankTemp: z.number().optional(),
                        firstTankPressure: z.number().optional(),
                        panelTemp: z.number().optional(),
                        panelPressure: z.number().optional(),
                        recordedBy: z.string(),
                    }),
                )
                .optional(),
        }),
    ),
    outputs: z.array(
        z.object({
            id: z.string(),
            materialCategory: materialCategorySchema,
            quantity: z.number(),
            unit: z.enum(['KG', 'TONS']),
            photoUrl: z.string().optional(),
            qualityGrade: z.string().optional(),
            recordedAt: timestampSchema,
            recordedBy: z.string(),
        }),
    ),
    startTime: timestampSchema,
    endTime: optionalTimestamp,
    inputWeight: z.number().optional(),
    shiftId: z.string().optional(),
    notes: z.string().optional(),
    linkedGateEntryIds: z.array(z.string()).optional(),
});

// ============================================
// INVENTORY
// ============================================

export const inventoryItemSchema = auditFieldsSchema.extend({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    category: z.enum(['RAW_MATERIAL', 'FINISHED_PRODUCT', 'CONSUMABLE', 'SPARE_PART']),
    unit: z.string(),
    currentStock: z.number(),
    minimumStock: z.number(),
    maximumStock: z.number().optional(),
    location: z.string().optional(),
});

// ============================================
// SPARE PARTS
// ============================================

export const sparePartSchema = auditFieldsSchema.extend({
    id: z.string(),
    partNumber: z.string(),
    fileNumber: z.string().optional(),
    name: z.string(),
    description: z.string().optional(),
    category: z.enum([
        'MOTOR',
        'PUMP',
        'VALVE',
        'BEARING',
        'BELT',
        'SEAL',
        'ELECTRICAL',
        'HYDRAULIC',
        'PNEUMATIC',
        'MECHANICAL',
        'OIL_LUBRICANT',
        'JCB',
        'FILTER',
        'FASTENER',
        'GENERAL',
    ]),
    subCategory: z.string().optional(),
    unit: z.string(),
    currentStock: z.number(),
    minimumStock: z.number(),
    usedFor: z.string().optional(),
    machineIds: z.array(z.string()).optional(),
    location: z.string().optional(),
    unitPrice: z.number().optional(),
});

// ============================================
// QUALITY CHECK
// ============================================

export const qualityCheckSchema = z.object({
    id: z.string(),
    checkNumber: z.string(),
    batchId: z.string(),
    batchNumber: z.string(),
    checkType: z.enum(['VISUAL', 'MEASUREMENT', 'CHEMICAL', 'PHYSICAL']),
    status: z.enum(['PENDING', 'PASSED', 'FAILED', 'ON_HOLD']),
    parameters: z.array(
        z.object({
            name: z.string(),
            expected: z.string(),
            actual: z.string(),
            passed: z.boolean(),
        }),
    ),
    inspector: z.string(),
    inspectedAt: timestampSchema,
    notes: z.string().optional().nullable(),
    createdAt: timestampSchema,
    createdBy: z.string(),
    updatedAt: timestampSchema,
    updatedBy: z.string(),
});

// ============================================
// MAINTENANCE JOB
// ============================================

export const maintenanceJobSchema = auditFieldsSchema.extend({
    id: z.string(),
    jobNumber: z.string(),
    assetId: z.string(),
    jobType: z.enum(['BREAKDOWN', 'PREVENTIVE', 'CORRECTIVE']),
    priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
    status: z.enum(['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_PARTS', 'COMPLETED', 'CLOSED']),
    description: z.string(),
    reportedBy: z.string(),
    reportedAt: timestampSchema,
    assignedTo: z.string().optional(),
    startedAt: optionalTimestamp,
    completedAt: optionalTimestamp,
    rootCause: z.string().optional(),
    actionTaken: z.string().optional(),
    partsUsed: z
        .array(
            z.object({
                partId: z.string(),
                partNumber: z.string(),
                partName: z.string(),
                quantity: z.number(),
                unitPrice: z.number().optional(),
            }),
        )
        .optional(),
});

// ============================================
// SHIFT
// ============================================

export const shiftSchema = auditFieldsSchema.extend({
    id: z.string(),
    shiftType: z.enum(['A', 'B', 'C']),
    date: timestampSchema,
    supervisorId: z.string(),
    startTime: timestampSchema,
    endTime: optionalTimestamp.nullable(),
    handoverNotes: z.string().optional().nullable(),
    incomingSupervisorId: z.string().optional().nullable(),
    handoverAcknowledged: z.boolean().optional(),
    handoverAcknowledgedAt: optionalTimestamp,
});

// ============================================
// AUDIT LOG
// ============================================

export const auditLogSchema = z.object({
    id: z.string(),
    action: z.string(),
    collection: z.string(),
    documentId: z.string(),
    userId: z.string().optional(),
    data: z.record(z.string(), z.unknown()).optional(),
    timestamp: timestampSchema,
});

// ============================================
// BUG REPORT
// ============================================

export const bugReportSchema = z.object({
    id: z.string(),
    reportNumber: z.string(),
    title: z.string(),
    description: z.string(),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
    screenshotUrl: z.string().optional(),
    pageUrl: z.string(),
    browserInfo: z.string(),
    createdBy: z.object({
        userId: z.string(),
        displayName: z.string(),
        role: z.string(),
    }),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
    resolvedAt: optionalTimestamp,
    adminNotes: z.string().optional(),
});

// ============================================
// WEBHOOK
// ============================================

const webhookEventSchema = z.enum([
    'gate_entry.created',
    'gate_entry.completed',
    'gate_entry.cancelled',
    'batch.started',
    'batch.completed',
    'batch.cancelled',
    'weighbridge.completed',
    'inventory.low_stock',
    'user.created',
    'user.status_changed',
]);

export const webhookSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    url: z.string(),
    method: z.enum(['POST', 'PUT']),
    events: z.array(webhookEventSchema),
    headers: z.record(z.string(), z.string()).optional(),
    secret: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'FAILED']),
    retryCount: z.number(),
    maxRetries: z.number(),
    lastTriggeredAt: optionalTimestamp,
    lastSuccessAt: optionalTimestamp,
    lastFailureAt: optionalTimestamp,
    lastError: z.string().optional(),
    successCount: z.number(),
    failureCount: z.number(),
    createdAt: timestampSchema,
    createdBy: z.string(),
    updatedAt: timestampSchema,
    updatedBy: z.string(),
});

export const webhookDeliverySchema = z.object({
    id: z.string(),
    webhookId: z.string(),
    webhookName: z.string(),
    event: webhookEventSchema,
    payload: z.record(z.string(), z.unknown()),
    url: z.string(),
    method: z.enum(['POST', 'PUT']),
    headers: z.record(z.string(), z.string()),
    status: z.enum(['PENDING', 'SUCCESS', 'FAILED']),
    responseCode: z.number().optional(),
    responseBody: z.string().optional(),
    error: z.string().optional(),
    duration: z.number().optional(),
    attemptNumber: z.number(),
    triggeredAt: timestampSchema,
    completedAt: optionalTimestamp,
});

// ============================================
// APP NOTIFICATION
// ============================================

export const appNotificationSchema = z.object({
    id: z.string(),
    type: z.enum(['info', 'success', 'warning', 'alert']),
    title: z.string(),
    message: z.string(),
    targetRoles: z.array(userRoleSchema),
    entityType: z.string().optional(),
    entityId: z.string().optional(),
    createdAt: timestampSchema,
    expiresAt: optionalTimestamp,
});

// ============================================
// PARSE HELPERS
// ============================================

/**
 * Safely parse a Firestore document with a Zod schema.
 * Returns parsed data on success, logs warning and returns raw data on failure.
 * This allows gradual adoption without breaking existing functionality.
 */
export function parseDoc<T>(schema: z.ZodType<T>, data: unknown, context?: string): T {
    const result = schema.safeParse(data);
    if (result.success) {
        return result.data;
    }
    if (import.meta.env.DEV) {
        console.warn(
            `[Schema Validation] ${context || 'Unknown'}: ${result.error.issues.length} issue(s)`,
            result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
        );
    }
    // Return raw data as fallback to avoid breaking production
    return data as T;
}

/**
 * Parse an array of Firestore documents with a Zod schema.
 */
export function parseDocs<T>(schema: z.ZodType<T>, docs: unknown[], context?: string): T[] {
    return docs.map((doc, i) => parseDoc(schema, doc, `${context || 'Unknown'}[${i}]`));
}
