import { ThemeSettings, defaultTheme, hexToRgb } from "@/types/theme";
import { BrandSettings, defaultBranding } from "@/types/branding";
import { InvoiceQRCode } from "@/components/InvoiceQRCode";
import { numberToWords } from "@/lib/numberToWords";

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

interface A4PrintTemplateProps {
  invoice: InvoiceData;
  items: InvoiceItemData[];
  installments: InstallmentData[];
  company?: CompanyData | null;
  theme: ThemeSettings;
  branding?: BrandSettings | null;
}

/**
 * A4 Print Template - Fixed 210mm width layout
 * Uses absolute positioning and fixed widths (no flex/grid)
 * Designed for exact print/PDF parity
 */
export const A4PrintTemplate = ({
  invoice,
  items,
  installments,
  company,
  theme,
  branding,
}: A4PrintTemplateProps) => {
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

  // Use company data first, then branding as fallback
  const headerLogo = company?.logo_url || b.company_logo;
  const headerName = company?.name || b.company_name || "Company Name";
  const headerTagline = company?.tagline || b.tagline;

  // Footer settings
  const footerEmail = company?.email || b.email;
  const footerPhone = company?.phone || b.phone;
  const addressLine1 = company?.address_line1 || b.address_line1;
  const addressLine2 = company?.address_line2 || b.address_line2;
  const footerAddress = [addressLine1, addressLine2].filter(Boolean).join(", ") || company?.address;
  const footerThankYou = company?.thank_you_text || b.thank_you_text || "Thank you for staying with us.";
  const showQR = company?.show_qr_code ?? b.show_qr_code ?? true;
  const footerWebsite = company?.website || b.website;

  // Status badge colors
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "paid":
        return { backgroundColor: "#dcfce7", color: "#166534" };
      case "partial":
        return { backgroundColor: "#fef3c7", color: "#92400e" };
      case "unpaid":
      default:
        return { backgroundColor: "#fee2e2", color: "#991b1b" };
    }
  };

  // Fixed dimensions for A4 (210mm width, using px for screen)
  const pageWidth = "210mm";
  const contentPadding = "20mm";

  return (
    <div
      className="a4-print-template"
      style={{
        width: pageWidth,
        minHeight: "297mm",
        backgroundColor: "#ffffff",
        margin: "0 auto",
        padding: contentPadding,
        boxSizing: "border-box",
        fontFamily: "'Noto Serif', 'Times New Roman', serif",
        fontSize: "10pt",
        lineHeight: "1.4",
        color: "#000000",
        position: "relative",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* ===== HEADER SECTION ===== */}
      <div style={{ position: "relative", height: "24mm", marginBottom: "6mm" }}>
        {/* Logo - Left */}
        <div style={{ position: "absolute", left: 0, top: 0 }}>
          {headerLogo ? (
            <img
              src={headerLogo}
              alt={headerName}
              style={{
                width: "18mm",
                height: "18mm",
                borderRadius: "50%",
                objectFit: "cover",
                border: `0.6pt solid ${t.primary_color}`,
              }}
            />
          ) : (
            <div
              style={{
                width: "18mm",
                height: "18mm",
                borderRadius: "50%",
                backgroundColor: t.primary_color,
                border: `0.6pt solid ${t.primary_color}`,
                display: "table-cell",
                verticalAlign: "middle",
                textAlign: "center",
                color: "#ffffff",
                fontSize: "12pt",
                fontWeight: "bold",
              }}
            >
              {headerName?.charAt(0) || "C"}
            </div>
          )}
        </div>

        {/* Company Name - Left of logo */}
        <div style={{ position: "absolute", left: "22mm", top: "2mm" }}>
          <div style={{ color: t.primary_color, fontSize: "13pt", fontWeight: "bold" }}>
            {headerName}
          </div>
          {headerTagline && (
            <div style={{ color: t.header_text_color, fontSize: "8pt", fontStyle: "italic", opacity: 0.7, marginTop: "1mm" }}>
              {headerTagline}
            </div>
          )}
        </div>

        {/* INVOICE Title - Right */}
        <div style={{ position: "absolute", right: 0, top: 0, textAlign: "right" }}>
          <div style={{ color: t.primary_color, fontSize: "22pt", fontWeight: "bold" }}>
            INVOICE
          </div>
          <div style={{ color: "#f97316", fontSize: "11pt", fontWeight: "bold", marginTop: "1mm" }}>
            {invoice.invoice_number}
          </div>
          {/* Status Badge */}
          <div style={{ marginTop: "3mm" }}>
            <span
              style={{
                ...getStatusStyle(invoice.status),
                padding: "2mm 4mm",
                borderRadius: "3mm",
                fontSize: "8pt",
                fontWeight: "600",
                textTransform: "capitalize",
              }}
            >
              {invoice.status}
            </span>
          </div>
        </div>
      </div>

      {/* ===== DIVIDER ===== */}
      <div style={{ borderTop: `0.3pt solid ${t.border_color}`, marginBottom: "6mm" }} />

      {/* ===== BILL TO + DATE SECTION ===== */}
      <div style={{ position: "relative", marginBottom: "10mm" }}>
        {/* Bill To - Left with accent bar */}
        <div style={{ display: "inline-block", width: "60%", verticalAlign: "top" }}>
          <div style={{ borderLeft: `1.5mm solid ${t.accent_color}`, paddingLeft: "4mm" }}>
            <div style={{ color: t.subtotal_text_color, fontSize: "8pt", textTransform: "uppercase", marginBottom: "2mm" }}>
              BILL TO
            </div>
            <div style={{ color: "#000000", fontSize: "11pt", fontWeight: "bold", marginBottom: "1mm" }}>
              {invoice.client_name}
            </div>
            {invoice.client_email && (
              <div style={{ color: t.subtotal_text_color, fontSize: "8pt" }}>
                {invoice.client_email}
              </div>
            )}
            {invoice.client_phone && (
              <div style={{ color: t.subtotal_text_color, fontSize: "8pt" }}>
                {invoice.client_phone}
              </div>
            )}
            {invoice.client_address && (
              <div style={{ color: t.subtotal_text_color, fontSize: "8pt" }}>
                {invoice.client_address}
              </div>
            )}
          </div>
        </div>

        {/* Invoice Date - Right */}
        <div style={{ display: "inline-block", width: "40%", verticalAlign: "top", textAlign: "right" }}>
          <span style={{ color: t.subtotal_text_color, fontSize: "8pt" }}>INVOICE DATE : </span>
          <span style={{ color: "#000000", fontSize: "9pt", fontWeight: "bold" }}>
            {formatDate(invoice.invoice_date)}
          </span>
        </div>
      </div>

      {/* ===== ITEMS TABLE ===== */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "8mm",
        }}
      >
        <thead>
          <tr style={{ borderBottom: `0.5pt solid ${t.border_color}` }}>
            <th style={{ width: "50%", textAlign: "left", padding: "3mm 0", color: t.subtotal_text_color, fontSize: "8pt", fontWeight: "bold", textTransform: "uppercase" }}>
              Description
            </th>
            <th style={{ width: "10%", textAlign: "left", padding: "3mm 0", color: t.subtotal_text_color, fontSize: "8pt", fontWeight: "bold", textTransform: "uppercase" }}>
              Qty
            </th>
            <th style={{ width: "20%", textAlign: "left", padding: "3mm 0", color: t.subtotal_text_color, fontSize: "8pt", fontWeight: "bold", textTransform: "uppercase" }}>
              Unit Price
            </th>
            <th style={{ width: "20%", textAlign: "right", padding: "3mm 0", color: t.subtotal_text_color, fontSize: "8pt", fontWeight: "bold", textTransform: "uppercase" }}>
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} style={{ borderBottom: `0.2pt solid ${t.border_color}` }}>
              <td style={{ padding: "3mm 0", color: "#000000", fontSize: "9pt" }}>
                {item.title || "—"}
              </td>
              <td style={{ padding: "3mm 0", textAlign: "left", color: "#000000", fontSize: "9pt" }}>
                {item.qty || 1}
              </td>
              <td style={{ padding: "3mm 0", textAlign: "left", color: "#000000", fontSize: "9pt" }}>
                {formatCurrency(item.unit_price || item.amount)}
              </td>
              <td style={{ padding: "3mm 0", textAlign: "right", color: "#000000", fontSize: "9pt", fontWeight: "bold" }}>
                {formatCurrency(item.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ===== SUMMARY SECTION ===== */}
      <div style={{ textAlign: "right", marginBottom: "8mm" }}>
        <div style={{ display: "inline-block", width: "75mm" }}>
          {/* Subtotal */}
          <div style={{ borderBottom: `0.2pt solid ${t.border_color}`, padding: "2mm 0" }}>
            <span style={{ float: "left", color: t.subtotal_text_color, fontSize: "9pt" }}>Subtotal</span>
            <span style={{ color: "#000000", fontSize: "9pt", fontWeight: "bold" }}>{formatCurrency(invoice.subtotal)}</span>
            <div style={{ clear: "both" }} />
          </div>

          {/* Tax */}
          <div style={{ borderBottom: `0.2pt solid ${t.border_color}`, padding: "2mm 0" }}>
            <span style={{ float: "left", color: t.subtotal_text_color, fontSize: "9pt" }}>Tax</span>
            <span style={{ color: "#000000", fontSize: "9pt", fontWeight: "bold" }}>{formatCurrency(invoice.vat_amount)}</span>
            <div style={{ clear: "both" }} />
          </div>

          {/* Total */}
          <div style={{ borderBottom: `0.2pt solid ${t.border_color}`, padding: "2mm 0" }}>
            <span style={{ float: "left", color: "#000000", fontSize: "10pt", fontWeight: "bold" }}>Total</span>
            <span style={{ color: "#000000", fontSize: "10pt", fontWeight: "bold" }}>{formatCurrency(invoice.total_amount)}</span>
            <div style={{ clear: "both" }} />
          </div>

          {/* Total Paid */}
          <div style={{ borderBottom: `0.2pt solid ${t.border_color}`, padding: "2mm 0" }}>
            <span style={{ float: "left", color: t.paid_text_color, fontSize: "9pt", fontWeight: "bold" }}>Total Paid</span>
            <span style={{ color: t.paid_text_color, fontSize: "9pt", fontWeight: "bold" }}>{formatCurrency(invoice.paid_amount)}</span>
            <div style={{ clear: "both" }} />
          </div>

          {/* Balance Box */}
          <div
            style={{
              backgroundColor: invoice.due_amount > 0 ? t.badge_unpaid_color : t.balance_bg_color,
              color: t.balance_text_color,
              padding: "3mm",
              marginTop: "2mm",
              fontWeight: "bold",
              fontSize: "9pt",
            }}
          >
            <span style={{ float: "left" }}>{invoice.due_amount > 0 ? "Balance" : "Paid in Full"}</span>
            <span>{formatCurrency(invoice.due_amount)}</span>
            <div style={{ clear: "both" }} />
          </div>
          {/* In Word */}
          <div style={{ marginTop: "2mm", fontSize: "8pt", color: t.subtotal_text_color }}>
            <span style={{ fontWeight: "bold" }}>In Word : </span>
            <span>{numberToWords(invoice.due_amount > 0 ? invoice.due_amount : invoice.total_amount)} Taka Only</span>
          </div>
        </div>
      </div>

      {/* ===== NOTES SECTION ===== */}
      {invoice.notes && (
        <div style={{ border: `0.3pt solid ${t.border_color}`, padding: "4mm", marginBottom: "6mm" }}>
          <div style={{ color: t.primary_color, fontSize: "9pt", fontWeight: "bold", marginBottom: "2mm", textTransform: "uppercase" }}>
            Notes / Payment Terms
          </div>
          <div style={{ color: t.subtotal_text_color, fontSize: "8pt", whiteSpace: "pre-wrap" }}>
            {invoice.notes}
          </div>
        </div>
      )}

      {/* ===== PAYMENT HISTORY ===== */}
      {installments.length > 0 && (
        <div style={{ border: `0.3pt solid ${t.border_color}`, padding: "4mm", marginBottom: "6mm" }}>
          <div style={{ color: t.primary_color, fontSize: "9pt", fontWeight: "bold", marginBottom: "3mm", textTransform: "uppercase" }}>
            Payment History
          </div>
          {installments.map((pay) => (
            <div key={pay.id} style={{ borderLeft: `1.5mm solid ${t.border_color}`, paddingLeft: "3mm", marginBottom: "3mm" }}>
              <span style={{ color: t.primary_color, fontSize: "8pt", marginRight: "3mm" }}>
                {formatDate(pay.paid_date)}
              </span>
              <span
                style={{
                  backgroundColor: t.subtotal_text_color,
                  color: "#ffffff",
                  padding: "1mm 2mm",
                  fontSize: "6pt",
                  fontWeight: "bold",
                  marginRight: "2mm",
                }}
              >
                Bank Transfer
              </span>
              <span
                style={{
                  backgroundColor: t.accent_color,
                  color: "#ffffff",
                  padding: "1mm 2mm",
                  fontSize: "6pt",
                  fontWeight: "bold",
                  marginRight: "2mm",
                }}
              >
                Advance
              </span>
              <span style={{ color: t.subtotal_text_color, fontSize: "7pt" }}>— Advance Payment</span>
              <span style={{ float: "right", color: t.accent_color, fontSize: "10pt", fontWeight: "bold" }}>
                {formatCurrency(pay.amount)}
              </span>
              <div style={{ clear: "both" }} />
            </div>
          ))}
        </div>
      )}

      {/* ===== SIGNATURE SECTION ===== */}
      <div style={{ marginTop: "16mm", textAlign: "center" }}>
        <div style={{ display: "inline-block", width: "33%", verticalAlign: "bottom", textAlign: "center", padding: "0 3mm" }}>
          <div style={{ borderTop: `0.3pt solid ${t.border_color}`, paddingTop: "2mm" }}>
            <span style={{ fontSize: "8pt", color: t.subtotal_text_color }}>Received by</span>
          </div>
        </div>
        <div style={{ display: "inline-block", width: "33%", verticalAlign: "bottom", textAlign: "center", padding: "0 3mm" }}>
          <div style={{ borderTop: `0.3pt solid ${t.border_color}`, paddingTop: "2mm" }}>
            <span style={{ fontSize: "8pt", color: t.subtotal_text_color }}>Prepared by</span>
          </div>
        </div>
        <div style={{ display: "inline-block", width: "33%", verticalAlign: "bottom", textAlign: "center", padding: "0 3mm" }}>
          <div style={{ borderTop: `0.3pt solid ${t.border_color}`, paddingTop: "2mm" }}>
            <span style={{ fontSize: "8pt", color: t.subtotal_text_color }}>Authorize by</span>
          </div>
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <div
        style={{
          position: "absolute",
          bottom: "20mm",
          left: "20mm",
          right: "20mm",
          borderTop: `0.3pt solid ${t.border_color}`,
          paddingTop: "4mm",
        }}
      >
        {/* Thank You - Center */}
        <div style={{ textAlign: "center", marginBottom: "4mm" }}>
          <span style={{ color: t.footer_text_color, fontSize: "9pt" }}>{footerThankYou}</span>
        </div>

        {/* Bottom Row: Address Left, QR Right */}
        <div style={{ position: "relative" }}>
          {/* Address - Left (Two lines) */}
          <div style={{ display: "inline-block", width: "70%", verticalAlign: "top" }}>
            {addressLine1 && (
              <div style={{ color: t.footer_text_color, fontSize: "7pt" }}>{addressLine1}</div>
            )}
            {addressLine2 && (
              <div style={{ color: t.footer_text_color, fontSize: "7pt" }}>{addressLine2}</div>
            )}
            {(footerPhone || footerEmail) && (
              <div style={{ color: t.footer_text_color, fontSize: "7pt" }}>
                {[footerPhone, footerEmail].filter(Boolean).join(" | ")}
              </div>
            )}
            {footerWebsite && (
              <div style={{ color: t.primary_color, fontSize: "7pt" }}>{footerWebsite}</div>
            )}
          </div>

          {/* QR Code - Right */}
          {showQR && (
            <div style={{ display: "inline-block", width: "30%", textAlign: "right", verticalAlign: "top" }}>
              <div style={{ display: "inline-block" }}>
                <InvoiceQRCode invoiceId={invoice.id} size={60} />
                <div style={{ color: t.footer_text_color, fontSize: "5pt", textAlign: "center", marginTop: "1mm" }}>
                  Scan for details
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
