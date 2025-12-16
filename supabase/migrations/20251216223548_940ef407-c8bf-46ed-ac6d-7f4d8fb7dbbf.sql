-- Create exam levels table
CREATE TABLE public.exam_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level_number INTEGER NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exam subjects table
CREATE TABLE public.exam_subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id UUID NOT NULL REFERENCES public.exam_levels(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exam questions table for future use
CREATE TABLE public.exam_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES public.exam_subjects(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer INTEGER NOT NULL,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exam_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Anyone can view exam levels" ON public.exam_levels FOR SELECT USING (true);
CREATE POLICY "Anyone can view exam subjects" ON public.exam_subjects FOR SELECT USING (true);
CREATE POLICY "Anyone can view exam questions" ON public.exam_questions FOR SELECT USING (true);

-- Insert the 4 levels
INSERT INTO public.exam_levels (level_number, name_ar, name_en) VALUES
(1, 'المستوى الأول', 'Level One'),
(2, 'المستوى الثاني', 'Level Two'),
(3, 'المستوى الثالث', 'Level Three'),
(4, 'المستوى الرابع', 'Level Four');