-- Add model_year column to exam_questions table
ALTER TABLE public.exam_questions 
ADD COLUMN model_year integer DEFAULT 2024;