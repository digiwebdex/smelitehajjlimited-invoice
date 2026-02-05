import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Pencil, Printer, Share2, Copy, Mail, MessageCircle, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useInvoice } from "@/hooks/useInvoices";
import { useCompany } from "@/hooks/useCompanies";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { InvoiceQRCode } from "@/components/InvoiceQRCode";

export default function InvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: invoice, isLoading: invoiceLoading } = useInvoice(id);
  const { data: company, isLoading: companyLoading } = useCompany(invoice?.company_id);

  const isLoading = invoiceLoading || companyLoading;

  const formatCurrency = (amount: number) => {
    return `৳${new Intl.NumberFormat("en-BD", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)}`;
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
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
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!invoice) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-foreground">
            Invoice not found
          </h2>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/invoices")}
          >
            Back to Invoices
          </Button>
        </div>
      </AppLayout>
    );
  }

  const items = invoice.items || [];
  const installments = invoice.installments || [];

  return (
    <AppLayout>
      <div className="min-h-screen print:bg-white print:min-h-0">
        {/* Action Bar - Hidden on Print */}
        <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/invoices")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {invoice.invoice_number}
              </h1>
              <p className="text-muted-foreground">Invoice Preview</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {getStatusBadge(invoice.status)}
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                     const url = `${window.location.origin}/view/${id}`;
                    navigator.clipboard.writeText(url);
                    toast({
                      title: "Link copied",
                      description: "Invoice link copied to clipboard.",
                    });
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                     const url = `${window.location.origin}/view/${id}`;
                    const message = encodeURIComponent(
                      `Invoice ${invoice.invoice_number} - ${invoice.client_name}\nTotal: ৳${invoice.total_amount}\nDue: ৳${invoice.due_amount}\n\nView: ${url}`
                    );
                    window.open(`https://wa.me/?text=${message}`, "_blank");
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Share via WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                     const url = `${window.location.origin}/view/${id}`;
                    const subject = encodeURIComponent(`Invoice ${invoice.invoice_number}`);
                    const body = encodeURIComponent(
                       `Dear ${invoice.client_name},\n\nPlease find the invoice details below:\n\nInvoice #: ${invoice.invoice_number}\nTotal Amount: ৳${invoice.total_amount}\nPaid: ৳${invoice.paid_amount}\nDue: ৳${invoice.due_amount}\n\nView Invoice: ${url}\n\nThank you for your business!`
                    );
                    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
                  }}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Share via Email
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              onClick={() => navigate(`/invoices/${id}/edit`)}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        {/* Invoice Document */}
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl p-8 print:shadow-none print:p-0 print:rounded-none">
          {/* HEADER */}
          <div className="flex justify-between items-start border-b border-gray-200 pb-6">
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
                  <p className="text-sm text-muted-foreground italic">
                    {company.tagline}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  {company?.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  {company?.phone}
                </p>
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold text-primary">INVOICE</h1>
              <p className="text-accent font-semibold text-lg mt-1">
                {invoice.invoice_number}
              </p>
              <div className="mt-2">{getStatusBadge(invoice.status)}</div>
            </div>
          </div>

          {/* BILL TO + DATES */}
          <div className="flex justify-between mt-8">
            <div>
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
            <div className="text-right text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Invoice Date:</span>{" "}
                <span className="font-medium">{formatDate(invoice.invoice_date)}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Due Date:</span>{" "}
                <span className="font-medium">
                  {formatDate(invoice.due_date)}
                </span>
              </p>
            </div>
          </div>

          {/* ITEM TABLE */}
          <div className="mt-10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 text-muted-foreground font-semibold uppercase tracking-wide">
                    #
                  </th>
                  <th className="text-left py-3 text-muted-foreground font-semibold uppercase tracking-wide">
                    Description
                  </th>
                  <th className="text-right py-3 text-muted-foreground font-semibold uppercase tracking-wide">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-4 text-muted-foreground">{i + 1}</td>
                    <td className="py-4 font-medium text-foreground">
                      {item.title || "—"}
                    </td>
                    <td className="py-4 text-right font-semibold text-foreground">
                      {formatCurrency(Number(item.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SUMMARY */}
          <div className="flex justify-end mt-8">
            <div className="w-72 text-sm space-y-3">
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">
                  {formatCurrency(Number(invoice.subtotal) || 0)}
                </span>
              </div>
              {Number(invoice.vat_rate) > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">
                    VAT ({invoice.vat_rate}%)
                  </span>
                  <span className="font-medium">
                    {formatCurrency(Number(invoice.vat_amount) || 0)}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t border-gray-200 font-bold text-base">
                <span>Total</span>
                <span>{formatCurrency(Number(invoice.total_amount))}</span>
              </div>
              <div className="flex justify-between py-2 text-green-600 font-semibold">
                <span>Total Paid</span>
                <span>{formatCurrency(Number(invoice.paid_amount))}</span>
              </div>
              <div
                className={cn(
                  "flex justify-between px-4 py-3 rounded-lg font-bold",
                  Number(invoice.due_amount) > 0
                    ? "bg-red-600 text-white"
                    : "bg-green-600 text-white"
                )}
              >
                <span>{Number(invoice.due_amount) > 0 ? "Balance Due" : "Paid in Full"}</span>
                <span>{formatCurrency(Number(invoice.due_amount))}</span>
              </div>
            </div>
          </div>

          {/* PAYMENT HISTORY */}
          {installments.length > 0 && (
            <div className="mt-10 border border-gray-200 rounded-lg p-6 bg-gray-50 print:bg-gray-50">
              <h4 className="font-semibold text-foreground mb-4 uppercase tracking-wide text-sm">
                Payment History
              </h4>
              <div className="space-y-2">
                {installments.map((pay, i) => (
                  <div
                    key={pay.id}
                    className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{i + 1}
                      </span>
                      <span className="text-sm text-foreground">
                        {formatDate(pay.paid_date)}
                      </span>
                    </div>
                    <div className="text-green-600 font-semibold">
                      {formatCurrency(Number(pay.amount))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FOOTER */}
          <div className="flex justify-between items-start mt-12 pt-6 border-t border-gray-200">
            <div>
              <p className="text-sm text-muted-foreground">
                Thank you for your business!
              </p>
              {company?.address && (
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  {company.address}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Generated on {formatDate(new Date().toISOString())}
              </p>
            </div>
            <InvoiceQRCode invoiceId={invoice.id} size={70} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
