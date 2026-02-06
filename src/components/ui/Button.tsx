import { forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    fullWidth?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/25',
    secondary: 'bg-surface-tertiary hover:bg-surface-hover text-foreground border border-border',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/25',
    ghost: 'bg-transparent hover:bg-surface-hover text-foreground-secondary',
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-xl',
};

const disabledStyles = 'opacity-50 cursor-not-allowed';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            loading = false,
            fullWidth = false,
            leftIcon,
            rightIcon,
            disabled,
            className = '',
            children,
            ...props
        },
        ref
    ) => {
        const isDisabled = disabled || loading;

        return (
            <button
                ref={ref}
                disabled={isDisabled}
                className={`
                    inline-flex items-center justify-center gap-2 font-medium transition-all duration-200
                    ${variantStyles[variant]}
                    ${sizeStyles[size]}
                    ${fullWidth ? 'w-full' : ''}
                    ${isDisabled ? disabledStyles : ''}
                    ${className}
                `}
                {...props}
            >
                {loading ? (
                    <Spinner size={size} />
                ) : (
                    leftIcon
                )}
                {children}
                {!loading && rightIcon}
            </button>
        );
    }
);

Button.displayName = 'Button';

// Internal spinner component
function Spinner({ size }: { size: ButtonSize }) {
    const spinnerSizes = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
    };

    return (
        <div
            className={`${spinnerSizes[size]} border-2 border-current border-t-transparent rounded-full animate-spin`}
            aria-hidden="true"
        />
    );
}

// Icon Button variant
interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
    icon: React.ReactNode;
    'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ icon, variant = 'ghost', size = 'md', className = '', ...props }, ref) => {
        const iconSizeStyles: Record<ButtonSize, string> = {
            sm: 'p-1.5',
            md: 'p-2',
            lg: 'p-3',
        };

        return (
            <button
                ref={ref}
                className={`
                    inline-flex items-center justify-center rounded-lg transition-all duration-200
                    ${variantStyles[variant]}
                    ${iconSizeStyles[size]}
                    ${props.disabled ? disabledStyles : ''}
                    ${className}
                `}
                {...props}
            >
                {icon}
            </button>
        );
    }
);

IconButton.displayName = 'IconButton';
