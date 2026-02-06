interface PageLayoutProps {
    children: React.ReactNode;
    className?: string;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl' | 'full';
    padding?: boolean;
}

const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
};

export function PageLayout({
    children,
    className = '',
    maxWidth = 'full',
    padding = true,
}: PageLayoutProps) {
    return (
        <div>
            <div className={`${maxWidthStyles[maxWidth]} mx-auto ${padding ? 'p-4' : ''} ${className}`}>
                {children}
            </div>
        </div>
    );
}

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
    onClick?: () => void;
}

const cardPaddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
};

export function Card({
    children,
    className = '',
    padding = 'md',
    hover = false,
    onClick,
}: CardProps) {
    const Component = onClick ? 'button' : 'div';

    return (
        <Component
            className={`
                glass-card
                ${cardPaddingStyles[padding]}
                ${hover ? 'hover:bg-surface-hover transition-all cursor-pointer' : ''}
                ${onClick ? 'text-left w-full' : ''}
                ${className}
            `}
            onClick={onClick}
        >
            {children}
        </Component>
    );
}

interface SectionProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

export function Section({
    children,
    title,
    description,
    action,
    className = '',
}: SectionProps) {
    return (
        <section className={`mb-6 ${className}`}>
            {(title || action) && (
                <div className="flex items-center justify-between mb-4">
                    <div>
                        {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}
                        {description && <p className="text-sm text-foreground-muted">{description}</p>}
                    </div>
                    {action}
                </div>
            )}
            {children}
        </section>
    );
}

interface GridProps {
    children: React.ReactNode;
    cols?: 1 | 2 | 3 | 4;
    gap?: 'sm' | 'md' | 'lg';
    className?: string;
}

const gridColStyles = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

const gridGapStyles = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
};

export function Grid({
    children,
    cols = 1,
    gap = 'md',
    className = '',
}: GridProps) {
    return (
        <div className={`grid ${gridColStyles[cols]} ${gridGapStyles[gap]} ${className}`}>
            {children}
        </div>
    );
}

interface DividerProps {
    className?: string;
}

export function Divider({ className = '' }: DividerProps) {
    return <hr className={`border-border my-4 ${className}`} />;
}
