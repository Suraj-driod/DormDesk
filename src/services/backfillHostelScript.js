import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

export const backfillHostelData = async (defaultHostelId = "hostel_boys_a") => {
  const collectionsToUpdate = ["users", "issues", "announcements", "complaints", "lost_items"];
  let totalUpdated = 0;

  for (const collectionName of collectionsToUpdate) {
    console.log(`Starting backfill for ${collectionName}...`);
    const collRef = collection(db, collectionName);
    const snapshot = await getDocs(collRef);
    
    for (const document of snapshot.docs) {
      const data = document.data();
      if (!data.hostelId) {
        await updateDoc(doc(db, collectionName, document.id), {
          hostelId: defaultHostelId
        });
        totalUpdated++;
      }
    }
    console.log(`Finished ${collectionName}`);
  }
  
  console.log(`Backfill complete. Total documents updated: ${totalUpdated}`);
};
