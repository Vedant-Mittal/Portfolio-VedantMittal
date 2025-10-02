import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, Upload, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCourses, Course } from '@/hooks/useCourses';
import { CourseEditor } from '@/components/admin/CourseEditor';
import { LectureManager } from '@/components/admin/LectureManager';

const AdminPage = () => {
  const { isAdmin, isInstructor, loading: authLoading, user, profile } = useAuth();
  const { toast } = useToast();
  const { courses, loading: coursesLoading, refetch } = useCourses();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('courses');
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

  if (authLoading || coursesLoading) {
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

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setIsEditing(true);
    setActiveTab('editor');
  };

  const handleNewCourse = () => {
    setSelectedCourse(null);
    setIsEditing(true);
    setActiveTab('editor');
  };

  const handleSaveCourse = () => {
    setIsEditing(false);
    setSelectedCourse(null);
    setActiveTab('courses');
    refetch();
  };


  const handleManageLectures = (course: Course) => {
    setSelectedCourse(course);
    setActiveTab('lectures');
  };

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
        <div className="flex items-center justify-between mb-8">
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
              <h1 className="text-3xl font-bold text-primary">Admin Panel</h1>
              <p className="text-muted-foreground">Manage courses and content</p>
            </div>
          </div>
          
          {activeTab === 'courses' && (
            <div className="flex gap-2">
              <Button onClick={handleNewCourse} className="glass-card bg-primary/90 hover:bg-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                New Course
              </Button>
              <Button onClick={() => navigate('/admin/portfolio')} variant="outline" className="glass-card">
                Edit Portfolio
              </Button>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="glass-card grid w-full max-w-md grid-cols-3 p-1">
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="editor" disabled={!isEditing && !selectedCourse}>Editor</TabsTrigger>
            <TabsTrigger value="lectures" disabled={!selectedCourse}>Lectures</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6 hover:glow-border transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <Badge variant={course.is_published ? "default" : "secondary"}>
                      {course.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">{course.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                    {course.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span>{course.level}</span>
                    <span>{course.price}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCourse(course)}
                      className="glass-card flex-1"
                      data-testid={`button-edit-${course.id}`}
                    >
                      <Edit className="mr-2 h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManageLectures(course)}
                      className="glass-card flex-1"
                      data-testid={`button-lectures-${course.id}`}
                    >
                      <Upload className="mr-2 h-3 w-3" />
                      Lectures
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/course/${course.slug}`)}
                      className="glass-card"
                      data-testid={`button-view-${course.id}`}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCourse(course)}
                      className="glass-card text-destructive hover:text-destructive"
                      data-testid={`button-delete-${course.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="editor" className="mt-6">
            {(isEditing || selectedCourse) && (
              <CourseEditor
                course={selectedCourse}
                onSave={handleSaveCourse}
                onCancel={() => {
                  setIsEditing(false);
                  setSelectedCourse(null);
                  setActiveTab('courses');
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="lectures" className="mt-6">
            {selectedCourse && (
              <LectureManager
                course={selectedCourse}
                onBack={() => setActiveTab('courses')}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;