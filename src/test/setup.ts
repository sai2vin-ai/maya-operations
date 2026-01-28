import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Firebase
vi.mock('../lib/firebase', () => ({
    db: {},
    auth: {},
    storage: {},
}));

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
    value: true,
    writable: true,
});

// Mock window event listeners
const listeners: Record<string, Function[]> = {};
window.addEventListener = vi.fn((event, callback) => {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(callback as Function);
});
window.removeEventListener = vi.fn((event, callback) => {
    if (listeners[event]) {
        listeners[event] = listeners[event].filter(cb => cb !== callback);
    }
});

// Mock IndexedDB
const mockIDB = {
    open: vi.fn(),
};
Object.defineProperty(window, 'indexedDB', { value: mockIDB });

// Mock MediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
    value: {
        getUserMedia: vi.fn().mockResolvedValue({
            getTracks: () => [{ stop: vi.fn() }],
        }),
    },
});
