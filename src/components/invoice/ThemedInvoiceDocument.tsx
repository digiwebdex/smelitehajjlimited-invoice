import { cn } from "@/lib/utils";
import { InvoiceQRCode } from "@/components/InvoiceQRCode";
import { ThemeSettings, defaultTheme } from "@/types/theme";
import { BrandSettings, defaultBranding } from "@/types/branding";
import { numberToWords } from "@/lib/numberToWords";
import { getInvoiceFooterDetails } from "@/lib/invoiceFooter";

const getOrdinal = (n: number): string => {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
};

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
  payment_method?: string;
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
  pdfMode?: boolean;
}

export const ThemedInvoiceDocument = ({
  invoice,
  items,
  installments,
  company,
  theme,
  branding,
  pdfMode = false,
}: ThemedInvoiceDocumentProps) => {
  const t = theme || defaultTheme;
  const b = branding || defaultBranding;

  const currencySymbol = "৳";
  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${new Intl.NumberFormat("en-BD", {
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

  const {
    addressLine1,
    addressLine2,
    footerAlign,
    footerEmail,
    footerPhone,
    footerThankYou,
    footerWebsite,
    showQR,
  } = getInvoiceFooterDetails(company, branding);

  const footerAlignClass = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end",
  }[footerAlign];

  return (
    <div
      className={cn(
        "bg-white shadow-lg rounded-xl p-8 print:shadow-none print:p-0 print:rounded-none",
        pdfMode && "flex flex-col"
      )}
      style={pdfMode ? { minHeight: "1040px" } : undefined}
    >
      {/* HEADER */}
      <div className="flex justify-between items-start pb-4">
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
              className="inline-block text-sm font-medium rounded-full capitalize"
              style={{
                ...getStatusBadgeStyle(invoice.status),
                lineHeight: "26px",
                height: "26px",
                padding: "0 14px",
                verticalAlign: "middle",
                whiteSpace: "nowrap",
              }}
            >
              {invoice.status}
            </span>
          </div>
        </div>
      </div>

      {/* BILL TO + DATES */}
      <div
        className="flex justify-between mt-4 pt-4"
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

      {/* UNIFIED ITEM + SUMMARY TABLE — matches A4/PDF layout exactly */}
      <div className="mt-4">
        <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
          <colgroup>
            <col style={{ width: "50%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "20%" }} />
          </colgroup>
          <thead>
            <tr style={{ borderBottomWidth: '1px', borderBottomColor: t.border_color }}>
              <th className="text-left py-2 font-semibold uppercase tracking-wide text-xs" style={{ color: t.table_header_text }}>
                Description
              </th>
              <th className="text-left py-2 font-semibold uppercase tracking-wide text-xs" style={{ color: t.table_header_text }}>
                Qty
              </th>
              <th className="text-left py-2 font-semibold uppercase tracking-wide text-xs" style={{ color: t.table_header_text }}>
                Unit Price
              </th>
              <th className="text-right py-2 font-semibold uppercase tracking-wide text-xs" style={{ color: t.table_header_text }}>
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} style={{ borderBottomWidth: '1px', borderBottomColor: t.border_color }}>
                <td className="font-medium text-black uppercase leading-tight" style={{ verticalAlign: "top", paddingTop: "6px", paddingBottom: "3px" }}>
                  {item.title || "—"}
                </td>
                <td className="text-left text-black leading-tight" style={{ verticalAlign: "top", paddingTop: "6px", paddingBottom: "3px" }}>{item.qty || 1}</td>
                <td className="text-left text-black leading-tight" style={{ verticalAlign: "top", paddingTop: "6px", paddingBottom: "3px" }}>
                  {formatCurrency(item.unit_price || item.amount)}
                </td>
                <td className="text-right font-semibold text-black leading-tight" style={{ verticalAlign: "top", paddingTop: "6px", paddingBottom: "3px" }}>
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}

            {/* Spacer */}
            <tr><td colSpan={4} style={{ height: "2px" }} /></tr>

            {/* Subtotal */}
            <tr>
              <td colSpan={2} />
              <td className={cn("py-0.5", "text-sm leading-tight")} style={{ color: t.subtotal_text_color }}>Subtotal</td>
              <td className={cn("py-0.5", "text-right text-sm font-semibold text-black leading-tight")}>{formatCurrency(invoice.subtotal)}</td>
            </tr>
            {/* Tax */}
            <tr>
              <td colSpan={2} />
              <td className={cn("py-0.5", "text-sm leading-tight")} style={{ color: t.subtotal_text_color }}>Tax</td>
              <td className={cn("py-0.5", "text-right text-sm font-semibold text-black leading-tight")}>{formatCurrency(invoice.vat_amount)}</td>
            </tr>
            {/* Total */}
            <tr>
              <td colSpan={2} />
              <td className={cn("py-0.5", "font-bold text-black leading-tight")}>Total</td>
              <td className={cn("py-0.5", "text-right font-bold text-black leading-tight")}>{formatCurrency(invoice.total_amount)}</td>
            </tr>
            {/* Total Paid */}
            <tr>
              <td colSpan={2} />
              <td className={cn("py-0.5", "font-bold leading-tight")} style={{ color: t.paid_text_color }}>Total Paid</td>
              <td className={cn("py-0.5", "text-right font-bold leading-tight")} style={{ color: t.paid_text_color }}>{formatCurrency(invoice.paid_amount)}</td>
            </tr>
            {/* Balance / Paid in Full */}
            <tr>
              <td colSpan={2} />
              <td
                colSpan={2}
                style={{
                  backgroundColor: invoice.due_amount > 0 ? t.badge_unpaid_color : t.balance_bg_color,
                  color: t.balance_text_color,
                  padding: "5px 12px",
                  fontWeight: "bold",
                }}
              >
                <div className="flex justify-between">
                  <span>{invoice.due_amount > 0 ? "Balance" : "Paid in Full"}</span>
                  <span>{formatCurrency(invoice.due_amount)}</span>
                </div>
              </td>
            </tr>
            {/* In Word */}
            <tr>
              <td colSpan={2} />
              <td colSpan={2} className={cn("pt-2", "text-xs break-words leading-tight")} style={{ color: t.subtotal_text_color, overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                <span className="font-semibold">In Word : </span>
                <span>{numberToWords(invoice.due_amount > 0 ? invoice.due_amount : invoice.total_amount)} Taka Only</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* NOTES */}
      {invoice.notes && (
        <div
          className="mt-4 rounded-lg p-4"
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
          className="mt-4 rounded-lg p-4"
          style={{ borderWidth: '1px', borderColor: t.border_color }}
        >
          <h4 className="font-semibold mb-4 uppercase tracking-wide text-sm" style={{ color: t.primary_color }}>
            Payment History
          </h4>
          <div className="space-y-2">
            {installments.map((pay, idx) => (
              <div
                key={pay.id}
                className="flex justify-between items-center pl-4 py-1"
                style={{ borderLeftWidth: '4px', borderLeftColor: t.border_color }}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-medium" style={{ color: t.primary_color }}>
                    {formatDate(pay.paid_date)}
                  </span>
                  <span
                    className="inline-block text-xs rounded-full font-medium capitalize"
                    style={{
                      backgroundColor: "#cbd5e1",
                      color: "#1f2937",
                      lineHeight: "22px",
                      height: "22px",
                      padding: "0 12px",
                      verticalAlign: "middle",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {pay.payment_method || "Bank Transfer"}
                  </span>
                  <span className="text-sm" style={{ color: t.subtotal_text_color }}>
                    — {getOrdinal(idx + 1)} Payment
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

      {/* SIGNATURE + FOOTER wrapper pushed to bottom */}
      <div data-pdf-footer className={cn("mt-6", pdfMode && "mt-auto pt-2")}>
        {/* SIGNATURE SECTION */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
          {[
            { label: "Received by", sig: b.signature_received_by },
            { label: "Prepared by", sig: b.signature_prepared_by },
            { label: "Authorize by", sig: b.signature_authorize_by },
          ].map((item) => (
            <div key={item.label} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ height: "24px", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                {item.sig && (
                  <img src={item.sig} alt={item.label} style={{ height: "24px", objectFit: "contain" }} />
                )}
              </div>
              <div style={{ borderTop: `1px solid ${t.border_color}`, paddingTop: "4px" }}>
                <span className="text-xs" style={{ color: t.subtotal_text_color }}>{item.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* THANK YOU - centered below signatures */}
        <div className="text-center mt-2">
          <p className="text-sm" style={{ color: t.footer_text_color }}>
            {footerThankYou}
          </p>
        </div>

        {/* BOTTOM ROW - Address Left, QR Right */}
        <div className="flex justify-between items-end mt-3">
          <div className="text-xs leading-relaxed" style={{ color: t.footer_text_color }}>
            {addressLine1 && <p>{addressLine1}</p>}
            {addressLine2 && <p>{addressLine2}</p>}
            {footerPhone && <p>{footerPhone}</p>}
            {footerEmail && <p>{footerEmail}</p>}
            {footerWebsite && (
              <p style={{ color: t.primary_color }}>
                <span className="font-semibold">Website : </span>{footerWebsite}
              </p>
            )}
          </div>

          {showQR && (
            <div className="flex flex-col items-center">
              <InvoiceQRCode invoiceId={invoice.id} size={64} />
              <p className="text-xs mt-1" style={{ color: t.footer_text_color }}>
                Scan the QR code for details
              </p>
            </div>
          )}
        </div>
      </div> {/* end signature+footer wrapper */}
    </div>
  );
};
