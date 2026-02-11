import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test/test-utils';
import LoginPage from './LoginPage';

const mockLoginWithEmail = vi.fn();
const mockClearError = vi.fn();
const mockNavigate = vi.fn();

let mockError: string | null = null;
let mockLoading = false;

vi.mock('../contexts/AuthContext', () => ({
    useAuth: () => ({
        loginWithEmail: mockLoginWithEmail,
        error: mockError,
        loading: mockLoading,
        clearError: mockClearError,
    }),
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

describe('LoginPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockError = null;
        mockLoading = false;
        mockLoginWithEmail.mockResolvedValue(undefined);
    });

    it('should render login form with email and password fields', () => {
        render(<LoginPage />);

        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should render login button with Sign In text', () => {
        render(<LoginPage />);

        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should render header text', () => {
        render(<LoginPage />);

        expect(screen.getByText('Pyrolysis Ops')).toBeInTheDocument();
        expect(screen.getByText('Plant Management System')).toBeInTheDocument();
    });

    it('should call loginWithEmail on form submit', async () => {
        render(<LoginPage />);

        fireEvent.change(screen.getByLabelText(/email address/i), {
            target: { value: 'user@test.com' },
        });
        fireEvent.change(screen.getByLabelText(/password/i), {
            target: { value: 'password123' },
        });
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(mockLoginWithEmail).toHaveBeenCalledWith('user@test.com', 'password123');
        });
    });

    it('should call clearError on form submit', async () => {
        render(<LoginPage />);

        fireEvent.change(screen.getByLabelText(/email address/i), {
            target: { value: 'user@test.com' },
        });
        fireEvent.change(screen.getByLabelText(/password/i), {
            target: { value: 'pass' },
        });
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(mockClearError).toHaveBeenCalled();
        });
    });

    it('should show error message when error is set', () => {
        mockError = 'Invalid email or password';

        render(<LoginPage />);

        expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });

    it('should show Signing in text while loading', () => {
        mockLoading = true;

        render(<LoginPage />);

        expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    });

    it('should disable inputs and button while loading', () => {
        mockLoading = true;

        render(<LoginPage />);

        expect(screen.getByLabelText(/email address/i)).toBeDisabled();
        expect(screen.getByLabelText(/password/i)).toBeDisabled();
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should render the footer text', () => {
        render(<LoginPage />);

        expect(screen.getByText(/maya recycling/i)).toBeInTheDocument();
    });
});
