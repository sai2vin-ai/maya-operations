/**
 * MCP Server — Bug Reports / Feedback Reader
 *
 * Connects to Firestore using Firebase Admin SDK and exposes tools
 * to list, get, and summarize bug reports submitted by users.
 *
 * Run with: npx tsx src/mcp/feedback-server.ts
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

// --- Firebase init ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serviceAccountPath = resolve(__dirname, '../../service-account/firebase-service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const db = admin.firestore();
const BUG_REPORTS = 'bugReports';

// --- Helpers ---
function formatTimestamp(ts: admin.firestore.Timestamp | undefined): string {
    if (!ts || !ts.toDate) return 'N/A';
    return ts.toDate().toISOString().replace('T', ' ').slice(0, 19);
}

function formatReport(id: string, data: admin.firestore.DocumentData): string {
    const lines = [
        `## ${data.reportNumber || 'N/A'} — ${data.title || 'Untitled'}`,
        `**ID:** ${id}`,
        `**Status:** ${data.status || 'unknown'}  |  **Priority:** ${data.priority || 'unknown'}`,
        `**Reporter:** ${data.createdBy?.displayName || 'Unknown'} (${data.createdBy?.role || 'N/A'})`,
        `**Created:** ${formatTimestamp(data.createdAt)}`,
        data.resolvedAt ? `**Resolved:** ${formatTimestamp(data.resolvedAt)}` : null,
        `**Page URL:** ${data.pageUrl || 'N/A'}`,
        `**Browser:** ${data.browserInfo || 'N/A'}`,
        '',
        `### Description`,
        data.description || '(empty)',
        data.adminNotes ? `\n### Admin Notes\n${data.adminNotes}` : null,
        data.screenshotUrl ? `\n**Screenshot:** ${data.screenshotUrl}` : null,
    ];
    return lines.filter(Boolean).join('\n');
}

// --- MCP Server ---
const server = new McpServer({
    name: 'maya-feedback',
    version: '1.1.0',
});

// Tool: list_bug_reports
server.tool(
    'list_bug_reports',
    'List all bug reports with optional filtering by status and/or priority',
    {
        status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional().describe('Filter by status'),
        priority: z.enum(['low', 'medium', 'high', 'critical']).optional().describe('Filter by priority'),
        limit: z.number().min(1).max(100).optional().describe('Max results (default 50)'),
    },
    async (args) => {
        let query: admin.firestore.Query = db.collection(BUG_REPORTS).orderBy('createdAt', 'desc');

        if (args.status) {
            query = query.where('status', '==', args.status);
        }
        if (args.priority) {
            query = query.where('priority', '==', args.priority);
        }

        const maxResults = args.limit ?? 50;
        query = query.limit(maxResults);

        const snapshot = await query.get();

        if (snapshot.empty) {
            return { content: [{ type: 'text', text: 'No bug reports found matching the criteria.' }] };
        }

        const lines = [`# Bug Reports (${snapshot.size} result${snapshot.size > 1 ? 's' : ''})\n`];

        for (const doc of snapshot.docs) {
            const d = doc.data();
            lines.push(
                `| **${d.reportNumber}** | ${d.title} | ${(d.priority || '').toUpperCase()} | ${d.status} | ${d.createdBy?.displayName || 'Unknown'} | ${formatTimestamp(d.createdAt)} |`,
            );
        }

        const header = '| # | Title | Priority | Status | Reporter | Created |\n|---|---|---|---|---|---|';
        lines.splice(1, 0, header);

        return { content: [{ type: 'text', text: lines.join('\n') }] };
    },
);

// Tool: get_bug_report
server.tool(
    'get_bug_report',
    'Get full details of a specific bug report by its Firestore document ID or report number (e.g. BR-001)',
    {
        id: z.string().describe('Firestore document ID or report number (e.g. BR-001)'),
    },
    async (args) => {
        let docData: admin.firestore.DocumentData | undefined;
        let docId = args.id;

        // If it looks like a report number (BR-XXX), query by reportNumber field
        if (/^BR-\d+$/i.test(args.id)) {
            const snapshot = await db
                .collection(BUG_REPORTS)
                .where('reportNumber', '==', args.id.toUpperCase())
                .limit(1)
                .get();
            if (!snapshot.empty) {
                docId = snapshot.docs[0].id;
                docData = snapshot.docs[0].data();
            }
        } else {
            const doc = await db.collection(BUG_REPORTS).doc(args.id).get();
            if (doc.exists) {
                docData = doc.data();
            }
        }

        if (!docData) {
            return { content: [{ type: 'text', text: `Bug report "${args.id}" not found.` }] };
        }

        return { content: [{ type: 'text', text: formatReport(docId, docData) }] };
    },
);

// Tool: update_bug_report
server.tool(
    'update_bug_report',
    'Update a bug report — change status and/or add admin notes. Accepts a Firestore document ID or report number (e.g. BR-001).',
    {
        id: z.string().describe('Firestore document ID or report number (e.g. BR-001)'),
        status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional().describe('New status'),
        adminNotes: z.string().optional().describe('Admin notes to set on the report'),
    },
    async (args) => {
        if (!args.status && args.adminNotes === undefined) {
            return { content: [{ type: 'text', text: 'Provide at least one of: status, adminNotes.' }] };
        }

        // Resolve doc ID
        let docId = args.id;
        if (/^BR-\d+$/i.test(args.id)) {
            const snapshot = await db
                .collection(BUG_REPORTS)
                .where('reportNumber', '==', args.id.toUpperCase())
                .limit(1)
                .get();
            if (snapshot.empty) {
                return { content: [{ type: 'text', text: `Bug report "${args.id}" not found.` }] };
            }
            docId = snapshot.docs[0].id;
        } else {
            const check = await db.collection(BUG_REPORTS).doc(args.id).get();
            if (!check.exists) {
                return { content: [{ type: 'text', text: `Bug report "${args.id}" not found.` }] };
            }
        }

        const now = admin.firestore.Timestamp.now();
        const updates: Record<string, unknown> = { updatedAt: now };

        if (args.status) {
            updates.status = args.status;
            if (args.status === 'resolved') {
                updates.resolvedAt = now;
            }
        }
        if (args.adminNotes !== undefined) {
            updates.adminNotes = args.adminNotes;
        }

        await db.collection(BUG_REPORTS).doc(docId).update(updates);

        const updated = await db.collection(BUG_REPORTS).doc(docId).get();
        return { content: [{ type: 'text', text: `✓ Updated.\n\n${formatReport(docId, updated.data()!)}` }] };
    },
);

// Tool: get_feedback_stats
server.tool(
    'get_feedback_stats',
    'Get summary statistics of all bug reports — counts by status and priority',
    {},
    async () => {
        const snapshot = await db.collection(BUG_REPORTS).get();

        if (snapshot.empty) {
            return { content: [{ type: 'text', text: 'No bug reports found in the system.' }] };
        }

        const statusCounts: Record<string, number> = {};
        const priorityCounts: Record<string, number> = {};
        let oldest: admin.firestore.Timestamp | null = null;
        let newest: admin.firestore.Timestamp | null = null;

        for (const doc of snapshot.docs) {
            const d = doc.data();
            statusCounts[d.status] = (statusCounts[d.status] || 0) + 1;
            priorityCounts[d.priority] = (priorityCounts[d.priority] || 0) + 1;

            if (d.createdAt) {
                if (!oldest || d.createdAt.toMillis() < oldest.toMillis()) oldest = d.createdAt;
                if (!newest || d.createdAt.toMillis() > newest.toMillis()) newest = d.createdAt;
            }
        }

        const lines = [
            `# Feedback Stats`,
            `**Total reports:** ${snapshot.size}`,
            '',
            '## By Status',
            ...Object.entries(statusCounts)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([s, c]) => `- **${s}:** ${c}`),
            '',
            '## By Priority',
            ...Object.entries(priorityCounts)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([p, c]) => `- **${p}:** ${c}`),
            '',
            `**Date range:** ${formatTimestamp(oldest as admin.firestore.Timestamp)} → ${formatTimestamp(newest as admin.firestore.Timestamp)}`,
        ];

        return { content: [{ type: 'text', text: lines.join('\n') }] };
    },
);

// --- Start ---
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch((err) => {
    process.stderr.write(`MCP server error: ${err}\n`);
    process.exit(1);
});
