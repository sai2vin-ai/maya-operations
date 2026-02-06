import type { Timestamp } from 'firebase/firestore';

export type BugReportPriority = 'low' | 'medium' | 'high' | 'critical';

export type BugReportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface BugReport {
    id: string;
    reportNumber: string;
    title: string;
    description: string;
    priority: BugReportPriority;
    status: BugReportStatus;
    screenshotUrl?: string;
    pageUrl: string;
    browserInfo: string;
    createdBy: {
        userId: string;
        displayName: string;
        role: string;
    };
    createdAt: Timestamp;
    updatedAt: Timestamp;
    resolvedAt?: Timestamp;
    adminNotes?: string;
}

export interface CreateBugReportData {
    title: string;
    description: string;
    priority: BugReportPriority;
    pageUrl: string;
    browserInfo: string;
}

export const PRIORITY_LABELS: Record<BugReportPriority, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
};

export const STATUS_LABELS: Record<BugReportStatus, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
};

export const PRIORITY_COLORS: Record<BugReportPriority, string> = {
    low: 'bg-green-500/20 text-green-400 border-green-500/50',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
    critical: 'bg-red-500/20 text-red-400 border-red-500/50',
};
