import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthContext';
import * as Toast from '../services/toastService';

/**
 * Custom hook that sets up real-time Firestore onSnapshot listeners
 * to fire toast notifications based on the current user's role.
 *
 * Mount once inside AppLayout (which sits inside BrowserRouter,
 * so useNavigate() is available).
 */
export function useToastListeners() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const unsubsRef = useRef([]);

  useEffect(() => {
    // Clean up previous listeners
    unsubsRef.current.forEach((u) => u());
    unsubsRef.current = [];

    if (!profile?.id || !profile?.hostelId) return;

    const role = profile.role;
    const uid = profile.id;
    const hostelId = profile.hostelId;

    if (role === 'caretaker') setupCaretakerListeners(uid, hostelId, navigate, unsubsRef);
    if (role === 'student') setupStudentListeners(uid, hostelId, navigate, unsubsRef);
    if (role === 'admin') setupAdminListeners(uid, hostelId, navigate, unsubsRef);

    // All roles: announcements
    setupAnnouncementListener(hostelId, unsubsRef);

    return () => {
      unsubsRef.current.forEach((u) => u());
    };
  }, [profile?.id, profile?.role, profile?.hostelId]);
}

// ─── Caretaker Listeners ────────────────────────────────────────────────────

function setupCaretakerListeners(uid, hostelId, navigate, unsubsRef) {
  const issuesRef = collection(db, 'issues');
  const assignedQ = query(issuesRef, where('assigned_to', '==', uid));

  const prevIssues = new Map(); // track previous state for change detection

  const unsub1 = onSnapshot(assignedQ, (snap) => {
    snap.docChanges().forEach((change) => {
      const issue = { id: change.doc.id, ...change.doc.data() };

      if (change.type === 'added') {
        // Toast #1: New assignment
        Toast.toastIssueAssigned(issue, navigate);
      }

      if (change.type === 'modified') {
        const prev = prevIssues.get(issue.id);

        // Toast #7: Priority escalated
        if (prev && prev.priority !== issue.priority) {
          const RANK = { low: 0, medium: 1, high: 2, emergency: 3, critical: 4 };
          if ((RANK[issue.priority] ?? 0) > (RANK[prev.priority] ?? 0)) {
            Toast.toastPriorityEscalated(issue, issue.priority);
          }
        }
      }

      // Track current state
      prevIssues.set(issue.id, issue);
    });
  });
  unsubsRef.current.push(unsub1);

  // Listener 2: Deadline approaching — polled every 15 min via setInterval
  const intervalId = setInterval(() => {
    prevIssues.forEach((issue) => {
      if (!issue.deadlineAt) return;
      const status = (issue.status || '').toLowerCase();
      if (status === 'resolved' || status === 'closed') return;

      const msToDeadline = new Date(issue.deadlineAt).getTime() - Date.now();
      if (msToDeadline > 0 && msToDeadline <= 60 * 60 * 1000) {
        // within 1 hour
        Toast.toastDeadlineApproaching(issue);
      }
    });
  }, 15 * 60 * 1000); // every 15 minutes

  unsubsRef.current.push(() => clearInterval(intervalId));
}

// ─── Student Listeners ──────────────────────────────────────────────────────

function setupStudentListeners(uid, hostelId, navigate, unsubsRef) {
  const issuesRef = collection(db, 'issues');
  const myIssuesQ = query(issuesRef, where('created_by', '==', uid));

  const prevStatuses = new Map();

  // Listener: My issues status changes
  const unsub1 = onSnapshot(myIssuesQ, (snap) => {
    snap.docChanges().forEach((change) => {
      const issue = { id: change.doc.id, ...change.doc.data() };

      if (change.type === 'modified') {
        const prevStatus = prevStatuses.get(issue.id);
        const newStatus = issue.status;

        if (prevStatus && prevStatus !== newStatus) {
          // Toast #2: Status changed
          Toast.toastIssueStatusChanged(issue, newStatus, navigate);

          // Toast #3: Schedule feedback reminder 10 min after resolve
          if (newStatus === 'resolved' && !issue.feedbackGiven) {
            setTimeout(() => {
              // Re-check feedbackGiven hasn't been submitted in the meantime
              if (!issue.feedbackGiven) {
                Toast.toastFeedbackReminder(issue, navigate);
              }
            }, 10 * 60 * 1000); // 10 minutes
          }
        }
      }

      prevStatuses.set(issue.id, issue.status);
    });

    // Initialize on first snapshot
    if (snap.metadata.hasPendingWrites === false) {
      snap.docs.forEach((d) => {
        const issue = { id: d.id, ...d.data() };
        if (!prevStatuses.has(issue.id)) {
          prevStatuses.set(issue.id, issue.status);
        }
      });
    }
  });
  unsubsRef.current.push(unsub1);

  // Listener: Lost & Found items claimed
  const lostRef = collection(db, 'lost_found');
  const myItemsQ = query(lostRef, where('reported_by', '==', uid));
  const prevItemStatuses = new Map();

  const unsub2 = onSnapshot(myItemsQ, (snap) => {
    snap.docChanges().forEach((change) => {
      const item = { id: change.doc.id, ...change.doc.data() };

      if (change.type === 'modified') {
        const prevStatus = prevItemStatuses.get(item.id);
        if (prevStatus && prevStatus !== 'claimed' && item.status === 'claimed') {
          // Toast #9
          Toast.toastLostItemClaimed(item);
        }
      }

      prevItemStatuses.set(item.id, item.status);
    });
  });
  unsubsRef.current.push(unsub2);
}

// ─── Admin Listeners ────────────────────────────────────────────────────────

function setupAdminListeners(uid, hostelId, navigate, unsubsRef) {
  const issuesRef = collection(db, 'issues');
  const hostelIssuesQ = query(issuesRef, where('hostelId', '==', hostelId));

  const prevIssues = new Map();

  const unsub1 = onSnapshot(hostelIssuesQ, (snap) => {
    snap.docChanges().forEach((change) => {
      const issue = { id: change.doc.id, ...change.doc.data() };

      if (change.type === 'added' && prevIssues.size > 0) {
        // Toast #4: New issue reported (skip the initial load)
        Toast.toastNewIssueReported(issue);
      }

      if (change.type === 'modified') {
        const prev = prevIssues.get(issue.id);
        if (prev) {
          // Toast #5: Issue became overdue
          if (!prev.overdue && issue.overdue) {
            Toast.toastIssueOverdue(issue, () => navigate('/admin/issues'));
          }
          // Toast #6: Feedback received
          if (!prev.feedbackGiven && issue.feedbackGiven) {
            Toast.toastFeedbackReceived(issue);
          }
        }
      }

      prevIssues.set(issue.id, issue);
    });
  });
  unsubsRef.current.push(unsub1);
}

// ─── All Roles: Announcement Listener ───────────────────────────────────────

function setupAnnouncementListener(hostelId, unsubsRef) {
  const announcementsRef = collection(db, 'announcements');
  const q = query(announcementsRef, where('hostelId', '==', hostelId));

  let initialized = false;

  const unsub = onSnapshot(q, (snap) => {
    if (!initialized) {
      initialized = true;
      return; // skip initial load — only fire on new docs
    }
    snap.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const ann = { id: change.doc.id, ...change.doc.data() };
        Toast.toastNewAnnouncement(ann);
      }
    });
  });
  unsubsRef.current.push(unsub);
}
