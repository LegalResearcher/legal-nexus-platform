-- Create table for page visits tracking
CREATE TABLE public.page_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_name TEXT NOT NULL UNIQUE,
  visits_count BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read visit counts (public statistics)
CREATE POLICY "Anyone can view visit counts" 
ON public.page_visits 
FOR SELECT 
USING (true);

-- Create function to increment visit count
CREATE OR REPLACE FUNCTION public.increment_visit_count(page_key TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.page_visits (page_name, visits_count)
  VALUES (page_key, 1)
  ON CONFLICT (page_name) 
  DO UPDATE SET 
    visits_count = page_visits.visits_count + 1,
    updated_at = now();
END;
$$;

-- Insert initial record for the main page
INSERT INTO public.page_visits (page_name, visits_count)
VALUES ('الرئيسية', 15420);