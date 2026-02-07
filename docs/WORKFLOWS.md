# Operational Workflows

This document describes every operational workflow in the system, how data flows between features, and what each operation does to the underlying data.

---

## Feature Domains

| Feature | Purpose | Primary Entity |
|---------|---------|----------------|
| **Gate** | Track vehicles entering/exiting facility | `GateEntry` |
| **Weighbridge** | Two-stage weight recording for materials | `WeighbridgeEntry` |
| **Reactor** | Manage pyrolysis reactors | `Reactor` |
| **Batch** | 14-step pyrolysis batch workflow | `Batch` |
| **Inventory** | Track stock levels for all material types | `InventoryItem` + `InventoryTransaction` |
| **Spare Parts** | Separate inventory for machine parts | `SparePart` + `SparePartTransaction` |
| **Users** | User management with role-based access | `User` |
| **Devices** | Mobile/tablet device tracking | `Device` |
| **Webhooks** | External notifications for operational events | `Webhook` + `WebhookDelivery` |
| **Audit** | Immutable audit trail (Cloud Functions) | `AuditLog` |
| **Bug Reports** | User-submitted bug reports with screenshots | `BugReport` |
| **Reports** | Dashboards and CSV export | (read-only) |

---

## Status Transitions

### Gate Entry
```
PENDING ──> COMPLETED   (vehicle exited, entry finalized)
   └─────> CANCELLED    (entry voided)
```

### Weighbridge Entry
```
PENDING ──> FIRST_WEIGHT ──> COMPLETED   (both weights recorded, inventory updated)
   │              └─────────> CANCELLED
   └──────────────────────── CANCELLED
```

### Batch
```
CREATED ──> IN_PROGRESS (steps 1-8) ──> COOLING (steps 9-13) ──> COMPLETED (step 14)
   └──────> CANCELLED (reactor reset to IDLE)
```

### Reactor
```
IDLE ──> IN_BATCH (batch created) ──> IDLE (batch completed/cancelled)
  └──> MAINTENANCE
  └──> OFFLINE
```

### Device
```
REGISTERED ──> ACTIVE / INACTIVE / SUSPENDED ──> REVOKED
```

### Bug Report
```
open ──> in_progress ──> resolved ──> closed
```

---

## Workflow A: Raw Material Inbound

**Flow:** Gate Entry (IN) -> Weighbridge (RM_IN) -> Inventory (RECEIPT)

### Step 1 — Gate Entry
- **Actor:** Gate Operator
- **Creates:** `GateEntry` with `entryType: 'IN'`
- **Data captured:** vehicleNumber, materialCategory, supplierName, driverName, driverPhone, optional photo, optional weighbridge reading
- **Status:** `PENDING`
- **Validations:** Vehicle number uppercase, no duplicate PENDING entry for same vehicle

### Step 2 — Weighbridge (first weight)
- **Actor:** Weighbridge Operator
- **Creates:** `WeighbridgeEntry` with `entryType: 'RM_IN'`
- **Links:** `gateEntryId` -> Gate Entry, `inventoryItemId` -> Inventory Item
- **Data captured:** weight value, isGross flag (loaded vs empty)
- **Status:** `PENDING` -> `FIRST_WEIGHT`
- **Effect:** Records either grossWeight or tareWeight depending on isGross

### Step 3 — Weighbridge (second weight + completion)
- **Actor:** Weighbridge Operator
- **Calls:** `recordSecondWeightAndComplete()`
- **Validations:** grossWeight must be >= tareWeight
- **Calculates:** `netWeight = grossWeight - tareWeight`
- **Status:** `FIRST_WEIGHT` -> `COMPLETED`
- **Inventory effect (automatic):** If `inventoryItemId` is linked:
  - Creates `InventoryTransaction` with type `RECEIPT`, referenceType `WEIGHBRIDGE_ENTRY`
  - Converts units if needed (TONS -> KG: x1000, KL -> KG: x1000)
  - Atomically updates `InventoryItem.currentStock += netWeight`

### Step 4 — Gate Entry completion
- **Actor:** Gate Operator
- **Status:** `PENDING` -> `COMPLETED`

### Events triggered
- **Audit logs:** GATE_ENTRY_CREATED, GATE_ENTRY_COMPLETED
- **Webhooks:** `gate_entry.created`, `gate_entry.completed`, `weighbridge.completed`

---

## Workflow B: Batch Production (14-step pyrolysis)

**Flow:** Batch Creation -> 14 Steps -> Material Outputs -> Inventory (RECEIPT)

