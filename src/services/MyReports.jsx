import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';

export const useMyReports = () => {
  const { user, supabase } = useAuth();
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
        // Fetch ALL issues created by the current user
        const { data, error } = await supabase
          .from('issues')
          .select('*')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Normalize Data to match your Issues.jsx structure
        const formattedData = (data || []).map((item) => ({
          id: item.id,
          // Map DB 'visibility' ('Public'/'Private') to your UI 'type' ('public'/'private')
          type: item.visibility ? item.visibility.toLowerCase() : 'public', 
          title: item.title,
          author: 'You', // Since these are MY reports
          timestamp: new Date(item.created_at),
          content: item.description,
          status: item.status, // e.g., 'Reported', 'Resolved'
          upvotes: 0, // Placeholder
          comments: 0, // Placeholder
          media: item.media_url ? { type: 'image', url: item.media_url } : null,
        }));

        setReports(formattedData);
      } catch (err) {
        console.error('Error fetching my reports:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user, supabase]);

  return { reports, loading };
};

export default useMyReports;