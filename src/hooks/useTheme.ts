import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { ThemeSettings, defaultTheme } from "@/types/theme";

export const useTheme = () => {
  return useQuery({
    queryKey: ["theme-settings"],
    queryFn: async (): Promise<ThemeSettings> => {
      const { data, error } = await api.get<ThemeSettings>("/theme");
      if (error) {
        console.error("Error fetching theme:", error);
        return defaultTheme;
      }
      return data || defaultTheme;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdateTheme = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (theme: Partial<ThemeSettings>) => {
      const { data, error } = await api.put("/theme", theme);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["theme-settings"] });
    },
  });
};

export const useResetTheme = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await api.post("/theme/reset", {});
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["theme-settings"] });
    },
  });
};
