import { Suspense } from 'react';
import { AppProviders } from './components/AppProviders';
import { AppRoutes } from './routes/AppRoutes';
import { SyncStatusIndicator, OfflineBanner } from './components/SyncStatus';
import { LoadingSpinner } from './components/ui';
import './index.css';

function App() {
    return (
        <AppProviders>
            <OfflineBanner />
            <Suspense fallback={<LoadingSpinner fullScreen message="Loading..." />}>
                <AppRoutes />
            </Suspense>
            <SyncStatusIndicator />
        </AppProviders>
    );
}

export default App;
