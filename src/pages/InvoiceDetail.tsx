import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  FileText,
  Calendar,
  DollarSign,
  CheckCircle,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockInvoices, mockCompanies } from "@/data/mockData";
import { Invoice, InvoiceItem, Installment, InvoiceStatus } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = id === "new";

  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const count = mockInvoices.length + 1;
    return `INV-${year}-${count.toString().padStart(3, "0")}`;
  };

  const emptyInvoice: Invoice = {
    id: "",
    invoiceNumber: generateInvoiceNumber(),
    companyId: "",
    clientName: "",
    date: new Date(),
    items: [{ id: "1", title: "", amount: 0 }],
    installments: [],
    status: "unpaid",
    totalAmount: 0,
    paidAmount: 0,
    dueAmount: 0,
  };

  const existingInvoice = mockInvoices.find((inv) => inv.id === id);
  const [invoice, setInvoice] = useState<Invoice>(
    isNew ? emptyInvoice : existingInvoice || emptyInvoice
  );

  // Calculate totals whenever items or installments change
  useEffect(() => {
    const totalAmount = invoice.items.reduce((sum, item) => sum + item.amount, 0);
    const paidAmount = invoice.installments.reduce(
      (sum, inst) => sum + inst.amount,
      0
    );
    const dueAmount = totalAmount - paidAmount;

    let status: InvoiceStatus = "unpaid";
    if (paidAmount >= totalAmount && totalAmount > 0) {
      status = "paid";
    } else if (paidAmount > 0) {
      status = "partial";
    }

    setInvoice((prev) => ({
      ...prev,
      totalAmount,
      paidAmount,
      dueAmount,
      status,
    }));
  }, [invoice.items, invoice.installments]);

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      title: "",
      amount: 0,
    };
    setInvoice({ ...invoice, items: [...invoice.items, newItem] });
  };

  const handleRemoveItem = (itemId: string) => {
    if (invoice.items.length > 1) {
      setInvoice({
        ...invoice,
        items: invoice.items.filter((item) => item.id !== itemId),
      });
    }
  };

  const handleUpdateItem = (
    itemId: string,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    setInvoice({
      ...invoice,
      items: invoice.items.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      ),
    });
  };

  const handleAddInstallment = () => {
    const newInstallment: Installment = {
      id: Date.now().toString(),
      amount: 0,
      paidDate: new Date(),
    };
    setInvoice({
      ...invoice,
      installments: [...invoice.installments, newInstallment],
    });
  };

  const handleRemoveInstallment = (instId: string) => {
    setInvoice({
      ...invoice,
      installments: invoice.installments.filter((inst) => inst.id !== instId),
    });
  };

  const handleUpdateInstallment = (
    instId: string,
    field: keyof Installment,
    value: string | number | Date
  ) => {
    setInvoice({
      ...invoice,
      installments: invoice.installments.map((inst) =>
        inst.id === instId ? { ...inst, [field]: value } : inst
      ),
    });
  };

  const handleSave = () => {
    if (!invoice.companyId || !invoice.clientName) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: isNew ? "Invoice created" : "Invoice updated",
      description: `${invoice.invoiceNumber} has been saved.`,
    });

    navigate("/invoices");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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

  if (!isNew && !existingInvoice) {
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
                {isNew ? "New Invoice" : invoice.invoiceNumber}
              </h1>
              <p className="text-muted-foreground">
                {isNew ? "Create a new invoice" : "Edit invoice details"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(invoice.status)}
            <Button
              onClick={handleSave}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        {/* Invoice Form */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="card-elevated p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent" />
                Invoice Details
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <Input
                    id="invoiceNumber"
                    value={invoice.invoiceNumber}
                    onChange={(e) =>
                      setInvoice({ ...invoice, invoiceNumber: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={
                      invoice.date instanceof Date
                        ? invoice.date.toISOString().split("T")[0]
                        : new Date(invoice.date).toISOString().split("T")[0]
                    }
                    onChange={(e) =>
                      setInvoice({ ...invoice, date: new Date(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company *</Label>
                  <Select
                    value={invoice.companyId}
                    onValueChange={(value) =>
                      setInvoice({ ...invoice, companyId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockCompanies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Input
                    id="clientName"
                    value={invoice.clientName}
                    onChange={(e) =>
                      setInvoice({ ...invoice, clientName: e.target.value })
                    }
                    placeholder="Enter client name"
                  />
                </div>
              </div>
            </div>

            {/* Invoice Items */}
            <div className="card-elevated p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-accent" />
                  Line Items
                </h2>
                <Button variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
              <div className="space-y-3">
                {invoice.items.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <span className="text-sm text-muted-foreground w-6">
                      {index + 1}.
                    </span>
                    <Input
                      value={item.title}
                      onChange={(e) =>
                        handleUpdateItem(item.id, "title", e.target.value)
                      }
                      placeholder="Item description"
                      className="flex-1"
                    />
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        value={item.amount || ""}
                        onChange={(e) =>
                          handleUpdateItem(
                            item.id,
                            "amount",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="0"
                        className="pl-7"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={invoice.items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Installments */}
            <div className="card-elevated p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-accent" />
                  Payment Installments
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddInstallment}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Payment
                </Button>
              </div>
              {invoice.installments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No payments recorded yet. Add a payment when the client pays.
                </p>
              ) : (
                <div className="space-y-3">
                  {invoice.installments.map((inst, index) => (
                    <div
                      key={inst.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-success/5 border border-success/20"
                    >
                      <span className="text-sm text-success font-medium w-6">
                        #{index + 1}
                      </span>
                      <div className="relative w-32">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          $
                        </span>
                        <Input
                          type="number"
                          value={inst.amount || ""}
                          onChange={(e) =>
                            handleUpdateInstallment(
                              inst.id,
                              "amount",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="0"
                          className="pl-7"
                        />
                      </div>
                      <Input
                        type="date"
                        value={
                          inst.paidDate instanceof Date
                            ? inst.paidDate.toISOString().split("T")[0]
                            : new Date(inst.paidDate).toISOString().split("T")[0]
                        }
                        onChange={(e) =>
                          handleUpdateInstallment(
                            inst.id,
                            "paidDate",
                            new Date(e.target.value)
                          )
                        }
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => handleRemoveInstallment(inst.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
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
                    {formatCurrency(invoice.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-t border-border">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="font-medium text-success">
                    {formatCurrency(invoice.paidAmount)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-t border-border">
                  <span className="text-muted-foreground">Due</span>
                  <span className="font-medium text-destructive">
                    {formatCurrency(invoice.dueAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-t-2 border-foreground/10">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="text-2xl font-bold text-foreground">
                    {formatCurrency(invoice.totalAmount)}
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
