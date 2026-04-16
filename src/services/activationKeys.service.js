/**
 * Activation Keys Service
 * Handles validation and consumption of activation keys for admin registration.
 *
 * Firestore collection: activationKeys
 * Document ID = the key itself (e.g. "DORM-XXXX-YYYY")
 * Fields: { key, used (boolean, default false), createdAt, usedAt, usedBy (admin UID) }
 *
 * Keys are generic — they do NOT carry hostelId or hostelName.
 * The admin creates and configures their hostel during the registration flow.
 */

import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION = "activationKeys";

/**
 * Validate an activation key — check existence and whether it's already used.
 * @param {string} key - The activation key string (document ID)
 * @returns {{ valid: boolean, error?: string }}
 */
export const validateActivationKey = async (key) => {
  try {
    const keyRef = doc(db, COLLECTION, key.trim());
    const keySnap = await getDoc(keyRef);

    if (!keySnap.exists()) {
      return { valid: false, error: "Invalid activation key." };
    }

    const keyData = keySnap.data();

    if (keyData.used === true) {
      return { valid: false, error: "This activation key has already been used." };
    }

    return { valid: true };
  } catch (error) {
    console.error("Error validating activation key:", error);
    return { valid: false, error: "Failed to validate key. Please try again." };
  }
};

/**
 * Mark an activation key as used after successful admin registration.
 * @param {string} key - The activation key string
 * @param {string} adminUid - The UID of the admin who used the key
 */
export const markKeyAsUsed = async (key, adminUid) => {
  try {
    const keyRef = doc(db, COLLECTION, key.trim());
    await updateDoc(keyRef, {
      used: true,
      usedBy: adminUid,
      usedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error marking activation key as used:", error);
    throw error;
  }
};
