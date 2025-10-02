-- Create categories table for lecture categories
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories
CREATE POLICY "Anyone can view categories" 
ON public.categories 
FOR SELECT 
USING (true);

CREATE POLICY "Admins and instructors can manage categories" 
ON public.categories 
FOR ALL 
USING (auth.uid() IN ( SELECT profiles.user_id
   FROM profiles
  WHERE (profiles.role = ANY (ARRAY['admin'::text, 'instructor'::text]))));

-- Add category_id to lectures table
ALTER TABLE public.lectures 
ADD COLUMN category_id UUID REFERENCES public.categories(id);

-- Insert default categories based on existing chapter titles
INSERT INTO public.categories (name, description) VALUES 
('Introduction to React', 'Learn the fundamentals of React development'),
('Technical Analysis', 'Master the art of technical analysis in trading')
ON CONFLICT (name) DO NOTHING;

-- Update lectures to use categories based on chapter_title
UPDATE public.lectures 
SET category_id = (
  SELECT id FROM public.categories 
  WHERE name = lectures.chapter_title
)
WHERE chapter_title IN ('Introduction to React', 'Technical Analysis');

-- Create trigger for automatic timestamp updates on categories
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();