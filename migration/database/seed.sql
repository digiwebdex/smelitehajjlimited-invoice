-- ============================================
-- Seed Data
-- ============================================

-- Insert default theme settings
INSERT INTO public.theme_settings (id, primary_color, secondary_color, accent_color)
VALUES ('00000000-0000-0000-0000-000000000001', '#1e3a8a', '#f3f4f6', '#0f766e')
ON CONFLICT (id) DO NOTHING;

-- Insert default global brand settings
INSERT INTO public.global_brand_settings (id, company_name, tagline, address_line1, phone, email, website, thank_you_text)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'S M Elite Hajj Limited',
  'Excellence in Every Step',
  'B-25/4, Al-Baraka Super Market, Savar Bazar Bus-Stand, Savar, Dhaka-1340',
  '+8801867666888',
  'info@smelitehajj.com',
  'www.smelitehajj.com',
  'Thank you for staying with us.'
)
ON CONFLICT (id) DO NOTHING;

-- NOTE: You must manually export your actual data from the current database
-- using the data export instructions in README_DEPLOYMENT.md
