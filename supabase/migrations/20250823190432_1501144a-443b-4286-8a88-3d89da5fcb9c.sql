-- Phase 1: Critical Email Privacy Fix
-- Drop the overly broad profile viewing policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create more restrictive policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Phase 2: Fix RLS Recursive Queries with Security Definer Functions
-- Create security definer function to check user role safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Create function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(role_name TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = role_name
  );
$$;

-- Update existing RLS policies to use security definer functions
-- Categories policies
DROP POLICY IF EXISTS "Admins and instructors can manage categories" ON public.categories;
CREATE POLICY "Admins and instructors can manage categories" 
ON public.categories 
FOR ALL 
USING (public.get_current_user_role() IN ('admin', 'instructor'));

-- Courses policies  
DROP POLICY IF EXISTS "Admins and instructors can manage courses" ON public.courses;
CREATE POLICY "Admins and instructors can manage courses" 
ON public.courses 
FOR ALL 
USING (public.get_current_user_role() IN ('admin', 'instructor'));

DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;
CREATE POLICY "Anyone can view published courses" 
ON public.courses 
FOR SELECT 
USING (
  is_published = true OR 
  public.get_current_user_role() IN ('admin', 'instructor')
);

-- Lectures policies
DROP POLICY IF EXISTS "Admins and instructors can manage lectures" ON public.lectures;
CREATE POLICY "Admins and instructors can manage lectures" 
ON public.lectures 
FOR ALL 
USING (public.get_current_user_role() IN ('admin', 'instructor'));

DROP POLICY IF EXISTS "Anyone can view lectures of published courses" ON public.lectures;
CREATE POLICY "Anyone can view lectures of published courses" 
ON public.lectures 
FOR SELECT 
USING (
  course_id IN (
    SELECT id FROM public.courses 
    WHERE is_published = true OR 
          public.get_current_user_role() IN ('admin', 'instructor')
  )
);

-- User progress policies
DROP POLICY IF EXISTS "Admins can view all progress" ON public.user_progress;
CREATE POLICY "Admins can view all progress" 
ON public.user_progress 
FOR SELECT 
USING (public.has_role('admin'));

-- Phase 3: Add audit logging table for security monitoring
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (public.has_role('admin'));

-- Create function to log role changes
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.audit_logs (
      user_id, action, table_name, record_id, 
      old_values, new_values
    ) VALUES (
      auth.uid(), 'role_change', 'profiles', NEW.id,
      jsonb_build_object('role', OLD.role),
      jsonb_build_object('role', NEW.role)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for role change logging
DROP TRIGGER IF EXISTS audit_role_changes ON public.profiles;
CREATE TRIGGER audit_role_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_role_change();