import { useParams } from "react-router-dom";
import { Loader2, Printer, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { InvoiceQRCode } from "@/components/InvoiceQRCode";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { generateInvoicePdf } from "@/lib/generateInvoicePdf";
import { Invoice, Company } from "@/types";
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
 
   const isLoading = invoiceLoading || companyLoading;
 
    const formatCurrency = (amount: number) => {
      return `৳${new Intl.NumberFormat("en-BD", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)}`;
    };
 
    const formatDate = (dateString: string | undefined | null) => {
      if (!dateString) return "—";
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };
 
   const getStatusBadge = (status: string) => {
     const styles: Record<string, string> = {
       paid: "bg-green-100 text-green-800",
       partial: "bg-yellow-100 text-yellow-800",
       unpaid: "bg-red-100 text-red-800",
     };
     return (
       <span
         className={cn(
           "px-3 py-1 text-sm font-medium rounded-full capitalize",
           styles[status] || styles.unpaid
         )}
       >
         {status}
       </span>
     );
   };
 
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
 
   const items = invoice.items || [];
   const installments = invoice.installments || [];
 
    return (
      <div className="min-h-screen bg-gray-100 py-8 px-4 print:bg-white print:py-0 print:px-0">
        {/* Action Buttons - Hidden on Print */}
        <div className="max-w-4xl mx-auto mb-6 flex justify-end gap-3 print:hidden">
          <Button
            variant="outline"
            onClick={async () => {
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
                items: items.map(item => ({
                  id: item.id,
                  title: item.title,
                  amount: Number(item.amount),
                })),
                installments: installments.map(inst => ({
                  id: inst.id,
                  amount: Number(inst.amount),
                  paidDate: new Date(inst.paid_date),
                })),
                status: invoice.status as "unpaid" | "partial" | "paid",
                totalAmount: Number(invoice.total_amount),
                vatRate: Number(invoice.vat_rate) || 0,
                vatAmount: Number(invoice.vat_amount) || 0,
                subtotal: Number(invoice.subtotal) || 0,
                paidAmount: Number(invoice.paid_amount),
                dueAmount: Number(invoice.due_amount),
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
              await generateInvoicePdf(pdfInvoice, pdfCompany);
            }}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Download Invoice
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Print Invoice
          </Button>
        </div>
 
        {/* Invoice Document */}
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl p-8 print:shadow-none print:p-0 print:rounded-none">
          {/* HEADER */}
          <div className="flex justify-between items-start pb-6">
            <div className="flex items-center gap-4">
              {company?.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold">
                  {company?.name?.charAt(0) || "C"}
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-primary">
                  {company?.name || "Company Name"}
                </h2>
                {company?.tagline && (
                  <p className="text-sm text-primary/70 italic">
                    {company.tagline}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold text-primary">INVOICE</h1>
              <p className="text-orange-500 font-semibold text-lg mt-1">
                {invoice.invoice_number}
              </p>
              <div className="mt-2">
                {getStatusBadge(invoice.status)}
              </div>
            </div>
          </div>

          {/* BILL TO + DATES */}
          <div className="flex justify-between mt-6 pt-6 border-t border-gray-200">
            <div className="border-l-4 border-accent pl-4">
              <p className="text-muted-foreground text-sm uppercase tracking-wide mb-2">
                Bill To
              </p>
              <h3 className="font-bold text-lg text-foreground">
                {invoice.client_name}
              </h3>
              {invoice.client_email && (
                <p className="text-sm text-muted-foreground">
                  {invoice.client_email}
                </p>
              )}
              {invoice.client_phone && (
                <p className="text-sm text-muted-foreground">
                  {invoice.client_phone}
                </p>
              )}
              {invoice.client_address && (
                <p className="text-sm text-muted-foreground">
                  {invoice.client_address}
                </p>
              )}
            </div>
            <div className="text-right text-sm">
              <p>
                <span className="text-muted-foreground font-medium">INVOICE DATE :</span>{" "}
                <span className="font-semibold text-foreground">{formatDate(invoice.invoice_date)}</span>
              </p>
            </div>
          </div>

          {/* ITEM TABLE */}
          <div className="mt-10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 text-muted-foreground font-semibold uppercase tracking-wide">
                    Description
                  </th>
                  <th className="text-center py-3 text-muted-foreground font-semibold uppercase tracking-wide w-20">
                    Qty
                  </th>
                  <th className="text-right py-3 text-muted-foreground font-semibold uppercase tracking-wide">
                    Unit Price
                  </th>
                  <th className="text-right py-3 text-muted-foreground font-semibold uppercase tracking-wide">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-200">
                    <td className="py-4 font-medium text-black">
                      {item.title || "—"}
                    </td>
                    <td className="py-4 text-center text-black">1</td>
                    <td className="py-4 text-right text-black">
                      {formatCurrency(Number(item.amount))}
                    </td>
                    <td className="py-4 text-right font-semibold text-black">
                      {formatCurrency(Number(item.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SUMMARY */}
          <div className="flex justify-end mt-8">
            <div className="w-80 text-sm">
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-muted-foreground font-medium">Subtotal</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(Number(invoice.subtotal) || 0)}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-muted-foreground font-medium">Tax</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(Number(invoice.vat_amount) || 0)}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-foreground font-bold">Total</span>
                <span className="font-bold text-foreground">
                  {formatCurrency(Number(invoice.total_amount))}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-orange-500 font-bold">Total Paid</span>
                <span className="font-bold text-orange-500">
                  {formatCurrency(Number(invoice.paid_amount))}
                </span>
              </div>
              <div
                className={cn(
                  "flex justify-between px-4 py-3 mt-2 font-bold",
                  Number(invoice.due_amount) > 0
                    ? "bg-red-500 text-white"
                    : "bg-green-500 text-white"
                )}
              >
                <span>{Number(invoice.due_amount) > 0 ? "Balance" : "Paid in Full"}</span>
                <span>{formatCurrency(Number(invoice.due_amount))}</span>
              </div>
            </div>
          </div>

          {/* PAYMENT HISTORY */}
          {installments.length > 0 && (
            <div className="mt-10 border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-foreground mb-4 uppercase tracking-wide text-sm">
                Payment History
              </h4>
              <div className="space-y-3">
                {installments.map((pay, i) => (
                  <div
                    key={pay.id}
                    className="flex justify-between items-center border-l-4 border-gray-300 pl-4 py-2"
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-medium text-foreground">
                        {formatDate(pay.paid_date)}
                      </span>
                      <span className="px-2 py-1 bg-gray-400 text-white text-xs rounded font-medium">
                        Bank Transfer
                      </span>
                      <span className="px-2 py-1 bg-accent text-accent-foreground text-xs rounded font-medium">
                        Advance
                      </span>
                      <span className="text-muted-foreground text-sm">
                        — Advance Payment
                      </span>
                    </div>
                    <div className="text-accent font-bold text-lg">
                      {formatCurrency(Number(pay.amount))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FOOTER */}
          <div className="flex justify-between items-end mt-12 pt-6 border-t border-gray-200">
            <div>
              <p className="text-sm text-muted-foreground">
                Thank you for staying with us.
              </p>
              {company?.email && (
                <p className="text-xs text-muted-foreground mt-2">
                  {company.email}
                </p>
              )}
              {company?.phone && (
                <p className="text-xs text-muted-foreground">
                  {company.phone}
                </p>
              )}
              {company?.address && (
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  {company.address}
                </p>
              )}
            </div>
            <div className="text-center">
              <InvoiceQRCode invoiceId={invoice.id} size={70} />
              <p className="text-xs text-muted-foreground mt-1">Scan for details</p>
            </div>
          </div>
        </div>
 
       {/* Branding Footer */}
       <div className="max-w-4xl mx-auto mt-6 text-center text-xs text-muted-foreground print:hidden">
         Powered by S M Invoice Software
       </div>
     </div>
   );
 }