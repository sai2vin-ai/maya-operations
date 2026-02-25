# Codebase Review Findings — 2026-02-25

## Critical

- [x] **#1 Report stats always 0** — Fixed `output.type` → `output.materialCategory` with correct values `PYROLYSIS_OIL`/`CARBON_BLACK`/`SCRAP_STEEL`
- [x] **#2 Missing Firestore rules** — Added rules for `inventoryTransactions` and `webhookDeliveries`
- [x] **#3 Non-atomic BREAKDOWN update** — Wrapped in `runTransaction` so asset status + job creation are atomic
- [x] **#4 Missing assertAuthorized** — Added `assertAuthorized` to `qualityService` and `shiftService` with new `quality:*` and `shifts:*` permission actions

## High

- [x] **#5 Unsafe double cast** — Fixed `completedAt` to use safe `.toDate()` pattern instead of `as unknown as string`
- [x] **#6 Stale dashboard data** — Dashboard now uses `assetKeys`, `batchKeys`, `gateEntryKeys`, `inventoryKeys` factories
- [x] **#7 Non-atomic job completion** — `updateJob` COMPLETED/CLOSED now uses `runTransaction` for atomic job + asset update
- [x] **#8 getQCStats fetches 500 docs** — Now uses `where('inspectedAt', '>=', thirtyDaysAgo)` Firestore filter

## Medium

- [x] **#9 8 entity types lack Zod validation** — Added Zod schemas and wired `parseDoc`/`parseDocs` into all 7 remaining services
- [x] **#10 Unused zustand dependency** — Removed from package.json
- [ ] **#11 N+1 notification reads** — `getReadNotificationIds` makes up to 101 Firestore reads per load
- [ ] **#12 Unbounded audit count** — `getAuditLogCount` has no limit(), scans entire collection
- [x] **#13 Shifts Firestore rule mismatch** — Changed from `isManager()` to `isSupervisor()` so SHIFT_SUPERVISOR can write
