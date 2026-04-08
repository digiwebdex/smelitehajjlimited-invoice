import jsPDF from "jspdf";
import QRCode from "qrcode";
import { Invoice, Company } from "@/types";
import { ThemeSettings, defaultTheme, hexToRgb } from "@/types/theme";
import { BrandSettings, defaultBranding } from "@/types/branding";
import { numberToWords } from "@/lib/numberToWords";

const getOrdinal = (n: number): string => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const formatCurrency = (amount: number): string => {
  // Use "Tk" instead of "৳" because jsPDF doesn't support Bengali Unicode with default fonts
  return `Tk ${new Intl.NumberFormat("en-BD", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
};

const formatDate = (date: Date | undefined): string => {
  if (!date) return "—";
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const generateInvoicePdf = async (
  invoice: Invoice,
  company?: Company,
  theme?: ThemeSettings,
  branding?: BrandSettings | null
) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  
  const t = theme || defaultTheme;
  const b = branding || defaultBranding;
  
  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Dynamic colors from theme
  const primaryColor = hexToRgb(t.primary_color);
  const accentColor = hexToRgb(t.accent_color);
  const mutedColor = hexToRgb(t.subtotal_text_color);
  const textColor = hexToRgb(t.header_text_color);
  const paidTextColor = hexToRgb(t.paid_text_color);
  const redColor = hexToRgb(t.badge_unpaid_color);
  const orangeColor: [number, number, number] = [249, 115, 22]; // Orange-500 for invoice number
  const borderColor = hexToRgb(t.border_color);
  const footerTextColor = hexToRgb(t.footer_text_color);
  const balanceBgColor = hexToRgb(t.balance_bg_color);
  const balanceTextColor = hexToRgb(t.balance_text_color);

  // Branding settings - company data takes priority over global branding
  const headerName = company?.name || b.company_name || "Company Name";
  const headerTagline = company?.tagline || b.tagline;
  const headerLogo = company?.logo || b.company_logo;
  const footerEmail = company?.email || b.email;
  const footerPhone = company?.phone || b.phone;
  const addressLine1 = company?.address_line1 || b.address_line1;
  const addressLine2 = company?.address_line2 || b.address_line2;
  const footerAddress = [addressLine1, addressLine2].filter(Boolean).join(", ") || company?.address;
  const thankYouText = company?.thank_you_text || b.thank_you_text || "Thank you for staying with us.";
  const showQRCode = company?.show_qr_code ?? b.show_qr_code ?? true;
  const footerWebsite = company?.website || b.website;

  let yPos = margin;

  // ===================== HEADER SECTION =====================
  // Company Logo - circular with blue border
  const logoSize = 18;
  const logoCenterX = margin + logoSize / 2;
  const logoCenterY = yPos + logoSize / 2;
  let logoDrawn = false;
  
  // Helper function to draw circular logo with clean blue border
  const drawCircularLogo = (imageData: string) => {
    // Draw white filled circle as background
    doc.setFillColor(255, 255, 255);
    doc.circle(logoCenterX, logoCenterY, logoSize / 2, "F");
    
    // Add the image inscribed within the circle (side = diameter / √2)
    const imageSize = logoSize * 0.70;
    const imageOffset = (logoSize - imageSize) / 2;
    doc.addImage(imageData, "PNG", margin + imageOffset, yPos + imageOffset, imageSize, imageSize);
    
    // Mask corners outside circle with white arcs (4 corner rectangles)
    const r = logoSize / 2;
    const half = imageSize / 2;
    // Top-left corner
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, yPos, imageOffset, imageOffset, "F");
    // Top-right corner
    doc.rect(margin + logoSize - imageOffset, yPos, imageOffset, imageOffset, "F");
    // Bottom-left corner
    doc.rect(margin, yPos + logoSize - imageOffset, imageOffset, imageOffset, "F");
    // Bottom-right corner
    doc.rect(margin + logoSize - imageOffset, yPos + logoSize - imageOffset, imageOffset, imageOffset, "F");
    
    // Draw single clean blue border on top
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.6);
    doc.circle(logoCenterX, logoCenterY, logoSize / 2, "S");
  };
  
  if (headerLogo) {
    try {
      // For URLs, fetch the image as blob to avoid CORS issues
      if (headerLogo.startsWith("http") || headerLogo.startsWith("https")) {
        try {
          const response = await fetch(headerLogo);
          const blob = await response.blob();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          drawCircularLogo(dataUrl);
          logoDrawn = true;
        } catch (e) {
          console.error("Failed to fetch logo:", e);
        }
      } else if (headerLogo.startsWith("data:image")) {
        drawCircularLogo(headerLogo);
        logoDrawn = true;
      }
    } catch (e) {
      console.error("Failed to add logo:", e);
    }
  }
  
  // Fallback circular logo with company initial and blue border
  if (!logoDrawn) {
    // Draw blue border
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.4);
    doc.circle(logoCenterX, logoCenterY, logoSize / 2, "S");
    
    // Fill with primary color
    doc.setFillColor(...primaryColor);
    doc.circle(logoCenterX, logoCenterY, logoSize / 2 - 0.6, "F");
    
    // Add initial text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(headerName?.charAt(0) || "C", logoCenterX, logoCenterY + 3.5, { align: "center" });
  }

  // Company Name and Tagline
  const companyInfoX = margin + logoSize + 4;
  doc.setTextColor(...primaryColor);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(headerName, companyInfoX, yPos + 6);

  if (headerTagline) {
    doc.setTextColor(...mutedColor);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(headerTagline, companyInfoX, yPos + 11);
  }

  // INVOICE title on right
  doc.setTextColor(...primaryColor);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", pageWidth - margin, yPos + 6, { align: "right" });

  // Invoice number in orange color (matching web view)
  doc.setTextColor(...orangeColor);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.invoiceNumber, pageWidth - margin, yPos + 13, { align: "right" });

  // Status badge - positioned below invoice number
  const statusColors: Record<string, [number, number, number]> = {
    paid: [22, 163, 74], // Green-600
    partial: [202, 138, 4], // Yellow-600
    unpaid: [220, 38, 38], // Red-600
  };
  const statusBgColors: Record<string, [number, number, number]> = {
    paid: [220, 252, 231], // Green-100
    partial: [254, 249, 195], // Yellow-100
    unpaid: [254, 226, 226], // Red-100
  };
  const statusColor = statusColors[invoice.status] || statusColors.unpaid;
  const statusBgColor = statusBgColors[invoice.status] || statusBgColors.unpaid;
  const statusText = invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1);
  const statusWidth = doc.getTextWidth(statusText) + 8;
  
  doc.setFillColor(...statusBgColor);
  doc.roundedRect(pageWidth - margin - statusWidth, yPos + 16, statusWidth, 6, 3, 3, "F");
  doc.setTextColor(...statusColor);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(statusText, pageWidth - margin - statusWidth / 2, yPos + 20.5, { align: "center" });

  yPos += 22;

  // ===================== BILL TO & DATES SECTION =====================
  // Divider line
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 6;

  // Calculate height for Bill To section based on content
  let billToHeight = 20; // Base height
  if (invoice.clientEmail) billToHeight += 4;
  if (invoice.clientPhone) billToHeight += 4;
  if (invoice.clientAddress) billToHeight += 4;

  // Left accent bar for Bill To
  doc.setFillColor(...accentColor);
  doc.rect(margin, yPos, 1.5, billToHeight, "F");

  // Bill To label
  doc.setTextColor(...mutedColor);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("BILL TO", margin + 5, yPos + 4);

  // Invoice Date on right (muted color)
  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  doc.setFont("helvetica", "normal");
  doc.text("INVOICE DATE :", pageWidth - margin - 48, yPos + 4);
  doc.setTextColor(0, 0, 0); // Black
  doc.setFont("helvetica", "bold");
  doc.text(formatDate(invoice.date), pageWidth - margin, yPos + 4, { align: "right" });

  yPos += 8;

  // Client Name (bold, larger, black)
  doc.setTextColor(0, 0, 0); // Black
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.clientName, margin + 5, yPos + 1);

  yPos += 6;

  // Client details (muted, smaller) - email, phone, address separately
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mutedColor);

  if (invoice.clientEmail) {
    doc.text(invoice.clientEmail, margin + 5, yPos);
    yPos += 4;
  }
  
  if (invoice.clientPhone) {
    doc.text(invoice.clientPhone, margin + 5, yPos);
    yPos += 4;
  }

  if (invoice.clientAddress) {
    const addressLines = doc.splitTextToSize(invoice.clientAddress, 90);
    doc.text(addressLines, margin + 5, yPos);
    yPos += addressLines.length * 4;
  }

  yPos += 10;

  // ===================== ITEMS TABLE =====================
  const tableX = margin;

  // Column widths (match web layout: Qty left, Unit Price left, Total right)
  const descColWidth = contentWidth * 0.50;
  const qtyColWidth = contentWidth * 0.10;
  const unitColWidth = contentWidth * 0.20;

  const descX = tableX;
  const qtyX = tableX + descColWidth;
  const unitX = tableX + descColWidth + qtyColWidth;
  const totalRightX = tableX + contentWidth;

  // Table Header with underline
  doc.setTextColor(...mutedColor);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("DESCRIPTION", descX, yPos);
  doc.text("QTY", qtyX, yPos);
  doc.text("UNIT PRICE", unitX, yPos);
  doc.text("TOTAL", totalRightX, yPos, { align: "right" });

  yPos += 3;
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.5);
  doc.line(tableX, yPos, tableX + contentWidth, yPos);
  yPos += 2;

  // Table Rows (wrap description; vertically center all columns within the row)
  const lineHeight = 4.2;
  const minRowHeight = 7;
  invoice.items.forEach((item) => {
    const rowTopY = yPos;

    // Description (wrap within description column)
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    const title = item.title || "—";
    const titleLines = doc.splitTextToSize(title, descColWidth - 2);

    const textBlockHeight = titleLines.length * lineHeight;
    const totalRowHeight = Math.max(textBlockHeight + 2.8, minRowHeight);

    // Vertical center Y for single-line columns (baseline offset ~0.8mm)
    const yCenter = rowTopY + totalRowHeight / 2 + 0.8;

    // Description text - vertically centered
    const descStartY = rowTopY + (totalRowHeight - textBlockHeight) / 2 + lineHeight * 0.7;
    doc.text(titleLines, descX, descStartY);

    // Qty (left aligned, vertically centered)
    const qty = item.qty || 1;
    doc.setTextColor(0, 0, 0);
    doc.text(qty.toString(), qtyX, yCenter);

    // Unit Price (left aligned, vertically centered)
    const unitPrice = item.unitPrice || item.amount;
    doc.setTextColor(0, 0, 0);
    doc.text(formatCurrency(unitPrice), unitX, yCenter);

    // Total (right, bold, vertically centered)
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(item.amount), totalRightX, yCenter, { align: "right" });

    // Advance cursor + divider
    yPos = rowTopY + totalRowHeight;
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.2);
    doc.line(tableX, yPos, tableX + contentWidth, yPos);
    yPos += 2;
  });

  yPos += 2;

  // ===================== SUMMARY SECTION =====================
  const summaryX = pageWidth - margin - 75;
  const summaryWidth = 75;

  // Subtotal
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  doc.setFont("helvetica", "normal");
  doc.text("Subtotal", summaryX, yPos);
  doc.setTextColor(0, 0, 0); // Black
  doc.setFont("helvetica", "bold");
  const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
  doc.text(formatCurrency(subtotal), pageWidth - margin, yPos, { align: "right" });

  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.2);
  doc.line(summaryX, yPos + 3, pageWidth - margin, yPos + 3);
  yPos += 9;

  // Tax
  const vatRate = invoice.vatRate || 0;
  const vatAmount = invoice.vatAmount || (subtotal * vatRate) / 100;
  doc.setTextColor(...mutedColor);
  doc.setFont("helvetica", "normal");
  doc.text("Tax", summaryX, yPos);
  doc.setTextColor(0, 0, 0); // Black
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(vatAmount), pageWidth - margin, yPos, { align: "right" });

  doc.line(summaryX, yPos + 3, pageWidth - margin, yPos + 3);
  yPos += 9;

  // Total (bold, larger)
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0); // Black
  doc.setFont("helvetica", "bold");
  doc.text("Total", summaryX, yPos);
  const totalWithVat = subtotal + vatAmount;
  doc.text(formatCurrency(totalWithVat), pageWidth - margin, yPos, { align: "right" });

  doc.line(summaryX, yPos + 3, pageWidth - margin, yPos + 3);
  yPos += 9;

  // Total Paid (themed color)
  doc.setFontSize(9);
  doc.setTextColor(...paidTextColor);
  doc.setFont("helvetica", "bold");
  doc.text("Total Paid", summaryX, yPos);
  doc.text(formatCurrency(invoice.paidAmount), pageWidth - margin, yPos, { align: "right" });

  doc.line(summaryX, yPos + 3, pageWidth - margin, yPos + 3);
  yPos += 9;

  // Balance Box (themed colors)
  const balanceBoxBg = invoice.dueAmount > 0 ? redColor : balanceBgColor;
  doc.setFillColor(...balanceBoxBg);
  doc.rect(summaryX, yPos - 3, summaryWidth, 9, "F");

  doc.setTextColor(...balanceTextColor);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  const balanceLabel = invoice.dueAmount > 0 ? "Balance" : "Paid in Full";
  doc.text(balanceLabel, summaryX + 3, yPos + 2);
  doc.text(formatCurrency(invoice.dueAmount), pageWidth - margin - 3, yPos + 2, { align: "right" });

  yPos += 10;

  // In Word
  const inWordAmount = invoice.dueAmount > 0 ? invoice.dueAmount : totalWithVat;
  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  doc.setFont("helvetica", "bold");
  const inWordLabel = "In Word : ";
  const inWordLabelWidth = doc.getTextWidth(inWordLabel);
  doc.text(inWordLabel, summaryX, yPos);
  doc.setFont("helvetica", "normal");
  const inWordText = numberToWords(inWordAmount) + " Taka Only";
  const inWordLines = doc.splitTextToSize(inWordText, summaryWidth - inWordLabelWidth - 2);
  if (inWordLines.length === 1) {
    doc.text(inWordLines[0], summaryX + inWordLabelWidth, yPos);
  } else {
    // First line after label, rest lines aligned to label start
    doc.text(inWordLines[0], summaryX + inWordLabelWidth, yPos);
    for (let i = 1; i < inWordLines.length; i++) {
      yPos += 3.5;
      doc.text(inWordLines[i], summaryX, yPos);
    }
  }

  yPos += 10;

  // ===================== NOTES SECTION =====================
  if (invoice.notes) {
    // Notes section box
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    
    const notesLines = doc.splitTextToSize(invoice.notes, contentWidth - 10);
    const notesBoxHeight = 10 + notesLines.length * 4;
    doc.roundedRect(margin, yPos, contentWidth, notesBoxHeight, 2, 2, "S");
    
    yPos += 6;
    
    // Notes header
    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("NOTES / PAYMENT TERMS", margin + 5, yPos);
    yPos += 6;
    
    // Notes content
    doc.setFontSize(8);
    doc.setTextColor(...mutedColor);
    doc.setFont("helvetica", "normal");
    doc.text(notesLines, margin + 5, yPos);
    yPos += notesLines.length * 4 + 4;
  }

  // ===================== PAYMENT HISTORY =====================
  if (invoice.installments.length > 0) {
    // Payment History section box
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    const historyBoxHeight = 10 + invoice.installments.length * 12;
    doc.roundedRect(margin, yPos, contentWidth, historyBoxHeight, 2, 2, "S");
    
    yPos += 6;
    
    // Payment History header
    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("PAYMENT HISTORY", margin + 5, yPos);
    yPos += 6;

    // Payment entries
    invoice.installments.forEach((inst, idx) => {
      // Left accent bar (gray)
      doc.setFillColor(209, 213, 219); // Gray-300
      doc.rect(margin + 5, yPos, 1.5, 8, "F");

      // Date
      doc.setFontSize(8);
      doc.setTextColor(...textColor);
      doc.setFont("helvetica", "normal");
      doc.text(formatDate(inst.paidDate), margin + 10, yPos + 5);

      // Payment method badge (gray)
      const methodText = inst.paymentMethod || "Bank Transfer";
      const methodWidth = Math.max(doc.getTextWidth(methodText) + 4, 22);
      doc.setFillColor(156, 163, 175); // Gray-400
      doc.roundedRect(margin + 50, yPos + 1, methodWidth, 5, 1, 1, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6);
      doc.setFont("helvetica", "bold");
      doc.text(methodText, margin + 50 + methodWidth / 2, yPos + 4.5, { align: "center" });

      // Description
      doc.setTextColor(...mutedColor);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(`— ${getOrdinal(idx + 1)} Payment`, margin + 50 + methodWidth + 3, yPos + 5);

      // Amount (teal color, bold)
      doc.setTextColor(...accentColor);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(formatCurrency(inst.amount), pageWidth - margin - 5, yPos + 5, { align: "right" });

      yPos += 12;
    });

    yPos += 4;
  }

  // ===================== SIGNATURE SECTION =====================
  const footerYRef = pageHeight - 32;
  const sigY = footerYRef - 18;
  const signLineWidth = 40;
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);

  // Left: Received by (starts at left margin)
  const leftSignX = margin;
  doc.line(leftSignX, sigY, leftSignX + signLineWidth, sigY);

  // Center: Prepared by
  const centerSignX = pageWidth / 2 - signLineWidth / 2;
  doc.line(centerSignX, sigY, centerSignX + signLineWidth, sigY);

  // Right: Authorize by (ends at right margin)
  const rightSignX = pageWidth - margin - signLineWidth;
  doc.line(rightSignX, sigY, rightSignX + signLineWidth, sigY);

  const labels = ["Received by", "Prepared by", "Authorize by"];
  const labelXPositions = [leftSignX + signLineWidth / 2, pageWidth / 2, rightSignX + signLineWidth / 2];
  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  doc.setFont("helvetica", "normal");
  for (let i = 0; i < 3; i++) {
    doc.text(labels[i], labelXPositions[i], sigY + 5, { align: "center" });
  }

  // ===================== FOOTER =====================
  // Position footer at bottom
  const footerY = pageHeight - 32;

  // Divider line
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 6, pageWidth - margin, footerY - 6);

  // THANK YOU MESSAGE - Centered at top of footer
  doc.setTextColor(...footerTextColor);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(thankYouText, pageWidth / 2, footerY, { align: "center" });

  // BOTTOM ROW - Address on left, QR on right
  const bottomRowY = footerY + 6;
  
  // LEFT SIDE - Address details
  doc.setTextColor(...footerTextColor);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  
  let addressY = bottomRowY;
  if (addressLine1) {
    doc.text(addressLine1, margin, addressY);
    addressY += 3.5;
  }
  if (addressLine2) {
    doc.text(addressLine2, margin, addressY);
    addressY += 3.5;
  }
  if (footerPhone) {
    doc.text(footerPhone, margin, addressY);
    addressY += 3.5;
  }
  if (footerEmail) {
    doc.text(footerEmail, margin, addressY);
    addressY += 3.5;
  }
  if (footerWebsite) {
    doc.setTextColor(...primaryColor);
    doc.text(footerWebsite, margin, addressY);
  }

  // RIGHT SIDE - QR Code
  if (showQRCode) {
    const qrSize = 22;
    const invoiceUrl = `${window.location.origin}/view/${invoice.id}`;
    const qrX = pageWidth - margin - qrSize;
    const qrY = bottomRowY - 2;
    
    try {
      const qrDataUrl = await QRCode.toDataURL(invoiceUrl, {
        width: 110,
        margin: 1,
        errorCorrectionLevel: "M",
      });
      doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

      // QR Labels - centered below QR code
      doc.setFontSize(5);
      doc.setTextColor(...footerTextColor);
      doc.text("Scan to view invoice", qrX + qrSize / 2, qrY + qrSize + 2.5, { align: "center" });
      doc.text("Scan for details", qrX + qrSize / 2, qrY + qrSize + 5, { align: "center" });
    } catch (error) {
      console.error("Failed to generate QR code:", error);
    }
  }

  // Save the PDF
  doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
};
