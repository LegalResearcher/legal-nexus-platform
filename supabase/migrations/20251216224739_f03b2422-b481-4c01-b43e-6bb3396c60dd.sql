-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'editor');

-- Create update_updated_at_column function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create profiles table for admin users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create exam_settings table for each subject
CREATE TABLE public.exam_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES public.exam_subjects(id) ON DELETE CASCADE NOT NULL UNIQUE,
  default_duration_minutes INTEGER NOT NULL DEFAULT 30,
  questions_count INTEGER NOT NULL DEFAULT 20,
  passing_score INTEGER NOT NULL DEFAULT 60,
  password TEXT,
  preparer_name TEXT,
  allow_time_override BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exam_attempts table to track student attempts
CREATE TABLE public.exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES public.exam_subjects(id) ON DELETE CASCADE NOT NULL,
  student_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  duration_seconds INTEGER,
  answers JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pending_question_deletions for editor deletion requests
CREATE TABLE public.pending_question_deletions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES public.exam_questions(id) ON DELETE CASCADE NOT NULL UNIQUE,
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_question_deletions ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Exam settings policies
CREATE POLICY "Anyone can view exam settings" ON public.exam_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage exam settings" ON public.exam_settings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Exam attempts policies
CREATE POLICY "Anyone can create exam attempts" ON public.exam_attempts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view exam attempts" ON public.exam_attempts
  FOR SELECT USING (true);

-- Pending deletions policies
CREATE POLICY "Admins and editors can view pending deletions" ON public.pending_question_deletions
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'editor')
  );

CREATE POLICY "Editors can request deletions" ON public.pending_question_deletions
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Admins can manage pending deletions" ON public.pending_question_deletions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Exam questions additional policies
CREATE POLICY "Admins and editors can insert questions" ON public.exam_questions
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'editor')
  );

CREATE POLICY "Admins and editors can update questions" ON public.exam_questions
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'editor')
  );

CREATE POLICY "Only admins can delete questions" ON public.exam_questions
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exam_settings_updated_at
  BEFORE UPDATE ON public.exam_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();