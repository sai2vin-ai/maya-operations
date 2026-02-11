import { useState, lazy, Suspense } from 'react';
import { LoadingSpinner } from '../components/ui';

const RolesPermissionsTab = lazy(() => import('./settings/RolesPermissionsTab'));
const SystemConfigTab = lazy(() => import('./settings/SystemConfigTab'));
const NavigationTab = lazy(() => import('./settings/NavigationTab'));

type Tab = 'roles' | 'config' | 'navigation';

const TABS: { id: Tab; label: string }[] = [
    { id: 'roles', label: 'Roles & Permissions' },
    { id: 'config', label: 'System Config' },
    { id: 'navigation', label: 'Navigation' },
];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('roles');

    return (
        <div className="">
            {/* Header */}
            <header className="glass-card m-4 p-4">
                <h1 className="text-xl font-bold text-foreground">Settings</h1>
                <p className="text-sm text-foreground-muted">System configuration and access control</p>
            </header>

            {/* Tab Bar */}
            <div className="px-4">
                <div className="inline-flex gap-1 bg-surface-secondary rounded-lg p-1">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                                activeTab === tab.id
                                    ? 'bg-blue-600 text-white'
                                    : 'text-foreground-secondary hover:bg-surface-hover'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <main className="p-4">
                <Suspense fallback={<LoadingSpinner message="Loading..." />}>
                    {activeTab === 'roles' && <RolesPermissionsTab />}
                    {activeTab === 'config' && <SystemConfigTab />}
                    {activeTab === 'navigation' && <NavigationTab />}
                </Suspense>
            </main>
        </div>
    );
}
