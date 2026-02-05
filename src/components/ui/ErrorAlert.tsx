interface ErrorAlertProps {
    message: string;
    onDismiss?: () => void;
}

export function ErrorAlert({ message, onDismiss }: ErrorAlertProps) {
    return (
        <div className="glass-card p-4 mb-4 border border-red-500/50 bg-red-500/10">
            <div className="flex items-center justify-between">
                <p className="text-red-400">{message}</p>
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="p-1 hover:bg-red-500/20 rounded transition-colors"
                    >
                        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}

interface SuccessAlertProps {
    message: string;
    onDismiss?: () => void;
}

export function SuccessAlert({ message, onDismiss }: SuccessAlertProps) {
    return (
        <div className="glass-card p-4 mb-4 border border-green-500/50 bg-green-500/10">
            <div className="flex items-center justify-between">
                <p className="text-green-400">{message}</p>
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="p-1 hover:bg-green-500/20 rounded transition-colors"
                    >
                        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}
