import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, FileText, Filter, Download, X } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { generateInvoicePdf } from "@/lib/generateInvoicePdf";
import { useToast } from "@/hooks/use-toast";

export default function Invoices() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invoices] = useState<Invoice[]>(mockInvoices);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());

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


  const toggleInvoiceSelection = (invoiceId: string) => {
    setSelectedInvoices((prev) => {
      const next = new Set(prev);
      if (next.has(invoiceId)) {
        next.delete(invoiceId);
      } else {
        next.add(invoiceId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedInvoices.size === filteredInvoices.length) {
      setSelectedInvoices(new Set());
    } else {
      setSelectedInvoices(new Set(filteredInvoices.map((inv) => inv.id)));
    }
  };

  const handleBatchExport = () => {
    const invoicesToExport = invoices.filter((inv) => selectedInvoices.has(inv.id));
    invoicesToExport.forEach((invoice) => {
      const company = mockCompanies.find((c) => c.id === invoice.companyId);
      generateInvoicePdf(invoice, company);
    });
    toast({
      title: "PDFs exported",
      description: `${invoicesToExport.length} invoice${invoicesToExport.length > 1 ? "s" : ""} downloaded.`,
    });
    setSelectedInvoices(new Set());
  };

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

        {/* Batch Actions Bar */}
        {selectedInvoices.size > 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">
                {selectedInvoices.size} invoice{selectedInvoices.size > 1 ? "s" : ""} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedInvoices(new Set())}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
            <Button onClick={handleBatchExport} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export {selectedInvoices.size} PDF{selectedInvoices.size > 1 ? "s" : ""}
            </Button>
          </div>
        )}

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
            <div className="col-span-1 flex items-center">
              <Checkbox
                checked={filteredInvoices.length > 0 && selectedInvoices.size === filteredInvoices.length}
                onCheckedChange={toggleSelectAll}
                aria-label="Select all"
              />
            </div>
            <div className="col-span-2">Invoice #</div>
            <div className="col-span-2">Company</div>
            <div className="col-span-2">Client</div>
            <div className="col-span-1">Date</div>
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
                  className={cn(
                    "p-4 hover:bg-muted/30 transition-colors cursor-pointer",
                    selectedInvoices.has(invoice.id) && "bg-primary/5"
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                >
                  {/* Desktop View */}
                  <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
                    <div className="col-span-1 flex items-center">
                      <Checkbox
                        checked={selectedInvoices.has(invoice.id)}
                        onCheckedChange={() => toggleInvoiceSelection(invoice.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select ${invoice.invoiceNumber}`}
                      />
                    </div>
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
                    <div className="col-span-1 text-muted-foreground">
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
