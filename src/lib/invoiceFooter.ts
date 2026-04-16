import type { BrandSettings } from "@/types/branding";

type FooterCompany = {
  address?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  thank_you_text?: string | null;
  show_qr_code?: boolean | null;
  footer_alignment?: string | null;
};

const clean = (value?: string | null) => value?.trim() || null;

export const getInvoiceFooterDetails = (
  company: FooterCompany | null | undefined,
  branding: BrandSettings | null | undefined
) => {
  const b = branding || {
    address_line1: null,
    address_line2: null,
    email: null,
    phone: null,
    website: null,
    thank_you_text: null,
    show_qr_code: true,
    footer_alignment: "center",
  };

  const addressLine1 = company
    ? clean(company.address_line1)
    : clean(b.address_line1);

  const addressLine2 = company
    ? clean(company.address_line2)
    : clean(b.address_line2);

  const footerEmail = company ? clean(company.email) : clean(b.email);
  const footerPhone = company ? clean(company.phone) : clean(b.phone);
  const footerWebsite = company ? clean(company.website) : clean(b.website);
  const footerThankYou = clean(company?.thank_you_text) || clean(b.thank_you_text) || "Thank you for staying with us.";
  const showQR = company ? (company.show_qr_code ?? true) : (b.show_qr_code ?? true);
  const footerAlign = company ? clean(company.footer_alignment) || clean(b.footer_alignment) || "center" : clean(b.footer_alignment) || "center";
  const footerContactLine = [footerPhone, footerEmail].filter(Boolean).join(" | ");
  const footerLines = [addressLine1, addressLine2, footerContactLine || null, footerWebsite || null].filter(Boolean) as string[];

  return {
    addressLine1,
    addressLine2,
    footerAlign,
    footerContactLine,
    footerEmail,
    footerLines,
    footerPhone,
    footerThankYou,
    footerWebsite,
    showQR,
  };
};