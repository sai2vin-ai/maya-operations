import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { ThemeToggle } from '../ui/ThemeToggle';
import { GlobalSearch } from '../ui/GlobalSearch';
import { useUnreadCount, useRealtimeNotifications } from '../../features/notifications/hooks/useNotifications';

export function TopBar() {
    const { userData, logout } = useAuth();
    const { openMobile } = useSidebar();
    const navigate = useNavigate();
    const unreadCount = useUnreadCount();

    useRealtimeNotifications();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    return (
        <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-4 flex-shrink-0">
            {/* Left: Hamburger (mobile) */}
            <div className="flex items-center gap-3">
                <button
                    onClick={openMobile}
                    className="md:hidden p-1.5 rounded-lg text-foreground-muted hover:bg-surface-hover hover:text-foreground transition-colors"
                    aria-label="Open menu"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                </button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                {/* Global Search */}
                <GlobalSearch />

                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Report Bug */}
                <button
                    onClick={() => navigate('/bug-reports/new')}
                    className="p-2 rounded-lg text-foreground-muted hover:bg-surface-hover hover:text-foreground transition-colors"
                    title="Report a Bug"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12h.01M12 9v.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                </button>

                {/* Guide */}
                <button
                    onClick={() => navigate('/guide')}
                    className="p-2 rounded-lg text-foreground-muted hover:bg-surface-hover hover:text-foreground transition-colors"
                    title="User Guide"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                </button>

                {/* Notifications */}
                <button
                    onClick={() => navigate('/notifications')}
                    className="relative p-2 rounded-lg text-foreground-muted hover:bg-surface-hover hover:text-foreground transition-colors"
                    title="Notifications"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>

                {/* Divider */}
                <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

                {/* User Info */}
                <div className="hidden sm:flex items-center gap-2">
                    <div className="text-right">
                        <p className="text-sm font-medium text-foreground leading-tight">{userData?.name || 'User'}</p>
                        <p className="text-xs text-foreground-muted uppercase tracking-wider leading-tight">{userData?.role?.replace(/_/g, ' ') || ''}</p>
                    </div>
                    <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center ring-1 ring-border">
                        <span className="text-white text-sm font-medium">
                            {userData?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                    </div>
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg text-foreground-muted hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    title="Logout"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </div>
        </header>
    );
}
