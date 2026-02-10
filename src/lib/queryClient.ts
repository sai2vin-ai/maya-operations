import { QueryClient, MutationCache } from '@tanstack/react-query';

// Global mutation error handler - surfaces errors as a custom event
// that the ToastProvider can listen to, without coupling queryClient to React context
const mutationCache = new MutationCache({
    onError: (error) => {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        // Dispatch a custom event for the toast system to pick up
        window.dispatchEvent(new CustomEvent('mutation-error', { detail: { message } }));
    },
});

export const queryClient = new QueryClient({
    mutationCache,
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});
