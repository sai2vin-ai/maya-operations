// Re-export hooks from feature modules

// User hooks
export {
    useUsers,
    useUser,
    useCreateUser,
    useUpdateUser,
    useToggleUserStatus,
    userKeys,
    type UserFilters,
} from '../features/users/hooks/useUsers';

// Device hooks
export {
    useDevices,
    useDevice,
    useCreateDevice,
    useUpdateDevice,
    useToggleDeviceStatus,
    deviceKeys,
    type DeviceFilters,
} from '../features/devices/hooks/useDevices';

// Gate Entry hooks
export {
    useGateEntries,
    useGateEntry,
    useCreateGateEntry,
    useUpdateGateEntry,
    useCompleteGateEntry,
    useCancelGateEntry,
    gateEntryKeys,
    type GateEntryFilters,
} from '../features/gate/hooks/useGateEntries';

// Reactor/Batch hooks
export {
    useBatches,
    useBatch,
    useBatchesByReactor,
    useActiveBatch,
    useReactors,
    useReactor,
    useCreateBatch,
    useCompleteStep,
    useRecordOutput,
    useCancelBatch,
    batchKeys,
    reactorKeys,
    type BatchFilters,
} from '../features/reactor/hooks/useBatches';

// Inventory hooks
export {
    useInventory,
    useInventoryItem,
    useCreateInventoryItem,
    useUpdateInventoryItem,
    useRecordTransaction,
    inventoryKeys,
    type InventoryFilters,
} from '../features/inventory/hooks/useInventory';

// Spare Parts hooks
export {
    useSpareParts,
    useSparePart,
    useCreateSparePart,
    useUpdateSparePart,
    useReceiptSparePart,
    useIssueSparePart,
    sparePartKeys,
    type SparePartFilters,
} from '../features/spare-parts/hooks/useSpareParts';

// Weighbridge hooks
export {
    useWeighbridgeEntries,
    usePendingEntries,
    useTodayEntries,
    useWeighbridgeEntry,
    useCreateWeighbridgeEntry,
    useRecordFirstWeight,
    useRecordSecondWeight,
    useCancelWeighbridgeEntry,
    weighbridgeKeys,
    type WeighbridgeFilters,
} from '../features/weighbridge/hooks/useWeighbridge';
