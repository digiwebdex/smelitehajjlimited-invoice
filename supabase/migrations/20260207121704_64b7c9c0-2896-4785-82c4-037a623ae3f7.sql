-- Add notes column to invoices table for additional client information or payment terms
ALTER TABLE public.invoices 
ADD COLUMN notes text;