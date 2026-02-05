/* eslint-disable react-refresh/only-export-components */
interface DateRangeInputProps {
    startDate: string;
    endDate: string;
    onStartDateChange: (value: string) => void;
    onEndDateChange: (value: string) => void;
    presets?: boolean;
    onPresetChange?: (preset: DatePreset) => void;
}

export type DatePreset = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

const presetOptions: { value: DatePreset; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom' },
];

export function getPresetDates(preset: DatePreset): { startDate: string; endDate: string } {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    switch (preset) {
        case 'today':
            return { startDate: today, endDate: today };
        case 'week': {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            return { startDate: weekStart.toISOString().split('T')[0], endDate: today };
        }
        case 'month': {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return { startDate: monthStart.toISOString().split('T')[0], endDate: today };
        }
        case 'quarter': {
            const quarter = Math.floor(now.getMonth() / 3);
            const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
            return { startDate: quarterStart.toISOString().split('T')[0], endDate: today };
        }
        case 'year': {
            const yearStart = new Date(now.getFullYear(), 0, 1);
            return { startDate: yearStart.toISOString().split('T')[0], endDate: today };
        }
        case 'custom':
        default:
            return { startDate: '', endDate: '' };
    }
}

export function DateRangeInput({
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    presets = true,
    onPresetChange,
}: DateRangeInputProps) {
    const handlePresetClick = (preset: DatePreset) => {
        if (preset === 'custom') {
            onPresetChange?.(preset);
            return;
        }

        const dates = getPresetDates(preset);
        onStartDateChange(dates.startDate);
        onEndDateChange(dates.endDate);
        onPresetChange?.(preset);
    };

    return (
        <div className="flex flex-col gap-3">
            {/* Presets */}
            {presets && (
                <div className="flex flex-wrap gap-2">
                    {presetOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => handlePresetClick(option.value)}
                            className="px-3 py-1.5 text-sm rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Date Inputs */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                    <label className="block text-sm text-slate-400 mb-1">From</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => onStartDateChange(e.target.value)}
                        className="input-field w-full"
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-sm text-slate-400 mb-1">To</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => onEndDateChange(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="input-field w-full"
                    />
                </div>
            </div>
        </div>
    );
}
