export interface BrandSettings {
  id: string;
  company_name: string;
  company_logo?: string | null;
  tagline?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  thank_you_text: string;
  show_qr_code: boolean;
  footer_alignment: "left" | "center" | "right";
  created_at?: string;
  updated_at?: string;
}

export const defaultBranding: BrandSettings = {
  id: "00000000-0000-0000-0000-000000000002",
  company_name: "S M Elite Hajj Limited",
  company_logo: null,
  tagline: "Excellence in Every Step",
  address_line1: "B-25/4, Al-Baraka Super Market, Savar Bazar Bus-Stand, Savar, Dhaka-1340",
  address_line2: null,
  phone: "+8801867666888",
  email: "info@smelitehajj.com",
  website: "www.smelitehajj.com",
  thank_you_text: "Thank you for staying with us.",
  show_qr_code: true,
  footer_alignment: "center",
};
