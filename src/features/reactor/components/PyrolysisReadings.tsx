import { useCallback } from 'react';

interface ReadingRow {
    reactorTemp: string;
    reactorPressure: string;
    firstTankTemp: string;
    firstTankPressure: string;
    panelTemp: string;
    panelPressure: string;
}

interface PyrolysisReadingsProps {
    readings: ReadingRow[];
    onChange: (readings: ReadingRow[]) => void;
}

const EMPTY_READING: ReadingRow = {
    reactorTemp: '', reactorPressure: '',
    firstTankTemp: '', firstTankPressure: '',
    panelTemp: '', panelPressure: ''
};

export function PyrolysisReadings({ readings, onChange }: PyrolysisReadingsProps) {
    const updateReading = useCallback((idx: number, field: keyof ReadingRow, value: string) => {
        const updated = [...readings];
        updated[idx] = { ...updated[idx], [field]: value };
        onChange(updated);
    }, [readings, onChange]);

    const addReading = useCallback(() => {
        onChange([...readings, { ...EMPTY_READING }]);
    }, [readings, onChange]);

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">Temperature & Pressure Readings</label>
            <div className="bg-slate-700/50 p-4 rounded-lg space-y-3">
                {readings.map((reading, idx) => (
                    <div key={idx} className="grid grid-cols-6 gap-2 text-sm">
                        <input type="number" value={reading.reactorTemp}
                            onChange={(e) => updateReading(idx, 'reactorTemp', e.target.value)}
                            className="input-field" placeholder="Reactor C" />
                        <input type="number" value={reading.reactorPressure}
                            onChange={(e) => updateReading(idx, 'reactorPressure', e.target.value)}
                            className="input-field" placeholder="Reactor bar" />
                        <input type="number" value={reading.firstTankTemp}
                            onChange={(e) => updateReading(idx, 'firstTankTemp', e.target.value)}
                            className="input-field" placeholder="Tank C" />
                        <input type="number" value={reading.firstTankPressure}
                            onChange={(e) => updateReading(idx, 'firstTankPressure', e.target.value)}
                            className="input-field" placeholder="Tank bar" />
                        <input type="number" value={reading.panelTemp}
                            onChange={(e) => updateReading(idx, 'panelTemp', e.target.value)}
                            className="input-field" placeholder="Panel C" />
                        <input type="number" value={reading.panelPressure}
                            onChange={(e) => updateReading(idx, 'panelPressure', e.target.value)}
                            className="input-field" placeholder="Panel bar" />
                    </div>
                ))}
                <button onClick={addReading} className="btn-secondary text-sm w-full">
                    + Add Reading
                </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Reactor | 1st Tank | Panel (Temp + Pressure)</p>
        </div>
    );
}

export type { ReadingRow };
