import { BATCH_STEPS } from '../../config/batchSteps';
import { MATERIAL_CATEGORIES } from '../../features/gate/services/gateEntryService';
import { INVENTORY_CATEGORIES, COMMON_UNITS } from '../../features/inventory/services/inventoryService';
import { SPARE_PART_CATEGORIES, SPARE_PART_UNITS } from '../../features/spare-parts/services/sparePartsService';
import { QC_CHECK_TYPES } from '../../features/quality/services/qualityService';
import { SHIFT_TYPES } from '../../features/shifts/services/shiftService';
import { ASSET_CATEGORIES } from '../../features/asset-register/services/assetService';

function BadgeGrid({ items }: { items: { label: string; value?: string; extra?: string }[] }) {
    return (
        <div className="flex flex-wrap gap-2">
            {items.map((item) => (
                <span
                    key={item.value ?? item.label}
                    className="px-3 py-1.5 bg-surface-tertiary text-foreground-secondary rounded-lg text-sm"
                    title={item.extra}
                >
                    {item.label}
                    {item.extra && <span className="text-foreground-faint ml-1 text-xs">({item.extra})</span>}
                </span>
            ))}
        </div>
    );
}

export default function SystemConfigTab() {
    return (
        <div className="space-y-6">
            {/* Batch Workflow Steps */}
            <div className="glass-card p-6">
                <h3 className="text-foreground font-semibold text-lg mb-1">Batch Workflow</h3>
                <p className="text-foreground-muted text-sm mb-4">{BATCH_STEPS.length}-step pyrolysis batch process</p>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-sm">
                        <thead>
                            <tr className="border-b border-border text-left">
                                <th className="p-3 text-foreground-muted font-medium w-12">#</th>
                                <th className="p-3 text-foreground-muted font-medium">Step</th>
                                <th className="p-3 text-foreground-muted font-medium">Description</th>
                                <th className="p-3 text-foreground-muted font-medium text-center">Photo</th>
                                <th className="p-3 text-foreground-muted font-medium text-center">Abort</th>
                                <th className="p-3 text-foreground-muted font-medium text-center">Temp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {BATCH_STEPS.map((step) => (
                                <tr
                                    key={step.stepNumber}
                                    className="border-b border-border/50 hover:bg-surface-secondary"
                                >
                                    <td className="p-3 text-foreground-faint">{step.stepNumber}</td>
                                    <td className="p-3 text-foreground font-medium">
                                        {step.stepName.replace(/_/g, ' ')}
                                    </td>
                                    <td className="p-3 text-foreground-muted">{step.description}</td>
                                    <td className="p-3 text-center">
                                        {step.requiresPhoto ? (
                                            <span className="text-green-400">Yes</span>
                                        ) : (
                                            <span className="text-foreground-faint">-</span>
                                        )}
                                    </td>
                                    <td className="p-3 text-center">
                                        {step.canAbort === true && <span className="text-yellow-400">Yes</span>}
                                        {step.canAbort === 'emergency' && (
                                            <span className="text-red-400">Emergency</span>
                                        )}
                                        {step.canAbort === false && <span className="text-foreground-faint">No</span>}
                                    </td>
                                    <td className="p-3 text-center">
                                        {step.tempThreshold ? (
                                            <span className="text-orange-400">{step.tempThreshold}&deg;C</span>
                                        ) : (
                                            <span className="text-foreground-faint">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Material Categories */}
            <div className="glass-card p-6">
                <h3 className="text-foreground font-semibold text-lg mb-1">Material Categories</h3>
                <p className="text-foreground-muted text-sm mb-4">Gate entry material types</p>
                <BadgeGrid
                    items={MATERIAL_CATEGORIES.map((c) => ({ label: c.label, value: c.value, extra: c.unit }))}
                />
            </div>

            {/* Inventory */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                    <h3 className="text-foreground font-semibold text-lg mb-1">Inventory Categories</h3>
                    <p className="text-foreground-muted text-sm mb-4">Stock item classifications</p>
                    <BadgeGrid items={INVENTORY_CATEGORIES.map((c) => ({ label: c.label, value: c.value }))} />
                </div>
                <div className="glass-card p-6">
                    <h3 className="text-foreground font-semibold text-lg mb-1">Inventory Units</h3>
                    <p className="text-foreground-muted text-sm mb-4">Common measurement units</p>
                    <BadgeGrid items={COMMON_UNITS.map((u) => ({ label: u, value: u }))} />
                </div>
            </div>

            {/* Spare Parts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                    <h3 className="text-foreground font-semibold text-lg mb-1">Spare Part Categories</h3>
                    <p className="text-foreground-muted text-sm mb-4">Equipment part classifications</p>
                    <BadgeGrid items={SPARE_PART_CATEGORIES.map((c) => ({ label: c.label, value: c.value }))} />
                </div>
                <div className="glass-card p-6">
                    <h3 className="text-foreground font-semibold text-lg mb-1">Spare Part Units</h3>
                    <p className="text-foreground-muted text-sm mb-4">Part measurement units</p>
                    <BadgeGrid items={SPARE_PART_UNITS.map((u) => ({ label: u, value: u }))} />
                </div>
            </div>

            {/* Asset Categories */}
            <div className="glass-card p-6">
                <h3 className="text-foreground font-semibold text-lg mb-1">Asset Categories</h3>
                <p className="text-foreground-muted text-sm mb-4">Equipment asset classifications</p>
                <BadgeGrid items={ASSET_CATEGORIES.map((c) => ({ label: c.label, value: c.value }))} />
            </div>

            {/* Quality & Shifts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                    <h3 className="text-foreground font-semibold text-lg mb-1">Quality Check Types</h3>
                    <p className="text-foreground-muted text-sm mb-4">QC inspection methods</p>
                    <BadgeGrid items={QC_CHECK_TYPES.map((c) => ({ label: c.label, value: c.value }))} />
                </div>
                <div className="glass-card p-6">
                    <h3 className="text-foreground font-semibold text-lg mb-1">Shift Types</h3>
                    <p className="text-foreground-muted text-sm mb-4">Operational shift schedule</p>
                    <BadgeGrid items={SHIFT_TYPES.map((s) => ({ label: s.label, value: s.value, extra: s.time }))} />
                </div>
            </div>
        </div>
    );
}
