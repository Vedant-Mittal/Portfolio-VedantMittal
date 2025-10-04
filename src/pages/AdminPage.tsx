import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import PortfolioEditor from '@/components/admin/PortfolioEditor';

const AdminPage = () => {
  const { isAdmin, isInstructor, loading: authLoading, user, profile } = useAuth();
  const navigate = useNavigate();

  // Debug logging
  console.log('🔍 AdminPage Debug:', {
    user: user?.email || 'No user',
    profile: profile?.role || 'No profile',
    isAdmin,
    isInstructor,
    authLoading,
    coursesLoading
  });

  useEffect(() => {
    console.log('🚀 AdminPage useEffect:', { authLoading, isInstructor, hasProfile: !!profile });
    // Only redirect if auth is fully loaded (including profile) and user is not instructor
    if (!authLoading && profile && !isInstructor) {
      console.log('❌ Redirecting to home - user is not instructor');
      navigate('/');
    }
  }, [authLoading, isInstructor, profile, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Please sign in to access the admin panel.</p>
          <Button onClick={() => navigate('/auth')}>Go to Sign In</Button>
        </div>
      </div>
    );
  }

  if (profile && !isInstructor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">You are not authorized to access the admin panel.</p>
          <Button variant="ghost" onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  // This page now hosts only the Portfolio Editor UI

  const handleDeleteCourse = async (course: Course) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${course.title}"?\n\n` +
      'This will permanently delete the course and all its lectures. This action cannot be undone.'
    );

    if (!confirmDelete) return;

    try {
      // First delete all lectures associated with this course
      const { error: lecturesError } = await supabase
        .from('lectures')
        .delete()
        .eq('course_id', course.id);

      if (lecturesError) throw lecturesError;

      // Then delete the course
      const { error: courseError } = await supabase
        .from('courses')
        .delete()
        .eq('id', course.id);

      if (courseError) throw courseError;

      toast({
        title: "Course deleted",
        description: `"${course.title}" has been permanently deleted.`,
      });

      // Refresh the courses list
      refetch();

      // If the deleted course was selected, clear the selection
      if (selectedCourse?.id === course.id) {
        setSelectedCourse(null);
        setActiveTab('courses');
      }
    } catch (error: any) {
      console.error('Error deleting course:', error);
      toast({
        title: "Error deleting course",
        description: error.message || 'An unexpected error occurred',
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-primary">Portfolio Editor</h1>
              <p className="text-muted-foreground">Manage designs, AI designs and websites</p>
            </div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <PortfolioEditor />
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPage;