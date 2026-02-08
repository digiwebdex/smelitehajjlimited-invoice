import { cn } from "@/lib/utils";
import { InvoiceQRCode } from "@/components/InvoiceQRCode";
import { ThemeSettings, defaultTheme } from "@/types/theme";

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
}

export const ThemedInvoiceDocument = ({
  invoice,
  items,
  installments,
  company,
  theme,
}: ThemedInvoiceDocumentProps) => {
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
        return { backgroundColor: theme.badge_paid_color, color: "#ffffff" };
      case "partial":
        return { backgroundColor: theme.badge_partial_color, color: "#ffffff" };
      case "unpaid":
      default:
        return { backgroundColor: theme.badge_unpaid_color, color: "#ffffff" };
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-xl p-8 print:shadow-none print:p-0 print:rounded-none">
      {/* HEADER */}
      <div className="flex justify-between items-start pb-6">
        <div className="flex items-center gap-4">
          {company?.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.name}
              className="w-16 h-16 rounded-full object-cover"
              style={{ borderColor: theme.primary_color, borderWidth: '2px' }}
            />
          ) : (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
              style={{ backgroundColor: theme.primary_color, borderColor: theme.primary_color, borderWidth: '2px' }}
            >
              {company?.name?.charAt(0) || "C"}
            </div>
          )}
          <div>
            <h2
              className="text-xl font-bold"
              style={{ color: theme.header_text_color }}
            >
              {company?.name || "Company Name"}
            </h2>
            {company?.tagline && (
              <p className="text-sm italic" style={{ color: theme.header_text_color, opacity: 0.7 }}>
                {company.tagline}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <h1
            className="text-3xl font-bold"
            style={{ color: theme.invoice_title_color }}
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
        style={{ borderTopWidth: '1px', borderTopColor: theme.border_color }}
      >
        <div
          className="pl-4"
          style={{ borderLeftWidth: '4px', borderLeftColor: theme.accent_color }}
        >
          <p className="text-sm uppercase tracking-wide mb-2" style={{ color: theme.subtotal_text_color }}>
            Bill To
          </p>
          <h3 className="font-bold text-lg text-black">
            {invoice.client_name}
          </h3>
          {invoice.client_email && (
            <p className="text-sm" style={{ color: theme.subtotal_text_color }}>
              {invoice.client_email}
            </p>
          )}
          {invoice.client_phone && (
            <p className="text-sm" style={{ color: theme.subtotal_text_color }}>
              {invoice.client_phone}
            </p>
          )}
          {invoice.client_address && (
            <p className="text-sm" style={{ color: theme.subtotal_text_color }}>
              {invoice.client_address}
            </p>
          )}
        </div>
        <div className="text-right text-sm">
          <p>
            <span className="font-medium" style={{ color: theme.subtotal_text_color }}>INVOICE DATE :</span>{" "}
            <span className="font-semibold text-black">{formatDate(invoice.invoice_date)}</span>
          </p>
        </div>
      </div>

      {/* ITEM TABLE */}
      <div className="mt-10">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottomWidth: '2px', borderBottomColor: theme.border_color }}>
              <th
                className="text-left py-3 font-semibold uppercase tracking-wide"
                style={{ color: theme.table_header_text, backgroundColor: theme.table_header_bg }}
              >
                Description
              </th>
              <th
                className="text-center py-3 font-semibold uppercase tracking-wide w-20"
                style={{ color: theme.table_header_text, backgroundColor: theme.table_header_bg }}
              >
                Qty
              </th>
              <th
                className="text-right py-3 font-semibold uppercase tracking-wide"
                style={{ color: theme.table_header_text, backgroundColor: theme.table_header_bg }}
              >
                Unit Price
              </th>
              <th
                className="text-right py-3 font-semibold uppercase tracking-wide"
                style={{ color: theme.table_header_text, backgroundColor: theme.table_header_bg }}
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} style={{ borderBottomWidth: '1px', borderBottomColor: theme.border_color }}>
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
            style={{ borderBottomWidth: '1px', borderBottomColor: theme.border_color }}
          >
            <span className="font-medium" style={{ color: theme.subtotal_text_color }}>Subtotal</span>
            <span className="font-semibold text-black">
              {formatCurrency(invoice.subtotal)}
            </span>
          </div>
          <div
            className="flex justify-between py-3"
            style={{ borderBottomWidth: '1px', borderBottomColor: theme.border_color }}
          >
            <span className="font-medium" style={{ color: theme.subtotal_text_color }}>Tax</span>
            <span className="font-semibold text-black">
              {formatCurrency(invoice.vat_amount)}
            </span>
          </div>
          <div
            className="flex justify-between py-3"
            style={{ borderBottomWidth: '1px', borderBottomColor: theme.border_color }}
          >
            <span className="font-bold text-black">Total</span>
            <span className="font-bold text-black">
              {formatCurrency(invoice.total_amount)}
            </span>
          </div>
          <div
            className="flex justify-between py-3"
            style={{ borderBottomWidth: '1px', borderBottomColor: theme.border_color }}
          >
            <span className="font-bold" style={{ color: theme.paid_text_color }}>Total Paid</span>
            <span className="font-bold" style={{ color: theme.paid_text_color }}>
              {formatCurrency(invoice.paid_amount)}
            </span>
          </div>
          <div
            className="flex justify-between px-4 py-3 mt-2 font-bold"
            style={{
              backgroundColor: invoice.due_amount > 0 ? theme.badge_unpaid_color : theme.balance_bg_color,
              color: theme.balance_text_color,
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
          style={{ borderWidth: '1px', borderColor: theme.border_color }}
        >
          <h4 className="font-semibold mb-3 uppercase tracking-wide text-sm" style={{ color: theme.primary_color }}>
            Notes / Payment Terms
          </h4>
          <p className="text-sm whitespace-pre-wrap" style={{ color: theme.subtotal_text_color }}>
            {invoice.notes}
          </p>
        </div>
      )}

      {/* PAYMENT HISTORY */}
      {installments.length > 0 && (
        <div
          className="mt-10 rounded-lg p-6"
          style={{ borderWidth: '1px', borderColor: theme.border_color }}
        >
          <h4 className="font-semibold mb-4 uppercase tracking-wide text-sm" style={{ color: theme.primary_color }}>
            Payment History
          </h4>
          <div className="space-y-3">
            {installments.map((pay) => (
              <div
                key={pay.id}
                className="flex justify-between items-center pl-4 py-2"
                style={{ borderLeftWidth: '4px', borderLeftColor: theme.border_color }}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-medium" style={{ color: theme.primary_color }}>
                    {formatDate(pay.paid_date)}
                  </span>
                  <span
                    className="px-2 py-1 text-white text-xs rounded font-medium"
                    style={{ backgroundColor: theme.subtotal_text_color }}
                  >
                    Bank Transfer
                  </span>
                  <span
                    className="px-2 py-1 text-white text-xs rounded font-medium"
                    style={{ backgroundColor: theme.accent_color }}
                  >
                    Advance
                  </span>
                  <span className="text-sm" style={{ color: theme.subtotal_text_color }}>
                    — Advance Payment
                  </span>
                </div>
                <div className="font-bold text-lg" style={{ color: theme.accent_color }}>
                  {formatCurrency(pay.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div
        className="flex justify-between items-end mt-12 pt-6"
        style={{ borderTopWidth: '1px', borderTopColor: theme.border_color }}
      >
        <div className="text-center flex-1">
          {company?.email && (
            <p className="text-xs" style={{ color: theme.footer_text_color }}>
              {company.email} • {company.phone}
            </p>
          )}
          {company?.address && (
            <p className="text-xs mt-1" style={{ color: theme.footer_text_color }}>
              {company.address}
            </p>
          )}
          <p className="text-sm mt-2" style={{ color: theme.footer_text_color }}>
            Thank you for staying with us.
          </p>
        </div>
        <div className="text-center">
          <InvoiceQRCode invoiceId={invoice.id} size={70} />
          <p className="text-xs mt-1" style={{ color: theme.footer_text_color }}>Scan for details</p>
        </div>
      </div>
    </div>
  );
};
