import { useParams } from "react-router-dom";
import { Loader2, Printer, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";
import { ThemedInvoiceDocument } from "@/components/invoice/ThemedInvoiceDocument";
import { generateInvoicePdf } from "@/lib/generateInvoicePdf";
import { Invoice, Company } from "@/types";
import { defaultTheme } from "@/types/theme";

export default function PublicInvoiceView() {
  const { id } = useParams();

  // Fetch invoice without auth requirement
  const { data: invoice, isLoading: invoiceLoading, error: invoiceError } = useQuery({
    queryKey: ["public-invoice", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          items:invoice_items(*),
          installments(*)
        `)
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch company
  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ["public-company", invoice?.company_id],
    queryFn: async () => {
      if (!invoice?.company_id) return null;
      
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", invoice.company_id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!invoice?.company_id,
  });

  // Fetch theme
  const { data: theme, isLoading: themeLoading } = useTheme();

  const isLoading = invoiceLoading || companyLoading || themeLoading;
  const activeTheme = theme || defaultTheme;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!invoice || invoiceError) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Invoice not found
          </h2>
          <p className="text-muted-foreground">
            This invoice may have been removed or the link is invalid.
          </p>
        </div>
      </div>
    );
  }

  const items = (invoice.items || []).map((item: any) => ({
    id: item.id,
    title: item.title,
    amount: Number(item.amount),
    qty: item.qty || 1,
    unit_price: item.unit_price || Number(item.amount),
  }));

  const installments = (invoice.installments || []).map((inst: any) => ({
    id: inst.id,
    amount: Number(inst.amount),
    paid_date: inst.paid_date,
  }));

  const invoiceData = {
    id: invoice.id,
    invoice_number: invoice.invoice_number,
    client_name: invoice.client_name,
    client_email: invoice.client_email,
    client_phone: invoice.client_phone,
    client_address: invoice.client_address,
    invoice_date: invoice.invoice_date,
    status: invoice.status,
    subtotal: Number(invoice.subtotal) || 0,
    vat_amount: Number(invoice.vat_amount) || 0,
    total_amount: Number(invoice.total_amount),
    paid_amount: Number(invoice.paid_amount),
    due_amount: Number(invoice.due_amount),
    notes: invoice.notes,
  };

  const companyData = company ? {
    name: company.name,
    tagline: company.tagline,
    logo_url: company.logo_url,
    email: company.email,
    phone: company.phone,
    address: company.address,
  } : null;

  const handleDownloadPdf = async () => {
    const pdfInvoice: Invoice = {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      companyId: invoice.company_id,
      clientName: invoice.client_name,
      clientAddress: invoice.client_address || undefined,
      clientEmail: invoice.client_email || undefined,
      clientPhone: invoice.client_phone || undefined,
      date: new Date(invoice.invoice_date),
      dueDate: invoice.due_date ? new Date(invoice.due_date) : undefined,
      items: items.map((item: any) => ({
        id: item.id,
        title: item.title,
        amount: item.amount,
      })),
      installments: installments.map((inst: any) => ({
        id: inst.id,
        amount: inst.amount,
        paidDate: new Date(inst.paid_date),
      })),
      status: invoice.status as "unpaid" | "partial" | "paid",
      totalAmount: Number(invoice.total_amount),
      vatRate: Number(invoice.vat_rate) || 0,
      vatAmount: Number(invoice.vat_amount) || 0,
      subtotal: Number(invoice.subtotal) || 0,
      paidAmount: Number(invoice.paid_amount),
      dueAmount: Number(invoice.due_amount),
      notes: invoice.notes || undefined,
    };
    
    const pdfCompany: Company | undefined = company ? {
      id: company.id,
      name: company.name,
      tagline: company.tagline || undefined,
      logo: company.logo_url || undefined,
      email: company.email || "",
      phone: company.phone || "",
      address: company.address || "",
      createdAt: new Date(company.created_at),
    } : undefined;
    
    await generateInvoicePdf(pdfInvoice, pdfCompany, activeTheme);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 print:bg-white print:py-0 print:px-0">
      {/* Action Buttons - Hidden on Print */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-end gap-3 print:hidden">
        <Button variant="outline" onClick={handleDownloadPdf}>
          <FileDown className="h-4 w-4 mr-2" />
          Download Invoice
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          Print Invoice
        </Button>
      </div>

      {/* Invoice Document */}
      <div className="max-w-4xl mx-auto">
        <ThemedInvoiceDocument
          invoice={invoiceData}
          items={items}
          installments={installments}
          company={companyData}
          theme={activeTheme}
        />
      </div>

      {/* Branding Footer */}
      <div className="max-w-4xl mx-auto mt-6 text-center text-xs text-muted-foreground print:hidden">
        Powered by S M Invoice Software
      </div>
    </div>
  );
}
