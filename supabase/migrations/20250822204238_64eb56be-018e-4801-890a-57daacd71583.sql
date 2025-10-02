-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('admin', 'instructor', 'student')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  instructor_name TEXT NOT NULL,
  duration TEXT,
  level TEXT DEFAULT 'Beginner' CHECK (level IN ('Beginner', 'Intermediate', 'Advanced', 'Beginner to Advanced')),
  price TEXT,
  thumbnail_url TEXT,
  topics TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lectures table
CREATE TABLE public.lectures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  chapter_title TEXT NOT NULL,
  title TEXT NOT NULL,
  duration TEXT NOT NULL,
  youtube_video_id TEXT NOT NULL,
  notes_file_path TEXT,
  order_index INTEGER NOT NULL,
  chapter_order INTEGER NOT NULL,
  resources JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user progress table
CREATE TABLE public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lecture_id UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, lecture_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for courses
CREATE POLICY "Anyone can view published courses" ON public.courses FOR SELECT USING (is_published = true OR auth.uid() IN (SELECT user_id FROM public.profiles WHERE role IN ('admin', 'instructor')));
CREATE POLICY "Admins and instructors can manage courses" ON public.courses FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE role IN ('admin', 'instructor')));

-- Create RLS policies for lectures
CREATE POLICY "Anyone can view lectures of published courses" ON public.lectures FOR SELECT USING (course_id IN (SELECT id FROM public.courses WHERE is_published = true OR auth.uid() IN (SELECT user_id FROM public.profiles WHERE role IN ('admin', 'instructor'))));
CREATE POLICY "Admins and instructors can manage lectures" ON public.lectures FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE role IN ('admin', 'instructor')));

-- Create RLS policies for user progress
CREATE POLICY "Users can view their own progress" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own progress" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all progress" ON public.user_progress FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE role = 'admin'));

-- Create storage bucket for course materials
INSERT INTO storage.buckets (id, name, public) VALUES ('course-materials', 'course-materials', true);

-- Create storage policies
CREATE POLICY "Anyone can view course materials" ON storage.objects FOR SELECT USING (bucket_id = 'course-materials');
CREATE POLICY "Admins and instructors can upload course materials" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'course-materials' AND auth.uid() IN (SELECT user_id FROM public.profiles WHERE role IN ('admin', 'instructor')));
CREATE POLICY "Admins and instructors can update course materials" ON storage.objects FOR UPDATE USING (bucket_id = 'course-materials' AND auth.uid() IN (SELECT user_id FROM public.profiles WHERE role IN ('admin', 'instructor')));
CREATE POLICY "Admins and instructors can delete course materials" ON storage.objects FOR DELETE USING (bucket_id = 'course-materials' AND auth.uid() IN (SELECT user_id FROM public.profiles WHERE role IN ('admin', 'instructor')));

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lectures_updated_at BEFORE UPDATE ON public.lectures FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample admin user (you'll need to sign up with this email first)
-- INSERT INTO public.profiles (user_id, display_name, email, role) 
-- VALUES ('00000000-0000-0000-0000-000000000000', 'Admin User', 'admin@example.com', 'admin');

-- Insert sample course data
INSERT INTO public.courses (slug, title, description, instructor_name, duration, level, price, thumbnail_url, topics, is_published) VALUES 
('react-mastery', 'Complete React Mastery: From Zero to Production', 'Master React.js with this comprehensive course covering everything from basics to advanced patterns, state management, testing, and deployment strategies.', 'Vedant Mittal', '40+ hours', 'Beginner to Advanced', '$99', 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=600&fit=crop', ARRAY['React Hooks', 'Context API', 'Redux Toolkit', 'Testing', 'Performance', 'Deployment'], true);

-- Get the course ID for inserting lectures
INSERT INTO public.lectures (course_id, chapter_title, title, duration, youtube_video_id, order_index, chapter_order, resources) 
SELECT id, 'Introduction to React', 'What is React?', '8:45', 'dQw4w9WgXcQ', 1, 1, '[{"title": "React Official Docs", "url": "https://react.dev"}, {"title": "Create React App", "url": "https://create-react-app.dev"}]'::jsonb
FROM public.courses WHERE slug = 'react-mastery';

INSERT INTO public.lectures (course_id, chapter_title, title, duration, youtube_video_id, order_index, chapter_order, resources) 
SELECT id, 'Introduction to React', 'Setting Up Development Environment', '12:30', 'dQw4w9WgXcQ', 2, 1, '[{"title": "VS Code", "url": "https://code.visualstudio.com"}, {"title": "Node.js", "url": "https://nodejs.org"}]'::jsonb
FROM public.courses WHERE slug = 'react-mastery';

INSERT INTO public.lectures (course_id, chapter_title, title, duration, youtube_video_id, order_index, chapter_order, resources) 
SELECT id, 'Introduction to React', 'Your First React Component', '15:20', 'dQw4w9WgXcQ', 3, 1, '[{"title": "JSX Documentation", "url": "https://react.dev/learn/writing-markup-with-jsx"}]'::jsonb
FROM public.courses WHERE slug = 'react-mastery';