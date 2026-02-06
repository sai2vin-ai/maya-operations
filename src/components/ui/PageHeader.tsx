import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    backTo?: string;
    actions?: ReactNode;
}

export function PageHeader({ title, subtitle, backTo, actions }: PageHeaderProps) {
    const navigate = useNavigate();

    return (
        <header className="glass-card m-4 p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {backTo && (
                        <button
                            onClick={() => navigate(backTo)}
                            className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    )}
                    <div>
                        <h1 className="text-xl font-bold text-foreground">{title}</h1>
                        {subtitle && <p className="text-sm text-foreground-muted">{subtitle}</p>}
                    </div>
                </div>

                {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
        </header>
    );
}
