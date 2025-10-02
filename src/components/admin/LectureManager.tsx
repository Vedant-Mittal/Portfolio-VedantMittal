import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, FileText, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Course, Lecture } from '@/hooks/useCourses';

interface LectureManagerProps {
  course: Course;
  onBack: () => void;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
}

interface LectureFormData {
  chapter_title: string;
  title: string;
  duration: string;
  youtube_video_id: string;
  order_index: number;
  chapter_order: number;
  category_id: string;
  resources: Array<{ title: string; url: string }>;
}

export const LectureManager = ({ course, onBack }: LectureManagerProps) => {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [formData, setFormData] = useState<LectureFormData>({
    chapter_title: '',
    title: '',
    duration: '',
    youtube_video_id: '',
    order_index: 1,
    chapter_order: 1,
    category_id: '',
    resources: []
  });
  const [currentResource, setCurrentResource] = useState({ title: '', url: '' });
  const { toast } = useToast();

  useEffect(() => {
    fetchLectures();
    fetchCategories();
  }, [course.id]);

  const fetchLectures = async () => {
    try {
      const { data, error } = await supabase
        .from('lectures')
        .select('*')
        .eq('course_id', course.id)
        .order('chapter_order', { ascending: true })
        .order('order_index', { ascending: true });

      if (error) throw error;
      setLectures((data || []).map(lecture => ({
        ...lecture,
        chapter_title: lecture.chapter_title || 'Uncategorized',
        resources: Array.isArray(lecture.resources) 
          ? lecture.resources as Array<{ title: string; url: string }>
          : []
      })));
    } catch (error: any) {
      console.error('Error fetching lectures:', error);
      toast({
        title: "Error loading lectures",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error loading categories",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (lecture: Lecture) => {
    setEditingLecture(lecture);
    setFormData({
      chapter_title: lecture.chapter_title || '',
      title: lecture.title,
      duration: lecture.duration,
      youtube_video_id: lecture.youtube_video_id,
      order_index: lecture.order_index,
      chapter_order: lecture.chapter_order,
      category_id: (lecture as any).category_id || '',
      resources: lecture.resources || []
    });
    setIsEditing(true);
  };

  const handleNew = () => {
    setEditingLecture(null);
    const maxOrder = Math.max(...lectures.map(l => l.order_index), 0);
    const maxChapter = Math.max(...lectures.map(l => l.chapter_order), 0);
    
    setFormData({
      chapter_title: '',
      title: '',
      duration: '',
      youtube_video_id: '',
      order_index: maxOrder + 1,
      chapter_order: maxChapter + 1,
      category_id: '',
      resources: []
    });
    setIsEditing(true);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Validation Error",
        description: "Category name is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name: newCategoryName.trim(),
          slug: newCategoryName.trim().toLowerCase().replace(/\s+/g, '-'),
          description: newCategoryDescription.trim() || null
        }])
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data]);
      setNewCategoryName('');
      setNewCategoryDescription('');
      setIsCreatingCategory(false);
      
      toast({
        title: "Category created",
        description: "New category has been created successfully.",
      });
    } catch (error: any) {
      console.error('Error creating category:', error);
      toast({
        title: "Error creating category",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addResource = () => {
    if (currentResource.title.trim() && currentResource.url.trim()) {
      setFormData(prev => ({
        ...prev,
        resources: [...prev.resources, { ...currentResource }]
      }));
      setCurrentResource({ title: '', url: '' });
    }
  };

  const removeResource = (index: number) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.chapter_title.trim() || !formData.youtube_video_id.trim()) {
      toast({
        title: "Validation Error",
        description: "Title, chapter title, and YouTube video ID are required.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const lectureData = {
        course_id: course.id,
        chapter_title: formData.chapter_title,
        title: formData.title,
        duration: formData.duration,
        youtube_video_id: formData.youtube_video_id,
        order_index: formData.order_index,
        chapter_order: formData.chapter_order,
        // category_id: formData.category_id || null, // TODO: Enable when database schema includes category_id field
        resources: formData.resources
      };

      if (editingLecture) {
        // Update existing lecture
        const { error } = await supabase
          .from('lectures')
          .update(lectureData)
          .eq('id', editingLecture.id);

        if (error) throw error;
        
        toast({
          title: "Lecture updated",
          description: "Lecture has been updated successfully.",
        });
      } else {
        // Create new lecture
        const { error } = await supabase
          .from('lectures')
          .insert([lectureData]);

        if (error) throw error;
        
        toast({
          title: "Lecture created",
          description: "New lecture has been created successfully.",
        });
      }

      setIsEditing(false);
      setEditingLecture(null);
      fetchLectures();
    } catch (error: any) {
      console.error('Error saving lecture:', error);
      toast({
        title: "Error saving lecture",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (lecture: Lecture) => {
    if (!confirm('Are you sure you want to delete this lecture?')) return;

    try {
      const { error } = await supabase
        .from('lectures')
        .delete()
        .eq('id', lecture.id);

      if (error) throw error;
      
      toast({
        title: "Lecture deleted",
        description: "Lecture has been deleted successfully.",
      });
      
      fetchLectures();
    } catch (error: any) {
      console.error('Error deleting lecture:', error);
      toast({
        title: "Error deleting lecture",
        description: error.message,
        variant: "destructive",
      });
    }
  };


  // Group lectures by chapter
  const groupedLectures = lectures.reduce((acc, lecture) => {
    const chapter = lecture.chapter_title;
    if (!acc[chapter]) {
      acc[chapter] = [];
    }
    acc[chapter].push(lecture);
    return acc;
  }, {} as Record<string, Lecture[]>);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Courses
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-primary">Manage Lectures</h2>
            <p className="text-muted-foreground">{course.title}</p>
          </div>
        </div>
        
        <Button onClick={handleNew} className="glass-card bg-primary/90 hover:bg-primary text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" />
          Add Lecture
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading lectures...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedLectures).map(([chapterTitle, chapterLectures]) => (
            <Card key={chapterTitle} className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4 text-primary">{chapterTitle}</h3>
              <div className="space-y-3">
                {chapterLectures.map((lecture) => (
                  <motion.div
                    key={lecture.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 glass-card hover:glow-border transition-all duration-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline">{lecture.order_index}</Badge>
                        <h4 className="font-medium">{lecture.title}</h4>
                        <Badge variant="secondary">{lecture.duration}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        YouTube ID: {lecture.youtube_video_id}
                      </p>
                      {lecture.resources && lecture.resources.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {lecture.resources.length} resource(s)
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(lecture)}
                        className="glass-card"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(lecture)}
                        className="glass-card hover:bg-destructive/20"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="glass-card max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingLecture ? 'Edit Lecture' : 'Add New Lecture'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="chapter-title">Chapter Title *</Label>
              <Input
                id="chapter-title"
                value={formData.chapter_title}
                onChange={(e) => setFormData(prev => ({ ...prev, chapter_title: e.target.value }))}
                placeholder="e.g., Introduction, Getting Started"
                className="glass-card"
              />
            </div>

            <div>
              <Label htmlFor="lecture-title">Lecture Title *</Label>
              <Input
                id="lecture-title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="glass-card"
                placeholder="What is React?"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
              >
                <SelectTrigger className="glass-card">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                className="glass-card"
                placeholder="15:30"
              />
            </div>

            <div>
              <Label htmlFor="youtube-id">YouTube Video ID *</Label>
              <Input
                id="youtube-id"
                value={formData.youtube_video_id}
                onChange={(e) => setFormData(prev => ({ ...prev, youtube_video_id: e.target.value }))}
                className="glass-card"
                placeholder="dQw4w9WgXcQ"
              />
            </div>

            <div>
              <Label htmlFor="chapter-order">Chapter Order</Label>
              <Input
                id="chapter-order"
                type="number"
                value={formData.chapter_order}
                onChange={(e) => setFormData(prev => ({ ...prev, chapter_order: parseInt(e.target.value) || 1 }))}
                className="glass-card"
              />
            </div>

            <div>
              <Label htmlFor="order-index">Lecture Order</Label>
              <Input
                id="order-index"
                type="number"
                value={formData.order_index}
                onChange={(e) => setFormData(prev => ({ ...prev, order_index: parseInt(e.target.value) || 1 }))}
                className="glass-card"
              />
            </div>
          </div>

          <div className="mt-4">
            <Label>Resources</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={currentResource.title}
                onChange={(e) => setCurrentResource(prev => ({ ...prev, title: e.target.value }))}
                className="glass-card flex-1"
                placeholder="Resource title"
              />
              <Input
                value={currentResource.url}
                onChange={(e) => setCurrentResource(prev => ({ ...prev, url: e.target.value }))}
                className="glass-card flex-1"
                placeholder="Resource URL"
              />
              <Button type="button" onClick={addResource} variant="outline" className="glass-card">
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {formData.resources.map((resource, index) => (
                <div key={index} className="flex items-start justify-between p-2 glass-card gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium break-words">{resource.title}</span>
                    <span className="block text-sm text-muted-foreground ml-0 break-all">{resource.url}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeResource(index)}
                    className="text-destructive hover:bg-destructive/20"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="glass-card flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={uploading}
              className="glass-card bg-primary/90 hover:bg-primary text-primary-foreground flex-1"
            >
              {uploading ? 'Saving...' : 'Save Lecture'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};