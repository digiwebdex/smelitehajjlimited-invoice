-- Create theme_settings table for customizable invoice colors
CREATE TABLE public.theme_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  primary_color TEXT NOT NULL DEFAULT '#1e3a8a',
  secondary_color TEXT NOT NULL DEFAULT '#f3f4f6',
  accent_color TEXT NOT NULL DEFAULT '#0f766e',
  header_text_color TEXT NOT NULL DEFAULT '#1e3a8a',
  invoice_title_color TEXT NOT NULL DEFAULT '#1e3a8a',
  subtotal_text_color TEXT NOT NULL DEFAULT '#374151',
  paid_text_color TEXT NOT NULL DEFAULT '#15803d',
  balance_bg_color TEXT NOT NULL DEFAULT '#166534',
  balance_text_color TEXT NOT NULL DEFAULT '#ffffff',
  table_header_bg TEXT NOT NULL DEFAULT '#f9fafb',
  table_header_text TEXT NOT NULL DEFAULT '#374151',
  border_color TEXT NOT NULL DEFAULT '#e5e7eb',
  badge_paid_color TEXT NOT NULL DEFAULT '#16a34a',
  badge_partial_color TEXT NOT NULL DEFAULT '#f59e0b',
  badge_unpaid_color TEXT NOT NULL DEFAULT '#dc2626',
  footer_text_color TEXT NOT NULL DEFAULT '#6b7280',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (all users can view theme)
CREATE POLICY "Anyone can view theme settings"
ON public.theme_settings
FOR SELECT
USING (true);

-- Only admins can update theme
CREATE POLICY "Admins can update theme settings"
ON public.theme_settings
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert theme
CREATE POLICY "Admins can insert theme settings"
ON public.theme_settings
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete theme
CREATE POLICY "Admins can delete theme settings"
ON public.theme_settings
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_theme_settings_updated_at
BEFORE UPDATE ON public.theme_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default theme (only one row should exist)
INSERT INTO public.theme_settings (id) VALUES ('00000000-0000-0000-0000-000000000001');