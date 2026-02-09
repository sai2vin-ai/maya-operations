/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    updatePassword,
} from 'firebase/auth';
import type { User, ConfirmationResult } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { User as AppUser, UserRole } from '../types';

interface AuthContextType {
    currentUser: User | null;
    userData: AppUser | null;
    loading: boolean;
    error: string | null;
    loginWithEmail: (email: string, password: string) => Promise<void>;
    loginWithPhone: (phone: string) => Promise<ConfirmationResult>;
    verifyOTP: (confirmationResult: ConfirmationResult, otp: string) => Promise<void>;
    logout: () => Promise<void>;
    changePassword: (newPassword: string) => Promise<void>;
    hasRole: (roles: UserRole | UserRole[]) => boolean;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// E2E test mode: bypass Firebase Auth with a mock SUPER_ADMIN user
const isE2EMode = import.meta.env.VITE_E2E_MODE === 'true';

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Listen to auth state changes
    useEffect(() => {
        if (isE2EMode) {
            setCurrentUser({ uid: 'e2e-test-uid', email: 'admin@test.com' } as User);
            setUserData({
                id: 'e2e-test-uid',
                uid: 'e2e-test-uid',
                employeeId: 'EMP-001',
                name: 'E2E Test Admin',
                email: 'admin@test.com',
                phone: '+1234567890',
                role: 'SUPER_ADMIN',
                status: 'ACTIVE',
            } as AppUser);
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);

            if (user) {
                // Fetch user data from Firestore
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        setUserData({ id: userDoc.id, ...userDoc.data() } as AppUser);
                    } else {
                        setUserData(null);
                    }
                } catch (err) {
                    console.error('Error fetching user data:', err);
                    setUserData(null);
                }
            } else {
                setUserData(null);
            }

            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // Login with email and password
    const loginWithEmail = async (email: string, password: string) => {
        try {
            setError(null);
            setLoading(true);
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            const firebaseError = err as { code?: string };
            const errorMessage = getAuthErrorMessage(firebaseError.code);
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Login with phone - Step 1: Send OTP
    const loginWithPhone = async (phone: string): Promise<ConfirmationResult> => {
        try {
            setError(null);

            // Setup reCAPTCHA verifier
            const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                size: 'invisible',
                callback: () => {
                    // reCAPTCHA solved
                },
            });

            const confirmationResult = await signInWithPhoneNumber(auth, phone, recaptchaVerifier);
            return confirmationResult;
        } catch (err) {
            const firebaseError = err as { code?: string };
            const errorMessage = getAuthErrorMessage(firebaseError.code);
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    // Login with phone - Step 2: Verify OTP
    const verifyOTP = async (confirmationResult: ConfirmationResult, otp: string) => {
        try {
            setError(null);
            setLoading(true);
            await confirmationResult.confirm(otp);
        } catch (err) {
            const firebaseError = err as { code?: string };
            const errorMessage = getAuthErrorMessage(firebaseError.code);
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Logout
    const logout = async () => {
        try {
            setError(null);
            await signOut(auth);
        } catch (err) {
            setError('Failed to logout');
            throw err;
        }
    };

    // Change password
    const changePassword = async (newPassword: string) => {
        if (!currentUser) {
            throw new Error('No user logged in');
        }
        try {
            setError(null);
            await updatePassword(currentUser, newPassword);
        } catch (err) {
            const firebaseError = err as { code?: string };
            const errorMessage = getAuthErrorMessage(firebaseError.code);
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    // Check if user has required role(s)
    const hasRole = (roles: UserRole | UserRole[]): boolean => {
        if (!userData) return false;
        const roleArray = Array.isArray(roles) ? roles : [roles];
        return roleArray.includes(userData.role);
    };

    // Clear error
    const clearError = () => setError(null);

    const value: AuthContextType = {
        currentUser,
        userData,
        loading,
        error,
        loginWithEmail,
        loginWithPhone,
        verifyOTP,
        logout,
        changePassword,
        hasRole,
        clearError,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook to use auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Helper function to get user-friendly error messages
function getAuthErrorMessage(errorCode: string | undefined): string {
    switch (errorCode) {
        case 'auth/invalid-email':
            return 'Invalid email address';
        case 'auth/user-disabled':
            return 'This account has been disabled';
        case 'auth/user-not-found':
            return 'No account found with this email';
        case 'auth/wrong-password':
            return 'Incorrect password';
        case 'auth/invalid-credential':
            return 'Invalid email or password';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please try again later';
        case 'auth/invalid-phone-number':
            return 'Invalid phone number';
        case 'auth/invalid-verification-code':
            return 'Invalid OTP code';
        case 'auth/code-expired':
            return 'OTP code has expired';
        case 'auth/requires-recent-login':
            return 'Please login again to change password';
        case 'auth/weak-password':
            return 'Password must be at least 6 characters';
        default:
            return 'An error occurred. Please try again';
    }
}
