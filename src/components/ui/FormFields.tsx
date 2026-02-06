import { forwardRef, useId } from 'react';

// Base props for all form fields
interface BaseFieldProps {
    label?: string;
    error?: string;
    hint?: string;
    required?: boolean;
    id?: string;
}

// Text Input Component
interface TextInputProps extends BaseFieldProps, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'> {
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
    ({ label, error, hint, required, id, leftIcon, rightIcon, className = '', ...props }, ref) => {
        const generatedId = useId();
        const inputId = id || generatedId;

        return (
            <div className="w-full">
                {label && (
                    <label htmlFor={inputId} className="block text-sm font-medium text-foreground-secondary mb-1">
                        {label}
                        {required && <span className="text-red-400 ml-1">*</span>}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        aria-invalid={!!error}
                        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
                        className={`
                            input-field w-full
                            ${leftIcon ? 'pl-10' : ''}
                            ${rightIcon ? 'pr-10' : ''}
                            ${error ? 'border-red-500 focus:ring-red-500' : ''}
                            ${className}
                        `}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && (
                    <p id={`${inputId}-error`} className="mt-1 text-sm text-red-400" role="alert">
                        {error}
                    </p>
                )}
                {hint && !error && (
                    <p id={`${inputId}-hint`} className="mt-1 text-sm text-foreground-faint">
                        {hint}
                    </p>
                )}
            </div>
        );
    }
);

TextInput.displayName = 'TextInput';

// Select Field Component
interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

interface SelectFieldProps extends BaseFieldProps, Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
    options: SelectOption[];
    placeholder?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
    ({ label, error, hint, required, id, options, placeholder, className = '', ...props }, ref) => {
        const generatedId = useId();
        const selectId = id || generatedId;

        return (
            <div className="w-full">
                {label && (
                    <label htmlFor={selectId} className="block text-sm font-medium text-foreground-secondary mb-1">
                        {label}
                        {required && <span className="text-red-400 ml-1">*</span>}
                    </label>
                )}
                <select
                    ref={ref}
                    id={selectId}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
                    className={`
                        input-field w-full
                        ${error ? 'border-red-500 focus:ring-red-500' : ''}
                        ${className}
                    `}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {options.map((option) => (
                        <option key={option.value} value={option.value} disabled={option.disabled}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {error && (
                    <p id={`${selectId}-error`} className="mt-1 text-sm text-red-400" role="alert">
                        {error}
                    </p>
                )}
                {hint && !error && (
                    <p id={`${selectId}-hint`} className="mt-1 text-sm text-foreground-faint">
                        {hint}
                    </p>
                )}
            </div>
        );
    }
);

SelectField.displayName = 'SelectField';

// TextArea Component
interface TextAreaProps extends BaseFieldProps, Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
    resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
    ({ label, error, hint, required, id, resize = 'vertical', className = '', rows = 4, ...props }, ref) => {
        const generatedId = useId();
        const textareaId = id || generatedId;

        const resizeClass = {
            none: 'resize-none',
            vertical: 'resize-y',
            horizontal: 'resize-x',
            both: 'resize',
        };

        return (
            <div className="w-full">
                {label && (
                    <label htmlFor={textareaId} className="block text-sm font-medium text-foreground-secondary mb-1">
                        {label}
                        {required && <span className="text-red-400 ml-1">*</span>}
                    </label>
                )}
                <textarea
                    ref={ref}
                    id={textareaId}
                    rows={rows}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
                    className={`
                        input-field w-full
                        ${resizeClass[resize]}
                        ${error ? 'border-red-500 focus:ring-red-500' : ''}
                        ${className}
                    `}
                    {...props}
                />
                {error && (
                    <p id={`${textareaId}-error`} className="mt-1 text-sm text-red-400" role="alert">
                        {error}
                    </p>
                )}
                {hint && !error && (
                    <p id={`${textareaId}-hint`} className="mt-1 text-sm text-foreground-faint">
                        {hint}
                    </p>
                )}
            </div>
        );
    }
);

TextArea.displayName = 'TextArea';

// Checkbox Component
interface CheckboxProps extends BaseFieldProps, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'id'> {
    description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    ({ label, error, description, id, className = '', ...props }, ref) => {
        const generatedId = useId();
        const checkboxId = id || generatedId;

        return (
            <div className="w-full">
                <div className="flex items-start gap-3">
                    <input
                        ref={ref}
                        type="checkbox"
                        id={checkboxId}
                        aria-invalid={!!error}
                        aria-describedby={error ? `${checkboxId}-error` : description ? `${checkboxId}-desc` : undefined}
                        className={`
                            mt-1 h-4 w-4 rounded border-border-secondary bg-surface-secondary
                            text-blue-600 focus:ring-blue-500 focus:ring-offset-surface
                            ${className}
                        `}
                        {...props}
                    />
                    <div>
                        {label && (
                            <label htmlFor={checkboxId} className="text-sm font-medium text-foreground cursor-pointer">
                                {label}
                            </label>
                        )}
                        {description && (
                            <p id={`${checkboxId}-desc`} className="text-sm text-foreground-muted">
                                {description}
                            </p>
                        )}
                    </div>
                </div>
                {error && (
                    <p id={`${checkboxId}-error`} className="mt-1 text-sm text-red-400 ml-7" role="alert">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Checkbox.displayName = 'Checkbox';

// Form Group Component for grouping fields
interface FormGroupProps {
    children: React.ReactNode;
    className?: string;
}

export function FormGroup({ children, className = '' }: FormGroupProps) {
    return <div className={`space-y-4 ${className}`}>{children}</div>;
}

// Form Row Component for horizontal layout
interface FormRowProps {
    children: React.ReactNode;
    className?: string;
    cols?: 1 | 2 | 3 | 4;
}

export function FormRow({ children, className = '', cols = 2 }: FormRowProps) {
    const colsClass = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    };

    return <div className={`grid ${colsClass[cols]} gap-4 ${className}`}>{children}</div>;
}

// Field Label component for custom layouts
interface FieldLabelProps {
    htmlFor?: string;
    required?: boolean;
    children: React.ReactNode;
    className?: string;
}

export function FieldLabel({ htmlFor, required, children, className = '' }: FieldLabelProps) {
    return (
        <label htmlFor={htmlFor} className={`block text-sm font-medium text-foreground-secondary mb-1 ${className}`}>
            {children}
            {required && <span className="text-red-400 ml-1">*</span>}
        </label>
    );
}

// Field Error component
interface FieldErrorProps {
    id?: string;
    children: React.ReactNode;
    className?: string;
}

export function FieldError({ id, children, className = '' }: FieldErrorProps) {
    if (!children) return null;
    return (
        <p id={id} className={`mt-1 text-sm text-red-400 ${className}`} role="alert">
            {children}
        </p>
    );
}

// Field Hint component
interface FieldHintProps {
    id?: string;
    children: React.ReactNode;
    className?: string;
}

export function FieldHint({ id, children, className = '' }: FieldHintProps) {
    if (!children) return null;
    return (
        <p id={id} className={`mt-1 text-sm text-foreground-faint ${className}`}>
            {children}
        </p>
    );
}
