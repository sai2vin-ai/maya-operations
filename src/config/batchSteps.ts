/**
 * Batch workflow step definitions for the pyrolysis process.
 *
 * This configuration defines the 14-step batch workflow. Each step specifies:
 * - stepNumber: Sequential step order (1-14)
 * - stepName: Machine-readable identifier
 * - requiresPhoto: Whether photo evidence is required
 * - description: Human-readable step description
 * - canAbort: Whether the step can be aborted (true, false, or 'emergency' for emergency-only)
 * - tempThreshold: Temperature requirement before proceeding (optional)
 *
 * To modify the workflow, update this configuration.
 * Changes will reflect across batch creation, workflow pages, and progress tracking.
 */

export interface BatchStepConfig {
    stepNumber: number;
    stepName: string;
    requiresPhoto: boolean;
    description: string;
    canAbort: boolean | 'emergency';
    tempThreshold?: number;
}

export const BATCH_STEPS: BatchStepConfig[] = [
    { stepNumber: 1, stepName: 'CLEANING', requiresPhoto: true, description: 'Clean jolly and door', canAbort: true },
    { stepNumber: 2, stepName: 'INSPECTION', requiresPhoto: true, description: 'Safety checks - seals, heating elements', canAbort: true },
    { stepNumber: 3, stepName: 'LOADING', requiresPhoto: true, description: 'Load raw material, record input weight', canAbort: true },
    { stepNumber: 4, stepName: 'SEALING', requiresPhoto: true, description: 'Door closing, roller greasing', canAbort: true },
    { stepNumber: 5, stepName: 'OIL_SEAL_LEVEL', requiresPhoto: true, description: 'Oil seal leveling', canAbort: true },
    { stepNumber: 6, stepName: 'WATER_SEAL_LEVEL', requiresPhoto: true, description: 'Water seal leveling', canAbort: true },
    { stepNumber: 7, stepName: 'PRE_HEATING', requiresPhoto: true, description: 'Oil dip photo, record start time', canAbort: 'emergency' },
    { stepNumber: 8, stepName: 'PYROLYSIS', requiresPhoto: true, description: 'Record temp/pressure readings at reactor, tank, panel', canAbort: 'emergency' },
    { stepNumber: 9, stepName: 'COOLING', requiresPhoto: false, description: 'Controlled cooldown', canAbort: false },
    { stepNumber: 10, stepName: 'VENTING', requiresPhoto: true, description: 'Vent at 200C, nitrogen purging', tempThreshold: 200, canAbort: false },
    { stepNumber: 11, stepName: 'CARBON_DISCHARGE', requiresPhoto: true, description: 'Open at 70C, nitrogen purge before opening', tempThreshold: 70, canAbort: false },
    { stepNumber: 12, stepName: 'STEEL_DISCHARGE', requiresPhoto: true, description: 'Remove and weigh steel wire', canAbort: false },
    { stepNumber: 13, stepName: 'OIL_TRANSFER', requiresPhoto: true, description: 'Filter oil and transfer to main tank', canAbort: false },
    { stepNumber: 14, stepName: 'COMPLETE', requiresPhoto: false, description: 'Record final weights - oil, carbon, steel', canAbort: false },
];

/** Total number of steps in the workflow */
export const TOTAL_BATCH_STEPS = BATCH_STEPS.length;

/** Get step config by step number */
export function getStepConfig(stepNumber: number): BatchStepConfig | undefined {
    return BATCH_STEPS.find(s => s.stepNumber === stepNumber);
}

/** Steps that mark the cooling phase (9-13) */
export function isCoolingPhase(stepNumber: number): boolean {
    return stepNumber >= 9 && stepNumber < 14;
}

/** Check if a step can be aborted */
export function canAbortAtStep(stepNumber: number): boolean | 'emergency' {
    const step = getStepConfig(stepNumber);
    return step?.canAbort ?? false;
}
