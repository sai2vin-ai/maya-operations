import { useState, useRef } from 'react';
import {
    PageHeader,
    TextInput,
    TextArea,
    SelectField,
    FormGroup,
    LoadingSpinner,
} from '../../../components/ui';
import { useCreateBugReport } from '../hooks/useBugReports';
import { useAuth } from '../../../contexts/AuthContext';
import type { BugReportPriority, CreateBugReportData } from '../types';

export default function BugReportCreatePage() {
    const { userData } = useAuth();
    const createMutation = useCreateBugReport();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<CreateBugReportData>({
        title: '',
        description: '',
        priority: 'medium',
        pageUrl: window.location.href,
        browserInfo: navigator.userAgent,
    });

    const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
    const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setErrors(prev => ({ ...prev, screenshot: 'Please select an image file' }));
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setErrors(prev => ({ ...prev, screenshot: 'File must be less than 5MB' }));
            return;
        }

        setScreenshotFile(file);
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.screenshot;
            return newErrors;
        });

        const reader = new FileReader();
        reader.onload = (ev) => setScreenshotPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const removeScreenshot = () => {
        setScreenshotFile(null);
        setScreenshotPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        createMutation.mutate({
            data: formData,
            createdBy: {
                userId: userData?.id || '',
                displayName: userData?.name || 'Unknown',
                role: userData?.role || 'VIEWER',
            },
            file: screenshotFile || undefined,
            callerRole: userData?.role,
        });
    };

    if (createMutation.isPending) {
        return <LoadingSpinner fullScreen message="Submitting bug report..." />;
    }

    return (
        <div className="min-h-screen page-bg">
            <PageHeader
                title="Report a Bug"
                subtitle="Help us improve by reporting issues you encounter"
                backTo="/dashboard"
            />

            <div className="max-w-3xl mx-auto px-4 py-4">
                <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
                    <FormGroup>
                        <TextInput
                            label="Title"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Brief summary of the issue"
                            error={errors.title}
                            required
                        />

                        <TextArea
                            label="Description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Describe what happened, what you expected, and steps to reproduce"
                            rows={5}
                            error={errors.description}
                            required
                        />

                        <SelectField
                            label="Priority"
                            value={formData.priority}
                            onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as BugReportPriority }))}
                            options={[
                                { value: 'low', label: 'Low - Minor issue, cosmetic' },
                                { value: 'medium', label: 'Medium - Functional issue, workaround exists' },
                                { value: 'high', label: 'High - Major issue, blocks workflow' },
                                { value: 'critical', label: 'Critical - System down or data loss' },
                            ]}
                        />
                    </FormGroup>

                    {/* Screenshot Upload */}
                    <div>
                        <label className="block text-sm font-medium text-foreground-secondary mb-2">
                            Screenshot (optional)
                        </label>
                        <div className="border-2 border-dashed border-border rounded-lg p-4">
                            {screenshotPreview ? (
                                <div className="space-y-3">
                                    <img
                                        src={screenshotPreview}
                                        alt="Screenshot preview"
                                        className="max-h-48 rounded-lg mx-auto"
                                    />
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-sm text-foreground-muted">{screenshotFile?.name}</span>
                                        <button
                                            type="button"
                                            onClick={removeScreenshot}
                                            className="text-sm text-red-400 hover:text-red-300"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <svg className="w-8 h-8 text-foreground-faint mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-sm text-foreground-muted mb-2">Click to upload a screenshot</p>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="text-sm text-foreground-muted file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-surface-tertiary file:text-foreground-secondary hover:file:bg-surface-hover"
                                    />
                                </div>
                            )}
                        </div>
                        {errors.screenshot && <p className="text-red-400 text-sm mt-1">{errors.screenshot}</p>}
                    </div>

                    {/* Auto-captured info */}
                    <div className="bg-surface-secondary rounded-lg p-4">
                        <h4 className="text-sm font-medium text-foreground-secondary mb-2">Auto-captured Information</h4>
                        <div className="space-y-1 text-xs text-foreground-muted">
                            <p><span className="text-foreground-secondary">Page:</span> {formData.pageUrl}</p>
                            <p><span className="text-foreground-secondary">Browser:</span> {formData.browserInfo.substring(0, 80)}...</p>
                            <p><span className="text-foreground-secondary">User:</span> {userData?.name} ({userData?.role})</p>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-border">
                        <button type="submit" className="btn-primary">
                            Submit Report
                        </button>
                        <a href="/dashboard" className="btn-secondary">
                            Cancel
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
}
