import * as Sentry from '@sentry/react';

// Environment detection
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Initialize Sentry
export function initSentry() {
    // Only initialize if DSN is configured
    const dsn = import.meta.env.VITE_SENTRY_DSN;

    if (!dsn) {
        if (isDevelopment) {
            console.info('Sentry DSN not configured. Error tracking disabled.');
        }
        return;
    }

    Sentry.init({
        dsn,
        environment: isProduction ? 'production' : 'development',
        release: import.meta.env.VITE_APP_VERSION || '1.0.0',

        // Performance Monitoring
        tracesSampleRate: isProduction ? 0.1 : 1.0, // 10% in prod, 100% in dev

        // Session Replay for debugging (only in production)
        replaysSessionSampleRate: isProduction ? 0.1 : 0,
        replaysOnErrorSampleRate: isProduction ? 1.0 : 0,

        // Integrations
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({
                maskAllText: true,
                blockAllMedia: true,
            }),
        ],

        // Filter out non-actionable errors
        beforeSend(event, hint) {
            const error = hint.originalException;

            // Ignore network errors that are likely transient
            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                return null;
            }

            // Ignore Firebase auth errors that are user-caused
            if (error instanceof Error) {
                const ignoredMessages = [
                    'auth/wrong-password',
                    'auth/user-not-found',
                    'auth/invalid-email',
                    'auth/too-many-requests',
                    'auth/network-request-failed',
                ];
                if (ignoredMessages.some(msg => error.message.includes(msg))) {
                    return null;
                }
            }

            return event;
        },

        // Don't send PII
        beforeSendTransaction(event) {
            // Remove any PII from transaction data
            if (event.user) {
                delete event.user.ip_address;
                delete event.user.email;
            }
            return event;
        },
    });
}

// Error boundary wrapper for components
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Manual error capture
export function captureError(error: Error, context?: Record<string, unknown>) {
    Sentry.captureException(error, {
        extra: context,
    });
}

// Manual message capture
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    Sentry.captureMessage(message, level);
}

// Set user context (call after login)
export function setUser(user: { id: string; email?: string; role?: string } | null) {
    if (user) {
        Sentry.setUser({
            id: user.id,
            // Don't send email to Sentry for privacy
            role: user.role,
        });
    } else {
        Sentry.setUser(null);
    }
}

// Add breadcrumb for debugging
export function addBreadcrumb(message: string, category: string, data?: Record<string, unknown>) {
    Sentry.addBreadcrumb({
        message,
        category,
        data,
        level: 'info',
    });
}

// Track page views
export function trackPageView(pageName: string) {
    addBreadcrumb(`Viewed ${pageName}`, 'navigation');
}

// Track user actions
export function trackAction(action: string, data?: Record<string, unknown>) {
    addBreadcrumb(action, 'user-action', data);
}
