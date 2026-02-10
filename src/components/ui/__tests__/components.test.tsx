import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '../../../test/test-utils';
import { ErrorBoundary } from '../ErrorBoundary';
import { StatusBadge } from '../StatusBadge';
import { LoadingSpinner } from '../LoadingSpinner';
import { PageHeader } from '../PageHeader';

// --- Helper for ErrorBoundary tests ---

function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
    if (shouldThrow) throw new Error('Test error');
    return <div>No error</div>;
}

// ============================================================
// ErrorBoundary
// ============================================================

describe('ErrorBoundary', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders children when no error occurs', () => {
        render(
            <ErrorBoundary>
                <div>Child content</div>
            </ErrorBoundary>,
        );

        expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('shows default fallback when child throws', () => {
        render(
            <ErrorBoundary>
                <ThrowingComponent shouldThrow={true} />
            </ErrorBoundary>,
        );

        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('shows error message in default fallback', () => {
        render(
            <ErrorBoundary>
                <ThrowingComponent shouldThrow={true} />
            </ErrorBoundary>,
        );

        expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('resets and re-renders children when Try Again is clicked', () => {
        let shouldThrow = true;

        function ConditionalThrower() {
            if (shouldThrow) throw new Error('Test error');
            return <div>Recovered content</div>;
        }

        render(
            <ErrorBoundary>
                <ConditionalThrower />
            </ErrorBoundary>,
        );

        expect(screen.getByText('Something went wrong')).toBeInTheDocument();

        // Fix the error condition before clicking Try Again
        shouldThrow = false;
        fireEvent.click(screen.getByText('Try Again'));

        expect(screen.getByText('Recovered content')).toBeInTheDocument();
        expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('renders custom ReactNode fallback', () => {
        render(
            <ErrorBoundary fallback={<div>Custom fallback UI</div>}>
                <ThrowingComponent shouldThrow={true} />
            </ErrorBoundary>,
        );

        expect(screen.getByText('Custom fallback UI')).toBeInTheDocument();
        expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('renders custom function fallback with error and reset args', () => {
        render(
            <ErrorBoundary
                fallback={(error, reset) => (
                    <div>
                        <span>Error: {error.message}</span>
                        <button onClick={reset}>Reset</button>
                    </div>
                )}
            >
                <ThrowingComponent shouldThrow={false} />
            </ErrorBoundary>,
        );

        // No error yet, children should render
        expect(screen.getByText('No error')).toBeInTheDocument();

        // Now re-render with an error to trigger the function fallback
        render(
            <ErrorBoundary
                fallback={(error, reset) => (
                    <div>
                        <span>Error: {error.message}</span>
                        <button onClick={reset}>Reset</button>
                    </div>
                )}
            >
                <ThrowingComponent shouldThrow={true} />
            </ErrorBoundary>,
        );

        expect(screen.getByText('Error: Test error')).toBeInTheDocument();
        expect(screen.getByText('Reset')).toBeInTheDocument();
    });
});

// ============================================================
// StatusBadge
// ============================================================

describe('StatusBadge', () => {
    it('renders status text', () => {
        render(<StatusBadge status="ACTIVE" />);

        expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });

    it('applies correct class for ACTIVE status', () => {
        render(<StatusBadge status="ACTIVE" />);

        const badge = screen.getByText('ACTIVE');
        expect(badge.className).toContain('status-active');
    });

    it('applies correct class for PENDING status', () => {
        render(<StatusBadge status="PENDING" />);

        const badge = screen.getByText('PENDING');
        expect(badge.className).toContain('status-pending');
    });

    it('handles role variant', () => {
        render(<StatusBadge status="SUPER_ADMIN" variant="role" />);

        const badge = screen.getByText('SUPER_ADMIN');
        expect(badge.className).toContain('text-red-400');
        expect(badge.className).toContain('bg-red-500/20');
    });

    it('falls back to default style for unknown status', () => {
        render(<StatusBadge status="UNKNOWN_STATUS" />);

        const badge = screen.getByText('UNKNOWN_STATUS');
        expect(badge.className).toContain('status-badge');
        // Should not have any specific status style
        expect(badge.className).not.toContain('status-active');
        expect(badge.className).not.toContain('status-inactive');
        expect(badge.className).not.toContain('status-pending');
    });
});

// ============================================================
// LoadingSpinner
// ============================================================

describe('LoadingSpinner', () => {
    it('renders spinner', () => {
        const { container } = render(<LoadingSpinner />);

        const spinner = container.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
    });

    it('shows message when provided', () => {
        render(<LoadingSpinner message="Loading data..." />);

        expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('does not show message when not provided', () => {
        const { container } = render(<LoadingSpinner />);

        const paragraph = container.querySelector('p');
        expect(paragraph).not.toBeInTheDocument();
    });

    it('renders fullScreen wrapper with min-h-screen', () => {
        const { container } = render(<LoadingSpinner fullScreen />);

        const wrapper = container.firstElementChild;
        expect(wrapper?.className).toContain('min-h-screen');
    });

    it('renders inline wrapper without fullScreen', () => {
        const { container } = render(<LoadingSpinner />);

        const wrapper = container.firstElementChild;
        expect(wrapper?.className).not.toContain('min-h-screen');
        expect(wrapper?.className).toContain('py-12');
    });
});

// ============================================================
// PageHeader
// ============================================================

describe('PageHeader', () => {
    it('renders title', () => {
        render(<PageHeader title="Dashboard" />);

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('renders subtitle when provided', () => {
        render(<PageHeader title="Dashboard" subtitle="Overview of operations" />);

        expect(screen.getByText('Overview of operations')).toBeInTheDocument();
    });

    it('does not render subtitle when not provided', () => {
        render(<PageHeader title="Dashboard" />);

        expect(screen.queryByText('Overview of operations')).not.toBeInTheDocument();
        // Also verify no <p> tag inside the header for subtitle
        const heading = screen.getByText('Dashboard');
        const parentDiv = heading.parentElement;
        expect(parentDiv?.querySelector('p')).not.toBeInTheDocument();
    });

    it('renders back button when backTo is provided', () => {
        render(<PageHeader title="Details" backTo="/list" />);

        const backButton = screen.getByLabelText('Go back');
        expect(backButton).toBeInTheDocument();
    });

    it('does not render back button when backTo is not provided', () => {
        render(<PageHeader title="Dashboard" />);

        expect(screen.queryByLabelText('Go back')).not.toBeInTheDocument();
    });

    it('renders actions', () => {
        render(<PageHeader title="Users" actions={<button>Add User</button>} />);

        expect(screen.getByText('Add User')).toBeInTheDocument();
    });
});
