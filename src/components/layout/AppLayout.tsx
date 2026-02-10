import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { LoadingSpinner } from '../ui';

export function AppLayout() {
    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex flex-col flex-1 min-w-0">
                <TopBar />
                <main className="flex-1 overflow-y-auto page-bg">
                    <Suspense
                        fallback={
                            <div className="flex items-center justify-center h-full">
                                <LoadingSpinner message="Loading page..." />
                            </div>
                        }
                    >
                        <Outlet />
                    </Suspense>
                </main>
            </div>
        </div>
    );
}
