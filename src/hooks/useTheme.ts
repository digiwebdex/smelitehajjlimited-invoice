import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ThemeSettings, defaultTheme } from "@/types/theme";

const THEME_ID = '00000000-0000-0000-0000-000000000001';

export const useTheme = () => {
  return useQuery({
    queryKey: ["theme-settings"],
    queryFn: async (): Promise<ThemeSettings> => {
      const { data, error } = await supabase
        .from("theme_settings")
        .select("*")
        .eq("id", THEME_ID)
        .maybeSingle();

      if (error) {
        console.error("Error fetching theme:", error);
        return defaultTheme;
      }

      return data || defaultTheme;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

export const useUpdateTheme = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (theme: Partial<ThemeSettings>) => {
      const { data, error } = await supabase
        .from("theme_settings")
        .update(theme)
        .eq("id", THEME_ID)
        .select()
        .single();

      if (error) throw error;
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
      const { primary_color, secondary_color, accent_color, header_text_color, 
              invoice_title_color, subtotal_text_color, paid_text_color, 
              balance_bg_color, balance_text_color, table_header_bg, 
              table_header_text, border_color, badge_paid_color, 
              badge_partial_color, badge_unpaid_color, footer_text_color } = defaultTheme;

      const { data, error } = await supabase
        .from("theme_settings")
        .update({
          primary_color, secondary_color, accent_color, header_text_color,
          invoice_title_color, subtotal_text_color, paid_text_color,
          balance_bg_color, balance_text_color, table_header_bg,
          table_header_text, border_color, badge_paid_color,
          badge_partial_color, badge_unpaid_color, footer_text_color
        })
        .eq("id", THEME_ID)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["theme-settings"] });
    },
  });
};
