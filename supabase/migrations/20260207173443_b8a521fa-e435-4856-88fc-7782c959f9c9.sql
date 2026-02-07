-- Add qty and unit_price columns to invoice_items table
ALTER TABLE public.invoice_items 
ADD COLUMN qty integer NOT NULL DEFAULT 1,
ADD COLUMN unit_price numeric NOT NULL DEFAULT 0;

-- Update existing items: set unit_price = amount (assuming qty was 1)
UPDATE public.invoice_items SET unit_price = amount WHERE unit_price = 0;