### Batch creation
- **Actor:** Reactor Operator
- **Atomic transaction:**
  - Creates `Batch` with `status: CREATED`, `currentStep: 0`
  - Updates `Reactor.status` to `IN_BATCH`, sets `currentBatchId`
- **Validation:** Reactor must be `IDLE`, no active batch on reactor

### Steps 1-14

| Step | Name | Key Data | Phase |
|------|------|----------|-------|
| 1 | CLEANING | Photo required | IN_PROGRESS |
| 2 | INSPECTION | Safety checks, photo | IN_PROGRESS |
| 3 | LOADING | Input weight, linked gate entries | IN_PROGRESS |
| 4 | SEALING | Door closing, photo | IN_PROGRESS |
| 5 | OIL_SEAL_LEVEL | Photo | IN_PROGRESS |
| 6 | WATER_SEAL_LEVEL | Photo | IN_PROGRESS |
| 7 | PRE_HEATING | Oil dip photo | IN_PROGRESS |
| 8 | PYROLYSIS | Temp/pressure readings (reactor, tank, panel) | IN_PROGRESS |
| 9 | COOLING | Controlled cooldown | COOLING |
| 10 | VENTING | Vent at 200C, nitrogen purge, photo | COOLING |
| 11 | CARBON_DISCHARGE | Open at 70C, nitrogen purge, photo | COOLING |
| 12 | STEEL_DISCHARGE | Remove/weigh steel wire, photo | COOLING |
| 13 | OIL_TRANSFER | Filter and transfer oil, photo | COOLING |
| 14 | COMPLETE | Final weights | COMPLETED |

- Steps must be completed **sequentially** (cannot skip)
- Steps 1-6: can abort the batch
- Steps 7-8: emergency abort only
- Steps 9-14: cannot abort

### Step completion effects
- `currentStep` incremented
- Step data saved to `stepHistory[]` (photos, temps, readings, notes)
- Status transitions: CREATED -> IN_PROGRESS (step 1), IN_PROGRESS -> COOLING (step 9), COOLING -> COMPLETED (step 14)

### Batch completion (step 14)
- **Atomic transaction:**
  - Batch `status` -> `COMPLETED`, `endTime` set
  - Reactor `status` -> `IDLE`, `currentBatchId` -> null, `totalBatches` incremented

### Material outputs
- **Calls:** `recordOutput()` for each produced material (oil, carbon, steel)
- **Data:** materialCategory, quantity, unit, optional qualityGrade/photo
- **Inventory effect (automatic):** If `inventoryItemId` linked:
  - Creates `InventoryTransaction` with type `RECEIPT`, referenceType `BATCH`
  - Atomically updates `InventoryItem.currentStock`

### Batch cancellation
- **Atomic transaction:**
  - Batch `status` -> `CANCELLED`
  - Reactor `status` -> `IDLE`, `currentBatchId` -> null

### Events triggered
- **Audit logs:** BATCH_CREATED, BATCH_STEP_COMPLETED (x13), BATCH_IN_PROGRESS, BATCH_COOLING, BATCH_COMPLETED
- **Webhooks:** `batch.started`, `batch.completed` or `batch.cancelled`

---

## Workflow C: Finished Goods Outbound

**Flow:** Gate Entry (OUT) -> Weighbridge (FG_OUT) -> Inventory (ISSUE)

### Step 1 — Gate Entry
- **Creates:** `GateEntry` with `entryType: 'OUT'`
- **Data:** Customer info, vehicle, material category

### Step 2 — Weighbridge
- **Creates:** `WeighbridgeEntry` with `entryType: 'FG_OUT'`
- **Links:** `inventoryItemId` (finished product), optional `batchId`
- Two-stage weighing, same as inbound

### Step 3 — Completion
- **Inventory effect (automatic):** If `inventoryItemId` linked:
  - Creates `InventoryTransaction` with type `ISSUE`, referenceType `WEIGHBRIDGE_ENTRY`
  - Atomically updates `InventoryItem.currentStock -= netWeight`
  - **Validation:** Cannot reduce stock below zero

### Events triggered
- **Webhooks:** `gate_entry.created`, `gate_entry.completed`, `weighbridge.completed`

---

## Workflow D: Inventory Management

### Stock receipt (manual)
- `recordTransaction(RECEIPT)` — increases stock
- **Validation:** Cannot exceed `maximumStock` (if set)
- Atomic: create transaction + update `currentStock`

