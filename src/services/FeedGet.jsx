import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';

export const useFeedGet = (activeTab) => {
  const { supabase } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      let query;

      try {
        switch (activeTab) {
          case 'issues':
            // Issues have visibility, so we keep it here
            query = supabase
              .from('issues')
              .select(`
                id, title, description, created_at, status, visibility,
                profiles:created_by (name),
                upvotes:issue_upvotes (count),
                comments:issue_comments (count)
              `)
              .eq('visibility', 'public') 
              .order('created_at', { ascending: false });
            break;

          case 'announcements':
            query = supabase
              .from('announcements')
              .select(`
                id, title, content, created_at,
                profiles:created_by (name)
              `)
              .order('created_at', { ascending: false });
            break;

          case 'lost':
            query = supabase
              .from('lost_items')
              .select(`
                id, title, description, location, image_url, status, created_at,
                profiles:reported_by (name)
              `)
              .order('created_at', { ascending: false });
            break;

          case 'complaints':
            // ✅ FIX: Removed 'visibility' from this select string
            query = supabase
              .from('complaints')
              .select(`
                id, complaint_type, description, status, created_at,
                profiles:raised_by (name)
              `)
              .order('created_at', { ascending: false });
            break;

          default:
            setData([]);
            setLoading(false);
            return;
        }

        const { data: rawData, error } = await query;

        if (error) {
          console.error(`Error fetching ${activeTab}:`, error);
          setData([]);
        } else {
          // --- Data Normalization ---
          const formatted = rawData.map(item => {
            const base = {
              id: item.id,
              timestamp: new Date(item.created_at),
            };

            if (activeTab === 'issues') {
              return {
                ...base,
                title: item.title,
                content: item.description,
                author: item.profiles?.name || 'Unknown',
                status: item.status, 
                upvotes: item.upvotes?.[0]?.count || 0,
                comments: item.comments?.[0]?.count || 0,
                visibility: item.visibility,
                media: null 
              };
            } else if (activeTab === 'announcements') {
              return {
                ...base,
                title: item.title,
                content: item.content,
                author: item.profiles?.name || 'Admin',
                status: 'Official', 
                upvotes: 0,
                comments: 0,
                visibility: 'public'
              };
            } else if (activeTab === 'lost') {
              return {
                ...base,
                title: item.title,
                content: `${item.description} \n📍 Location: ${item.location}`,
                author: item.profiles?.name || 'Unknown',
                status: item.status, 
                upvotes: 0,
                comments: 0,
                visibility: 'public',
                media: item.image_url ? { type: 'image', url: item.image_url } : null
              };
            } else if (activeTab === 'complaints') {
              return {
                ...base,
                title: `${item.complaint_type} Complaint`,
                content: item.description,
                author: item.profiles?.name || 'Anonymous',
                status: item.status,
                visibility: 'private', // ✅ FIX: Hardcoded default since column is missing
                upvotes: 0,
                comments: 0
              };
            }
            return base;
          });
          
          setData(formatted);
        }

      } catch (e) {
        console.error("Feed fetch error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, supabase]);

  return { data, loading };
};

export default useFeedGet;