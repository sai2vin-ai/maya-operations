import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { currentUser, userData, loading } = useAuth();
    const location = useLocation();

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen page-bg flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-foreground-muted">Loading...</p>
                </div>
            </div>
        );
    }

    // Not logged in - redirect to login
    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // User logged in but no Firestore data yet
    if (!userData) {
        return (
            <div className="min-h-screen page-bg flex items-center justify-center">
                <div className="glass-card p-8 text-center max-w-md">
                    <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-2">Account Setup Required</h2>
                    <p className="text-foreground-muted mb-4">Your account is not fully configured. Please contact an administrator.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="btn-secondary"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Check if user is active (case-insensitive)
    const userStatus = userData.status?.toUpperCase();
    if (userStatus !== 'ACTIVE') {
        console.log('User status check failed:', { status: userData.status, expected: 'ACTIVE' });
        return (
            <div className="min-h-screen page-bg flex items-center justify-center">
                <div className="glass-card p-8 text-center max-w-md">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-2">Account Suspended</h2>
                    <p className="text-foreground-muted mb-4">Your account has been suspended. Please contact an administrator.</p>
                </div>
            </div>
        );
    }

    // Check role-based access (case-insensitive)
    if (allowedRoles && allowedRoles.length > 0) {
        const userRole = userData.role?.toUpperCase() as UserRole;
        if (!allowedRoles.map(r => r.toUpperCase()).includes(userRole)) {
            return (
                <div className="min-h-screen page-bg flex items-center justify-center">
                    <div className="glass-card p-8 text-center max-w-md">
                        <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
                        <p className="text-foreground-muted mb-4">You don't have permission to access this page.</p>
                        <Navigate to="/dashboard" replace />
                    </div>
                </div>
            );
        }
    }

    return <>{children}</>;
}

// Public route - redirects to dashboard if already logged in
interface PublicRouteProps {
    children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
    const { currentUser, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen page-bg flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (currentUser) {
        // Redirect to dashboard or the page they tried to visit
        const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';
        return <Navigate to={from} replace />;
    }

    return <>{children}</>;
}
