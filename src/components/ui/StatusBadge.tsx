interface StatusBadgeProps {
    status: string;
    variant?: 'status' | 'role';
}

const statusStyles: Record<string, string> = {
    ACTIVE: 'status-badge status-active',
    INACTIVE: 'status-badge status-inactive',
    SUSPENDED: 'status-badge status-pending',
    PENDING: 'status-badge status-pending',
    COMPLETED: 'status-badge status-active',
    CANCELLED: 'status-badge status-inactive',
    IN_PROGRESS: 'status-badge bg-blue-500/20 text-blue-400 border-blue-500/50',
};

const roleStyles: Record<string, string> = {
    SUPER_ADMIN: 'bg-red-500/20 text-red-400 border border-red-500/50',
    PLANT_MANAGER: 'bg-purple-500/20 text-purple-400 border border-purple-500/50',
    SHIFT_SUPERVISOR: 'bg-blue-500/20 text-blue-400 border border-blue-500/50',
    GATE_OPERATOR: 'bg-green-500/20 text-green-400 border border-green-500/50',
    WEIGHBRIDGE_OPERATOR: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50',
    REACTOR_OPERATOR: 'bg-orange-500/20 text-orange-400 border border-orange-500/50',
    STORES_KEEPER: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50',
    MAINTENANCE_TECH: 'bg-slate-500/20 text-slate-400 border border-slate-500/50',
    VIEWER: 'bg-gray-500/20 text-gray-400 border border-gray-500/50',
};

export function StatusBadge({ status, variant = 'status' }: StatusBadgeProps) {
    const normalizedStatus = status?.toUpperCase();

    if (variant === 'role') {
        const style = roleStyles[normalizedStatus] || 'bg-slate-500/20 text-slate-400 border border-slate-500/50';
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${style}`}>
                {status}
            </span>
        );
    }

    const style = statusStyles[normalizedStatus] || 'status-badge';
    return (
        <span className={style}>
            {status}
        </span>
    );
}
