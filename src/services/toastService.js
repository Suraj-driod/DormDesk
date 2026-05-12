import { toast } from 'sonner';

// ─── Session-scoped deduplication ────────────────────────────────────────────
// Same toast won't fire twice in a single browser session
const shownToasts = new Set();

function dedupe(key, fn) {
  if (shownToasts.has(key)) return;
  shownToasts.add(key);
  fn();
}

/** Call on logout to clear dedup state */
export function clearToastCache() {
  shownToasts.clear();
}

// ─── Toast #1 — Caretaker: Issue Assigned ────────────────────────────────────
export function toastIssueAssigned(issue, navigate) {
  dedupe(`assigned-${issue.id}`, () => {
    toast.info(`🔧 New issue assigned to you: ${issue.title}`, {
      action: {
        label: 'View Issue',
        onClick: () => navigate(`/caretaker/assignments`),
      },
    });
  });
}

// ─── Toast #2 — Student: Issue Status Changed ───────────────────────────────
const STATUS_TOAST_MAP = {
  in_progress: (title) => toast.info(`🔄 Your issue '${title}' is now being worked on`),
  resolved: (title, issueId, navigate) =>
    toast.success(`✅ Your issue '${title}' has been resolved! Please share your feedback`, {
      duration: Infinity,
      action: {
        label: 'Give Feedback',
        onClick: () => navigate(`/my-issues`),
      },
    }),
  overdue: (title) =>
    toast.warning(`⚠️ Your issue '${title}' is overdue. Admin has been notified`, {
      duration: 8000,
    }),
  closed: (title) => toast(`Your issue '${title}' has been closed`),
};

export function toastIssueStatusChanged(issue, newStatus, navigate) {
  const key = `status-${issue.id}-${newStatus}`;
  dedupe(key, () => {
    const handler = STATUS_TOAST_MAP[newStatus.toLowerCase()];
    if (handler) handler(issue.title, issue.id, navigate);
  });
}

// ─── Toast #3 — Student: Feedback Reminder (10 min after resolve) ───────────
export function toastFeedbackReminder(issue, navigate) {
  dedupe(`feedback-reminder-${issue.id}`, () => {
    toast.warning(`⏰ Don't forget to rate your experience for '${issue.title}'`, {
      duration: Infinity,
      action: {
        label: 'Rate Now',
        onClick: () => navigate(`/my-issues`),
      },
    });
  });
}

// ─── Toast #4 — Admin: New Issue Reported ────────────────────────────────────
const URGENCY_DURATION = {
  critical: Infinity,
  high: 8000,
  medium: 5000,
  low: 3000,
};

export function toastNewIssueReported(issue) {
  dedupe(`new-issue-${issue.id}`, () => {
    const duration = URGENCY_DURATION[(issue.priority || 'low').toLowerCase()] ?? 5000;
    toast.info(
      `📋 New issue reported: '${issue.title}' — ${issue.category} — ${issue.priority} priority`,
      { duration }
    );
  });
}

// ─── Toast #5 — Admin: Issue Overdue ─────────────────────────────────────────
export function toastIssueOverdue(issue, onAssignClick) {
  dedupe(`overdue-admin-${issue.id}`, () => {
    toast.error(
      `🚨 OVERDUE: '${issue.title}' has crossed its ${issue.priority} deadline and is still unresolved`,
      {
        duration: Infinity,
        action: {
          label: 'Assign Now',
          onClick: onAssignClick,
        },
      }
    );
  });
}

// ─── Toast #6 — Admin: Feedback Received ─────────────────────────────────────
export function toastFeedbackReceived(issue) {
  dedupe(`feedback-${issue.id}`, () => {
    const rating = issue.feedback?.rating ?? '?';
    toast.success(`⭐ New feedback received for '${issue.title}' — ${rating}/5 stars`);
  });
}

// ─── Toast #7 — Caretaker: Priority Escalated ───────────────────────────────
export function toastPriorityEscalated(issue, newPriority) {
  dedupe(`escalated-${issue.id}-${newPriority}`, () => {
    toast.warning(`⚠️ Priority escalated: '${issue.title}' is now ${newPriority} priority`);
  });
}

// ─── Toast #8 — Caretaker: Deadline Approaching (1 hour) ────────────────────
export function toastDeadlineApproaching(issue) {
  dedupe(`deadline-1h-${issue.id}`, () => {
    toast.warning(`⏳ Deadline in 1 hour: '${issue.title}' must be resolved soon`, {
      duration: 10000,
    });
  });
}

// ─── Toast #9 — Student: Lost Item Claimed ──────────────────────────────────
export function toastLostItemClaimed(item) {
  dedupe(`claimed-${item.id}`, () => {
    toast.success(`🎉 Someone has claimed your lost item: '${item.title}'`);
  });
}

// ─── Toast #10 — All Roles: New Announcement ────────────────────────────────
export function toastNewAnnouncement(announcement) {
  dedupe(`announcement-${announcement.id}`, () => {
    toast.info(`📢 New announcement: '${announcement.title}'`);
  });
}
