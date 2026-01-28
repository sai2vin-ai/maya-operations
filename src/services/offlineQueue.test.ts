import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    isOnline,
    setupNetworkListeners,
} from '../services/offlineQueue';

describe('offlineQueue', () => {
    describe('isOnline', () => {
        it('should return navigator.onLine value', () => {
            Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
            expect(isOnline()).toBe(true);

            Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
            expect(isOnline()).toBe(false);
        });
    });

    describe('setupNetworkListeners', () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('should add event listeners for online and offline', () => {
            const onOnline = vi.fn();
            const onOffline = vi.fn();

            setupNetworkListeners(onOnline, onOffline);

            expect(window.addEventListener).toHaveBeenCalledWith('online', onOnline);
            expect(window.addEventListener).toHaveBeenCalledWith('offline', onOffline);
        });

        it('should return cleanup function', () => {
            const onOnline = vi.fn();
            const onOffline = vi.fn();

            const cleanup = setupNetworkListeners(onOnline, onOffline);

            expect(typeof cleanup).toBe('function');

            cleanup();

            expect(window.removeEventListener).toHaveBeenCalledWith('online', onOnline);
            expect(window.removeEventListener).toHaveBeenCalledWith('offline', onOffline);
        });
    });
});
