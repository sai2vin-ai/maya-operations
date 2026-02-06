/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from 'react';

interface FilterOption {
    value: string;
    label: string;
    activeColor?: string;
}

interface FilterBarProps {
    searchValue: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder?: string;
    filters?: FilterOption[];
    activeFilter?: string;
    onFilterChange?: (value: string) => void;
    actions?: ReactNode;
}

export function FilterBar({
    searchValue,
    onSearchChange,
    searchPlaceholder = 'Search...',
    filters,
    activeFilter,
    onFilterChange,
    actions,
}: FilterBarProps) {
    const getFilterButtonClass = (filter: FilterOption, isActive: boolean) => {
        if (isActive) {
            const colorMap: Record<string, string> = {
                blue: 'bg-blue-600 text-white',
                green: 'bg-green-600 text-white',
                red: 'bg-red-600 text-white',
                yellow: 'bg-yellow-600 text-white',
                orange: 'bg-orange-600 text-white',
            };
            return colorMap[filter.activeColor || 'blue'] || 'bg-blue-600 text-white';
        }
        return 'bg-surface-tertiary text-foreground-secondary hover:bg-surface-hover';
    };

    return (
        <div className="glass-card p-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="input-field w-full"
                    />
                </div>

                {/* Filter Buttons */}
                {filters && filters.length > 0 && onFilterChange && (
                    <div className="flex gap-2">
                        {filters.map((filter) => (
                            <button
                                key={filter.value}
                                onClick={() => onFilterChange(filter.value)}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${getFilterButtonClass(
                                    filter,
                                    activeFilter === filter.value
                                )}`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Additional Actions */}
                {actions}
            </div>
        </div>
    );
}

// Preset filter configurations
export const StatusFilters: FilterOption[] = [
    { value: 'all', label: 'All', activeColor: 'blue' },
    { value: 'active', label: 'Active', activeColor: 'green' },
    { value: 'inactive', label: 'Inactive', activeColor: 'red' },
];
