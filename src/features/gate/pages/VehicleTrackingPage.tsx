import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getGateEntries } from '../services/gateEntryService';
import { PageHeader, LoadingSpinner, EmptyState } from '../../../components/ui';

export default function VehicleTrackingPage() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [view, setView] = useState<'vehicles' | 'blacklist'>('vehicles');

    const { data: entries = [], isLoading } = useQuery({
        queryKey: ['gateEntries', 'all'],
        queryFn: () => getGateEntries(500),
    });

    // Group entries by vehicle number
    const vehicleData = useMemo(() => {
        const vehicles: Record<string, {
            vehicleNumber: string;
            totalVisits: number;
            lastVisit: Date;
            firstVisit: Date;
            avgTurnaroundMins: number;
            materials: string[];
            entries: typeof entries;
        }> = {};

        entries.forEach(entry => {
            const vn = entry.vehicleNumber;
            if (!vehicles[vn]) {
                vehicles[vn] = {
                    vehicleNumber: vn,
                    totalVisits: 0,
                    lastVisit: new Date(0),
                    firstVisit: new Date(),
                    avgTurnaroundMins: 0,
                    materials: [],
                    entries: [],
                };
            }

            const v = vehicles[vn];
            v.totalVisits++;
            v.entries.push(entry);

            const entryTs = entry.entryTime as { toDate?: () => Date };
            const entryDate = entryTs?.toDate ? entryTs.toDate() : new Date();

            if (entryDate > v.lastVisit) v.lastVisit = entryDate;
            if (entryDate < v.firstVisit) v.firstVisit = entryDate;

            if (entry.materialCategory && !v.materials.includes(entry.materialCategory)) {
                v.materials.push(entry.materialCategory);
            }

            // Calculate turnaround for completed entries
            if (entry.status === 'COMPLETED' && entry.exitTime) {
                const exitTs = entry.exitTime as { toDate?: () => Date };
                const exitDate = exitTs?.toDate ? exitTs.toDate() : null;
                if (exitDate) {
                    const turnaround = (exitDate.getTime() - entryDate.getTime()) / (1000 * 60);
                    v.avgTurnaroundMins = (v.avgTurnaroundMins * (v.totalVisits - 1) + turnaround) / v.totalVisits;
                }
            }
        });

        return Object.values(vehicles).sort((a, b) => b.totalVisits - a.totalVisits);
    }, [entries]);

    const filteredVehicles = vehicleData.filter(v => {
        if (!searchQuery) return true;
        return v.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Frequent visitors (5+ visits)
    const frequentVisitors = vehicleData.filter(v => v.totalVisits >= 5);

    const formatDuration = (mins: number) => {
        if (mins < 60) return `${Math.round(mins)}m`;
        const hours = Math.floor(mins / 60);
        const remaining = Math.round(mins % 60);
        return `${hours}h ${remaining}m`;
    };

    const formatDate = (date: Date) => {
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div>
            <PageHeader
                title="Vehicle Tracking"
                subtitle={`${vehicleData.length} unique vehicles tracked`}
                backTo="/gate"
            />

            <main className="p-4 max-w-6xl mx-auto">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="glass-card p-4">
                        <p className="text-sm text-foreground-muted">Unique Vehicles</p>
                        <p className="text-2xl font-bold text-foreground">{vehicleData.length}</p>
                    </div>
                    <div className="glass-card p-4">
                        <p className="text-sm text-foreground-muted">Total Entries</p>
                        <p className="text-2xl font-bold text-foreground">{entries.length}</p>
                    </div>
                    <div className="glass-card p-4">
                        <p className="text-sm text-foreground-muted">Frequent Visitors</p>
                        <p className="text-2xl font-bold text-blue-400">{frequentVisitors.length}</p>
                        <p className="text-xs text-foreground-faint">5+ visits</p>
                    </div>
                    <div className="glass-card p-4">
                        <p className="text-sm text-foreground-muted">Avg Turnaround</p>
                        <p className="text-2xl font-bold text-foreground">
                            {vehicleData.length > 0 ? formatDuration(vehicleData.reduce((sum, v) => sum + v.avgTurnaroundMins, 0) / vehicleData.length) : '-'}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="glass-card p-1 mb-4 inline-flex gap-1">
                    <button
                        onClick={() => setView('vehicles')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            view === 'vehicles' ? 'bg-blue-600/20 text-blue-400' : 'text-foreground-muted hover:text-foreground'
                        }`}
                    >
                        All Vehicles
                    </button>
                    <button
                        onClick={() => setView('blacklist')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            view === 'blacklist' ? 'bg-blue-600/20 text-blue-400' : 'text-foreground-muted hover:text-foreground'
                        }`}
                    >
                        Frequent Visitors
                    </button>
                </div>

                {/* Search */}
                <div className="glass-card p-4 mb-4">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-field w-full"
                        placeholder="Search by vehicle number..."
                    />
                </div>

                {isLoading ? (
                    <LoadingSpinner />
                ) : (
                    <div className="glass-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-surface-tertiary/50">
                                    <tr>
                                        <th className="text-left p-4 text-foreground-secondary font-medium">Vehicle Number</th>
                                        <th className="text-right p-4 text-foreground-secondary font-medium">Total Visits</th>
                                        <th className="text-left p-4 text-foreground-secondary font-medium">Materials</th>
                                        <th className="text-left p-4 text-foreground-secondary font-medium">Last Visit</th>
                                        <th className="text-right p-4 text-foreground-secondary font-medium">Avg Turnaround</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {(view === 'blacklist' ? frequentVisitors : filteredVehicles).map((vehicle) => (
                                        <tr
                                            key={vehicle.vehicleNumber}
                                            className="hover:bg-surface-tertiary/30 cursor-pointer transition-colors"
                                            onClick={() => navigate(`/gate?vehicle=${encodeURIComponent(vehicle.vehicleNumber)}`)}
                                        >
                                            <td className="p-4">
                                                <span className="text-foreground font-mono font-bold">{vehicle.vehicleNumber}</span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className={`font-bold ${vehicle.totalVisits >= 10 ? 'text-blue-400' : vehicle.totalVisits >= 5 ? 'text-green-400' : 'text-foreground'}`}>
                                                    {vehicle.totalVisits}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {vehicle.materials.slice(0, 3).map(m => (
                                                        <span key={m} className="px-2 py-0.5 rounded-full text-xs bg-surface-tertiary text-foreground-muted">{m}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4 text-foreground-muted text-sm">{formatDate(vehicle.lastVisit)}</td>
                                            <td className="p-4 text-right text-foreground-secondary text-sm">
                                                {vehicle.avgTurnaroundMins > 0 ? formatDuration(vehicle.avgTurnaroundMins) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {filteredVehicles.length === 0 && (
                            <EmptyState title="No vehicles found" description="No matching vehicle records" />
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
