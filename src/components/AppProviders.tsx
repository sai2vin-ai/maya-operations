import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../contexts/AuthContext';
import { RolePermissionsProvider } from '../contexts/RolePermissionsContext';
import { OfflineProvider } from '../contexts/OfflineContext';
import { SidebarProvider } from '../contexts/SidebarContext';
import { ToastProvider } from './ui';
import { queryClient } from '../lib/queryClient';

export function AppProviders({ children }: { children: ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <AuthProvider>
                    <RolePermissionsProvider>
                        <OfflineProvider>
                            <ToastProvider>
                                <SidebarProvider>{children}</SidebarProvider>
                            </ToastProvider>
                        </OfflineProvider>
                    </RolePermissionsProvider>
                </AuthProvider>
            </BrowserRouter>
        </QueryClientProvider>
    );
}
