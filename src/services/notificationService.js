import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";

const NOTIFICATIONS_COLLECTION = "notifications";

// ── Create notification — NEVER throws, NEVER blocks ──────────────────────────
export const createNotification = async (
  userId,
  hostelId,
  type,
  title,
  message,
  issueId = null
) => {
  try {
    if (!userId) return;
    const notifRef = collection(db, NOTIFICATIONS_COLLECTION);
    await addDoc(notifRef, {
      userId,
      hostelId: hostelId || null,
      type, // "status_change" | "assignment" | "escalation" | "announcement"
      title,
      message,
      issueId: issueId || null,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    // Notification failures must never block calling actions
    console.error("createNotification failed (non-blocking):", error);
  }
};

// ── Fetch notifications — real-time listener ──────────────────────────────────
// Returns an unsubscribe function. Caller must invoke on unmount.
export const fetchNotifications = (userId, callback) => {
  if (!userId) {
    callback([]);
    return () => {};
  }

  const notifRef = collection(db, NOTIFICATIONS_COLLECTION);
  const q = query(
    notifRef,
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(20)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const notifications = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      callback(notifications);
    },
    (error) => {
      console.error("Notification listener error:", error);
      callback([]);
    }
  );

  return unsubscribe;
};

// ── Mark single notification as read ──────────────────────────────────────────
export const markAsRead = async (notificationId) => {
  try {
    const notifRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notifRef, { isRead: true });
  } catch (error) {
    console.error("markAsRead failed:", error);
  }
};

// ── Mark all notifications as read (batch) ────────────────────────────────────
export const markAllAsRead = async (userId) => {
  try {
    const notifRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(
      notifRef,
      where("userId", "==", userId),
      where("isRead", "==", false)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => {
      batch.update(docSnap.ref, { isRead: true });
    });

    await batch.commit();
  } catch (error) {
    console.error("markAllAsRead failed:", error);
  }
};

// ── Get unread count ──────────────────────────────────────────────────────────
export const getUnreadCount = async (userId) => {
  try {
    if (!userId) return 0;
    const notifRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(
      notifRef,
      where("userId", "==", userId),
      where("isRead", "==", false)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("getUnreadCount failed:", error);
    return 0;
  }
};
