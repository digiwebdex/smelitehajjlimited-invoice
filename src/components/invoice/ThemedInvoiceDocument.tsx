import { cn } from "@/lib/utils";
import { InvoiceQRCode } from "@/components/InvoiceQRCode";
import { ThemeSettings, defaultTheme } from "@/types/theme";
import { BrandSettings, defaultBranding } from "@/types/branding";

interface InvoiceItemData {
  id: string;
  title: string;
  amount: number;
  qty?: number;
  unit_price?: number;
}

interface InstallmentData {
  id: string;
  amount: number;
  paid_date: string;
}

interface CompanyData {
  name: string;
  tagline?: string | null;
  logo_url?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  website?: string | null;
  thank_you_text?: string | null;
  show_qr_code?: boolean | null;
  footer_alignment?: string | null;
}

interface InvoiceData {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email?: string | null;
  client_phone?: string | null;
  client_address?: string | null;
  invoice_date: string;
  status: string;
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  notes?: string | null;
}

interface ThemedInvoiceDocumentProps {
  invoice: InvoiceData;
  items: InvoiceItemData[];
  installments: InstallmentData[];
  company?: CompanyData | null;
  theme: ThemeSettings;
  branding?: BrandSettings | null;
}

export const ThemedInvoiceDocument = ({
  invoice,
  items,
  installments,
  company,
  theme,
  branding,
}: ThemedInvoiceDocumentProps) => {
  const t = theme || defaultTheme;
  const b = branding || defaultBranding;

  const formatCurrency = (amount: number) => {
    return `৳${new Intl.NumberFormat("en-BD", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`;
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "paid":
        return { backgroundColor: t.badge_paid_color, color: "#ffffff" };
      case "partial":
        return { backgroundColor: t.badge_partial_color, color: "#ffffff" };
      case "unpaid":
      default:
        return { backgroundColor: t.badge_unpaid_color, color: "#ffffff" };
    }
  };

  // Use company data first, then branding as fallback
  const headerLogo = company?.logo_url || b.company_logo;
  const headerName = company?.name || b.company_name || "Company Name";
  const headerTagline = company?.tagline || b.tagline;

  // Footer settings - company data takes priority
  const footerEmail = company?.email || b.email;
  const footerPhone = company?.phone || b.phone;
  const addressLine1 = company?.address_line1 || b.address_line1;
  const addressLine2 = company?.address_line2 || b.address_line2;
  const footerAddress = [addressLine1, addressLine2].filter(Boolean).join(", ") || company?.address;
  const footerThankYou = company?.thank_you_text || b.thank_you_text || "Thank you for staying with us.";
  const showQR = company?.show_qr_code ?? b.show_qr_code ?? true;
  const footerAlign = company?.footer_alignment || b.footer_alignment || "center";
  const footerWebsite = company?.website || b.website;

  const footerAlignClass = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end",
  }[footerAlign];

  return (
    <div className="bg-white shadow-lg rounded-xl p-8 print:shadow-none print:p-0 print:rounded-none">
      {/* HEADER */}
      <div className="flex justify-between items-start pb-6">
        <div className="flex items-center gap-4">
          {headerLogo ? (
            <img
              src={headerLogo}
              alt={headerName}
              className="w-16 h-16 rounded-full object-cover"
              style={{ borderColor: t.primary_color, borderWidth: '2px' }}
            />
          ) : (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
              style={{ backgroundColor: t.primary_color, borderColor: t.primary_color, borderWidth: '2px' }}
            >
              {headerName?.charAt(0) || "C"}
            </div>
          )}
          <div>
            <h2
              className="text-xl font-bold"
              style={{ color: t.header_text_color }}
            >
              {headerName}
            </h2>
            {headerTagline && (
              <p className="text-sm italic" style={{ color: t.header_text_color, opacity: 0.7 }}>
                {headerTagline}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <h1
            className="text-3xl font-bold"
            style={{ color: t.invoice_title_color }}
          >
            INVOICE
          </h1>
          <p className="text-orange-500 font-semibold text-lg mt-1">
            {invoice.invoice_number}
          </p>
          <div className="mt-2">
            <span
              className="px-3 py-1 text-sm font-medium rounded-full capitalize"
              style={getStatusBadgeStyle(invoice.status)}
            >
              {invoice.status}
            </span>
          </div>
        </div>
      </div>

      {/* BILL TO + DATES */}
      <div
        className="flex justify-between mt-6 pt-6"
        style={{ borderTopWidth: '1px', borderTopColor: t.border_color }}
      >
        <div
          className="pl-4"
          style={{ borderLeftWidth: '4px', borderLeftColor: t.accent_color }}
        >
          <p className="text-sm uppercase tracking-wide mb-2" style={{ color: t.subtotal_text_color }}>
            Bill To
          </p>
          <h3 className="font-bold text-lg text-black">
            {invoice.client_name}
          </h3>
          {invoice.client_email && (
            <p className="text-sm" style={{ color: t.subtotal_text_color }}>
              {invoice.client_email}
            </p>
          )}
          {invoice.client_phone && (
            <p className="text-sm" style={{ color: t.subtotal_text_color }}>
              {invoice.client_phone}
            </p>
          )}
          {invoice.client_address && (
            <p className="text-sm" style={{ color: t.subtotal_text_color }}>
              {invoice.client_address}
            </p>
          )}
        </div>
        <div className="text-right text-sm">
          <p>
            <span className="font-medium" style={{ color: t.subtotal_text_color }}>INVOICE DATE :</span>{" "}
            <span className="font-semibold text-black">{formatDate(invoice.invoice_date)}</span>
          </p>
        </div>
      </div>

      {/* ITEM TABLE */}
      <div className="mt-10">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottomWidth: '2px', borderBottomColor: t.border_color }}>
              <th
                className="text-left py-3 font-semibold uppercase tracking-wide"
                style={{ color: t.table_header_text, backgroundColor: t.table_header_bg }}
              >
                Description
              </th>
              <th
                className="text-center py-3 font-semibold uppercase tracking-wide w-20"
                style={{ color: t.table_header_text, backgroundColor: t.table_header_bg }}
              >
                Qty
              </th>
              <th
                className="text-right py-3 font-semibold uppercase tracking-wide"
                style={{ color: t.table_header_text, backgroundColor: t.table_header_bg }}
              >
                Unit Price
              </th>
              <th
                className="text-right py-3 font-semibold uppercase tracking-wide"
                style={{ color: t.table_header_text, backgroundColor: t.table_header_bg }}
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} style={{ borderBottomWidth: '1px', borderBottomColor: t.border_color }}>
                <td className="py-4 font-medium text-black">
                  {item.title || "—"}
                </td>
                <td className="py-4 text-center text-black">{item.qty || 1}</td>
                <td className="py-4 text-right text-black">
                  {formatCurrency(item.unit_price || item.amount)}
                </td>
                <td className="py-4 text-right font-semibold text-black">
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SUMMARY */}
      <div className="flex justify-end mt-8">
        <div className="w-80 text-sm">
          <div
            className="flex justify-between py-3"
            style={{ borderBottomWidth: '1px', borderBottomColor: t.border_color }}
          >
            <span className="font-medium" style={{ color: t.subtotal_text_color }}>Subtotal</span>
            <span className="font-semibold text-black">
              {formatCurrency(invoice.subtotal)}
            </span>
          </div>
          <div
            className="flex justify-between py-3"
            style={{ borderBottomWidth: '1px', borderBottomColor: t.border_color }}
          >
            <span className="font-medium" style={{ color: t.subtotal_text_color }}>Tax</span>
            <span className="font-semibold text-black">
              {formatCurrency(invoice.vat_amount)}
            </span>
          </div>
          <div
            className="flex justify-between py-3"
            style={{ borderBottomWidth: '1px', borderBottomColor: t.border_color }}
          >
            <span className="font-bold text-black">Total</span>
            <span className="font-bold text-black">
              {formatCurrency(invoice.total_amount)}
            </span>
          </div>
          <div
            className="flex justify-between py-3"
            style={{ borderBottomWidth: '1px', borderBottomColor: t.border_color }}
          >
            <span className="font-bold" style={{ color: t.paid_text_color }}>Total Paid</span>
            <span className="font-bold" style={{ color: t.paid_text_color }}>
              {formatCurrency(invoice.paid_amount)}
            </span>
          </div>
          <div
            className="flex justify-between px-4 py-3 mt-2 font-bold"
            style={{
              backgroundColor: invoice.due_amount > 0 ? t.badge_unpaid_color : t.balance_bg_color,
              color: t.balance_text_color,
            }}
          >
            <span>{invoice.due_amount > 0 ? "Balance" : "Paid in Full"}</span>
            <span>{formatCurrency(invoice.due_amount)}</span>
          </div>
        </div>
      </div>

      {/* NOTES */}
      {invoice.notes && (
        <div
          className="mt-10 rounded-lg p-6"
          style={{ borderWidth: '1px', borderColor: t.border_color }}
        >
          <h4 className="font-semibold mb-3 uppercase tracking-wide text-sm" style={{ color: t.primary_color }}>
            Notes / Payment Terms
          </h4>
          <p className="text-sm whitespace-pre-wrap" style={{ color: t.subtotal_text_color }}>
            {invoice.notes}
          </p>
        </div>
      )}

      {/* PAYMENT HISTORY */}
      {installments.length > 0 && (
        <div
          className="mt-10 rounded-lg p-6"
          style={{ borderWidth: '1px', borderColor: t.border_color }}
        >
          <h4 className="font-semibold mb-4 uppercase tracking-wide text-sm" style={{ color: t.primary_color }}>
            Payment History
          </h4>
          <div className="space-y-3">
            {installments.map((pay) => (
              <div
                key={pay.id}
                className="flex justify-between items-center pl-4 py-2"
                style={{ borderLeftWidth: '4px', borderLeftColor: t.border_color }}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-medium" style={{ color: t.primary_color }}>
                    {formatDate(pay.paid_date)}
                  </span>
                  <span
                    className="px-2 py-1 text-white text-xs rounded font-medium"
                    style={{ backgroundColor: t.subtotal_text_color }}
                  >
                    Bank Transfer
                  </span>
                  <span
                    className="px-2 py-1 text-white text-xs rounded font-medium"
                    style={{ backgroundColor: t.accent_color }}
                  >
                    Advance
                  </span>
                  <span className="text-sm" style={{ color: t.subtotal_text_color }}>
                    — Advance Payment
                  </span>
                </div>
                <div className="font-bold text-lg" style={{ color: t.accent_color }}>
                  {formatCurrency(pay.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FOOTER - Using branding settings */}
      <div
        className="mt-12 pt-6"
        style={{ borderTopWidth: '1px', borderTopColor: t.border_color }}
      >
        {/* THANK YOU CENTER (TOP) */}
        <div className="text-center mb-2">
          <p className="text-sm" style={{ color: t.footer_text_color }}>
            {footerThankYou}
          </p>
        </div>

        {/* BOTTOM ROW - Address Left, QR Right */}
        <div className="flex justify-between items-end">
          {/* LEFT SIDE - ADDRESS */}
          <div className="text-xs" style={{ color: t.footer_text_color }}>
            {footerAddress && (
              <p>{footerAddress}</p>
            )}
            {(footerPhone || footerEmail) && (
              <p>{[footerPhone, footerEmail].filter(Boolean).join(", ")}</p>
            )}
            {footerWebsite && (
              <p style={{ color: t.primary_color }}>{footerWebsite}</p>
            )}
          </div>

          {/* RIGHT SIDE - QR */}
          {showQR && (
            <div className="flex flex-col items-center">
              <InvoiceQRCode invoiceId={invoice.id} size={70} />
              <p className="text-xs mt-1" style={{ color: t.footer_text_color }}>
                Scan for details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
