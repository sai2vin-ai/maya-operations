interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
    className = '',
    variant = 'rectangular',
    width,
    height,
    animation = 'pulse',
}: SkeletonProps) {
    const baseStyles = 'bg-surface-tertiary';

    const variantStyles = {
        text: 'rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-lg',
    };

    const animationStyles = {
        pulse: 'animate-pulse',
        wave: 'animate-shimmer bg-gradient-to-r from-surface-tertiary via-surface-hover to-surface-tertiary bg-[length:200%_100%]',
        none: '',
    };

    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;

    return (
        <div
            className={`${baseStyles} ${variantStyles[variant]} ${animationStyles[animation]} ${className}`}
            style={style}
            aria-hidden="true"
        />
    );
}

// Pre-built skeleton patterns
export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    variant="text"
                    height={16}
                    width={i === lines - 1 ? '75%' : '100%'}
                />
            ))}
        </div>
    );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
    return (
        <div className={`glass-card p-4 ${className}`}>
            <div className="flex items-start gap-4">
                <Skeleton variant="circular" width={48} height={48} />
                <div className="flex-1 space-y-2">
                    <Skeleton variant="text" height={20} width="60%" />
                    <Skeleton variant="text" height={14} width="40%" />
                </div>
            </div>
        </div>
    );
}

export function SkeletonList({ count = 5, className = '' }: { count?: number; className?: string }) {
    return (
        <div className={`space-y-3 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}

export function SkeletonTable({ rows = 5, cols = 4, className = '' }: { rows?: number; cols?: number; className?: string }) {
    return (
        <div className={`glass-card overflow-hidden ${className}`}>
            {/* Header */}
            <div className="flex gap-4 p-4 border-b border-border">
                {Array.from({ length: cols }).map((_, i) => (
                    <Skeleton key={i} variant="text" height={16} className="flex-1" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex gap-4 p-4 border-b border-border last:border-b-0">
                    {Array.from({ length: cols }).map((_, colIndex) => (
                        <Skeleton key={colIndex} variant="text" height={14} className="flex-1" />
                    ))}
                </div>
            ))}
        </div>
    );
}

export function SkeletonStats({ count = 4, className = '' }: { count?: number; className?: string }) {
    return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${count} gap-4 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <Skeleton variant="text" height={14} width="60%" />
                        <Skeleton variant="rectangular" width={60} height={24} />
                    </div>
                    <Skeleton variant="text" height={32} width="40%" />
                    <Skeleton variant="text" height={12} width="30%" className="mt-2" />
                </div>
            ))}
        </div>
    );
}

export function SkeletonForm({ fields = 4, className = '' }: { fields?: number; className?: string }) {
    return (
        <div className={`space-y-4 ${className}`}>
            {Array.from({ length: fields }).map((_, i) => (
                <div key={i}>
                    <Skeleton variant="text" height={14} width={100} className="mb-1" />
                    <Skeleton variant="rectangular" height={40} />
                </div>
            ))}
        </div>
    );
}
