ALTER TABLE public.global_brand_settings 
ADD COLUMN signature_received_by TEXT DEFAULT NULL,
ADD COLUMN signature_prepared_by TEXT DEFAULT NULL,
ADD COLUMN signature_authorize_by TEXT DEFAULT NULL;