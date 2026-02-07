import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  FileText,
  DollarSign,
  CheckCircle,
  Loader2,
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
import { useInvoice, useCreateInvoice, useUpdateInvoice, useNextInvoiceNumber } from "@/hooks/useInvoices";
import { useCompanies } from "@/hooks/useCompanies";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface LocalItem {
  id: string;
  title: string;
  qty: number;
  unitPrice: number;
  amount: number;
}

interface LocalInstallment {
  id: string;
  amount: number;
  paid_date: string;
}

type InvoiceStatus = "unpaid" | "partial" | "paid";

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = !id || id === "new";

  const { data: existingInvoice, isLoading: invoiceLoading } = useInvoice(isNew ? undefined : id);
  const { data: companies = [], isLoading: companiesLoading } = useCompanies();
  const { data: nextInvoiceNumber } = useNextInvoiceNumber();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [vatRate, setVatRate] = useState(0);
  const [items, setItems] = useState<LocalItem[]>([{ id: "1", title: "", qty: 1, unitPrice: 0, amount: 0 }]);
  const [installments, setInstallments] = useState<LocalInstallment[]>([]);

  // Calculated values
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const vatAmount = (subtotal * vatRate) / 100;
  const totalAmount = subtotal + vatAmount;
  const paidAmount = installments.reduce((sum, inst) => sum + inst.amount, 0);
  const dueAmount = totalAmount - paidAmount;

  let status: InvoiceStatus = "unpaid";
  if (paidAmount >= totalAmount && totalAmount > 0) {
    status = "paid";
  } else if (paidAmount > 0) {
    status = "partial";
  }

  // Load existing invoice data
  useEffect(() => {
    if (isNew && nextInvoiceNumber) {
      setInvoiceNumber(nextInvoiceNumber);
    }
  }, [isNew, nextInvoiceNumber]);

  useEffect(() => {
    if (existingInvoice) {
      setInvoiceNumber(existingInvoice.invoice_number);
      setCompanyId(existingInvoice.company_id);
      setClientName(existingInvoice.client_name);
      setClientEmail(existingInvoice.client_email || "");
      setClientPhone(existingInvoice.client_phone || "");
      setClientAddress(existingInvoice.client_address || "");
      setInvoiceDate(existingInvoice.invoice_date);
      setDueDate(existingInvoice.due_date || "");
      setVatRate(Number(existingInvoice.vat_rate) || 0);
      
      if (existingInvoice.items && existingInvoice.items.length > 0) {
        setItems(existingInvoice.items.map((item) => ({
          id: item.id,
          title: item.title,
          qty: 1,
          unitPrice: Number(item.amount),
          amount: Number(item.amount),
        })));
      }
      
      if (existingInvoice.installments) {
        setInstallments(existingInvoice.installments.map((inst) => ({
          id: inst.id,
          amount: Number(inst.amount),
          paid_date: inst.paid_date,
        })));
      }
    }
  }, [existingInvoice]);

  const handleAddItem = () => {
    setItems([...items, { id: Date.now().toString(), title: "", qty: 1, unitPrice: 0, amount: 0 }]);
  };

  const handleRemoveItem = (itemId: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== itemId));
    }
  };

  const handleUpdateItem = (itemId: string, field: keyof LocalItem, value: string | number) => {
    setItems(items.map((item) => {
      if (item.id !== itemId) return item;
      
      const updatedItem = { ...item, [field]: value };
      
      // Auto-calculate amount when qty or unitPrice changes
      if (field === "qty" || field === "unitPrice") {
        updatedItem.amount = updatedItem.qty * updatedItem.unitPrice;
      }
      
      return updatedItem;
    }));
  };

  const handleAddInstallment = () => {
    setInstallments([
      ...installments,
      { id: Date.now().toString(), amount: 0, paid_date: new Date().toISOString().split("T")[0] },
    ]);
  };

  const handleRemoveInstallment = (instId: string) => {
    setInstallments(installments.filter((inst) => inst.id !== instId));
  };

  const handleUpdateInstallment = (
    instId: string,
    field: keyof LocalInstallment,
    value: string | number
  ) => {
    setInstallments(installments.map((inst) =>
      inst.id === instId ? { ...inst, [field]: value } : inst
    ));
  };

  const handleSave = async () => {
    if (!companyId || !clientName) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const invoiceData = {
      company_id: companyId,
      invoice_number: invoiceNumber,
      client_name: clientName,
      client_email: clientEmail || undefined,
      client_phone: clientPhone || undefined,
      client_address: clientAddress || undefined,
      invoice_date: invoiceDate,
      due_date: dueDate || undefined,
      subtotal,
      vat_rate: vatRate,
      vat_amount: vatAmount,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      due_amount: dueAmount,
      status,
      items: items.filter((item) => item.title.trim() !== "").map((item) => ({
        title: item.title,
        amount: item.amount,
      })),
      installments: installments.map((inst) => ({
        amount: inst.amount,
        paid_date: inst.paid_date,
      })),
    };

    try {
      if (isNew) {
        await createInvoice.mutateAsync(invoiceData);
      } else {
        await updateInvoice.mutateAsync({ id: id!, ...invoiceData });
      }
      navigate("/invoices");
    } catch (error) {
      // Error handling is done in the hooks
    }
  };

  const formatCurrency = (amount: number) => {
    return `৳${new Intl.NumberFormat("en-BD", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)}`;
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

  const isLoading = invoiceLoading || companiesLoading;
  const isSaving = createInvoice.isPending || updateInvoice.isPending;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!isNew && !existingInvoice && !invoiceLoading) {
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
                {isNew ? "New Invoice" : invoiceNumber}
              </h1>
              <p className="text-muted-foreground">
                {isNew ? "Create a new invoice" : "Edit invoice details"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(status)}
            <Button
              onClick={handleSave}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
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
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company *</Label>
                  <Select value={companyId} onValueChange={setCompanyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Invoice Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Client Information */}
              <h3 className="text-md font-medium text-foreground pt-4 border-t border-border mt-4">
                Client Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Input
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Enter client name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Client Email</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="client@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Client Phone</Label>
                  <Input
                    id="clientPhone"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+880 1XXX XXXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientAddress">Client Address</Label>
                  <Input
                    id="clientAddress"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    placeholder="Enter address"
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
            {/* Table Header */}
              <div className="grid grid-cols-12 gap-3 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                <div className="col-span-1">#</div>
                <div className="col-span-4">Description</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-1"></div>
              </div>
              
              <div className="space-y-2 mt-2">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-3 items-center p-3 rounded-lg bg-muted/50"
                  >
                    <span className="col-span-1 text-sm text-muted-foreground">
                      {index + 1}.
                    </span>
                    <div className="col-span-4">
                      <Input
                        value={item.title}
                        onChange={(e) => handleUpdateItem(item.id, "title", e.target.value)}
                        placeholder="Item description"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={item.qty || ""}
                        onChange={(e) => handleUpdateItem(item.id, "qty", parseInt(e.target.value) || 1)}
                        placeholder="1"
                        className="text-center"
                        min={1}
                      />
                    </div>
                    <div className="col-span-2">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          ৳
                        </span>
                        <Input
                          type="number"
                          value={item.unitPrice || ""}
                          onChange={(e) => handleUpdateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="pl-6 text-right"
                        />
                      </div>
                    </div>
                    <div className="col-span-2 text-right font-semibold text-foreground pr-2">
                      {formatCurrency(item.amount)}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={items.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
                <Button variant="outline" size="sm" onClick={handleAddInstallment}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Payment
                </Button>
              </div>
              {installments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No payments recorded yet. Add a payment when the client pays.
                </p>
              ) : (
                <div className="space-y-3">
                  {installments.map((inst, index) => (
                    <div
                      key={inst.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200"
                    >
                      <span className="text-sm text-green-600 font-medium w-6">
                        #{index + 1}
                      </span>
                      <div className="relative w-32">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          ৳
                        </span>
                        <Input
                          type="number"
                          value={inst.amount || ""}
                          onChange={(e) => handleUpdateInstallment(inst.id, "amount", parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="pl-7"
                        />
                      </div>
                      <Input
                        type="date"
                        value={inst.paid_date}
                        onChange={(e) => handleUpdateInstallment(inst.id, "paid_date", e.target.value)}
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

          {/* Sidebar Summary */}
          <div className="space-y-6">
            <div className="card-elevated p-6 space-y-4 sticky top-6">
              <h2 className="text-lg font-semibold text-foreground">
                Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="vatRate" className="text-sm text-muted-foreground">
                    VAT %
                  </Label>
                  <Input
                    id="vatRate"
                    type="number"
                    value={vatRate || ""}
                    onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                    className="w-20 h-8 text-sm"
                    placeholder="0"
                  />
                  <span className="text-sm font-medium ml-auto">
                    {formatCurrency(vatAmount)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-t border-border">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-lg">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Paid</span>
                  <span className="font-semibold">{formatCurrency(paidAmount)}</span>
                </div>
                <div
                  className={cn(
                    "flex justify-between p-3 rounded-lg font-semibold",
                    dueAmount > 0
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  )}
                >
                  <span>{dueAmount > 0 ? "Due" : "Fully Paid"}</span>
                  <span>{formatCurrency(dueAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
