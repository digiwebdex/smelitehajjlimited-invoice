import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  title: string;
  amount: number;
  created_at: string;
}

export interface Installment {
  id: string;
  invoice_id: string;
  amount: number;
  paid_date: string;
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
  invoice_date: string;
  due_date?: string;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  status: "unpaid" | "partial" | "paid";
  items: { title: string; amount: number }[];
  installments: { amount: number; paid_date: string }[];
}

export function useInvoices() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["invoices", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          items:invoice_items(*),
          installments:installments(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
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
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          items:invoice_items(*),
          installments:installments(*)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
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

      // Create the invoice first
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          user_id: user.id,
          company_id: invoice.company_id,
          invoice_number: invoice.invoice_number,
          client_name: invoice.client_name,
          client_email: invoice.client_email,
          client_phone: invoice.client_phone,
          client_address: invoice.client_address,
          invoice_date: invoice.invoice_date,
          due_date: invoice.due_date,
          subtotal: invoice.subtotal,
          vat_rate: invoice.vat_rate,
          vat_amount: invoice.vat_amount,
          total_amount: invoice.total_amount,
          paid_amount: invoice.paid_amount,
          due_amount: invoice.due_amount,
          status: invoice.status,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Insert invoice items
      if (invoice.items.length > 0) {
        const { error: itemsError } = await supabase
          .from("invoice_items")
          .insert(
            invoice.items.map((item) => ({
              invoice_id: invoiceData.id,
              title: item.title,
              amount: item.amount,
            }))
          );

        if (itemsError) throw itemsError;
      }

      // Insert installments
      if (invoice.installments.length > 0) {
        const { error: installmentsError } = await supabase
          .from("installments")
          .insert(
            invoice.installments.map((inst) => ({
              invoice_id: invoiceData.id,
              amount: inst.amount,
              paid_date: inst.paid_date,
            }))
          );

        if (installmentsError) throw installmentsError;
      }

      return invoiceData;
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
      // Update the invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .update({
          company_id: invoice.company_id,
          invoice_number: invoice.invoice_number,
          client_name: invoice.client_name,
          client_email: invoice.client_email,
          client_phone: invoice.client_phone,
          client_address: invoice.client_address,
          invoice_date: invoice.invoice_date,
          due_date: invoice.due_date,
          subtotal: invoice.subtotal,
          vat_rate: invoice.vat_rate,
          vat_amount: invoice.vat_amount,
          total_amount: invoice.total_amount,
          paid_amount: invoice.paid_amount,
          due_amount: invoice.due_amount,
          status: invoice.status,
        })
        .eq("id", id)
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Delete existing items and installments
      await supabase.from("invoice_items").delete().eq("invoice_id", id);
      await supabase.from("installments").delete().eq("invoice_id", id);

      // Insert new items
      if (invoice.items.length > 0) {
        const { error: itemsError } = await supabase
          .from("invoice_items")
          .insert(
            invoice.items.map((item) => ({
              invoice_id: id,
              title: item.title,
              amount: item.amount,
            }))
          );

        if (itemsError) throw itemsError;
      }

      // Insert new installments
      if (invoice.installments.length > 0) {
        const { error: installmentsError } = await supabase
          .from("installments")
          .insert(
            invoice.installments.map((inst) => ({
              invoice_id: id,
              amount: inst.amount,
              paid_date: inst.paid_date,
            }))
          );

        if (installmentsError) throw installmentsError;
      }

      return invoiceData;
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
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", id);

      if (error) throw error;
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
      const { count, error } = await supabase
        .from("invoices")
        .select("*", { count: "exact", head: true });

      if (error) throw error;
      
      const year = new Date().getFullYear();
      const nextNumber = (count || 0) + 1;
      return `INV-${year}-${nextNumber.toString().padStart(3, "0")}`;
    },
    enabled: !!user,
  });
}
