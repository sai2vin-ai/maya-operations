import { useState, useEffect, useRef } from 'react';

interface InputDialogProps {
    isOpen: boolean;
    title: string;
    message?: string;
    placeholder?: string;
    defaultValue?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'danger' | 'warning';
    required?: boolean;
    multiline?: boolean;
    onConfirm: (value: string) => void;
    onCancel: () => void;
    loading?: boolean;
}

export function InputDialog({
    isOpen,
    title,
    message,
    placeholder = '',
    defaultValue = '',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'default',
    required = true,
    multiline = false,
    onConfirm,
    onCancel,
    loading = false,
}: InputDialogProps) {
    const [value, setValue] = useState(defaultValue);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    // Reset value and focus input when dialog opens
    useEffect(() => {
        if (isOpen) {
            // Reset to default value when dialog opens
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setValue(defaultValue);
            // Focus input after dialog opens
            const timer = setTimeout(() => inputRef.current?.focus(), 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen, defaultValue]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && !loading) {
                onCancel();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, loading, onCancel]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!required || value.trim()) {
            onConfirm(value.trim());
        }
    };

    const variantStyles = {
        default: {
            icon: 'bg-blue-500/20',
            iconColor: 'text-blue-500',
            button: 'bg-blue-600 hover:bg-blue-700',
        },
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
    };

    const styles = variantStyles[variant];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={loading ? undefined : onCancel}
            />

            {/* Dialog */}
            <div className="glass-card p-6 max-w-md w-full mx-4 relative z-10">
                <form onSubmit={handleSubmit}>
                    <div className="flex items-start gap-4 mb-4">
                        <div className={`w-12 h-12 ${styles.icon} rounded-full flex items-center justify-center flex-shrink-0`}>
                            <svg className={`w-6 h-6 ${styles.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
                            {message && <p className="text-slate-400 text-sm">{message}</p>}
                        </div>
                    </div>

                    {multiline ? (
                        <textarea
                            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder={placeholder}
                            disabled={loading}
                            rows={4}
                            className="input-field w-full mb-4 resize-none"
                            required={required}
                        />
                    ) : (
                        <input
                            ref={inputRef as React.RefObject<HTMLInputElement>}
                            type="text"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder={placeholder}
                            disabled={loading}
                            className="input-field w-full mb-4"
                            required={required}
                        />
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={loading}
                            className="btn-secondary"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            type="submit"
                            disabled={loading || (required && !value.trim())}
                            className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${styles.button} flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {loading && (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            )}
                            {confirmLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
