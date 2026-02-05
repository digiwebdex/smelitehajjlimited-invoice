-- Add public SELECT policy for invoices (anyone with the invoice ID can view it)
CREATE POLICY "Public can view invoices by ID"
ON public.invoices
FOR SELECT
TO anon, authenticated
USING (true);

-- Add public SELECT policy for invoice_items (linked to invoices)
CREATE POLICY "Public can view invoice items"
ON public.invoice_items
FOR SELECT
TO anon, authenticated
USING (true);

-- Add public SELECT policy for installments (linked to invoices)
CREATE POLICY "Public can view installments"
ON public.installments
FOR SELECT
TO anon, authenticated
USING (true);

-- Add public SELECT policy for companies (needed to show company info on invoice)
CREATE POLICY "Public can view companies"
ON public.companies
FOR SELECT
TO anon, authenticated
USING (true);