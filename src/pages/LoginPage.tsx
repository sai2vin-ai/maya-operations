import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 1000;

export default function LoginPage() {
    const { loginWithEmail, error, clearError, loading } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localLoading, setLocalLoading] = useState(false);
    const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
    const failedAttempts = useRef(0);

    const isLockedOut = lockoutUntil !== null && Date.now() < lockoutUntil;

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLockedOut) return;

        clearError();
        setLocalLoading(true);

        try {
            await loginWithEmail(email, password);
            failedAttempts.current = 0;
            setLockoutUntil(null);
        } catch {
            failedAttempts.current += 1;
            if (failedAttempts.current >= MAX_ATTEMPTS) {
                const delay = BASE_DELAY_MS * Math.pow(2, failedAttempts.current - MAX_ATTEMPTS);
                const until = Date.now() + Math.min(delay, 60_000); // Max 60s lockout
                setLockoutUntil(until);
                setTimeout(() => setLockoutUntil(null), Math.min(delay, 60_000));
            }
        } finally {
            setLocalLoading(false);
        }
    };

    const isLoading = loading || localLoading;

    const lockoutSeconds = isLockedOut ? Math.ceil((lockoutUntil! - Date.now()) / 1000) : 0;

    return (
        <div className="min-h-screen page-bg flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
                        <span className="text-white font-bold text-3xl">P</span>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Pyrolysis Ops</h1>
                    <p className="text-foreground-muted mt-1">Plant Management System</p>
                </div>

                {/* Login Card */}
                <div className="glass-card p-8">
                    {/* Error Display */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2">
                            <svg
                                className="w-5 h-5 text-red-500 flex-shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <span className="text-red-400 text-sm">{error}</span>
                        </div>
                    )}

                    {/* Lockout Warning */}
                    {isLockedOut && (
                        <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg flex items-center gap-2">
                            <svg
                                className="w-5 h-5 text-yellow-500 flex-shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                            <span className="text-yellow-400 text-sm">
                                Too many failed attempts. Try again in {lockoutSeconds}s.
                            </span>
                        </div>
                    )}

                    {/* Email Login Form */}
                    <form onSubmit={handleEmailLogin} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-foreground-secondary mb-1">
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field w-full"
                                placeholder="you@company.com"
                                required
                                disabled={isLoading || isLockedOut}
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-foreground-secondary mb-1"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field w-full"
                                placeholder="••••••••"
                                required
                                disabled={isLoading || isLockedOut}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || isLockedOut}
                            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-foreground-faint text-sm mt-6">Maya Recycling © 2025</p>
            </div>
        </div>
    );
}
