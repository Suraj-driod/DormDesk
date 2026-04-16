/**
 * Hostel Service
 * Handles hostel creation, flat generation, and hostel lookups.
 *
 * Firestore collection: hostels
 * Document structure:
 *   hostelName, blockName, numberOfFloors, flatsPerFloor,
 *   flatNumberingReference, customFlatPattern, adminUid,
 *   generatedFlats: [{ floor, flat }], createdAt
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  query,
  where,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";

const HOSTELS_COLLECTION = "hostels";
const MANAGEMENT_COLLECTION = "management";

// ────────────────────────────────────────────────────────────
// Flat Generation
// ────────────────────────────────────────────────────────────

/**
 * Generate flat list based on numbering schema.
 *
 * @param {number} numberOfFloors
 * @param {number} flatsPerFloor
 * @param {"sequential"|"floor-prefixed"|"custom"} scheme
 * @param {string} [customPattern] - Only used when scheme === "custom".
 *        Pattern may include {floor} and {unit} placeholders, e.g. "A-{floor}{unit}"
 * @returns {Array<{floor: number, flat: string}>}
 */
export const generateFlats = (
  numberOfFloors,
  flatsPerFloor,
  scheme,
  customPattern = ""
) => {
  const flats = [];

  for (let floor = 1; floor <= numberOfFloors; floor++) {
    for (let unit = 1; unit <= flatsPerFloor; unit++) {
      let flatNumber;

      switch (scheme) {
        case "sequential": {
          // 1, 2, 3 … across the whole building
          flatNumber = String((floor - 1) * flatsPerFloor + unit);
          break;
        }
        case "floor-prefixed": {
          // 101, 102, 201, 202 …
          const paddedUnit = String(unit).padStart(2, "0");
          flatNumber = `${floor}${paddedUnit}`;
          break;
        }
        case "custom": {
          // Replace {floor} and {unit} placeholders
          flatNumber = customPattern
            .replace(/\{floor\}/gi, String(floor))
            .replace(/\{unit\}/gi, String(unit));
          break;
        }
        default:
          flatNumber = String((floor - 1) * flatsPerFloor + unit);
      }

      flats.push({ floor, flat: flatNumber });
    }
  }

  return flats;
};

// ────────────────────────────────────────────────────────────
// Hostel CRUD
// ────────────────────────────────────────────────────────────

/**
 * Create a hostel document AND the admin management profile in one go.
 *
 * @param {object} hostelData - { hostelName, blockName, numberOfFloors, flatsPerFloor, flatNumberingReference, customFlatPattern? }
 * @param {object} adminData  - { uid, email, fullName, phone? }
 * @returns {Promise<{hostelId: string, hostel: object}>}
 */
export const setupHostel = async (hostelData, adminData) => {
  const {
    hostelName,
    blockName,
    numberOfFloors,
    flatsPerFloor,
    flatNumberingReference,
    customFlatPattern,
  } = hostelData;

  // 1. Pre-compute flats
  const generatedFlats = generateFlats(
    numberOfFloors,
    flatsPerFloor,
    flatNumberingReference,
    customFlatPattern
  );

  // 2. Prepare payloads
  const hostelDocRef = doc(collection(db, HOSTELS_COLLECTION));
  const hostelId = hostelDocRef.id;

  const hostelPayload = {
    hostelName,
    blockName,
    numberOfFloors: Number(numberOfFloors),
    flatsPerFloor: Number(flatsPerFloor),
    flatNumberingReference,
    ...(flatNumberingReference === "custom" && customFlatPattern
      ? { customFlatPattern }
      : {}),
    adminUid: adminData.uid,
    generatedFlats,
    createdAt: serverTimestamp(),
  };

  const managementPayload = {
    role: "admin",
    hostelId,
    hostelName,
    blockName,
    email: adminData.email,
    name: adminData.fullName,
    full_name: adminData.fullName,
    phone: adminData.phone || "",
    isActive: true,
    active: true,
    disabled: false,
    createdAt: serverTimestamp(),
  };

  // 3. Atomic batch write — hostel + management profile
  const batch = writeBatch(db);
  batch.set(hostelDocRef, hostelPayload);
  batch.set(doc(db, MANAGEMENT_COLLECTION, adminData.uid), managementPayload);
  await batch.commit();

  return { hostelId, hostel: { id: hostelId, ...hostelPayload } };
};

// ────────────────────────────────────────────────────────────
// Queries
// ────────────────────────────────────────────────────────────

/**
 * Fetch all hostels (for student registration dropdown).
 * Returns an array of hostel objects including doc id.
 */
export const fetchAllHostels = async () => {
  const snapshot = await getDocs(collection(db, HOSTELS_COLLECTION));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Fetch a single hostel by its document id.
 */
export const fetchHostelById = async (hostelId) => {
  const snap = await getDoc(doc(db, HOSTELS_COLLECTION, hostelId));
  if (!snap.exists()) throw new Error("Hostel not found");
  return { id: snap.id, ...snap.data() };
};
