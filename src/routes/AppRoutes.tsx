import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from '../components/ProtectedRoute';
import { AppLayout } from '../components/layout';
import { getRolesForModule, getRolesWithPermission } from '../config/roles';
import { LoginPage, NotFoundPage } from './pages';
import { appRoutes, type RouteConfig } from './routeConfig';

function resolveAllowedRoles(route: RouteConfig) {
    if (!route.module) return undefined;
    if (route.permission) {
        return getRolesWithPermission(route.module, route.permission);
    }
    return getRolesForModule(route.module);
}

export function AppRoutes() {
    return (
        <Routes>
            {/* Public route — login */}
            <Route
                path="/login"
                element={
                    <PublicRoute>
                        <LoginPage />
                    </PublicRoute>
                }
            />

            {/* All protected routes wrapped in AppLayout */}
            <Route
                element={
                    <ProtectedRoute>
                        <AppLayout />
                    </ProtectedRoute>
                }
            >
                {appRoutes.map((route) => {
                    const allowedRoles = resolveAllowedRoles(route);
                    const Page = route.page;

                    return allowedRoles ? (
                        <Route
                            key={route.path}
                            path={route.path}
                            element={
                                <ProtectedRoute allowedRoles={allowedRoles}>
                                    <Page />
                                </ProtectedRoute>
                            }
                        />
                    ) : (
                        <Route key={route.path} path={route.path} element={<Page />} />
                    );
                })}

                {/* Redirect legacy /roles path to /settings */}
                <Route path="/roles" element={<Navigate to="/settings" replace />} />
            </Route>

            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}
