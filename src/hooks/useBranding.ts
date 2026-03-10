import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { BrandSettings, defaultBranding } from "@/types/branding";

export const useBranding = () => {
  return useQuery({
    queryKey: ["brand-settings"],
    queryFn: async (): Promise<BrandSettings> => {
      const { data, error } = await api.get<BrandSettings>("/branding");
      if (error) {
        console.error("Error fetching branding:", error);
        return defaultBranding;
      }
      return (data as BrandSettings) || defaultBranding;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdateBranding = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (branding: Partial<BrandSettings>) => {
      const { data, error } = await api.put("/branding", branding);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-settings"] });
    },
  });
};

export const useResetBranding = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await api.post("/branding/reset", {});
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-settings"] });
    },
  });
};
