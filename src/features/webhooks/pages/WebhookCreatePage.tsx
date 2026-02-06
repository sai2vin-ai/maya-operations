import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    PageHeader,
    TextInput,
    TextArea,
    SelectField,
    Checkbox,
    FormGroup,
    FormRow,
    LoadingSpinner,
    useToast,
} from '../../../components/ui';
import { useCreateWebhook } from '../hooks/useWebhooks';
import { useAuth } from '../../../contexts/AuthContext';
import {
    WEBHOOK_EVENT_CATEGORIES,
    WEBHOOK_EVENT_LABELS,
    type WebhookMethod,
    type WebhookEventType,
    type CreateWebhookData,
} from '../types';

export default function WebhookCreatePage() {
    const navigate = useNavigate();
    const { userData } = useAuth();
    const toast = useToast();
    const createMutation = useCreateWebhook();

    const [formData, setFormData] = useState<CreateWebhookData>({
        name: '',
        description: '',
        url: '',
        method: 'POST',
        events: [],
        headers: {},
        secret: '',
    });

    const [headerKey, setHeaderKey] = useState('');
    const [headerValue, setHeaderValue] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.url.trim()) {
            newErrors.url = 'URL is required';
        } else {
            try {
                new URL(formData.url);
                if (!formData.url.startsWith('https://')) {
                    newErrors.url = 'URL must use HTTPS for security';
                }
            } catch {
                newErrors.url = 'Invalid URL format';
            }
        }

        if (formData.events.length === 0) {
            newErrors.events = 'Select at least one event';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            await createMutation.mutateAsync({
                data: formData,
                createdBy: userData?.id || '',
            });

            toast.success('Webhook created successfully');
            navigate('/webhooks');
        } catch {
            toast.error('Failed to create webhook');
        }
    };

    const handleEventToggle = (event: WebhookEventType) => {
        setFormData((prev) => ({
            ...prev,
            events: prev.events.includes(event)
                ? prev.events.filter((e) => e !== event)
                : [...prev.events, event],
        }));
    };

    const handleSelectAllCategory = (events: readonly WebhookEventType[]) => {
        const allSelected = events.every((e) => formData.events.includes(e));

        setFormData((prev) => ({
            ...prev,
            events: allSelected
                ? prev.events.filter((e) => !events.includes(e))
                : [...new Set([...prev.events, ...events])],
        }));
    };

    const addHeader = () => {
        if (!headerKey.trim() || !headerValue.trim()) return;

        setFormData((prev) => ({
            ...prev,
            headers: {
                ...prev.headers,
                [headerKey.trim()]: headerValue.trim(),
            },
        }));
        setHeaderKey('');
        setHeaderValue('');
    };

    const removeHeader = (key: string) => {
        setFormData((prev) => {
            const newHeaders = { ...prev.headers };
            delete newHeaders[key];
            return { ...prev, headers: newHeaders };
        });
    };

    if (createMutation.isPending) {
        return <LoadingSpinner fullScreen message="Creating webhook..." />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <PageHeader
                title="Create Webhook"
                subtitle="Set up a new webhook integration"
                backTo="/webhooks"
            />

            <div className="max-w-3xl mx-auto px-4 py-4">
                <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
                    {/* Basic Information */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
                        <FormGroup>
                            <TextInput
                                label="Name"
                                value={formData.name}
                                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., Slack Notifications"
                                error={errors.name}
                                required
                            />

                            <TextArea
                                label="Description"
                                value={formData.description || ''}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                                }
                                placeholder="Optional description"
                                rows={2}
                            />
                        </FormGroup>
                    </div>

                    {/* Endpoint Configuration */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Endpoint Configuration</h3>
                        <FormRow cols={3}>
                            <SelectField
                                label="Method"
                                value={formData.method}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        method: e.target.value as WebhookMethod,
                                    }))
                                }
                                options={[
                                    { value: 'POST', label: 'POST' },
                                    { value: 'PUT', label: 'PUT' },
                                ]}
                            />
                            <div className="sm:col-span-2">
                                <TextInput
                                    label="URL"
                                    value={formData.url}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, url: e.target.value }))
                                    }
                                    placeholder="https://api.example.com/webhook"
                                    error={errors.url}
                                    required
                                />
                            </div>
                        </FormRow>
                    </div>

                    {/* Events */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Events</h3>
                        <p className="text-slate-400 text-sm mb-4">
                            Select the events that should trigger this webhook
                        </p>
                        {errors.events && (
                            <p className="text-red-400 text-sm mb-2">{errors.events}</p>
                        )}

                        {Object.entries(WEBHOOK_EVENT_CATEGORIES).map(([category, events]) => (
                            <div key={category} className="mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <button
                                        type="button"
                                        onClick={() => handleSelectAllCategory(events)}
                                        className="text-sm text-blue-400 hover:text-blue-300"
                                    >
                                        {events.every((e) => formData.events.includes(e))
                                            ? 'Deselect all'
                                            : 'Select all'}
                                    </button>
                                    <span className="text-slate-500 text-sm">{category}</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {events.map((event) => (
                                        <Checkbox
                                            key={event}
                                            label={WEBHOOK_EVENT_LABELS[event]}
                                            checked={formData.events.includes(event)}
                                            onChange={() => handleEventToggle(event)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Custom Headers */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Custom Headers</h3>
                        <p className="text-slate-400 text-sm mb-4">
                            Optional headers to include with each request
                        </p>
                        <FormRow cols={3}>
                            <TextInput
                                label="Header Name"
                                value={headerKey}
                                onChange={(e) => setHeaderKey(e.target.value)}
                                placeholder="X-Custom-Header"
                            />
                            <TextInput
                                label="Header Value"
                                value={headerValue}
                                onChange={(e) => setHeaderValue(e.target.value)}
                                placeholder="value"
                            />
                            <button
                                type="button"
                                onClick={addHeader}
                                className="btn-secondary mt-6"
                            >
                                Add
                            </button>
                        </FormRow>

                        {Object.keys(formData.headers || {}).length > 0 && (
                            <div className="mt-3 space-y-1">
                                {Object.entries(formData.headers || {}).map(([key, value]) => (
                                    <div
                                        key={key}
                                        className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded text-sm"
                                    >
                                        <span className="text-slate-300">{key}:</span>
                                        <span className="text-slate-400 flex-1">{value}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeHeader(key)}
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Signing Secret */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Signing Secret</h3>
                        <p className="text-slate-400 text-sm mb-4">
                            Optional secret for HMAC signature verification (X-Webhook-Signature header)
                        </p>
                        <TextInput
                            label="Secret"
                            type="password"
                            value={formData.secret || ''}
                            onChange={(e) => setFormData((prev) => ({ ...prev, secret: e.target.value }))}
                            placeholder="Enter a secret key"
                        />
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-700">
                        <button type="submit" className="btn-primary">
                            Create Webhook
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/webhooks')}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
