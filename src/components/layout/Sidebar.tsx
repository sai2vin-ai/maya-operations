import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { getNavGroupsForRole, DASHBOARD_NAV_ITEM, NAV_ICON_PATHS } from '../../config/navigation';
import type { NavItem } from '../../config/navigation';

function NavIcon({ icon, className = '' }: { icon: string; className?: string }) {
    const iconData = NAV_ICON_PATHS[icon];
    if (!iconData) return null;
    return (
        <svg
            className={`w-5 h-5 flex-shrink-0 ${className}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
        >
            <path strokeLinecap="round" strokeLinejoin="round" d={iconData.path} />
        </svg>
    );
}

export function Sidebar() {
    const { userData } = useAuth();
    const { isCollapsed, isMobileOpen, toggleCollapsed, closeMobile } = useSidebar();
    const location = useLocation();
    const navigate = useNavigate();

    const navGroups = userData ? getNavGroupsForRole(userData.role) : [];
    const showDashboard = userData ? DASHBOARD_NAV_ITEM.roles.includes(userData.role) : false;

    const isActive = (path: string) => {
        if (path === '/dashboard') return location.pathname === '/dashboard';
        return location.pathname.startsWith(path);
    };

    const handleNav = (path: string) => {
        navigate(path);
        closeMobile();
    };

    const renderNavButton = (item: NavItem) => {
        const active = isActive(item.path);
        return (
            <button
                key={item.id}
                onClick={() => handleNav(item.path)}
                title={isCollapsed ? item.label : undefined}
                className={`
                    w-full flex items-center gap-3 rounded-lg transition-all duration-200 text-left
                    ${isCollapsed ? 'justify-center px-2 py-2' : 'px-3 py-2'}
                    ${
                        active
                            ? 'bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/25'
                            : 'text-foreground-muted hover:bg-surface-hover hover:text-foreground'
                    }
                `}
            >
                <NavIcon icon={item.icon} className={active ? 'text-blue-400' : ''} />
                {!isCollapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
            </button>
        );
    };

    const sidebarContent = (
        <div className="flex flex-col h-full">
            {/* Logo / Branding */}
            <div
                className={`flex items-center gap-3 p-4 border-b border-border ${isCollapsed ? 'justify-center' : ''}`}
            >
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
                    <span className="text-white font-bold text-lg">P</span>
                </div>
                {!isCollapsed && (
                    <div className="overflow-hidden">
                        <h1 className="text-sm font-bold text-foreground truncate">Pyrolysis Ops</h1>
                        <p className="text-xs text-foreground-muted truncate">Plant Management</p>
                    </div>
                )}
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 overflow-y-auto py-2 px-2">
                {/* Dashboard (always above groups) */}
                {showDashboard && <div className="mb-1">{renderNavButton(DASHBOARD_NAV_ITEM)}</div>}

                {/* Grouped sections */}
                {navGroups.map((group) => (
                    <div key={group.id} className="mt-3">
                        {isCollapsed ? (
                            <div className="mx-2 border-t border-border" />
                        ) : (
                            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-foreground-faint">
                                {group.label}
                            </p>
                        )}
                        <div className="space-y-0.5 mt-1">{group.items.map(renderNavButton)}</div>
                    </div>
                ))}
            </nav>

            {/* Collapse Toggle (desktop only) */}
            <div className="hidden md:block border-t border-border p-2">
                <button
                    onClick={toggleCollapsed}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-foreground-muted hover:bg-surface-hover hover:text-foreground transition-colors"
                    title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <svg
                        className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                    {!isCollapsed && <span className="text-sm">Collapse</span>}
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                className={`
                    hidden md:flex flex-col bg-surface border-r border-border
                    transition-all duration-300 ease-in-out flex-shrink-0
                    ${isCollapsed ? 'w-16' : 'w-60'}
                `}
            >
                {sidebarContent}
            </aside>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={closeMobile} />
                    {/* Slide-in Sidebar */}
                    <aside className="fixed inset-y-0 left-0 w-64 bg-surface border-r border-border z-50 md:hidden animate-slide-in-left">
                        {sidebarContent}
                    </aside>
                </>
            )}
        </>
    );
}
