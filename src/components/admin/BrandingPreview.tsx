import { BrandSettings } from "@/types/branding";
import { useTheme } from "@/hooks/useTheme";
import { defaultTheme } from "@/types/theme";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";

interface BrandingPreviewProps {
  branding: BrandSettings;
}

export function BrandingPreview({ branding }: BrandingPreviewProps) {
  const { data: theme } = useTheme();
  const t = theme || defaultTheme;

  const footerAlignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[branding.footer_alignment || "center"];

  return (
    <div className="border rounded-lg overflow-hidden bg-white text-sm">
      {/* Header Preview */}
      <div className="p-4 border-b" style={{ borderColor: t.border_color }}>
        <div className="flex items-center gap-3">
          {branding.company_logo ? (
            <img
              src={branding.company_logo}
              alt={branding.company_name}
              className="w-12 h-12 rounded-full object-cover"
              style={{ borderColor: t.primary_color, borderWidth: "2px" }}
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: t.primary_color }}
            >
              {branding.company_name?.charAt(0) || "C"}
            </div>
          )}
          <div>
            <h3 className="font-bold" style={{ color: t.header_text_color }}>
              {branding.company_name || "Company Name"}
            </h3>
            {branding.tagline && (
              <p className="text-xs italic" style={{ color: t.header_text_color, opacity: 0.7 }}>
                {branding.tagline}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content Placeholder */}
      <div className="p-4 space-y-2">
        <div className="h-3 bg-muted rounded w-3/4"></div>
        <div className="h-3 bg-muted rounded w-1/2"></div>
        <div className="h-3 bg-muted rounded w-2/3"></div>
        <div className="h-8 bg-muted/50 rounded mt-4"></div>
        <div className="h-8 bg-muted/50 rounded"></div>
      </div>

      {/* Footer Preview */}
      <div
        className="p-4 border-t"
        style={{ borderColor: t.border_color }}
      >
        <div className={cn("flex items-end gap-4", {
          "justify-start": branding.footer_alignment === "left",
          "justify-center": branding.footer_alignment === "center",
          "justify-end": branding.footer_alignment === "right",
        })}>
          <div className={cn("flex-1", footerAlignClass)}>
            {branding.email && branding.phone && (
              <p className="text-xs" style={{ color: t.footer_text_color }}>
                {branding.email} • {branding.phone}
              </p>
            )}
            {branding.address_line1 && (
              <p className="text-xs mt-1" style={{ color: t.footer_text_color }}>
                {branding.address_line1}
              </p>
            )}
            {branding.address_line2 && (
              <p className="text-xs" style={{ color: t.footer_text_color }}>
                {branding.address_line2}
              </p>
            )}
            {branding.website && (
              <p className="text-xs mt-1" style={{ color: t.primary_color }}>
                {branding.website}
              </p>
            )}
            <p className="text-xs mt-2" style={{ color: t.footer_text_color }}>
              {branding.thank_you_text || "Thank you for staying with us."}
            </p>
          </div>
          {branding.show_qr_code && (
            <div className="flex flex-col items-center">
              <div className="bg-white p-1 rounded border">
                <QRCodeSVG value="https://example.com/invoice/123" size={50} />
              </div>
              <p className="text-[8px] mt-1" style={{ color: t.footer_text_color }}>
                Scan for details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
