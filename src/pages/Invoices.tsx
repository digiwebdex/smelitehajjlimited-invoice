import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, FileText, Filter } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockInvoices, mockCompanies } from "@/data/mockData";
import { Invoice, InvoiceStatus } from "@/types";
import { cn } from "@/lib/utils";

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices] = useState<Invoice[]>(mockInvoices);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || invoice.status === statusFilter;
    const matchesCompany =
      companyFilter === "all" || invoice.companyId === companyFilter;
    return matchesSearch && matchesStatus && matchesCompany;
  });

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

  const getStatusBadge = (status: InvoiceStatus) => {
    const styles = {
      paid: "status-paid",
      partial: "status-partial",
      unpaid: "status-unpaid",
    };
    return (
      <span
        className={cn(
          "px-2.5 py-0.5 text-xs font-medium rounded-full capitalize",
          styles[status]
        )}
      >
        {status}
      </span>
    );
  };

  const getCompanyName = (companyId: string) => {
    return mockCompanies.find((c) => c.id === companyId)?.name || "Unknown";
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Invoices
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and track all your invoices
            </p>
          </div>
          <Button
            onClick={() => navigate("/invoices/new")}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All Companies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {mockCompanies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Invoice List */}
        <div className="card-elevated overflow-hidden">
          {/* Table Header (Desktop) */}
          <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 border-b border-border bg-muted/30 text-sm font-medium text-muted-foreground">
            <div className="col-span-2">Invoice #</div>
            <div className="col-span-2">Company</div>
            <div className="col-span-2">Client</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-2 text-right">Status</div>
          </div>

          {/* Invoice Rows */}
          <div className="divide-y divide-border">
            {filteredInvoices.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground">
                  No invoices found
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== "all" || companyFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Create your first invoice to get started"}
                </p>
              </div>
            ) : (
              filteredInvoices.map((invoice, index) => (
                <div
                  key={invoice.id}
                  className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                  style={{ animationDelay: `${index * 30}ms` }}
                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                >
                  {/* Desktop View */}
                  <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
                    <div className="col-span-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/5">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">
                          {invoice.invoiceNumber}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-2 text-muted-foreground truncate">
                      {getCompanyName(invoice.companyId)}
                    </div>
                    <div className="col-span-2 text-muted-foreground truncate">
                      {invoice.clientName}
                    </div>
                    <div className="col-span-2 text-muted-foreground">
                      {formatDate(invoice.date)}
                    </div>
                    <div className="col-span-2 text-right">
                      <p className="font-semibold text-foreground">
                        {formatCurrency(invoice.totalAmount)}
                      </p>
                      {invoice.dueAmount > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Due: {formatCurrency(invoice.dueAmount)}
                        </p>
                      )}
                    </div>
                    <div className="col-span-2 text-right">
                      {getStatusBadge(invoice.status)}
                    </div>
                  </div>

                  {/* Mobile View */}
                  <div className="md:hidden space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {invoice.invoiceNumber}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {getCompanyName(invoice.companyId)}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {invoice.clientName} • {formatDate(invoice.date)}
                      </span>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(invoice.totalAmount)}
                      </span>
                    </div>
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
