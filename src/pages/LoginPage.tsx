import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { ConfirmationResult } from 'firebase/auth';

type LoginMode = 'email' | 'phone';

export function LoginPage() {
    const { loginWithEmail, loginWithPhone, verifyOTP, error, clearError, loading } = useAuth();

    const [mode, setMode] = useState<LoginMode>('email');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [localLoading, setLocalLoading] = useState(false);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        setLocalLoading(true);

        try {
            await loginWithEmail(email, password);
            // Redirect happens automatically via ProtectedRoute
        } catch (err) {
            // Error is already set in context
        } finally {
            setLocalLoading(false);
        }
    };

    const handlePhoneSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        setLocalLoading(true);

        try {
            // Format phone number for India (+91)
            const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
            const result = await loginWithPhone(formattedPhone);
            setConfirmationResult(result);
            setShowOtpInput(true);
        } catch (err) {
            // Error is already set in context
        } finally {
            setLocalLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        setLocalLoading(true);

        try {
            if (confirmationResult) {
                await verifyOTP(confirmationResult, otp);
                // Redirect happens automatically via ProtectedRoute
            }
        } catch (err) {
            // Error is already set in context
        } finally {
            setLocalLoading(false);
        }
    };

    const switchMode = (newMode: LoginMode) => {
        setMode(newMode);
        clearError();
        setShowOtpInput(false);
        setConfirmationResult(null);
        setOtp('');
    };

    const isLoading = loading || localLoading;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            {/* reCAPTCHA container (invisible) */}
            <div id="recaptcha-container"></div>

            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
                        <span className="text-white font-bold text-3xl">P</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Pyrolysis Ops</h1>
                    <p className="text-slate-400 mt-1">Plant Management System</p>
                </div>

                {/* Login Card */}
                <div className="glass-card p-8">
                    {/* Mode Toggle */}
                    <div className="flex gap-2 mb-6">
                        <button
                            type="button"
                            onClick={() => switchMode('email')}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${mode === 'email'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                        >
                            Email
                        </button>
                        <button
                            type="button"
                            onClick={() => switchMode('phone')}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${mode === 'phone'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                        >
                            Phone OTP
                        </button>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2">
                            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-red-400 text-sm">{error}</span>
                        </div>
                    )}

                    {/* Email Login Form */}
                    {mode === 'email' && (
                        <form onSubmit={handleEmailLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-field w-full"
                                    placeholder="you@company.com"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-field w-full"
                                    placeholder="••••••••"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
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
                    )}

                    {/* Phone OTP Login Form */}
                    {mode === 'phone' && !showOtpInput && (
                        <form onSubmit={handlePhoneSendOTP} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Phone Number
                                </label>
                                <div className="flex gap-2">
                                    <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-400">
                                        +91
                                    </div>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                        className="input-field flex-1"
                                        placeholder="9876543210"
                                        maxLength={10}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading || phone.length !== 10}
                                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Sending OTP...</span>
                                    </>
                                ) : (
                                    'Send OTP'
                                )}
                            </button>
                        </form>
                    )}

                    {/* OTP Verification Form */}
                    {mode === 'phone' && showOtpInput && (
                        <form onSubmit={handleVerifyOTP} className="space-y-4">
                            <div className="text-center mb-4">
                                <p className="text-slate-400">
                                    OTP sent to <span className="text-white">+91 {phone}</span>
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowOtpInput(false);
                                        setConfirmationResult(null);
                                        setOtp('');
                                    }}
                                    className="text-blue-400 text-sm hover:underline mt-1"
                                >
                                    Change number
                                </button>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Enter OTP
                                </label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    className="input-field w-full text-center text-2xl tracking-widest"
                                    placeholder="000000"
                                    maxLength={6}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading || otp.length !== 6}
                                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Verifying...</span>
                                    </>
                                ) : (
                                    'Verify OTP'
                                )}
                            </button>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-slate-500 text-sm mt-6">
                    Maya Recycling © 2025
                </p>
            </div>
        </div>
    );
}
