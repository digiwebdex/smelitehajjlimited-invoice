import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BrandSettings, defaultBranding } from "@/types/branding";

const BRANDING_ID = "00000000-0000-0000-0000-000000000002";

export const useBranding = () => {
  return useQuery({
    queryKey: ["brand-settings"],
    queryFn: async (): Promise<BrandSettings> => {
      const { data, error } = await supabase
        .from("global_brand_settings")
        .select("*")
        .eq("id", BRANDING_ID)
        .maybeSingle();

      if (error) {
        console.error("Error fetching branding:", error);
        return defaultBranding;
      }

      return (data as BrandSettings) || defaultBranding;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

export const useUpdateBranding = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (branding: Partial<BrandSettings>) => {
      const { data, error } = await supabase
        .from("global_brand_settings")
        .update(branding)
        .eq("id", BRANDING_ID)
        .select()
        .single();

      if (error) throw error;
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
      const {
        company_name,
        tagline,
        address_line1,
        address_line2,
        phone,
        email,
        website,
        thank_you_text,
        show_qr_code,
        footer_alignment,
      } = defaultBranding;

      const { data, error } = await supabase
        .from("global_brand_settings")
        .update({
          company_name,
          tagline,
          address_line1,
          address_line2,
          phone,
          email,
          website,
          thank_you_text,
          show_qr_code,
          footer_alignment,
          company_logo: null,
        })
        .eq("id", BRANDING_ID)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-settings"] });
    },
  });
};
