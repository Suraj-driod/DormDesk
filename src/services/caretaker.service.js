/**
 * Caretaker Management Service
 * Handles CRUD operations for caretaker accounts in Firestore.
 * 
 * NOTE: Caretaker accounts are stored in the "management" collection 
 * (matching the existing pattern used in AuthContext.fetchProfile).
 */

import {
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

const MANAGEMENT_COLLECTION = "management";

/**
 * Write a new caretaker document to the management collection.
 * Document ID = the Firebase Auth UID of the caretaker.
 */
export const createCaretakerDoc = async (uid, data) => {
  try {
    const docRef = doc(db, MANAGEMENT_COLLECTION, uid);
    await setDoc(docRef, {
      name: data.name,
      full_name: data.name,
      email: data.email,
      phone: data.phone || "",
      role: "caretaker",
      hostelId: data.hostelId,
      hostelName: data.hostelName || "",
      isActive: true,
      active: true,
      disabled: false,
      createdBy: data.createdBy,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error creating caretaker doc:", error);
    throw error;
  }
};

/**
 * Fetch all caretakers belonging to a specific hostel.
 * @param {string} hostelId
 * @returns {Array} array of caretaker objects with { id, ...data }
 */
export const fetchCaretakersByHostel = async (hostelId) => {
  try {
    const mgmtRef = collection(db, MANAGEMENT_COLLECTION);
    const q = query(
      mgmtRef,
      where("role", "==", "caretaker"),
      where("hostelId", "==", hostelId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching caretakers:", error);
    throw error;
  }
};

/**
 * Toggle the disabled status of a caretaker.
 * @param {string} caretakerId - Document ID (UID)
 * @param {boolean} disabled - New disabled state
 */
export const toggleCaretakerDisabled = async (caretakerId, disabled) => {
  try {
    const docRef = doc(db, MANAGEMENT_COLLECTION, caretakerId);
    await updateDoc(docRef, {
      disabled: disabled,
      isActive: !disabled,
      active: !disabled,
    });
  } catch (error) {
    console.error("Error toggling caretaker disabled:", error);
    throw error;
  }
};

/**
 * Delete a caretaker document from the management collection.
 * NOTE: This only deletes the Firestore doc — the Firebase Auth account
 * cannot be deleted from client SDK without Admin SDK.
 * @param {string} caretakerId - Document ID (UID)
 */
export const deleteCaretakerDoc = async (caretakerId) => {
  try {
    const docRef = doc(db, MANAGEMENT_COLLECTION, caretakerId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting caretaker doc:", error);
    throw error;
  }
};
