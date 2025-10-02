import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Course {
  id: string;
  slug: string;
  title: string;
  description?: string;
  instructor_name: string;
  duration?: string;
  level: string;
  price?: string;
  thumbnail_url?: string;
  topics: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lecture {
  id: string;
  course_id: string;
  chapter_title: string;
  title: string;
  duration: string;
  youtube_video_id: string;
  notes_file_path?: string;
  order_index: number;
  chapter_order: number;
  resources: Array<{ title: string; url: string }>;
  created_at: string;
  updated_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  course_id: string;
  lecture_id: string;
  completed_at: string;
}

export const useCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
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

  return { courses, loading, refetch: fetchCourses };
};

export const useCourse = (slug: string) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCourse = async () => {
    try {
      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('slug', slug)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch lectures
      const { data: lecturesData, error: lecturesError } = await supabase
        .from('lectures')
        .select('*')
        .eq('course_id', courseData.id)
        .order('chapter_order', { ascending: true })
        .order('order_index', { ascending: true });

      if (lecturesError) throw lecturesError;
      setLectures((lecturesData || []).map(lecture => ({
        ...lecture,
        resources: Array.isArray(lecture.resources) 
          ? lecture.resources as Array<{ title: string; url: string }>
          : []
      })));

      // Fetch user progress if authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('*')
          .eq('course_id', courseData.id)
          .eq('user_id', session.user.id);

        if (progressError) {
          console.error('Error fetching progress:', progressError);
        } else {
          setUserProgress(progressData || []);
        }
      }
    } catch (error: any) {
      console.error('Error fetching course:', error);
      toast({
        title: "Error loading course",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markLectureComplete = async (lectureId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: session.user.id,
          course_id: course!.id,
          lecture_id: lectureId
        });

      if (error) throw error;

      // Update local state
      setUserProgress(prev => {
        const exists = prev.find(p => p.lecture_id === lectureId);
        if (exists) return prev;
        
        return [...prev, {
          id: Date.now().toString(),
          user_id: session.user.id,
          course_id: course!.id,
          lecture_id: lectureId,
          completed_at: new Date().toISOString()
        }];
      });

      toast({
        title: "Progress saved",
        description: "Lecture marked as complete!",
      });
    } catch (error: any) {
      console.error('Error marking lecture complete:', error);
      toast({
        title: "Error saving progress",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (slug) {
      fetchCourse();
    }
  }, [slug]);

  return { 
    course, 
    lectures, 
    userProgress, 
    loading, 
    markLectureComplete,
    refetch: fetchCourse 
  };
};