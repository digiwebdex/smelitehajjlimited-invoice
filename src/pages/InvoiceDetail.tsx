import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
  useInvoice,
  useCreateInvoice,
  useUpdateInvoice,
  useNextInvoiceNumber,
} from "@/hooks/useInvoices";
import { useCompanies } from "@/hooks/useCompanies";
import { useToast } from "@/hooks/use-toast";

import {
  InvoiceFormHeader,
  InvoiceDetailsCard,
  LineItemsSection,
  PaymentsSection,
  InvoiceSummaryCard,
  invoiceFormSchema,
  lineItemSchema,
  type LocalItem,
  type LocalInstallment,
  type InvoiceStatus,
} from "@/components/invoice";

const DEFAULT_NEW_INVOICE_DATE = new Date().toISOString().split("T")[0];

function toNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toDateInputValue(value: unknown): string {
  if (!value) return "";
  const str = String(value);
  // Try to extract YYYY-MM-DD from the beginning of any date string
  const match = str.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  // Fallback: parse as Date object
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    }
  } catch {
    // ignore
  }
  return "";
}

function normalizeLineItem(item: LocalItem): LocalItem {
  const qty = Math.max(1, toNumber(item.qty, 1));
  const unitPrice = Math.max(0, toNumber(item.unitPrice, 0));

  return {
    id: item.id,
    title: item.title,
    qty,
    unitPrice,
    amount: qty * unitPrice,
  };
}

function normalizeInstallment(installment: LocalInstallment): LocalInstallment {
  return {
    ...installment,
    amount: Math.max(0, toNumber(installment.amount, 0)),
  };
}