### Stock issue (manual)
- `recordTransaction(ISSUE)` — decreases stock
- **Validation:** Cannot result in negative stock

### Stock adjustment
- `recordTransaction(ADJUSTMENT)` — positive or negative correction
- Requires reason and optional approver

### Low-stock alerts
- Items where `currentStock <= minimumStock`
- Webhook: `inventory.low_stock`

### Reference types
Every transaction can link back to its source via `referenceType` + `referenceId`:
- `GATE_ENTRY` — from gate weighbridge reading
- `WEIGHBRIDGE_ENTRY` — from weighbridge completion
- `BATCH` — from batch output recording
- `MAINTENANCE_JOB` — from maintenance work

---

## Workflow E: Spare Parts

- **Create part:** Auto-generates `partNumber` (CATEGORY-NNN format)
- **Receipt:** Increase stock, record supplier/reason
- **Issue:** Decrease stock, record issuedTo user, machineId, reason
- **Validation:** No negative stock on issue
- **Low-stock tracking:** Same pattern as inventory

---

## Cross-Feature Data Links

```
GateEntry
  └── WeighbridgeEntry.gateEntryId     (weighbridge links to gate)
  └── Batch.linkedGateEntryIds[]       (batch loading step links gate entries)

WeighbridgeEntry
  ├── .gateEntryId    -> GateEntry     (inbound material source)
  ├── .batchId        -> Batch         (outbound production source)
  └── .inventoryItemId -> InventoryItem (auto-update on completion)

Batch
  ├── .reactorId      -> Reactor       (which reactor runs it)
  └── .linkedGateEntryIds[] -> GateEntry[] (input materials)

InventoryTransaction
  ├── .itemId         -> InventoryItem
  └── .referenceId    -> GateEntry | Batch | WeighbridgeEntry
```

---

## Authorization (Role -> Allowed Operations)

| Role | Gate | Weighbridge | Batch | Inventory | Spare Parts | Users | Webhooks |
|------|------|-------------|-------|-----------|-------------|-------|----------|
| SUPER_ADMIN | Full | Full | Full | Full | Full | Full | Full |
| PLANT_MANAGER | Full | Full | Full | Full | Full | Create/Update | Full |
| SHIFT_SUPERVISOR | Full | Full | Full | - | - | - | - |
| GATE_OPERATOR | Create/Update | Create/Update | - | - | - | - | - |
| WEIGHBRIDGE_OPERATOR | - | Create/Update | - | - | - | - | - |
| REACTOR_OPERATOR | - | - | Create/Steps | - | - | - | - |
| STORES_KEEPER | - | - | - | Full | Full | - | - |
| MAINTENANCE_TECH | - | - | - | - | Issue/Receipt | - | - |
| VIEWER | Read-only | Read-only | Read-only | Read-only | Read-only | - | - |

---

## Cloud Functions (Automated)

### Firestore Triggers (audit logging)
| Trigger | Collection | Logged Actions |
|---------|-----------|---------------|
| onGateEntryCreate | gateEntries | GATE_ENTRY_CREATED |
| onGateEntryUpdate | gateEntries | GATE_ENTRY_{status} on status change |
| onBatchCreate | batches | BATCH_CREATED |
| onBatchUpdate | batches | BATCH_{status}, BATCH_STEP_COMPLETED |
| onUserCreate | users | USER_CREATED |
| onUserUpdate | users | USER_{status}, USER_ROLE_CHANGED |
| onReactorUpdate | reactors | REACTOR_{status} |
| onDeviceUpdate | devices | DEVICE_REVOKED |

### Scheduled Functions
| Function | Schedule | Purpose |
|----------|----------|---------|
| cleanupOldAuditLogs | Daily 02:00 | Delete audit logs > 90 days (batch of 500) |
| dailyStatsAggregation | Daily 00:05 | Count yesterday's gate entries + completed batches |

---

## Webhook Events

| Event | Triggered When |
|-------|----------------|
| `gate_entry.created` | New gate entry created |
| `gate_entry.completed` | Gate entry status -> COMPLETED |
| `gate_entry.cancelled` | Gate entry status -> CANCELLED |
| `batch.started` | New batch created |
| `batch.completed` | Batch step 14 completed |
| `batch.cancelled` | Batch cancelled |
| `weighbridge.completed` | Second weight recorded |
| `inventory.low_stock` | Stock falls below minimum |
| `user.created` | New user created |
| `user.status_changed` | User status updated |

Webhooks support HMAC-SHA256 signatures, retry (up to 3 attempts), and delivery logging.
