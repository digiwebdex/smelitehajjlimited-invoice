import jsPDF from "jspdf";
import QRCode from "qrcode";
import { Invoice, Company } from "@/types";

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

export const generateInvoicePdf = async (invoice: Invoice, company?: Company) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  
  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Colors matching the invoice view page exactly
  const primaryColor: [number, number, number] = [46, 65, 158]; // Primary/Mid-blue
  const accentColor: [number, number, number] = [20, 184, 166]; // Accent/Teal
  const mutedColor: [number, number, number] = [100, 116, 139]; // Muted gray
  const textColor: [number, number, number] = [40, 56, 138]; // Foreground/Dark blue
  const greenColor: [number, number, number] = [22, 163, 74]; // Green-600
  const redColor: [number, number, number] = [220, 38, 38]; // Red-600
  const orangeColor: [number, number, number] = [249, 115, 22]; // Orange-500
  const borderColor: [number, number, number] = [229, 231, 235]; // Gray-200

  let yPos = margin;

  // ===================== HEADER SECTION =====================
  // Company Logo - circular with clipping
  const logoSize = 16;
  const logoCenterX = margin + logoSize / 2;
  const logoCenterY = yPos + logoSize / 2;
  let logoDrawn = false;
  
  // Helper function to draw circular logo
  const drawCircularLogo = (imageData: string) => {
    // Draw circular border/background first
    doc.setDrawColor(229, 231, 235); // Gray border
    doc.setLineWidth(0.5);
    doc.circle(logoCenterX, logoCenterY, logoSize / 2, "S");
    
    // Add the image (it will be square, but we create visual circular effect)
    doc.addImage(imageData, "PNG", margin, yPos, logoSize, logoSize);
  };
  
  if (company?.logo) {
    try {
      // For URLs, fetch the image as blob to avoid CORS issues
      if (company.logo.startsWith("http") || company.logo.startsWith("https")) {
        try {
          const response = await fetch(company.logo);
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
      } else if (company.logo.startsWith("data:image")) {
        drawCircularLogo(company.logo);
        logoDrawn = true;
      }
    } catch (e) {
      console.error("Failed to add logo:", e);
    }
  }
  
  // Fallback circular logo with company initial
  if (!logoDrawn) {
    doc.setFillColor(...primaryColor);
    doc.circle(logoCenterX, logoCenterY, logoSize / 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(company?.name?.charAt(0) || "C", logoCenterX, logoCenterY + 3, { align: "center" });
  }

  // Company Name and Tagline
  const companyInfoX = margin + logoSize + 4;
  doc.setTextColor(...primaryColor);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(company?.name || "Company Name", companyInfoX, yPos + 6);

  if (company?.tagline) {
    doc.setTextColor(...mutedColor);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(company.tagline, companyInfoX, yPos + 11);
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
  doc.roundedRect(pageWidth - margin - statusWidth, yPos + 16, statusWidth, 6, 2, 2, "F");
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
  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "bold");
  doc.text(formatDate(invoice.date), pageWidth - margin, yPos + 4, { align: "right" });

  yPos += 8;

  // Client Name (bold, larger)
  doc.setTextColor(...textColor);
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
  // Fixed column positions for proper alignment
  const col1X = tableX; // Description - left aligned
  const col2X = tableX + contentWidth * 0.55; // Qty - center aligned
  const col3X = tableX + contentWidth * 0.75; // Unit Price - right aligned
  const col4X = tableX + contentWidth; // Total - right aligned

  // Table Header with underline
  doc.setTextColor(...mutedColor);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("DESCRIPTION", col1X, yPos);
  doc.text("QTY", col2X, yPos, { align: "center" });
  doc.text("UNIT PRICE", col3X, yPos, { align: "right" });
  doc.text("TOTAL", col4X, yPos, { align: "right" });

  yPos += 3;
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.5);
  doc.line(tableX, yPos, tableX + contentWidth, yPos);
  yPos += 6;

  // Table Rows
  invoice.items.forEach((item) => {
    // Description (black color - matching web view)
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const title = item.title || "—";
    doc.text(title, col1X, yPos);

    // Qty - centered
    doc.setTextColor(...mutedColor);
    doc.text("1", col2X, yPos, { align: "center" });

    // Unit Price - right aligned
    doc.setTextColor(...textColor);
    doc.text(formatCurrency(item.amount), col3X, yPos, { align: "right" });

    // Total - right aligned, bold
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(item.amount), col4X, yPos, { align: "right" });

    yPos += 8;
    
    // Row divider
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.2);
    doc.line(tableX, yPos - 2, tableX + contentWidth, yPos - 2);
  });

  yPos += 8;

  // ===================== SUMMARY SECTION =====================
  const summaryX = pageWidth - margin - 75;
  const summaryWidth = 75;

  // Subtotal
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  doc.setFont("helvetica", "normal");
  doc.text("Subtotal", summaryX, yPos);
  doc.setTextColor(...textColor);
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
  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(vatAmount), pageWidth - margin, yPos, { align: "right" });

  doc.line(summaryX, yPos + 3, pageWidth - margin, yPos + 3);
  yPos += 9;

  // Total (bold, larger)
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "bold");
  doc.text("Total", summaryX, yPos);
  const totalWithVat = subtotal + vatAmount;
  doc.text(formatCurrency(totalWithVat), pageWidth - margin, yPos, { align: "right" });

  doc.line(summaryX, yPos + 3, pageWidth - margin, yPos + 3);
  yPos += 9;

  // Total Paid (orange color - matching web view)
  doc.setFontSize(9);
  doc.setTextColor(...orangeColor);
  doc.setFont("helvetica", "bold");
  doc.text("Total Paid", summaryX, yPos);
  doc.text(formatCurrency(invoice.paidAmount), pageWidth - margin, yPos, { align: "right" });

  doc.line(summaryX, yPos + 3, pageWidth - margin, yPos + 3);
  yPos += 9;

  // Balance Box (red for due, green for paid - matching web view exactly)
  const balanceColor = invoice.dueAmount > 0 ? redColor : greenColor;
  doc.setFillColor(...balanceColor);
  doc.rect(summaryX, yPos - 3, summaryWidth, 9, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  const balanceLabel = invoice.dueAmount > 0 ? "Balance" : "Paid in Full";
  doc.text(balanceLabel, summaryX + 3, yPos + 2);
  doc.text(formatCurrency(invoice.dueAmount), pageWidth - margin - 3, yPos + 2, { align: "right" });

  yPos += 16;

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
    invoice.installments.forEach((inst, index) => {
      // Left accent bar (gray)
      doc.setFillColor(209, 213, 219); // Gray-300
      doc.rect(margin + 5, yPos, 1.5, 8, "F");

      // Date
      doc.setFontSize(8);
      doc.setTextColor(...textColor);
      doc.setFont("helvetica", "normal");
      doc.text(formatDate(inst.paidDate), margin + 10, yPos + 5);

      // Bank Transfer badge (gray)
      doc.setFillColor(156, 163, 175); // Gray-400
      doc.roundedRect(margin + 50, yPos + 1, 22, 5, 1, 1, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6);
      doc.setFont("helvetica", "bold");
      doc.text("Bank Transfer", margin + 61, yPos + 4.5, { align: "center" });

      // Advance badge (teal/accent)
      doc.setFillColor(...accentColor);
      doc.roundedRect(margin + 74, yPos + 1, 14, 5, 1, 1, "F");
      doc.setTextColor(255, 255, 255);
      doc.text("Advance", margin + 81, yPos + 4.5, { align: "center" });

      // Description
      doc.setTextColor(...mutedColor);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("— Advance Payment", margin + 90, yPos + 5);

      // Amount (teal color, bold)
      doc.setTextColor(...accentColor);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(formatCurrency(inst.amount), pageWidth - margin - 5, yPos + 5, { align: "right" });

      yPos += 12;
    });

    yPos += 4;
  }

  // ===================== FOOTER =====================
  // Position footer at bottom
  const footerY = pageHeight - 28;

  // Divider line
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 8, pageWidth - margin, footerY - 8);

  // QR Code - positioned on the right side
  const invoiceUrl = `${window.location.origin}/view/${invoice.id}`;
  const qrSize = 22;
  const qrX = pageWidth - margin - qrSize;
  const qrY = footerY - 4;
  
  try {
    const qrDataUrl = await QRCode.toDataURL(invoiceUrl, {
      width: 110,
      margin: 1,
      errorCorrectionLevel: "M",
    });
    doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

    // QR Label - centered below QR code
    doc.setFontSize(6);
    doc.setTextColor(...mutedColor);
    doc.text("Scan to view invoice", qrX + qrSize / 2, qrY + qrSize + 3, { align: "center" });
  } catch (error) {
    console.error("Failed to generate QR code:", error);
  }

  // Thank you message (accent/teal color like web view)
  doc.setTextColor(...accentColor);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for staying with us.", margin, footerY);

  // Company contact info (muted) - left side, below thank you
  let footerDetailY = footerY + 5;
  doc.setTextColor(...mutedColor);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  
  if (company?.email) {
    doc.text(company.email, margin, footerDetailY);
    footerDetailY += 4;
  }
  if (company?.phone) {
    doc.text(company.phone, margin, footerDetailY);
    footerDetailY += 4;
  }
  if (company?.address) {
    const addressLines = doc.splitTextToSize(company.address, 80);
    doc.text(addressLines, margin, footerDetailY);
  }

  // Save the PDF
  doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
};
