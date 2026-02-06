import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    PageHeader,
    FilterBar,
    LoadingSpinner,
    EmptyState,
    StatusBadge,
} from '../../../components/ui';
import { Table, TableHead, TableHeader, TableBody, TableRow, TableCell, MobileCard, MobileCardRow } from '../../../components/ui/Table';
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

export default function BugReportsPage() {
    const navigate = useNavigate();
    const [filters, setFilters] = useState<BugReportFilters>({});
    const [search, setSearch] = useState('');
    const { data: reports, isLoading } = useBugReports(filters);

    const filteredReports = (reports || []).filter(r => {
        if (!search) return true;
        const q = search.toLowerCase();
        return r.title.toLowerCase().includes(q) || r.reportNumber.toLowerCase().includes(q);
    });

    const pagination = usePagination(filteredReports, { pageSize: 15 });

    const handleStatusFilter = (value: string) => {
        setFilters(prev => ({ ...prev, status: value as 'all' | BugReportStatus }));
    };

    const handlePriorityFilter = (value: string) => {
        setFilters(prev => ({ ...prev, priority: value as 'all' | BugReportPriority }));
    };

    if (isLoading) return <LoadingSpinner fullScreen message="Loading bug reports..." />;

    const formatDate = (report: BugReport) => {
        if (!report.createdAt?.toDate) return '-';
        return report.createdAt.toDate().toLocaleDateString();
    };

    const PRIORITY_FILTER_OPTIONS = [
        { value: 'all', label: 'All Priorities' },
        { value: 'critical', label: 'Critical' },
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' },
    ];

    return (
        <div className="min-h-screen page-bg">
            <PageHeader
                title="Bug Reports"
                subtitle={`${reports?.length || 0} total reports`}
                backTo="/dashboard"
            />

            <div className="px-4 py-4 space-y-4">
                <FilterBar
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Search by title or report number..."
                    filters={STATUS_FILTERS}
                    activeFilter={filters.status || 'all'}
                    onFilterChange={handleStatusFilter}
                />

                <div className="flex gap-2 flex-wrap">
                    {PRIORITY_FILTER_OPTIONS.map(f => (
                        <button
                            key={f.value}
                            onClick={() => handlePriorityFilter(f.value)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                (filters.priority || 'all') === f.value
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-surface-tertiary text-foreground-secondary hover:bg-surface-hover'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {filteredReports.length === 0 ? (
                    <EmptyState
                        title="No bug reports found"
                        description="No reports match the current filters."
                    />
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block">
                            <Table>
                                <TableHead>
                                    <TableRow hoverable={false}>
                                        <TableHeader>#</TableHeader>
                                        <TableHeader>Title</TableHeader>
                                        <TableHeader>Priority</TableHeader>
                                        <TableHeader>Status</TableHeader>
                                        <TableHeader>Reporter</TableHeader>
                                        <TableHeader>Date</TableHeader>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {pagination.pageItems.map(report => (
                                        <TableRow
                                            key={report.id}
                                            onClick={() => navigate(`/bug-reports/${report.id}`)}
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
                            </Table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-3">
                            {pagination.pageItems.map(report => (
                                <MobileCard
                                    key={report.id}
                                    onClick={() => navigate(`/bug-reports/${report.id}`)}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <span className="text-xs font-mono text-foreground-muted">{report.reportNumber}</span>
                                            <h4 className="text-foreground font-medium">{report.title}</h4>
                                        </div>
                                        <StatusBadge status={STATUS_LABELS[report.status]} />
                                    </div>
                                    <MobileCardRow
                                        label="Priority"
                                        value={
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${PRIORITY_COLORS[report.priority]}`}>
                                                {PRIORITY_LABELS[report.priority]}
                                            </span>
                                        }
                                    />
                                    <MobileCardRow label="Reporter" value={report.createdBy.displayName} />
                                    <MobileCardRow label="Date" value={formatDate(report)} />
                                </MobileCard>
                            ))}
                        </div>
                    </>
                )}

                {pagination.totalPages > 1 && (
                    <div className="flex justify-center">
                        <nav className="flex items-center gap-2">
                            <button
                                onClick={pagination.prevPage}
                                disabled={!pagination.hasPrevPage}
                                className="btn-secondary px-3 py-1 text-sm disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-foreground-muted">
                                Page {pagination.currentPage} of {pagination.totalPages}
                            </span>
                            <button
                                onClick={pagination.nextPage}
                                disabled={!pagination.hasNextPage}
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
