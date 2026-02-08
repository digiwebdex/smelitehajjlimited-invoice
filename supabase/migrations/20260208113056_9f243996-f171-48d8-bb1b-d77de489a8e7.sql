-- Create global branding settings table
CREATE TABLE public.global_brand_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL DEFAULT 'S M Elite Hajj Limited',
  company_logo TEXT,
  tagline TEXT DEFAULT 'Excellence in Every Step',
  address_line1 TEXT DEFAULT 'B-25/4, Al-Baraka Super Market, Savar Bazar Bus-Stand, Savar, Dhaka-1340',
  address_line2 TEXT,
  phone TEXT DEFAULT '+8801867666888',
  email TEXT DEFAULT 'info@smelitehajj.com',
  website TEXT DEFAULT 'www.smelitehajj.com',
  thank_you_text TEXT DEFAULT 'Thank you for staying with us.',
  show_qr_code BOOLEAN NOT NULL DEFAULT true,
  footer_alignment TEXT NOT NULL DEFAULT 'center',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.global_brand_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view branding settings (needed for public invoice view)
CREATE POLICY "Anyone can view branding settings"
ON public.global_brand_settings
FOR SELECT
USING (true);

-- Only admins can insert branding settings
CREATE POLICY "Admins can insert branding settings"
ON public.global_brand_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Only admins can update branding settings
CREATE POLICY "Admins can update branding settings"
ON public.global_brand_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Only admins can delete branding settings
CREATE POLICY "Admins can delete branding settings"
ON public.global_brand_settings
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Insert default branding record
INSERT INTO public.global_brand_settings (
  id,
  company_name,
  tagline,
  address_line1,
  phone,
  email,
  website,
  thank_you_text,
  show_qr_code,
  footer_alignment
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'S M Elite Hajj Limited',
  'Excellence in Every Step',
  'B-25/4, Al-Baraka Super Market, Savar Bazar Bus-Stand, Savar, Dhaka-1340',
  '+8801867666888',
  'info@smelitehajj.com',
  'www.smelitehajj.com',
  'Thank you for staying with us.',
  true,
  'center'
);