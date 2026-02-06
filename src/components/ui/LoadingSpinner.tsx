interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    message?: string;
    fullScreen?: boolean;
}

const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-16 h-16 border-4',
};

export function LoadingSpinner({ size = 'md', message, fullScreen = false }: LoadingSpinnerProps) {
    const spinner = (
        <div className="flex flex-col items-center gap-4">
            <div className={`${sizeClasses[size]} border-blue-500 border-t-transparent rounded-full animate-spin`}></div>
            {message && <p className="text-foreground-muted">{message}</p>}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="min-h-screen page-bg flex items-center justify-center">
                {spinner}
            </div>
        );
    }

    return (
        <div className="flex justify-center py-12">
            {spinner}
        </div>
    );
}
