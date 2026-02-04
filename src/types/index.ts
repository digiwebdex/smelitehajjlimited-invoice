// Types for the Invoice Management System

export interface Company {
  id: string;
  name: string;
  logo?: string;
  email: string;
  phone: string;
  address: string;
  createdAt: Date;
}

export interface InvoiceItem {
  id: string;
  title: string;
  amount: number;
}

export interface Installment {
  id: string;
  amount: number;
  paidDate: Date;
}

export type InvoiceStatus = 'unpaid' | 'partial' | 'paid';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  companyId: string;
  clientName: string;
  date: Date;
  items: InvoiceItem[];
  installments: Installment[];
  status: InvoiceStatus;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
}

export interface RevenueStats {
  totalRevenue: number;
  totalDue: number;
  totalInvoices: number;
  companyRevenue: { companyId: string; companyName: string; revenue: number }[];
  monthlyRevenue: { month: string; revenue: number }[];
}
