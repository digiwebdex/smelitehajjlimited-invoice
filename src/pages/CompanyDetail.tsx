import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, DollarSign, FileText, TrendingUp } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/StatCard";
import { mockCompanies, mockInvoices } from "@/data/mockData";
import { cn } from "@/lib/utils";

export default function CompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const company = mockCompanies.find((c) => c.id === id);
  const companyInvoices = mockInvoices.filter((inv) => inv.companyId === id);

  if (!company) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-foreground">
            Company not found
          </h2>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/companies")}
          >
            Back to Companies
          </Button>
        </div>
      </AppLayout>
    );
  }

  const totalRevenue = companyInvoices.reduce(
    (sum, inv) => sum + inv.paidAmount,
    0
  );
  const totalDue = companyInvoices.reduce((sum, inv) => sum + inv.dueAmount, 0);
  const totalInvoices = companyInvoices.length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      paid: "status-paid",
      partial: "status-partial",
      unpaid: "status-unpaid",
    };
    return (
      <span
        className={cn(
          "px-2.5 py-0.5 text-xs font-medium rounded-full capitalize",
          styles[status as keyof typeof styles]
        )}
      >
        {status}
      </span>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10">
              <Building2 className="h-7 w-7 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {company.name}
              </h1>
              <p className="text-muted-foreground">Income Statement</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            subtitle="From this company"
            icon={<DollarSign className="h-6 w-6" />}
            variant="revenue"
          />
          <StatCard
            title="Outstanding"
            value={formatCurrency(totalDue)}
            subtitle="Pending payments"
            icon={<TrendingUp className="h-6 w-6" />}
            variant="due"
          />
          <StatCard
            title="Invoices"
            value={totalInvoices}
            subtitle="Total created"
            icon={<FileText className="h-6 w-6" />}
            variant="invoices"
          />
        </div>

        {/* Invoice List */}
        <div className="card-elevated">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">
              Invoice History
            </h2>
          </div>
          <div className="divide-y divide-border">
            {companyInvoices.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  No invoices for this company yet.
                </p>
              </div>
            ) : (
              companyInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {invoice.invoiceNumber}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {invoice.clientName} • {formatDate(invoice.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:ml-auto">
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {formatCurrency(invoice.totalAmount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Paid: {formatCurrency(invoice.paidAmount)}
                      </p>
                    </div>
                    {getStatusBadge(invoice.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
