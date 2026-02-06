import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './contexts/ThemeContext'
import { initSentry, SentryErrorBoundary } from './lib/sentry'
import { reportWebVitals } from './lib/performance'

// Initialize Sentry before rendering
initSentry()

// Initialize performance monitoring in production
if (import.meta.env.PROD) {
  reportWebVitals()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <SentryErrorBoundary fallback={({ error, resetError }) => {
        const err = error instanceof Error ? error : new Error(String(error));
        return (
          <div className="min-h-screen page-bg flex items-center justify-center p-4">
            <div className="glass-card p-8 max-w-md text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-foreground mb-2">Something went wrong</h1>
              <p className="text-foreground-muted mb-4">
                An unexpected error occurred. Our team has been notified.
              </p>
              <p className="text-foreground-faint text-sm mb-6 font-mono bg-surface-secondary p-2 rounded">
                {err.message}
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={resetError} className="btn-primary">
                  Try Again
                </button>
                <button onClick={() => window.location.href = '/dashboard'} className="btn-secondary">
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        );
      }}>
        <App />
      </SentryErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
)
