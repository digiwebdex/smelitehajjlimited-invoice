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

const DEFAULT_ADDRESS_LINE_1 = "B-25/4, Al-Baraka Super Market";
const DEFAULT_ADDRESS_LINE_2 = "Savar Bazar Bus-Stand, Savar, Dhaka-1340";

const clean = (value?: string | null) => value?.trim() || null;

const splitAddress = (address?: string | null) => {
  const normalized = clean(address);

  if (!normalized) {
    return { line1: null, line2: null };
  }

  const lines = normalized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length > 1) {
    return {
      line1: lines[0],
      line2: lines.slice(1).join(", "),
    };
  }

  return {
    line1: normalized,
    line2: null,
  };
};

export const getInvoiceFooterDetails = (
  company: FooterCompany | null | undefined,
  branding: BrandSettings | null | undefined
) => {
  const b = branding || {
    address_line1: DEFAULT_ADDRESS_LINE_1,
    address_line2: DEFAULT_ADDRESS_LINE_2,
    email: null,
    phone: null,
    website: null,
    thank_you_text: null,
    show_qr_code: true,
    footer_alignment: "center",
  };

  const derivedCompanyAddress = splitAddress(company?.address);
  const hasCompanyAddress = Boolean(
    clean(company?.address_line1) || clean(company?.address_line2) || clean(company?.address)
  );

  const addressLine1 = hasCompanyAddress
    ? clean(company?.address_line1) || derivedCompanyAddress.line1
    : clean(b.address_line1) || DEFAULT_ADDRESS_LINE_1;

  const addressLine2 = hasCompanyAddress
    ? clean(company?.address_line2) || derivedCompanyAddress.line2
    : clean(b.address_line2) || DEFAULT_ADDRESS_LINE_2;

  const footerEmail = company ? clean(company.email) : clean(b.email);
  const footerPhone = company ? clean(company.phone) : clean(b.phone);
  const footerWebsite = company ? clean(company.website) || clean(b.website) : clean(b.website) || "www.smelitehajj.com";
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