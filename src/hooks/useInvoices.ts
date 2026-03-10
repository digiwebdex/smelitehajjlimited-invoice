import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  title: string;
  qty: number;
  unit_price: number;
  amount: number;
  created_at: string;
}

export interface Installment {
  id: string;
  invoice_id: string;
  amount: number;
  paid_date: string;
  payment_method: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  company_id: string;
  invoice_number: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  client_address: string | null;
  notes: string | null;
  invoice_date: string;
  due_date: string | null;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  status: "unpaid" | "partial" | "paid";
  created_at: string;
  updated_at: string;
  items?: InvoiceItem[];
  installments?: Installment[];
}

export interface InvoiceInput {
  company_id: string;
  invoice_number: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  notes?: string;
  invoice_date: string;
  due_date?: string;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  status: "unpaid" | "partial" | "paid";
  items: { title: string; qty: number; unit_price: number; amount: number }[];
  installments: { amount: number; paid_date: string; payment_method: string }[];
}

export function useInvoices() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["invoices", user?.id],
    queryFn: async () => {
      const { data, error } = await api.get<Invoice[]>("/invoices");
      if (error) throw new Error(error);
      return data as Invoice[];
    },
    enabled: !!user,
  });
}

export function useInvoice(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await api.get<Invoice>(`/invoices/${id}`);
      if (error) throw new Error(error);
      return data as Invoice | null;
    },
    enabled: !!user && !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (invoice: InvoiceInput) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await api.post("/invoices", invoice);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast({
        title: "Invoice created",
        description: "The invoice has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...invoice }: InvoiceInput & { id: string }) => {
      const { data, error } = await api.put(`/invoices/${id}`, invoice);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice", data.id] });
      toast({
        title: "Invoice updated",
        description: "The invoice has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.delete(`/invoices/${id}`);
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast({
        title: "Invoice deleted",
        description: "The invoice has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useNextInvoiceNumber() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["nextInvoiceNumber", user?.id],
    queryFn: async () => {
      const { data, error } = await api.get<{ next_number: string }>("/invoices/next-number");
      if (error) throw new Error(error);
      return data?.next_number || "INV-2026-001";
    },
    enabled: !!user,
  });
}
