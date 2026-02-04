import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  DollarSign,
  CheckCircle,
  Download,
  Pencil,
  Calendar,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Printer,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { mockInvoices, mockCompanies } from "@/data/mockData";
import { InvoiceStatus } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { generateInvoicePdf } from "@/lib/generateInvoicePdf";

export default function InvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const invoice = mockInvoices.find((inv) => inv.id === id);
  const company = invoice ? mockCompanies.find((c) => c.id === invoice.companyId) : null;

  const formatCurrency = (amount: number) => {
    return `৳${new Intl.NumberFormat("en-BD", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)}`;
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    const styles = {
      paid: "status-paid",
      partial: "status-partial",
      unpaid: "status-unpaid",
    };
    return (
      <span
        className={cn(
          "px-3 py-1 text-sm font-medium rounded-full capitalize",
          styles[status]
        )}
      >
        {status}
      </span>
    );
  };

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

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
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
                {invoice.invoiceNumber}
              </h1>
              <p className="text-muted-foreground">Invoice Preview</p>
            </div>
          </div>
          <div className="flex items-center gap-3 print:hidden">
            {getStatusBadge(invoice.status)}
            <Button
              variant="outline"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                generateInvoicePdf(invoice, company);
                toast({
                  title: "PDF exported",
                  description: `${invoice.invoiceNumber}.pdf has been downloaded.`,
                });
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button
              onClick={() => navigate(`/invoices/${id}/edit`)}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice & Company Details */}
            <div className="card-elevated p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <FileText className="h-5 w-5 text-accent" />
                    Invoice Details
                  </h2>
                </div>
                {company?.logo && (
                  <img
                    src={company.logo}
                    alt={company.name}
                    className="h-12 w-12 object-contain rounded-lg"
                  />
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Invoice Number</p>
                  <p className="font-medium text-foreground">{invoice.invoiceNumber}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" /> Company
                  </p>
                  <p className="font-medium text-foreground">{company?.name || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Invoice Date
                  </p>
                  <p className="font-medium text-foreground">{formatDate(invoice.date)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Due Date
                  </p>
                  <p className="font-medium text-foreground">{formatDate(invoice.dueDate)}</p>
                </div>
              </div>

              {/* Client Information */}
              <div className="pt-4 border-t border-border">
                <h3 className="text-md font-medium text-foreground mb-4 flex items-center gap-2">
                  <User className="h-4 w-4 text-accent" />
                  Client Information
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Client Name</p>
                    <p className="font-medium text-foreground">{invoice.clientName}</p>
                  </div>
                  {invoice.clientEmail && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" /> Email
                      </p>
                      <p className="font-medium text-foreground">{invoice.clientEmail}</p>
                    </div>
                  )}
                  {invoice.clientPhone && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" /> Phone
                      </p>
                      <p className="font-medium text-foreground">{invoice.clientPhone}</p>
                    </div>
                  )}
                  {invoice.clientAddress && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> Address
                      </p>
                      <p className="font-medium text-foreground">{invoice.clientAddress}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="card-elevated p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-accent" />
                Line Items
              </h2>
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-3 grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
                  <div className="col-span-1">#</div>
                  <div className="col-span-8">Description</div>
                  <div className="col-span-3 text-right">Amount</div>
                </div>
                <div className="divide-y divide-border">
                  {invoice.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="px-4 py-3 grid grid-cols-12 gap-4 items-center"
                    >
                      <div className="col-span-1 text-sm text-muted-foreground">
                        {index + 1}
                      </div>
                      <div className="col-span-8 font-medium text-foreground">
                        {item.title || "—"}
                      </div>
                      <div className="col-span-3 text-right font-medium text-foreground">
                        {formatCurrency(item.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Payment History */}
            <div className="card-elevated p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-accent" />
                Payment History
              </h2>
              {invoice.installments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No payments recorded yet.
                </p>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 px-4 py-3 grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
                    <div className="col-span-2">#</div>
                    <div className="col-span-5">Date</div>
                    <div className="col-span-5 text-right">Amount</div>
                  </div>
                  <div className="divide-y divide-border">
                    {invoice.installments.map((inst, index) => (
                      <div
                        key={inst.id}
                        className="px-4 py-3 grid grid-cols-12 gap-4 items-center bg-success/5"
                      >
                        <div className="col-span-2 text-sm text-success font-medium">
                          #{index + 1}
                        </div>
                        <div className="col-span-5 text-foreground">
                          {formatDate(inst.paidDate)}
                        </div>
                        <div className="col-span-5 text-right font-medium text-success">
                          {formatCurrency(inst.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="card-elevated p-6 sticky top-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Summary</h2>

              <div className="space-y-3">
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">
                    {formatCurrency(invoice.subtotal || 0)}
                  </span>
                </div>
                {(invoice.vatRate || 0) > 0 && (
                  <div className="flex justify-between py-2 border-t border-border">
                    <span className="text-muted-foreground">VAT ({invoice.vatRate}%)</span>
                    <span className="font-medium">
                      {formatCurrency(invoice.vatAmount || 0)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-t border-border">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-medium">
                    {formatCurrency(invoice.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-t border-border">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="font-medium text-success">
                    {formatCurrency(invoice.paidAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-t-2 border-foreground/10">
                  <span className="font-semibold text-foreground">Amount Due</span>
                  <span className="text-2xl font-bold text-destructive">
                    {formatCurrency(invoice.dueAmount)}
                  </span>
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-2">{getStatusBadge(invoice.status)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
