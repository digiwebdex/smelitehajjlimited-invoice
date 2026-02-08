export interface ThemeSettings {
  id: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  header_text_color: string;
  invoice_title_color: string;
  subtotal_text_color: string;
  paid_text_color: string;
  balance_bg_color: string;
  balance_text_color: string;
  table_header_bg: string;
  table_header_text: string;
  border_color: string;
  badge_paid_color: string;
  badge_partial_color: string;
  badge_unpaid_color: string;
  footer_text_color: string;
  created_at?: string;
  updated_at?: string;
}

export const defaultTheme: ThemeSettings = {
  id: '00000000-0000-0000-0000-000000000001',
  primary_color: '#1e3a8a',
  secondary_color: '#f3f4f6',
  accent_color: '#0f766e',
  header_text_color: '#1e3a8a',
  invoice_title_color: '#1e3a8a',
  subtotal_text_color: '#374151',
  paid_text_color: '#15803d',
  balance_bg_color: '#166534',
  balance_text_color: '#ffffff',
  table_header_bg: '#f9fafb',
  table_header_text: '#374151',
  border_color: '#e5e7eb',
  badge_paid_color: '#16a34a',
  badge_partial_color: '#f59e0b',
  badge_unpaid_color: '#dc2626',
  footer_text_color: '#6b7280',
};

// Convert hex to RGB array for PDF generation
export const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
};
