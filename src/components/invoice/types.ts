import { z } from "zod";

// ——————————————————————————————————————————————
// Item schema & type
// ——————————————————————————————————————————————
export const lineItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Description is required"),
  qty: z.number().min(1, "Qty must be at least 1"),
  unitPrice: z.number().min(0, "Unit price cannot be negative"),
  amount: z.number(),
});

export type LocalItem = z.infer<typeof lineItemSchema>;

// ——————————————————————————————————————————————
// Installment schema & type
// ——————————————————————————————————————————————
export const installmentSchema = z.object({
  id: z.string(),
  amount: z.number().min(0, "Amount cannot be negative"),
  paid_date: z.string().min(1, "Date is required"),
  payment_method: z.string().default("Bank Transfer"),
});

export type LocalInstallment = z.infer<typeof installmentSchema>;

// ——————————————————————————————————————————————
// Invoice form schema
// ——————————————————————————————————————————————
export const invoiceFormSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  companyId: z.string().min(1, "Company is required"),
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Invalid email").or(z.literal("")),
  clientPhone: z.string(),
  clientAddress: z.string(),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  vatRate: z.number().min(0).max(100),
  notes: z.string().max(1000, "Notes must be less than 1000 characters").optional(),
});

export type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

export type InvoiceStatus = "unpaid" | "partial" | "paid";

// ——————————————————————————————————————————————
// Utility: format BDT currency
// ——————————————————————————————————————————————
export const formatCurrency = (amount: number) =>
  `৳${new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)}`;
