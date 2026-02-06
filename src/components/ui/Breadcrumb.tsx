import { Link, useLocation } from 'react-router-dom';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items?: BreadcrumbItem[];
    className?: string;
    separator?: React.ReactNode;
    showHome?: boolean;
}

// Route name mappings for auto-generation
const ROUTE_NAMES: Record<string, string> = {
    dashboard: 'Dashboard',
    users: 'Users',
    devices: 'Devices',
    gate: 'Gate Operations',
    reactor: 'Reactor',
    inventory: 'Inventory',
    'spare-parts': 'Store',
    weighbridge: 'Weighbridge',
    maintenance: 'Maintenance',
    audit: 'Audit Logs',
    reports: 'Reports',
    roles: 'Roles & Permissions',
    new: 'New',
    output: 'Output',
};

export function Breadcrumb({
    items,
    className = '',
    separator,
    showHome = true,
}: BreadcrumbProps) {
    const location = useLocation();

    // Auto-generate breadcrumbs from current path if items not provided
    const breadcrumbItems: BreadcrumbItem[] = items || generateBreadcrumbs(location.pathname);

    // Add home/dashboard as first item if showHome is true
    const allItems = showHome && breadcrumbItems[0]?.href !== '/dashboard'
        ? [{ label: 'Dashboard', href: '/dashboard' }, ...breadcrumbItems]
        : breadcrumbItems;

    const defaultSeparator = (
        <svg className="w-4 h-4 text-foreground-faint flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
    );

    return (
        <nav aria-label="Breadcrumb" className={className}>
            <ol className="flex items-center flex-wrap gap-1 text-sm">
                {allItems.map((item, index) => {
                    const isLast = index === allItems.length - 1;

                    return (
                        <li key={index} className="flex items-center gap-1">
                            {index > 0 && (
                                <span className="mx-1" aria-hidden="true">
                                    {separator || defaultSeparator}
                                </span>
                            )}
                            {isLast || !item.href ? (
                                <span
                                    className="text-foreground-secondary font-medium"
                                    aria-current={isLast ? 'page' : undefined}
                                >
                                    {item.label}
                                </span>
                            ) : (
                                <Link
                                    to={item.href}
                                    className="text-foreground-muted hover:text-foreground transition-colors"
                                >
                                    {item.label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

// Helper function to generate breadcrumbs from pathname
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    let currentPath = '';

    segments.forEach((segment, index) => {
        currentPath += `/${segment}`;
        const isLast = index === segments.length - 1;

        // Check if segment is an ID (contains numbers or is UUID-like)
        const isId = /^[a-zA-Z0-9-]{8,}$/.test(segment) || /^\d+$/.test(segment);

        if (isId) {
            // For IDs, show "Details" or keep the previous segment name
            breadcrumbs.push({
                label: 'Details',
                href: isLast ? undefined : currentPath,
            });
        } else {
            // Look up the route name or capitalize the segment
            const label = ROUTE_NAMES[segment] || capitalizeFirst(segment);
            breadcrumbs.push({
                label,
                href: isLast ? undefined : currentPath,
            });
        }
    });

    return breadcrumbs;
}

function capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
}

// Compact breadcrumb for mobile
interface CompactBreadcrumbProps {
    backHref: string;
    backLabel?: string;
    currentLabel: string;
    className?: string;
}

export function CompactBreadcrumb({
    backHref,
    backLabel = 'Back',
    currentLabel,
    className = '',
}: CompactBreadcrumbProps) {
    return (
        <nav aria-label="Breadcrumb" className={`flex items-center gap-2 ${className}`}>
            <Link
                to={backHref}
                className="flex items-center gap-1 text-foreground-muted hover:text-foreground transition-colors text-sm"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">{backLabel}</span>
            </Link>
            <span className="text-foreground-faint" aria-hidden="true">/</span>
            <span className="text-foreground-secondary font-medium text-sm truncate" aria-current="page">
                {currentLabel}
            </span>
        </nav>
    );
}
