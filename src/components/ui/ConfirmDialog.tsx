import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

export function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'danger',
    onConfirm,
    onCancel,
    loading = false,
}: ConfirmDialogProps) {
    const cancelButtonRef = useRef<HTMLButtonElement>(null);

    // Focus the cancel button when dialog opens and handle keyboard navigation
    useEffect(() => {
        if (isOpen) {
            // Focus cancel button on open (safer default)
            cancelButtonRef.current?.focus();

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape' && !loading) {
                    onCancel();
                }
            };

            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, loading, onCancel]);

    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: 'bg-red-500/20',
            iconColor: 'text-red-500',
            button: 'bg-red-600 hover:bg-red-700',
        },
        warning: {
            icon: 'bg-yellow-500/20',
            iconColor: 'text-yellow-500',
            button: 'bg-yellow-600 hover:bg-yellow-700',
        },
        info: {
            icon: 'bg-blue-500/20',
            iconColor: 'text-blue-500',
            button: 'bg-blue-600 hover:bg-blue-700',
        },
    };

    const styles = variantStyles[variant];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-message"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={loading ? undefined : onCancel}
                aria-hidden="true"
            />

            {/* Dialog */}
            <div className="glass-card p-6 max-w-md mx-4 relative z-10">
                <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${styles.icon} rounded-full flex items-center justify-center flex-shrink-0`} aria-hidden="true">
                        {variant === 'danger' && (
                            <svg className={`w-6 h-6 ${styles.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        )}
                        {variant === 'warning' && (
                            <svg className={`w-6 h-6 ${styles.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                        {variant === 'info' && (
                            <svg className={`w-6 h-6 ${styles.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </div>
                    <div className="flex-1">
                        <h3 id="confirm-dialog-title" className="text-lg font-semibold text-foreground mb-2">{title}</h3>
                        <p id="confirm-dialog-message" className="text-foreground-muted">{message}</p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        ref={cancelButtonRef}
                        onClick={onCancel}
                        disabled={loading}
                        className="btn-secondary"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${styles.button} flex items-center gap-2`}
                    >
                        {loading && (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        )}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
