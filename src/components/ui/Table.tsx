import React from 'react';

interface TableProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * Responsive table wrapper that adds horizontal scroll on mobile
 */
export function Table({ children, className = '' }: TableProps) {
    return (
        <div className={`glass-card overflow-hidden ${className}`}>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                    {children}
                </table>
            </div>
        </div>
    );
}

interface TableHeadProps {
    children: React.ReactNode;
    className?: string;
}

export function TableHead({ children, className = '' }: TableHeadProps) {
    return (
        <thead className={`bg-slate-700/50 ${className}`}>
            {children}
        </thead>
    );
}

interface TableBodyProps {
    children: React.ReactNode;
    className?: string;
}

export function TableBody({ children, className = '' }: TableBodyProps) {
    return <tbody className={className}>{children}</tbody>;
}

interface TableRowProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    hoverable?: boolean;
}

export function TableRow({ children, className = '', onClick, hoverable = true }: TableRowProps) {
    return (
        <tr
            className={`
                border-b border-slate-700/50 last:border-b-0
                ${hoverable ? 'hover:bg-slate-700/30 transition-colors' : ''}
                ${onClick ? 'cursor-pointer' : ''}
                ${className}
            `}
            onClick={onClick}
        >
            {children}
        </tr>
    );
}

interface TableHeaderProps {
    children: React.ReactNode;
    className?: string;
    align?: 'left' | 'center' | 'right';
}

export function TableHeader({ children, className = '', align = 'left' }: TableHeaderProps) {
    const alignClass = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
    };

    return (
        <th className={`px-4 py-3 text-sm font-semibold text-slate-300 ${alignClass[align]} ${className}`}>
            {children}
        </th>
    );
}

interface TableCellProps {
    children: React.ReactNode;
    className?: string;
    align?: 'left' | 'center' | 'right';
}

export function TableCell({ children, className = '', align = 'left' }: TableCellProps) {
    const alignClass = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
    };

    return (
        <td className={`px-4 py-3 text-sm text-slate-200 ${alignClass[align]} ${className}`}>
            {children}
        </td>
    );
}

// Mobile card view alternative
interface MobileCardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export function MobileCard({ children, className = '', onClick }: MobileCardProps) {
    return (
        <div
            className={`glass-card p-4 ${onClick ? 'cursor-pointer hover:bg-slate-700/50' : ''} transition-colors ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
}

interface MobileCardRowProps {
    label: string;
    value: React.ReactNode;
    className?: string;
}

export function MobileCardRow({ label, value, className = '' }: MobileCardRowProps) {
    return (
        <div className={`flex justify-between items-center py-1 ${className}`}>
            <span className="text-slate-400 text-sm">{label}</span>
            <span className="text-white text-sm font-medium">{value}</span>
        </div>
    );
}

// Responsive table component that switches between table and cards
interface ResponsiveTableProps {
    data: Record<string, unknown>[];
    columns: {
        key: string;
        header: string;
        render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
        align?: 'left' | 'center' | 'right';
        mobileHide?: boolean;
    }[];
    onRowClick?: (row: Record<string, unknown>) => void;
    emptyMessage?: string;
    className?: string;
}

export function ResponsiveTable({
    data,
    columns,
    onRowClick,
    emptyMessage = 'No data available',
    className = '',
}: ResponsiveTableProps) {
    if (data.length === 0) {
        return (
            <div className="glass-card p-8 text-center text-slate-400">
                {emptyMessage}
            </div>
        );
    }

    return (
        <>
            {/* Desktop Table */}
            <div className={`hidden md:block ${className}`}>
                <Table>
                    <TableHead>
                        <TableRow hoverable={false}>
                            {columns.map((col) => (
                                <TableHeader key={col.key} align={col.align}>
                                    {col.header}
                                </TableHeader>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.map((row, index) => (
                            <TableRow
                                key={index}
                                onClick={onRowClick ? () => onRowClick(row) : undefined}
                            >
                                {columns.map((col) => (
                                    <TableCell key={col.key} align={col.align}>
                                        {col.render
                                            ? col.render(row[col.key], row)
                                            : String(row[col.key] ?? '-')}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Cards */}
            <div className={`md:hidden space-y-3 ${className}`}>
                {data.map((row, index) => (
                    <MobileCard
                        key={index}
                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                    >
                        {columns
                            .filter((col) => !col.mobileHide)
                            .map((col) => (
                                <MobileCardRow
                                    key={col.key}
                                    label={col.header}
                                    value={
                                        col.render
                                            ? col.render(row[col.key], row)
                                            : String(row[col.key] ?? '-')
                                    }
                                />
                            ))}
                    </MobileCard>
                ))}
            </div>
        </>
    );
}
