import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Company {
  id: string;
  user_id: string;
  name: string;
  tagline: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  address_line1: string | null;
  address_line2: string | null;
  website: string | null;
  thank_you_text: string | null;
  show_qr_code: boolean | null;
  footer_alignment: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyInput {
  name: string;
  tagline?: string;
  email?: string;
  phone?: string;
  address?: string;
  logo_url?: string;
  address_line1?: string;
  address_line2?: string;
  website?: string;
  thank_you_text?: string;
  show_qr_code?: boolean;
  footer_alignment?: string;
}

export function useCompanies() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["companies", user?.id],
    queryFn: async () => {
      const { data, error } = await api.get<Company[]>("/companies");
      if (error) throw new Error(error);
      return data as Company[];
    },
    enabled: !!user,
  });
}

export function useCompany(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["company", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await api.get<Company>(`/companies/${id}`);
      if (error) throw new Error(error);
      return data as Company | null;
    },
    enabled: !!user && !!id,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (company: CompanyInput) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await api.post("/companies", company);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast({
        title: "Company created",
        description: "The company has been created successfully.",
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

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...company }: CompanyInput & { id: string }) => {
      const { data, error } = await api.put(`/companies/${id}`, company);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["company", data.id] });
      toast({
        title: "Company updated",
        description: "The company has been updated successfully.",
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

export function useDeleteCompany() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.delete(`/companies/${id}`);
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast({
        title: "Company deleted",
        description: "The company has been deleted successfully.",
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
