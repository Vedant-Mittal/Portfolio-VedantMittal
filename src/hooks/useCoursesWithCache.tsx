import { useState, useEffect } from 'react';
import { Course } from '@/hooks/useCourses';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Simple cache to avoid repeated API calls
const courseCache = new Map<string, { data: Course[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useCoursesWithCache = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCourses = async (forceRefresh = false) => {
    const cacheKey = 'published-courses';
    const now = Date.now();
    
    // Check cache first unless force refresh
    if (!forceRefresh && courseCache.has(cacheKey)) {
      const cached = courseCache.get(cacheKey)!;
      if (now - cached.timestamp < CACHE_DURATION) {
        setCourses(cached.data);
        setLoading(false);
        return;
      }
    }

    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const coursesData = data || [];
      setCourses(coursesData);
      
      // Update cache
      courseCache.set(cacheKey, { data: coursesData, timestamp: now });
      
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      toast({
        title: "Error loading courses",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const refetch = () => {
    setLoading(true);
    fetchCourses(true);
  };

  return { courses, loading, refetch };
};