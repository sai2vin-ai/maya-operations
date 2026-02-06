import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    PageHeader,
    FilterBar,
    LoadingSpinner,
    ErrorAlert,
    EmptyState,
    EmptyStateIcons,
    StatusBadge,
    ConfirmDialog,
    useToast,
} from '../../../components/ui';
import { useWebhooks, useToggleWebhookStatus, useDeleteWebhook } from '../hooks/useWebhooks';
import { useAuth } from '../../../contexts/AuthContext';
import { WEBHOOK_EVENT_LABELS } from '../types';
import type { Webhook, WebhookStatus } from '../types';
import { formatRelativeTime } from '../../../utils/formatters';

export default function WebhooksPage() {
    const navigate = useNavigate();
    const { userData } = useAuth();
    const toast = useToast();
    const [statusFilter, setStatusFilter] = useState<'all' | WebhookStatus>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<Webhook | null>(null);

    const { data: webhooks, isLoading, error } = useWebhooks({
        status: statusFilter,
        searchQuery,
    });

    const toggleStatusMutation = useToggleWebhookStatus();
    const deleteMutation = useDeleteWebhook();

    const handleToggleStatus = async (webhook: Webhook) => {
        try {
            await toggleStatusMutation.mutateAsync({
                webhookId: webhook.id,
                currentStatus: webhook.status,
                updatedBy: userData?.id || '',
            });
            toast.success(`Webhook ${webhook.status === 'ACTIVE' ? 'deactivated' : 'activated'} successfully`);
        } catch {
            toast.error('Failed to update webhook status');
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        try {
            await deleteMutation.mutateAsync({ webhookId: deleteTarget.id });
            toast.success('Webhook deleted successfully');
            setDeleteTarget(null);
        } catch {
            toast.error('Failed to delete webhook');
        }
    };

    const statusFilters = [
        { value: 'all', label: 'All' },
        { value: 'ACTIVE', label: 'Active', activeColor: 'green' },
        { value: 'INACTIVE', label: 'Inactive' },
        { value: 'FAILED', label: 'Failed', activeColor: 'red' },
    ];

    if (isLoading) {
        return <LoadingSpinner fullScreen message="Loading webhooks..." />;
    }

    if (error) {
        return <ErrorAlert message="Failed to load webhooks" />;
    }

    return (
        <div className="min-h-screen page-bg">
            <PageHeader
                title="Webhooks"
                subtitle="Manage webhook integrations for external systems"
                backTo="/dashboard"
                actions={
                    <Link to="/webhooks/new" className="btn-primary">
                        Add Webhook
                    </Link>
                }
            />

            <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
                <FilterBar
                    searchPlaceholder="Search webhooks..."
                    searchValue={searchQuery}
                    onSearchChange={setSearchQuery}
                    filters={statusFilters}
                    activeFilter={statusFilter}
                    onFilterChange={(value) => setStatusFilter(value as 'all' | WebhookStatus)}
                />

                {webhooks && webhooks.length > 0 ? (
                    <div className="grid gap-4">
                        {webhooks.map((webhook) => (
                            <div
                                key={webhook.id}
                                className="glass-card p-4 hover:border-border-secondary transition-colors"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Link
                                                to={`/webhooks/${webhook.id}`}
                                                className="text-lg font-semibold text-foreground hover:text-blue-400 truncate"
                                            >
                                                {webhook.name}
                                            </Link>
                                            <StatusBadge status={webhook.status} />
                                        </div>

                                        {webhook.description && (
                                            <p className="text-foreground-muted text-sm mb-2 line-clamp-1">
                                                {webhook.description}
                                            </p>
                                        )}

                                        <div className="flex flex-wrap gap-2 mb-3">
                                            <span className="text-foreground-faint text-xs font-mono bg-surface-secondary px-2 py-1 rounded">
                                                {webhook.method}
                                            </span>
                                            <span className="text-foreground-muted text-xs truncate max-w-[300px]">
                                                {webhook.url}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-1 mb-3">
                                            {webhook.events.slice(0, 3).map((event) => (
                                                <span
                                                    key={event}
                                                    className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded"
                                                >
                                                    {WEBHOOK_EVENT_LABELS[event]}
                                                </span>
                                            ))}
                                            {webhook.events.length > 3 && (
                                                <span className="text-xs text-foreground-faint">
                                                    +{webhook.events.length - 3} more
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex gap-4 text-sm text-foreground-faint">
                                            <span>
                                                Success: <span className="text-green-400">{webhook.successCount}</span>
                                            </span>
                                            <span>
                                                Failed: <span className="text-red-400">{webhook.failureCount}</span>
                                            </span>
                                            {webhook.lastTriggeredAt && (
                                                <span>
                                                    Last triggered: {formatRelativeTime(webhook.lastTriggeredAt)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleToggleStatus(webhook)}
                                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                                                webhook.status === 'ACTIVE'
                                                    ? 'bg-surface-tertiary text-foreground-secondary hover:bg-surface-hover'
                                                    : 'bg-blue-600 text-foreground hover:bg-blue-700'
                                            }`}
                                            disabled={toggleStatusMutation.isPending}
                                        >
                                            {webhook.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button
                                            onClick={() => setDeleteTarget(webhook)}
                                            className="px-3 py-1.5 rounded text-sm font-medium bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={EmptyStateIcons.webhook}
                        title="No webhooks configured"
                        description="Create a webhook to send real-time notifications to external systems"
                        action={{
                            label: 'Add Webhook',
                            onClick: () => navigate('/webhooks/new'),
                        }}
                    />
                )}

                <ConfirmDialog
                    isOpen={!!deleteTarget}
                    title="Delete Webhook"
                    message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
                    confirmLabel="Delete"
                    variant="danger"
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteTarget(null)}
                />
            </div>
        </div>
    );
}