// ——————————————————————————————————————————————
// Main Page
// ——————————————————————————————————————————————
export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = !id || id === "new";

  const { data: existingInvoice, isLoading: invoiceLoading } = useInvoice(
    isNew ? undefined : id
  );
  const { data: companies = [], isLoading: companiesLoading } = useCompanies();
  const { data: nextInvoiceNumber } = useNextInvoiceNumber();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();

  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    isNew ? DEFAULT_NEW_INVOICE_DATE : ""
  );
  const [vatRate, setVatRate] = useState(0);
  const [items, setItems] = useState<LocalItem[]>([
    { id: "1", title: "", qty: 1, unitPrice: 0, amount: 0 },
  ]);
  const [installments, setInstallments] = useState<LocalInstallment[]>([]);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  // Calculated values
  const normalizedItems = items.map(normalizeLineItem);
  const normalizedInstallments = installments.map(normalizeInstallment);
  const subtotal = normalizedItems.reduce((sum, item) => sum + item.amount, 0);
  const vatAmount = (subtotal * vatRate) / 100;
  const totalAmount = subtotal + vatAmount;
  const paidAmount = normalizedInstallments.reduce((sum, installment) => sum + installment.amount, 0);
  const dueAmount = totalAmount - paidAmount;
  const status: InvoiceStatus =
    paidAmount >= totalAmount && totalAmount > 0
      ? "paid"
      : paidAmount > 0
      ? "partial"
      : "unpaid";

  // Load existing invoice
  useEffect(() => {
    if (isNew && nextInvoiceNumber) setInvoiceNumber(nextInvoiceNumber);
  }, [isNew, nextInvoiceNumber]);

  useEffect(() => {
    if (!existingInvoice) return;
    setInvoiceNumber(existingInvoice.invoice_number);
    setCompanyId(existingInvoice.company_id);
    setClientName(existingInvoice.client_name);
    setClientEmail(existingInvoice.client_email || "");
    setClientPhone(existingInvoice.client_phone || "");
    setClientAddress(existingInvoice.client_address || "");
    setNotes(existingInvoice.notes || "");
    setInvoiceDate(
      toDateInputValue(existingInvoice.invoice_date) ||
      toDateInputValue(existingInvoice.created_at) ||
      ""
    );
    setVatRate(Number(existingInvoice.vat_rate) || 0);
    if (existingInvoice.items?.length) {
      setItems(
        existingInvoice.items.map((it) => ({
          id: it.id,
          title: it.title,
          qty: toNumber(it.qty, 1),
          unitPrice: toNumber(it.unit_price, 0),
          amount: toNumber(it.amount, 0),
        }))
      );
    }
    if (existingInvoice.installments) {
      setInstallments(
        existingInvoice.installments.map((inst) => ({
          id: inst.id,
          amount: toNumber(inst.amount, 0),
          paid_date: inst.paid_date,
          payment_method: inst.payment_method || "Bank Transfer",
        }))
      );
    }
  }, [existingInvoice]);

  // Handlers
  const handleFieldChange = useCallback((field: string, value: string) => {
    const map: Record<string, (v: string) => void> = {
      invoiceNumber: setInvoiceNumber,
      companyId: setCompanyId,
      clientName: setClientName,
      clientEmail: setClientEmail,
      clientPhone: setClientPhone,
      clientAddress: setClientAddress,
      invoiceDate: setInvoiceDate,
      notes: setNotes,
    };
    map[field]?.(value);
    setErrors((e) => ({ ...e, [field]: undefined }));
  }, []);

  const handleAddItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), title: "", qty: 1, unitPrice: 0, amount: 0 },
    ]);
  }, []);

  const handleRemoveItem = useCallback((itemId: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== itemId) : prev));
  }, []);

  const handleUpdateItem = useCallback(
    (itemId: string, field: keyof LocalItem, value: string | number) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          const updated = normalizeLineItem(item);

          if (field === "title") {
            updated.title = String(value);
            return updated;
          }

          if (field === "qty") {
            updated.qty = Math.max(1, toNumber(value, 1));
          }

          if (field === "unitPrice") {
            updated.unitPrice = Math.max(0, toNumber(value, 0));
          }

          if (field === "amount") {
            updated.amount = Math.max(0, toNumber(value, 0));
            return updated;
          }

          updated.amount = updated.qty * updated.unitPrice;
          return updated;
        })
      );
    },
    []
  );

  const handleAddInstallment = useCallback(() => {
    setInstallments((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        amount: 0,
        paid_date: new Date().toISOString().split("T")[0],
        payment_method: "Bank Transfer",
      },
    ]);
  }, []);

  const handleRemoveInstallment = useCallback((instId: string) => {
    setInstallments((prev) => prev.filter((i) => i.id !== instId));
  }, []);

  const handleUpdateInstallment = useCallback(
    (instId: string, field: keyof LocalInstallment, value: string | number) => {
      setInstallments((prev) =>
        prev.map((inst) => {
          if (inst.id !== instId) return inst;

          if (field === "amount") {
            return {
              ...inst,
              amount: Math.max(0, toNumber(value, 0)),
            };
          }

          return { ...inst, [field]: value };
        })
      );
    },
    []
  );

  // Validation + save
  const handleSave = async () => {
    const newErrors: Record<string, string | undefined> = {};

    // Validate form fields
    const formResult = invoiceFormSchema.safeParse({
      invoiceNumber,
      companyId,
      clientName,
      clientEmail,
      clientPhone,
      clientAddress,
      invoiceDate,
      vatRate,
      notes,
    });
    if (!formResult.success) {
      formResult.error.issues.forEach((issue) => {
        newErrors[issue.path[0] as string] = issue.message;
      });
    }

    // Validate items
    normalizedItems.forEach((item, idx) => {
      const res = lineItemSchema.safeParse(item);
      if (!res.success) {
        res.error.issues.forEach((issue) => {
          const field = issue.path[0] as string;
          newErrors[`items.${idx}.${field}`] = issue.message;
        });
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({
        title: "Validation error",
        description: "Please fix the highlighted fields.",
        variant: "destructive",
      });
      return;
    }

    setErrors({});

    const payload = {
      company_id: companyId,
      invoice_number: invoiceNumber,
      client_name: clientName,
      client_email: clientEmail || undefined,
      client_phone: clientPhone || undefined,
      client_address: clientAddress || undefined,
      notes: notes || undefined,
      invoice_date: invoiceDate,
      subtotal,
      vat_rate: vatRate,
      vat_amount: vatAmount,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      due_amount: dueAmount,
      status,
        items: normalizedItems
        .filter((i) => i.title.trim())
        .map((i) => ({ title: i.title, qty: i.qty, unit_price: i.unitPrice, amount: i.amount })),
        installments: normalizedInstallments.map((inst) => ({
        amount: inst.amount,
        paid_date: inst.paid_date,
        payment_method: inst.payment_method || "Bank Transfer",
      })),
    };

    try {
      if (isNew) {
        await createInvoice.mutateAsync(payload);
      } else {
        await updateInvoice.mutateAsync({ id: id!, ...payload });
      }
      navigate("/invoices");
    } catch {
      // Error handled in hooks
    }
  };

  // Loading / not found
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
      <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
        <InvoiceFormHeader
          isNew={isNew}
          invoiceNumber={invoiceNumber}
          status={status}
          isSaving={isSaving}
          onBack={() => navigate("/invoices")}
          onSave={handleSave}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main form (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <InvoiceDetailsCard
              invoiceNumber={invoiceNumber}
              companyId={companyId}
              invoiceDate={invoiceDate}
              clientName={clientName}
              clientEmail={clientEmail}
              clientPhone={clientPhone}
              clientAddress={clientAddress}
              notes={notes}
              companies={companies}
              errors={errors}
              onChange={handleFieldChange}
            />

            <LineItemsSection
              items={normalizedItems}
              errors={errors}
              onAdd={handleAddItem}
              onUpdate={handleUpdateItem}
              onRemove={handleRemoveItem}
            />

            <PaymentsSection
              installments={normalizedInstallments}
              onAdd={handleAddInstallment}
              onUpdate={handleUpdateInstallment}
              onRemove={handleRemoveInstallment}
            />
          </div>

          {/* Summary sidebar (1 col) */}
          <div>
            <InvoiceSummaryCard
              subtotal={subtotal}
              vatRate={vatRate}
              vatAmount={vatAmount}
              totalAmount={totalAmount}
              paidAmount={paidAmount}
              dueAmount={dueAmount}
              onVatRateChange={setVatRate}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
