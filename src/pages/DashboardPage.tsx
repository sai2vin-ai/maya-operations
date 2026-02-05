import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
    const { userData, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (err) {
            console.error('Logout failed:', err);
        }
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
            { id: 'maintenance', name: 'Maintenance', icon: '🔧', roles: ['SUPER_ADMIN', 'PLANT_MANAGER', 'MAINTENANCE_TECH'], color: 'from-yellow-500 to-yellow-600' },
            { id: 'audit', name: 'Audit Logs', icon: '📋', roles: ['SUPER_ADMIN', 'PLANT_MANAGER'], color: 'from-slate-500 to-slate-600' },
            { id: 'reports', name: 'Reports', icon: '📈', roles: ['SUPER_ADMIN'], color: 'from-red-500 to-red-600' },
        ];

        return allModules.filter(module =>
            module.roles.includes(userData.role)
        );
    };

    const modules = getRoleBasedModules();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <header className="glass-card m-4 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">P</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Pyrolysis Ops</h1>
                            <p className="text-sm text-slate-400">Plant Management System</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* User Info */}
                        <div className="text-right hidden sm:block">
                            <p className="text-white font-medium">{userData?.name || 'User'}</p>
                            <p className="text-sm text-slate-400">{userData?.role?.replace('_', ' ') || 'Loading...'}</p>
                        </div>

                        {/* Avatar */}
                        <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium">
                                {userData?.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-4">
                {/* Welcome Message */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white">
                        Welcome back, {userData?.name?.split(' ')[0] || 'User'}!
                    </h2>
                    <p className="text-slate-400">Here's what's happening at the plant today.</p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-slate-400 text-sm font-medium">Active Reactors</h3>
                            <span className="status-badge status-active">Online</span>
                        </div>
                        <p className="text-3xl font-bold text-white">4</p>
                        <p className="text-sm text-slate-500 mt-1">of 6 total</p>
                    </div>

                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-slate-400 text-sm font-medium">Today's Batches</h3>
                            <span className="status-badge status-pending">In Progress</span>
                        </div>
                        <p className="text-3xl font-bold text-white">12</p>
                        <p className="text-sm text-slate-500 mt-1">3 in progress</p>
                    </div>

                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-slate-400 text-sm font-medium">Gate Entries</h3>
                            <span className="status-badge status-active">Active</span>
                        </div>
                        <p className="text-3xl font-bold text-white">8</p>
                        <p className="text-sm text-slate-500 mt-1">today</p>
                    </div>

                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-slate-400 text-sm font-medium">Pending Jobs</h3>
                            <span className="status-badge status-inactive">Attention</span>
                        </div>
                        <p className="text-3xl font-bold text-white">2</p>
                        <p className="text-sm text-slate-500 mt-1">maintenance</p>
                    </div>
                </div>

                {/* Module Cards */}
                <h3 className="text-lg font-semibold text-white mb-4">Quick Access</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {modules.map((module) => (
                        <button
                            key={module.id}
                            className="glass-card p-6 text-left hover:bg-slate-700/50 transition-all group"
                            onClick={() => navigate(`/${module.id}`)}
                        >
                            <div className={`w-12 h-12 bg-gradient-to-br ${module.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                <span className="text-2xl">{module.icon}</span>
                            </div>
                            <h4 className="text-white font-semibold mb-1">{module.name}</h4>
                            <p className="text-slate-400 text-sm">
                                Click to open {module.name.toLowerCase()}
                            </p>
                        </button>
                    ))}
                </div>

                {/* Current Shift Info */}
                <div className="glass-card p-6 mt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-white font-semibold mb-1">Current Shift</h3>
                            <p className="text-slate-400">Shift A • 06:00 - 14:00</p>
                        </div>
                        <div className="text-right">
                            <p className="text-white font-semibold">Supervisor</p>
                            <p className="text-slate-400">{userData?.name || 'Loading...'}</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
