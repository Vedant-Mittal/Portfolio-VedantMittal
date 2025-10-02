import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Course } from '@/hooks/useCourses';

interface CourseEditorProps {
  course: Course | null;
  onSave: () => void;
  onCancel: () => void;
}

export const CourseEditor = ({ course, onSave, onCancel }: CourseEditorProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentTopic, setCurrentTopic] = useState('');
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    description: '',
    instructor_name: '',
    duration: '',
    level: 'Beginner',
    price: '',
    thumbnail_url: '',
    topics: [] as string[],
    is_published: false
  });
  const { toast } = useToast();

  useEffect(() => {
    if (course) {
      setFormData({
        slug: course.slug,
        title: course.title,
        description: course.description || '',
        instructor_name: course.instructor_name,
        duration: course.duration || '',
        level: course.level,
        price: course.price || '',
        thumbnail_url: course.thumbnail_url || '',
        topics: course.topics || [],
        is_published: course.is_published
      });
    }
  }, [course]);

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTopic = () => {
    if (currentTopic.trim() && !formData.topics.includes(currentTopic.trim())) {
      setFormData(prev => ({
        ...prev,
        topics: [...prev.topics, currentTopic.trim()]
      }));
      setCurrentTopic('');
    }
  };

  const removeTopic = (topicToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.filter(topic => topic !== topicToRemove)
    }));
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (title: string) => {
    handleInputChange('title', title);
    if (!course) {
      handleInputChange('slug', generateSlug(title));
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.instructor_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and instructor name are required.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const courseData = {
        slug: formData.slug,
        title: formData.title,
        description: formData.description || null,
        instructor_name: formData.instructor_name,
        duration: formData.duration || null,
        level: formData.level,
        price: formData.price || null,
        thumbnail_url: formData.thumbnail_url || null,
        topics: formData.topics,
        is_published: formData.is_published
      };

      if (course) {
        // Update existing course
        const { error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', course.id);

        if (error) throw error;
        
        toast({
          title: "Course updated",
          description: "Course has been updated successfully.",
        });
      } else {
        // Create new course
        const { error } = await supabase
          .from('courses')
          .insert([courseData]);

        if (error) throw error;
        
        toast({
          title: "Course created",
          description: "New course has been created successfully.",
        });
      }

      onSave();
    } catch (error: any) {
      console.error('Error saving course:', error);
      toast({
        title: "Error saving course",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-primary">
            {course ? 'Edit Course' : 'Create New Course'}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} className="glass-card">
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isLoading}
              className="glass-card bg-primary/90 hover:bg-primary text-primary-foreground"
            >
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? 'Saving...' : 'Save Course'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="glass-card"
                placeholder="Course title"
              />
            </div>

            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                className="glass-card"
                placeholder="course-url-slug"
              />
            </div>

            <div>
              <Label htmlFor="instructor">Instructor Name *</Label>
              <Input
                id="instructor"
                value={formData.instructor_name}
                onChange={(e) => handleInputChange('instructor_name', e.target.value)}
                className="glass-card"
                placeholder="Instructor name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  className="glass-card"
                  placeholder="40+ hours"
                />
              </div>
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className="glass-card"
                  placeholder="$99"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="level">Level</Label>
              <Select value={formData.level} onValueChange={(value) => handleInputChange('level', value)}>
                <SelectTrigger className="glass-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                  <SelectItem value="Beginner to Advanced">Beginner to Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="glass-card min-h-[120px]"
                placeholder="Course description..."
              />
            </div>

            <div>
              <Label htmlFor="thumbnail">Thumbnail URL</Label>
              <Input
                id="thumbnail"
                value={formData.thumbnail_url}
                onChange={(e) => handleInputChange('thumbnail_url', e.target.value)}
                className="glass-card"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <Label>Topics</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={currentTopic}
                  onChange={(e) => setCurrentTopic(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTopic()}
                  className="glass-card flex-1"
                  placeholder="Add a topic"
                />
                <Button type="button" onClick={addTopic} variant="outline" className="glass-card">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.topics.map((topic) => (
                  <Badge key={topic} variant="secondary" className="cursor-pointer" onClick={() => removeTopic(topic)}>
                    {topic} ×
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="published"
                checked={formData.is_published}
                onCheckedChange={(checked) => handleInputChange('is_published', checked)}
              />
              <Label htmlFor="published">Published</Label>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};