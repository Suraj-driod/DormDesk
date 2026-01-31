import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  orderBy 
} from "firebase/firestore";
import { db } from "../firebase";

const STATUS_LOGS_COLLECTION = "issue_status_logs";

// Fetch status logs for a specific issue
export const fetchStatusLogs = async (issueId) => {
  try {
    const logsRef = collection(db, STATUS_LOGS_COLLECTION);
    const q = query(
      logsRef,
      where("issue_id", "==", issueId),
      orderBy("changed_at", "desc")
    );
    const snapshot = await getDocs(q);

    const logs = await Promise.all(snapshot.docs.map(async (docSnap) => {
      const log = { id: docSnap.id, ...docSnap.data() };

      // Fetch changed_by user info
      if (log.changed_by) {
        // Try users first
        let userRef = doc(db, "users", log.changed_by);
        let userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          // Try management
          userRef = doc(db, "management", log.changed_by);
          userSnap = await getDoc(userRef);
        }
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          log.changed_by_user = { 
            id: userSnap.id, 
            name: userData.name || userData.full_name 
          };
        }
      }

      return log;
    }));

    return logs;
  } catch (error) {
    console.error("Error fetching status logs:", error);
    throw error;
  }
};

// Add a new status log entry
export const addStatusLog = async (logData) => {
  try {
    const logsRef = collection(db, STATUS_LOGS_COLLECTION);
    const docRef = await addDoc(logsRef, {
      ...logData,
      changed_at: new Date().toISOString(),
    });

    const newSnap = await getDoc(docRef);
    return { id: newSnap.id, ...newSnap.data() };
  } catch (error) {
    console.error("Error adding status log:", error);
    throw error;
  }
};
