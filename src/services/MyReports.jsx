import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthContext';

export const useMyReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchReports = async () => {
      setLoading(true);
      try {
        const issuesRef = collection(db, 'issues');
        const q = query(
          issuesRef,
          where('created_by', '==', user.uid),
          orderBy('created_at', 'desc')
        );
        const snapshot = await getDocs(q);

        const formattedData = snapshot.docs.map((docSnap) => {
          const item = docSnap.data();
          return {
            id: docSnap.id,
            type: item.visibility ? item.visibility.toLowerCase() : 'public',
            title: item.title,
            author: 'You',
            timestamp: new Date(item.created_at),
            content: item.description,
            status: item.status,
            upvotes: 0,
            comments: 0,
            media: item.media_url ? { type: 'image', url: item.media_url } : null,
          };
        });

        setReports(formattedData);
      } catch (err) {
        console.error('Error fetching my reports:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user]);

  return { reports, loading };
};

export default useMyReports;
