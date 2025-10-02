import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LatestVideo {
  id: string;
  title: string;
  youtube_video_id: string;
  duration: string;
  created_at: string;
  course_id: string;
}

export const useLatestVideos = () => {
  const [videos, setVideos] = useState<LatestVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('lectures')
        .select('id, title, youtube_video_id, duration, created_at, course_id')
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      setVideos(data || []);
    } catch (error: any) {
      console.error('Error fetching latest videos:', error);
      toast({ title: 'Error loading videos', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  return { videos, loading, refetch: fetchVideos };
};


