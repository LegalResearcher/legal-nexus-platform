-- Create content categories table
CREATE TABLE public.content_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    type TEXT NOT NULL CHECK (type IN ('laws', 'books', 'templates')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create laws table
CREATE TABLE public.legal_laws (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.content_categories(id) ON DELETE SET NULL,
    file_url TEXT,
    source_type TEXT NOT NULL DEFAULT 'upload' CHECK (source_type IN ('upload', 'link')),
    file_type TEXT DEFAULT 'pdf' CHECK (file_type IN ('pdf', 'doc', 'docx')),
    is_visible BOOLEAN NOT NULL DEFAULT true,
    allow_download BOOLEAN NOT NULL DEFAULT true,
    total_downloads BIGINT NOT NULL DEFAULT 0,
    total_views BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create books table
CREATE TABLE public.legal_books (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    author TEXT,
    category_id UUID REFERENCES public.content_categories(id) ON DELETE SET NULL,
    file_url TEXT,
    source_type TEXT NOT NULL DEFAULT 'upload' CHECK (source_type IN ('upload', 'link')),
    file_type TEXT DEFAULT 'pdf' CHECK (file_type IN ('pdf', 'doc', 'docx')),
    is_visible BOOLEAN NOT NULL DEFAULT true,
    allow_download BOOLEAN NOT NULL DEFAULT true,
    total_downloads BIGINT NOT NULL DEFAULT 0,
    total_views BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create templates table
CREATE TABLE public.legal_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.content_categories(id) ON DELETE SET NULL,
    file_url TEXT,
    source_type TEXT NOT NULL DEFAULT 'upload' CHECK (source_type IN ('upload', 'link')),
    file_type TEXT DEFAULT 'pdf' CHECK (file_type IN ('pdf', 'doc', 'docx')),
    image_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    allow_download BOOLEAN NOT NULL DEFAULT true,
    total_downloads BIGINT NOT NULL DEFAULT 0,
    total_views BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create site analytics table for real-time tracking
CREATE TABLE public.site_analytics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'file_download', 'file_view')),
    resource_type TEXT CHECK (resource_type IN ('law', 'book', 'template')),
    resource_id UUID,
    page_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create site settings table for Telegram and Legal Consultant URLs
CREATE TABLE public.site_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default site settings
INSERT INTO public.site_settings (setting_key, setting_value) VALUES
    ('telegram_bot_link', ''),
    ('legal_consultant_url', '');

-- Enable RLS on all tables
ALTER TABLE public.content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_laws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_categories
CREATE POLICY "Anyone can view categories" ON public.content_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.content_categories FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for legal_laws
CREATE POLICY "Anyone can view visible laws" ON public.legal_laws FOR SELECT USING (is_visible = true);
CREATE POLICY "Admins can view all laws" ON public.legal_laws FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins and editors can manage laws" ON public.legal_laws FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

-- RLS Policies for legal_books
CREATE POLICY "Anyone can view visible books" ON public.legal_books FOR SELECT USING (is_visible = true);
CREATE POLICY "Admins can view all books" ON public.legal_books FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins and editors can manage books" ON public.legal_books FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

-- RLS Policies for legal_templates
CREATE POLICY "Anyone can view visible templates" ON public.legal_templates FOR SELECT USING (is_visible = true);
CREATE POLICY "Admins can view all templates" ON public.legal_templates FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins and editors can manage templates" ON public.legal_templates FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

-- RLS Policies for site_analytics (anyone can insert for tracking, only admins can view)
CREATE POLICY "Anyone can insert analytics" ON public.site_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view analytics" ON public.site_analytics FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for site_settings
CREATE POLICY "Anyone can view site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage site settings" ON public.site_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger for new tables
CREATE TRIGGER update_content_categories_updated_at BEFORE UPDATE ON public.content_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_legal_laws_updated_at BEFORE UPDATE ON public.legal_laws FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_legal_books_updated_at BEFORE UPDATE ON public.legal_books FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_legal_templates_updated_at BEFORE UPDATE ON public.legal_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to increment download count
CREATE OR REPLACE FUNCTION public.increment_download_count(table_name text, record_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF table_name = 'laws' THEN
        UPDATE public.legal_laws SET total_downloads = total_downloads + 1 WHERE id = record_id;
    ELSIF table_name = 'books' THEN
        UPDATE public.legal_books SET total_downloads = total_downloads + 1 WHERE id = record_id;
    ELSIF table_name = 'templates' THEN
        UPDATE public.legal_templates SET total_downloads = total_downloads + 1 WHERE id = record_id;
    END IF;
    
    -- Also record in analytics
    INSERT INTO public.site_analytics (event_type, resource_type, resource_id)
    VALUES ('file_download', 
            CASE WHEN table_name = 'laws' THEN 'law' 
                 WHEN table_name = 'books' THEN 'book' 
                 ELSE 'template' END, 
            record_id);
END;
$$;

-- Create function to increment view count
CREATE OR REPLACE FUNCTION public.increment_view_count(table_name text, record_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF table_name = 'laws' THEN
        UPDATE public.legal_laws SET total_views = total_views + 1 WHERE id = record_id;
    ELSIF table_name = 'books' THEN
        UPDATE public.legal_books SET total_views = total_views + 1 WHERE id = record_id;
    ELSIF table_name = 'templates' THEN
        UPDATE public.legal_templates SET total_views = total_views + 1 WHERE id = record_id;
    END IF;
    
    -- Also record in analytics
    INSERT INTO public.site_analytics (event_type, resource_type, resource_id)
    VALUES ('file_view', 
            CASE WHEN table_name = 'laws' THEN 'law' 
                 WHEN table_name = 'books' THEN 'book' 
                 ELSE 'template' END, 
            record_id);
END;
$$;

-- Create storage bucket for legal files
INSERT INTO storage.buckets (id, name, public) VALUES ('legal-files', 'legal-files', true);

-- Storage policies for legal-files bucket
CREATE POLICY "Anyone can view legal files" ON storage.objects FOR SELECT USING (bucket_id = 'legal-files');
CREATE POLICY "Admins and editors can upload legal files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'legal-files' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role)));
CREATE POLICY "Admins and editors can update legal files" ON storage.objects FOR UPDATE USING (bucket_id = 'legal-files' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role)));
CREATE POLICY "Admins can delete legal files" ON storage.objects FOR DELETE USING (bucket_id = 'legal-files' AND has_role(auth.uid(), 'admin'::app_role));