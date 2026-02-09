import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getReactors } from '../features/reactor/services/reactorService';
import { getBatches } from '../features/reactor/services/batchService';
import { getTodaysEntries } from '../features/gate/services/gateEntryService';
import { getLowStockItems } from '../features/inventory/services/inventoryService';
import { useActiveShift } from '../features/shifts/hooks/useShifts';
import { useAssetStats } from '../features/asset-register/hooks/useAssets';
import { useJobStats } from '../features/maintenance/hooks/useMaintenance';
import { SHIFT_TYPES } from '../features/shifts/services/shiftService';


// Key for storing recent modules in localStorage
const RECENT_MODULES_KEY = 'recent-modules';
const MAX_RECENT_MODULES = 3;

// Get recent modules from localStorage
function getRecentModules(): string[] {
    try {
        const stored = localStorage.getItem(RECENT_MODULES_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

// Save module to recent list
function saveRecentModule(moduleId: string): void {
    try {
        const recent = getRecentModules();
        const updated = [moduleId, ...recent.filter(id => id !== moduleId)].slice(0, MAX_RECENT_MODULES);
        localStorage.setItem(RECENT_MODULES_KEY, JSON.stringify(updated));
    } catch {
        // Ignore localStorage errors
    }
}

export default function DashboardPage() {
    const { userData } = useAuth();
    const navigate = useNavigate();
    // Use lazy initializer to load recent modules from localStorage
    const [recentModules] = useState<string[]>(getRecentModules);

    // Live dashboard stats
    const { data: reactors, isError: reactorsError } = useQuery({ queryKey: ['reactors'], queryFn: getReactors, staleTime: 30_000 });
    const { data: todayBatches, isError: batchesError } = useQuery({
        queryKey: ['batches', 'today'],
        queryFn: () => getBatches(100),
        staleTime: 30_000,
        select: (batches) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return batches.filter(b => {
                const ts = b.startTime as { toDate?: () => Date };
                const d = ts?.toDate ? ts.toDate() : new Date(b.startTime as unknown as string);
                return d >= today;
            });
        },
    });
    const { data: todayGateEntries, isError: gateError } = useQuery({ queryKey: ['gateEntries', 'today'], queryFn: getTodaysEntries, staleTime: 30_000 });
    const { data: lowStockItems, isError: inventoryError } = useQuery({ queryKey: ['inventory', 'lowStock'], queryFn: getLowStockItems, staleTime: 60_000 });
    const { data: activeShift } = useActiveShift();
    const { data: assetStats } = useAssetStats();
    const { data: jobStats } = useJobStats();
    const statsError = reactorsError || batchesError || gateError || inventoryError;

    const activeReactorCount = reactors?.filter(r => r.status === 'IN_BATCH').length ?? 0;
    const totalReactorCount = reactors?.length ?? 0;
    const todayBatchCount = todayBatches?.length ?? 0;
    const inProgressBatchCount = todayBatches?.filter(b => b.status === 'IN_PROGRESS' || b.status === 'COOLING').length ?? 0;
    const todayGateCount = todayGateEntries?.length ?? 0;
    const lowStockCount = lowStockItems?.length ?? 0;

    const handleModuleClick = (moduleId: string) => {
        saveRecentModule(moduleId);
        navigate(`/${moduleId}`);
    };

    // Role-based dashboard cards
    const getRoleBasedModules = () => {
        if (!userData) return [];

        const allModules = [
            { id: 'weighbridge', name: 'Weighbridge', icon: '🚚', roles: ['SUPER_ADMIN', 'PLANT_MANAGER', 'WEIGHBRIDGE_OPERATOR', 'GATE_OPERATOR'], color: 'from-teal-500 to-teal-600' },
            { id: 'gate', name: 'Gate Operations', icon: '🚛', roles: ['SUPER_ADMIN', 'PLANT_MANAGER', 'SHIFT_SUPERVISOR', 'GATE_OPERATOR'], color: 'from-green-500 to-green-600' },
            { id: 'reactor', name: 'Reactor Dashboard', icon: '⚙️', roles: ['SUPER_ADMIN', 'PLANT_MANAGER', 'SHIFT_SUPERVISOR', 'REACTOR_OPERATOR'], color: 'from-orange-500 to-orange-600' },
            { id: 'reactor/output', name: 'Reactor Output', icon: '📊', roles: ['SUPER_ADMIN', 'PLANT_MANAGER', 'SHIFT_SUPERVISOR', 'REACTOR_OPERATOR'], color: 'from-amber-500 to-amber-600' },
            { id: 'inventory', name: 'Inventory', icon: '📦', roles: ['SUPER_ADMIN', 'PLANT_MANAGER', 'STORES_KEEPER'], color: 'from-cyan-500 to-cyan-600' },
            { id: 'spare-parts', name: 'Store', icon: '🏪', roles: ['SUPER_ADMIN', 'PLANT_MANAGER', 'STORES_KEEPER', 'MAINTENANCE_TECH'], color: 'from-indigo-500 to-indigo-600' },
            { id: 'users', name: 'User Management', icon: '👥', roles: ['SUPER_ADMIN', 'PLANT_MANAGER'], color: 'from-blue-500 to-blue-600' },
            { id: 'devices', name: 'Device Management', icon: '📱', roles: ['SUPER_ADMIN'], color: 'from-purple-500 to-purple-600' },
            { id: 'shifts', name: 'Shift Management', icon: '🕐', roles: ['SUPER_ADMIN', 'PLANT_MANAGER', 'SHIFT_SUPERVISOR'], color: 'from-emerald-500 to-emerald-600' },
            { id: 'maintenance', name: 'Maintenance', icon: '🔧', roles: ['SUPER_ADMIN', 'PLANT_MANAGER', 'MAINTENANCE_TECH'], color: 'from-yellow-500 to-yellow-600' },
            { id: 'audit', name: 'Audit Logs', icon: '📋', roles: ['SUPER_ADMIN', 'PLANT_MANAGER'], color: 'from-slate-500 to-slate-600' },
            { id: 'reports', name: 'Reports', icon: '📈', roles: ['SUPER_ADMIN'], color: 'from-red-500 to-red-600' },
            { id: 'bug-reports', name: 'Bug Reports', icon: '🐛', roles: ['SUPER_ADMIN', 'PLANT_MANAGER'], color: 'from-rose-500 to-rose-600' },
        ];

        return allModules.filter(module =>
            module.roles.includes(userData.role)
        );
    };

    const modules = getRoleBasedModules();

    return (
        <div className="relative overflow-hidden">
            {/* Ambient background glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/6 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Main Content */}
            <main className="p-4 relative z-10">
                {/* Welcome Message */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-foreground">
                        Welcome back, <span className="text-gradient">{userData?.name?.split(' ')[0] || 'User'}</span>!
                    </h2>
                    <p className="text-foreground-muted mt-1">Here's what's happening at the plant today.</p>
                </div>

                {/* Stats loading error */}
                {statsError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                        <p className="text-red-400 text-sm">Failed to load some dashboard stats. Data shown may be stale.</p>
                    </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Active Reactors */}
                    <div className="glass-card-elevated p-5 glow-green group hover:-translate-y-0.5 transition-all duration-300">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-green-500/15 rounded-lg flex items-center justify-center ring-1 ring-green-500/25">
                                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-foreground-muted text-xs font-medium uppercase tracking-wider">Active Reactors</h3>
                            </div>
                            <span className="status-badge status-active">Online</span>
                        </div>
                        <p className="text-3xl font-bold text-foreground">{activeReactorCount}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-soft" />
                            <p className="text-sm text-foreground-faint">of {totalReactorCount} total</p>
                        </div>
                    </div>

                    {/* Today's Batches */}
                    <div className="glass-card-elevated p-5 glow-orange group hover:-translate-y-0.5 transition-all duration-300">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-orange-500/15 rounded-lg flex items-center justify-center ring-1 ring-orange-500/25">
                                <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-foreground-muted text-xs font-medium uppercase tracking-wider">Today's Batches</h3>
                            </div>
                            <span className="status-badge status-pending">In Progress</span>
                        </div>
                        <p className="text-3xl font-bold text-foreground">{todayBatchCount}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse-soft" />
                            <p className="text-sm text-foreground-faint">{inProgressBatchCount} in progress</p>
                        </div>
                    </div>

                    {/* Gate Entries */}
                    <div className="glass-card-elevated p-5 glow-blue group hover:-translate-y-0.5 transition-all duration-300">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-blue-500/15 rounded-lg flex items-center justify-center ring-1 ring-blue-500/25">
                                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-foreground-muted text-xs font-medium uppercase tracking-wider">Gate Entries</h3>
                            </div>
                            <span className="status-badge status-active">Active</span>
                        </div>
                        <p className="text-3xl font-bold text-foreground">{todayGateCount}</p>
                        <p className="text-sm text-foreground-faint mt-1">today</p>
                    </div>

                    {/* Pending Jobs */}
                    <div className="glass-card-elevated p-5 glow-red group hover:-translate-y-0.5 transition-all duration-300">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-red-500/15 rounded-lg flex items-center justify-center ring-1 ring-red-500/25">
                                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-foreground-muted text-xs font-medium uppercase tracking-wider">Low Stock</h3>
                            </div>
                            {lowStockCount > 0 ? <span className="status-badge status-inactive">Attention</span> : <span className="status-badge status-active">OK</span>}
                        </div>
                        <p className="text-3xl font-bold text-foreground">{lowStockCount}</p>
                        <p className="text-sm text-foreground-faint mt-1">items below minimum</p>
                    </div>
                </div>

                {/* Module Cards */}
                <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-lg font-semibold text-foreground">Quick Access</h3>
                    <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {modules.map((module, index) => {
                        const isRecent = recentModules.includes(module.id);
                        const recentIndex = recentModules.indexOf(module.id);

                        return (
                            <button
                                key={module.id}
                                className={`
                                    glass-card p-5 text-left transition-all duration-300 group animate-fade-in-up
                                    hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30 hover:border-border-secondary
                                    ${isRecent ? 'ring-1 ring-blue-500/40 bg-blue-500/5' : ''}
                                `}
                                style={{ animationDelay: `${index * 50}ms` }}
                                onClick={() => handleModuleClick(module.id)}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`w-11 h-11 bg-gradient-to-br ${module.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                                        <span className="text-xl">{module.icon}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isRecent && (
                                            <span className="text-[10px] text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded-full ring-1 ring-blue-500/25 font-medium uppercase tracking-wider">
                                                {recentIndex === 0 ? 'Recent' : 'Visited'}
                                            </span>
                                        )}
                                        <svg className="w-4 h-4 text-foreground-faint group-hover:text-foreground-muted group-hover:translate-x-0.5 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                                <h4 className="text-foreground font-semibold mb-0.5 group-hover:text-blue-100 transition-colors">{module.name}</h4>
                                <p className="text-foreground-faint text-sm">
                                    Click to open {module.name.toLowerCase()}
                                </p>
                            </button>
                        );
                    })}
                </div>

                {/* Maintenance Alerts */}
                {((assetStats && (assetStats.breakdownAssets > 0 || assetStats.pmDue > 0)) || (jobStats && jobStats.criticalJobs > 0)) && (
                    <div className="mt-6 mb-4">
                        <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold text-foreground">Maintenance Alerts</h3>
                            <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {assetStats && assetStats.breakdownAssets > 0 && (
                                <div className="glass-card p-4 border border-red-500/30 cursor-pointer hover:bg-surface-hover transition-colors" onClick={() => navigate('/assets')}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                        <p className="text-red-400 font-medium text-sm">{assetStats.breakdownAssets} Asset{assetStats.breakdownAssets > 1 ? 's' : ''} Down</p>
                                    </div>
                                    <p className="text-foreground-faint text-xs mt-1">Requires immediate attention</p>
                                </div>
                            )}
                            {jobStats && jobStats.criticalJobs > 0 && (
                                <div className="glass-card p-4 border border-orange-500/30 cursor-pointer hover:bg-surface-hover transition-colors" onClick={() => navigate('/maintenance')}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                                        <p className="text-orange-400 font-medium text-sm">{jobStats.criticalJobs} Critical Job{jobStats.criticalJobs > 1 ? 's' : ''}</p>
                                    </div>
                                    <p className="text-foreground-faint text-xs mt-1">Open critical work orders</p>
                                </div>
                            )}
                            {assetStats && assetStats.pmDue > 0 && (
                                <div className="glass-card p-4 border border-yellow-500/30 cursor-pointer hover:bg-surface-hover transition-colors" onClick={() => navigate('/assets')}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                        <p className="text-yellow-400 font-medium text-sm">{assetStats.pmDue} PM Overdue</p>
                                    </div>
                                    <p className="text-foreground-faint text-xs mt-1">Preventive maintenance due</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Current Shift Info */}
                <div className="gradient-border-card p-5 mt-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-500/15 rounded-lg flex items-center justify-center ring-1 ring-indigo-500/25">
                                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-foreground font-semibold">Current Shift</h3>
                                {activeShift ? (
                                    <p className="text-foreground-muted text-sm">
                                        {SHIFT_TYPES.find(s => s.value === activeShift.shiftType)?.label || `Shift ${activeShift.shiftType}`}
                                        {' '}&bull;{' '}
                                        {SHIFT_TYPES.find(s => s.value === activeShift.shiftType)?.time || ''}
                                    </p>
                                ) : (
                                    <p className="text-foreground-faint text-sm">No active shift</p>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            {activeShift ? (
                                <>
                                    <p className="text-xs text-foreground-faint uppercase tracking-wider mb-0.5">Started</p>
                                    <p className="text-foreground font-medium text-sm">
                                        {(() => {
                                            const ts = activeShift.startTime as { toDate?: () => Date };
                                            return ts?.toDate ? ts.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
                                        })()}
                                    </p>
                                </>
                            ) : (
                                <button onClick={() => navigate('/shifts')} className="text-blue-400 hover:text-blue-300 text-sm">
                                    Start Shift →
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
