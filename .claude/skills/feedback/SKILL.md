---
name: feedback
description: Review user feedback and bug reports from the Maya Operations app. Use when the user asks to check feedback, review bug reports, or see user-reported issues.
argument-hint: '[status|priority|report-number]'
---

Review user feedback (bug reports) from the Maya Operations system.

## How to use the MCP tools

1. **Overview first** — Call `get_feedback_stats` to show a summary of all reports by status and priority.
2. **List reports** — Call `list_bug_reports` to show the table of reports. Apply filters if the user specified a status or priority:
    - `$ARGUMENTS` may be a status (`open`, `in_progress`, `resolved`, `closed`), a priority (`low`, `medium`, `high`, `critical`), or a report number (`BR-001`).
3. **Detail view** — If `$ARGUMENTS` looks like a report number (e.g. `BR-001`) or a document ID, call `get_bug_report` with that ID.

## Presentation

- Always start with the stats summary so the user sees the big picture.
- When listing, show the table and highlight any **critical** or **high** priority open items.
- When showing a single report, display all fields clearly.
- Suggest actionable next steps (e.g. "There are 3 critical open reports — want to see details?").
