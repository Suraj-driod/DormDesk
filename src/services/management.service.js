import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from "firebase/firestore";
import { db } from "../firebase";

const MANAGEMENT_COLLECTION = "management";

// Fetch all management users
export const fetchManagementUsers = async () => {
  try {
    const mgmtRef = collection(db, MANAGEMENT_COLLECTION);
    const q = query(mgmtRef, orderBy("created_at", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.error("Error fetching management users:", error);
    throw error;
  }
};

// Create a new management user
export const createManagementUser = async (userData) => {
  try {
    const mgmtRef = collection(db, MANAGEMENT_COLLECTION);
    
    // If userData has an id field, use setDoc with that id
    if (userData.id) {
      const docRef = doc(db, MANAGEMENT_COLLECTION, userData.id);
      const { id, ...dataWithoutId } = userData;
      await setDoc(docRef, {
        ...dataWithoutId,
        created_at: new Date().toISOString(),
      });
      const newSnap = await getDoc(docRef);
      return { id: newSnap.id, ...newSnap.data() };
    }

    // Otherwise use addDoc
    const docRef = await addDoc(mgmtRef, {
      ...userData,
      created_at: new Date().toISOString(),
    });

    const newSnap = await getDoc(docRef);
    return { id: newSnap.id, ...newSnap.data() };
  } catch (error) {
    console.error("Error creating management user:", error);
    throw error;
  }
};

// Fetch caretakers by hostel name
export const fetchCaretakersByHostel = async (hostelName) => {
  try {
    const mgmtRef = collection(db, MANAGEMENT_COLLECTION);
    const q = query(
      mgmtRef,
      where("hostel_name", "==", hostelName),
      where("role", "==", "caretaker"),
      orderBy("created_at", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.error("Error fetching caretakers by hostel:", error);
    throw error;
  }
};

// Add a new caretaker
export const addCaretaker = async (caretakerData) => {
  try {
    const mgmtRef = collection(db, MANAGEMENT_COLLECTION);
    
    // If caretakerData has an id (Firebase auth uid), use setDoc
    if (caretakerData.id) {
      const docRef = doc(db, MANAGEMENT_COLLECTION, caretakerData.id);
      const { id, ...dataWithoutId } = caretakerData;
      await setDoc(docRef, {
        ...dataWithoutId,
        role: "caretaker",
        is_active: true,
        created_at: new Date().toISOString(),
      });
      const newSnap = await getDoc(docRef);
      return { id: newSnap.id, ...newSnap.data() };
    }

    const docRef = await addDoc(mgmtRef, {
      ...caretakerData,
      role: "caretaker",
      is_active: true,
      created_at: new Date().toISOString(),
    });

    const newSnap = await getDoc(docRef);
    return { id: newSnap.id, ...newSnap.data() };
  } catch (error) {
    console.error("Error adding caretaker:", error);
    throw error;
  }
};

// Update caretaker details
export const updateCaretaker = async (id, caretakerData) => {
  try {
    const caretakerRef = doc(db, MANAGEMENT_COLLECTION, id);
    await updateDoc(caretakerRef, {
      ...caretakerData,
      updated_at: new Date().toISOString(),
    });

    const updatedSnap = await getDoc(caretakerRef);
    return { id: updatedSnap.id, ...updatedSnap.data() };
  } catch (error) {
    console.error("Error updating caretaker:", error);
    throw error;
  }
};

// Delete a caretaker
export const deleteCaretaker = async (id) => {
  try {
    const caretakerRef = doc(db, MANAGEMENT_COLLECTION, id);
    const caretakerSnap = await getDoc(caretakerRef);
    
    if (!caretakerSnap.exists()) throw new Error("Caretaker not found");
    
    const caretakerData = { id: caretakerSnap.id, ...caretakerSnap.data() };
    await deleteDoc(caretakerRef);
    return caretakerData;
  } catch (error) {
    console.error("Error deleting caretaker:", error);
    throw error;
  }
};

// Fetch all caretakers
export const fetchAllCaretakers = async () => {
  try {
    const mgmtRef = collection(db, MANAGEMENT_COLLECTION);
    const q = query(
      mgmtRef,
      where("role", "==", "caretaker"),
      orderBy("full_name")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.error("Error fetching all caretakers:", error);
    throw error;
  }
};

// Fetch active caretakers
export const fetchActiveCaretakers = async () => {
  try {
    const mgmtRef = collection(db, MANAGEMENT_COLLECTION);
    const q = query(
      mgmtRef,
      where("role", "==", "caretaker"),
      where("is_active", "==", true),
      orderBy("full_name")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.error("Error fetching active caretakers:", error);
    throw error;
  }
};
