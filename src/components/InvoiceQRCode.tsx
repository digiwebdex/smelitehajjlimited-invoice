import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";

interface InvoiceQRCodeProps {
  invoiceId: string;
  size?: number;
  className?: string;
  showLabel?: boolean;
}

export function InvoiceQRCode({
  invoiceId,
  size = 80,
  className,
  showLabel = true,
}: InvoiceQRCodeProps) {
   const invoiceUrl = `${window.location.origin}/view/${invoiceId}`;

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className="bg-white p-2 rounded-lg border border-border">
        <QRCodeSVG
          value={invoiceUrl}
          size={size}
          level="M"
          includeMargin={false}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-muted-foreground text-center">
          Scan to view invoice
        </p>
      )}
    </div>
  );
}
