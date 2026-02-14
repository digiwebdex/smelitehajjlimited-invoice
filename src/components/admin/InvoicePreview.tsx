import { ThemeSettings } from "@/types/theme";

interface InvoicePreviewProps {
  theme: ThemeSettings;
}

export const InvoicePreview = ({ theme }: InvoicePreviewProps) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto" style={{ borderColor: theme.border_color, borderWidth: '1px' }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: theme.primary_color }}
          >
            C
          </div>
          <div>
            <h3 className="font-bold" style={{ color: theme.header_text_color }}>Company Name</h3>
            <p className="text-xs text-gray-500">Your tagline here</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold" style={{ color: theme.invoice_title_color }}>INVOICE</h2>
          <p className="text-sm text-orange-500 font-semibold">INV-2026-001</p>
          <span 
            className="inline-block px-2 py-0.5 text-xs font-semibold rounded mt-1 text-white"
            style={{ backgroundColor: theme.badge_paid_color }}
          >
            Paid
          </span>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-4 pl-3" style={{ borderLeftWidth: '3px', borderLeftColor: theme.accent_color }}>
        <p className="text-xs text-gray-500 uppercase">Bill To</p>
        <p className="font-semibold text-black">Client Name</p>
        <p className="text-xs text-gray-500">client@email.com</p>
      </div>

      {/* Table */}
      <div className="mb-4">
        <div 
          className="grid grid-cols-4 text-xs font-semibold py-2 px-2 rounded-t"
          style={{ backgroundColor: theme.table_header_bg, color: theme.table_header_text }}
        >
          <span className="col-span-2">Description</span>
          <span className="text-center">Qty</span>
          <span className="text-right">Total</span>
        </div>
        <div className="grid grid-cols-4 text-sm py-2 px-2" style={{ borderBottomWidth: '1px', borderColor: theme.border_color }}>
          <span className="col-span-2 text-black">Service Item</span>
          <span className="text-center text-black">1</span>
          <span className="text-right text-black font-semibold">৳ 50,000</span>
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-1 text-sm mb-4">
        <div className="flex justify-between" style={{ borderBottomWidth: '1px', borderColor: theme.border_color }}>
          <span style={{ color: theme.subtotal_text_color }}>Subtotal</span>
          <span className="font-semibold text-black">৳ 50,000</span>
        </div>
        <div className="flex justify-between" style={{ borderBottomWidth: '1px', borderColor: theme.border_color }}>
          <span style={{ color: theme.subtotal_text_color }}>Tax (0%)</span>
          <span className="font-semibold text-black">৳ 0</span>
        </div>
        <div className="flex justify-between font-bold" style={{ borderBottomWidth: '1px', borderColor: theme.border_color }}>
          <span className="text-black">Total</span>
          <span className="text-black">৳ 50,000</span>
        </div>
        <div className="flex justify-between" style={{ borderBottomWidth: '1px', borderColor: theme.border_color }}>
          <span style={{ color: theme.paid_text_color }} className="font-semibold">Total Paid</span>
          <span style={{ color: theme.paid_text_color }} className="font-semibold">৳ 50,000</span>
        </div>
        <div 
          className="flex justify-between px-3 py-2 rounded font-bold"
          style={{ backgroundColor: theme.balance_bg_color, color: theme.balance_text_color }}
        >
          <span>Paid in Full</span>
          <span>৳ 0</span>
        </div>
      </div>

      {/* Status Badges Preview */}
      <div className="flex gap-2 mb-4">
        <span 
          className="px-2 py-0.5 text-xs font-semibold rounded-full text-white"
          style={{ backgroundColor: theme.badge_paid_color }}
        >
          Paid
        </span>
        <span 
          className="px-2 py-0.5 text-xs font-semibold rounded-full text-white"
          style={{ backgroundColor: theme.badge_partial_color }}
        >
          Partial
        </span>
        <span 
          className="px-2 py-0.5 text-xs font-semibold rounded-full text-white"
          style={{ backgroundColor: theme.badge_unpaid_color }}
        >
          Unpaid
        </span>
      </div>

      {/* Footer */}
      <div className="text-center pt-3" style={{ borderTopWidth: '1px', borderColor: theme.border_color }}>
        <p className="text-xs" style={{ color: theme.footer_text_color }}>info@company.com • +880 1234-567890</p>
        <p className="text-sm mt-1" style={{ color: theme.footer_text_color }}>Thank you for staying with us.</p>
      </div>
    </div>
  );
};
