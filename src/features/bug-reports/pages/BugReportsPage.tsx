import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    PageHeader,
    FilterBar,
    LoadingSpinner,
    EmptyState,
    StatusBadge,
} from '../../../components/ui';
import { ResponsiveTable, TableHead, TableHeader, TableBody, TableRow, TableCell } from '../../../components/ui/Table';
import { useBugReports, type BugReportFilters } from '../hooks/useBugReports';
import { usePagination } from '../../../hooks/usePagination';
import { PRIORITY_COLORS, STATUS_LABELS, PRIORITY_LABELS } from '../types';
import type { BugReport, BugReportStatus, BugReportPriority } from '../types';

const STATUS_FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
];

const PRIORITY_FILTERS = [
    { value: 'all', label: 'All Priorities' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
];

export default function BugReportsPage() {
    const navigate = useNavigate();
    const [filters, setFilters] = useState<BugReportFilters>({});
    const { data: reports, isLoading } = useBugReports(filters);
    const pagination = usePagination(reports || [], 15);

    const handleStatusFilter = (value: string) => {
        setFilters(prev => ({ ...prev, status: value as 'all' | BugReportStatus }));
    };

    const handlePriorityFilter = (value: string) => {
        setFilters(prev => ({ ...prev, priority: value as 'all' | BugReportPriority }));
    };

    if (isLoading) return <LoadingSpinner fullScreen message="Loading bug reports..." />;

    const columns = [
        { key: 'reportNumber', label: '#', className: 'w-24' },
        { key: 'title', label: 'Title' },
        { key: 'priority', label: 'Priority', className: 'w-28' },
        { key: 'status', label: 'Status', className: 'w-28' },
        { key: 'reporter', label: 'Reporter', className: 'w-36' },
        { key: 'date', label: 'Date', className: 'w-28' },
    ];

    const formatDate = (report: BugReport) => {
        if (!report.createdAt?.toDate) return '-';
        return report.createdAt.toDate().toLocaleDateString();
    };

    return (
        <div className="min-h-screen page-bg">
            <PageHeader
                title="Bug Reports"
                subtitle={`${reports?.length || 0} total reports`}
                backTo="/dashboard"
            />

            <div className="px-4 py-4 space-y-4">
                <div className="flex flex-wrap gap-4">
                    <FilterBar
                        filters={STATUS_FILTERS}
                        activeFilter={filters.status || 'all'}
                        onFilterChange={handleStatusFilter}
                    />
                    <FilterBar
                        filters={PRIORITY_FILTERS}
                        activeFilter={filters.priority || 'all'}
                        onFilterChange={handlePriorityFilter}
                    />
                </div>

                {!reports || reports.length === 0 ? (
                    <EmptyState
                        title="No bug reports found"
                        message="No reports match the current filters."
                    />
                ) : (
                    <ResponsiveTable
                        columns={columns}
                        data={pagination.currentItems}
                        renderRow={(report: BugReport) => (
                            <TableRow
                                key={report.id}
                                onClick={() => navigate(`/bug-reports/${report.id}`)}
                                className="cursor-pointer"
                            >
                                <TableCell className="font-mono text-sm">{report.reportNumber}</TableCell>
                                <TableCell className="font-medium">{report.title}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${PRIORITY_COLORS[report.priority]}`}>
                                        {PRIORITY_LABELS[report.priority]}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <StatusBadge status={STATUS_LABELS[report.status]} />
                                </TableCell>
                                <TableCell className="text-foreground-muted">{report.createdBy.displayName}</TableCell>
                                <TableCell className="text-foreground-muted">{formatDate(report)}</TableCell>
                            </TableRow>
                        )}
                        renderMobileCard={(report: BugReport) => (
                            <div
                                key={report.id}
                                onClick={() => navigate(`/bug-reports/${report.id}`)}
                                className="glass-card p-4 cursor-pointer hover:bg-surface-hover transition-colors"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <span className="text-xs font-mono text-foreground-muted">{report.reportNumber}</span>
                                        <h4 className="text-foreground font-medium">{report.title}</h4>
                                    </div>
                                    <StatusBadge status={STATUS_LABELS[report.status]} />
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${PRIORITY_COLORS[report.priority]}`}>
                                        {PRIORITY_LABELS[report.priority]}
                                    </span>
                                    <span className="text-foreground-muted">{report.createdBy.displayName}</span>
                                    <span className="text-foreground-faint">{formatDate(report)}</span>
                                </div>
                            </div>
                        )}
                    >
                        <TableHead>
                            <tr>
                                {columns.map(col => (
                                    <TableHeader key={col.key} className={col.className}>{col.label}</TableHeader>
                                ))}
                            </tr>
                        </TableHead>
                        <TableBody>
                            {pagination.currentItems.map(report => (
                                <TableRow
                                    key={report.id}
                                    onClick={() => navigate(`/bug-reports/${report.id}`)}
                                    className="cursor-pointer"
                                >
                                    <TableCell className="font-mono text-sm">{report.reportNumber}</TableCell>
                                    <TableCell className="font-medium">{report.title}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${PRIORITY_COLORS[report.priority]}`}>
                                            {PRIORITY_LABELS[report.priority]}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={STATUS_LABELS[report.status]} />
                                    </TableCell>
                                    <TableCell className="text-foreground-muted">{report.createdBy.displayName}</TableCell>
                                    <TableCell className="text-foreground-muted">{formatDate(report)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </ResponsiveTable>
                )}

                {pagination.totalPages > 1 && (
                    <div className="flex justify-center">
                        <nav className="flex items-center gap-2">
                            <button
                                onClick={() => pagination.goToPage(pagination.currentPage - 1)}
                                disabled={pagination.currentPage === 1}
                                className="btn-secondary px-3 py-1 text-sm disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-foreground-muted">
                                Page {pagination.currentPage} of {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => pagination.goToPage(pagination.currentPage + 1)}
                                disabled={pagination.currentPage === pagination.totalPages}
                                className="btn-secondary px-3 py-1 text-sm disabled:opacity-50"
                            >
                                Next
                            </button>
                        </nav>
                    </div>
                )}
            </div>
        </div>
    );
}
