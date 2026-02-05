import jsPDF from "jspdf";
import QRCode from "qrcode";
import { Invoice, Company } from "@/types";

const formatCurrency = (amount: number): string => {
  return `৳${new Intl.NumberFormat("en-BD", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)}`;
};

const formatDate = (date: Date | undefined): string => {
  if (!date) return "—";
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
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
  const primaryColor: [number, number, number] = [15, 23, 42]; // Primary/Navy
  const accentColor: [number, number, number] = [20, 184, 166]; // Accent/Teal
  const mutedColor: [number, number, number] = [100, 116, 139]; // Muted gray
  const textColor: [number, number, number] = [30, 41, 59]; // Foreground
  const greenColor: [number, number, number] = [22, 163, 74]; // Green-600
  const redColor: [number, number, number] = [220, 38, 38]; // Red-600
  const orangeColor: [number, number, number] = [249, 115, 22]; // Orange-500
  const borderColor: [number, number, number] = [229, 231, 235]; // Gray-200

  let yPos = margin;

  // ===================== HEADER SECTION =====================
  // Company Logo - handle both base64 and URL
  const logoSize = 14;
  let logoDrawn = false;
  
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
          doc.addImage(dataUrl, "JPEG", margin, yPos, logoSize, logoSize);
          logoDrawn = true;
        } catch (e) {
          console.error("Failed to fetch logo:", e);
        }
      } else if (company.logo.startsWith("data:image")) {
        doc.addImage(company.logo, "JPEG", margin, yPos, logoSize, logoSize);
        logoDrawn = true;
      }
    } catch (e) {
      console.error("Failed to add logo:", e);
    }
  }
  
  // Fallback circular logo with company initial
  if (!logoDrawn) {
    doc.setFillColor(...primaryColor);
    doc.circle(margin + logoSize / 2, yPos + logoSize / 2, logoSize / 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(company?.name?.charAt(0) || "C", margin + logoSize / 2, yPos + logoSize / 2 + 3, { align: "center" });
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

  // Invoice number in accent color
  doc.setTextColor(...accentColor);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.invoiceNumber, pageWidth - margin, yPos + 13, { align: "right" });

  yPos += 22;

  // ===================== BILL TO & DATES SECTION =====================
  // Divider line
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 6;

  // Left accent bar for Bill To
  doc.setFillColor(...accentColor);
  doc.rect(margin, yPos, 1.5, 24, "F");

  // Bill To label
  doc.setTextColor(...mutedColor);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("BILL TO", margin + 5, yPos + 4);

  // Invoice Date on right (muted color)
  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  doc.setFont("helvetica", "normal");
  doc.text("INVOICE DATE :", pageWidth - margin - 42, yPos + 4);
  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "bold");
  doc.text(formatDate(invoice.date), pageWidth - margin, yPos + 4, { align: "right" });

  yPos += 8;

  // Client Name (bold, larger)
  doc.setTextColor(...textColor);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.clientName, margin + 5, yPos + 1);

  // Due Date on right (orange color)
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...orangeColor);
  doc.text("DUE DATE :", pageWidth - margin - 42, yPos + 1);
  doc.setFont("helvetica", "bold");
  doc.text(formatDate(invoice.dueDate), pageWidth - margin, yPos + 1, { align: "right" });

  yPos += 6;

  // Client address (muted, smaller)
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mutedColor);

  if (invoice.clientAddress) {
    const addressLines = doc.splitTextToSize(invoice.clientAddress, 90);
    doc.text(addressLines, margin + 5, yPos);
    yPos += addressLines.length * 4;
  }

  yPos += 12;

  // ===================== ITEMS TABLE =====================
  const tableX = margin;
  const descWidth = contentWidth * 0.50;
  const qtyWidth = contentWidth * 0.12;
  const priceWidth = contentWidth * 0.20;
  const totalWidth = contentWidth * 0.18;

  // Table Header with underline
  doc.setTextColor(...mutedColor);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("DESCRIPTION", tableX, yPos);
  doc.text("QTY", tableX + descWidth + qtyWidth / 2, yPos, { align: "center" });
  doc.text("UNIT PRICE", tableX + descWidth + qtyWidth + priceWidth, yPos, { align: "right" });
  doc.text("TOTAL", tableX + contentWidth, yPos, { align: "right" });

  yPos += 3;
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.5);
  doc.line(tableX, yPos, tableX + contentWidth, yPos);
  yPos += 6;

  // Table Rows
  invoice.items.forEach((item) => {
    // Description with underline (accent color link style)
    doc.setTextColor(...accentColor);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const title = item.title || "—";
    doc.text(title, tableX, yPos);
    
    // Underline for description
    const titleWidth = doc.getTextWidth(title);
    doc.setDrawColor(...accentColor);
    doc.setLineWidth(0.2);
    doc.line(tableX, yPos + 1, tableX + titleWidth, yPos + 1);

    // Qty
    doc.setTextColor(...mutedColor);
    doc.text("1", tableX + descWidth + qtyWidth / 2, yPos, { align: "center" });

    // Unit Price
    doc.setTextColor(...textColor);
    doc.text(formatCurrency(item.amount), tableX + descWidth + qtyWidth + priceWidth, yPos, { align: "right" });

    // Total
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(item.amount), tableX + contentWidth, yPos, { align: "right" });

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
    // Payment History header
    doc.setTextColor(...textColor);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Payment History", margin, yPos);
    yPos += 6;

    // Payment entries
    invoice.installments.forEach((inst, index) => {
      // Left accent bar
      doc.setFillColor(...accentColor);
      doc.rect(margin, yPos, 1.5, 8, "F");

      // Date
      doc.setFontSize(8);
      doc.setTextColor(...mutedColor);
      doc.setFont("helvetica", "normal");
      doc.text(formatDate(inst.paidDate), margin + 5, yPos + 5);

      // Payment badge
      doc.setFillColor(...primaryColor);
      doc.roundedRect(margin + 35, yPos + 1, 16, 5, 1, 1, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6);
      doc.setFont("helvetica", "bold");
      doc.text("Payment", margin + 43, yPos + 4.5, { align: "center" });

      // Number badge
      doc.setFillColor(...accentColor);
      doc.roundedRect(margin + 53, yPos + 1, 10, 5, 1, 1, "F");
      doc.setTextColor(255, 255, 255);
      doc.text(`#${index + 1}`, margin + 58, yPos + 4.5, { align: "center" });

      // Amount (accent/teal color)
      doc.setTextColor(...accentColor);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(formatCurrency(inst.amount), pageWidth - margin, yPos + 5, { align: "right" });

      yPos += 12;
    });

    yPos += 4;
  }

  // ===================== FOOTER =====================
  // Position footer at bottom
  const footerY = pageHeight - 30;

  // Divider line
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 6, pageWidth - margin, footerY - 6);

  // Thank you message (accent/teal color like web view)
  doc.setTextColor(...accentColor);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for staying with us.", margin, footerY);

  // Company contact info (muted)
  let footerDetailY = footerY + 5;
  doc.setTextColor(...mutedColor);
  doc.setFontSize(7);
  
  if (company?.email) {
    doc.text(company.email, margin, footerDetailY);
    footerDetailY += 4;
  }
  if (company?.phone) {
    doc.text(company.phone, margin, footerDetailY);
    footerDetailY += 4;
  }
  if (company?.address) {
    const addressLines = doc.splitTextToSize(company.address, 85);
    doc.text(addressLines, margin, footerDetailY);
  }

  // QR Code with labels
  const invoiceUrl = `${window.location.origin}/view/${invoice.id}`;
  try {
    const qrDataUrl = await QRCode.toDataURL(invoiceUrl, {
      width: 100,
      margin: 1,
      errorCorrectionLevel: "M",
    });
    doc.addImage(qrDataUrl, "PNG", pageWidth - margin - 22, footerY - 10, 22, 22);

    // QR Labels
    doc.setFontSize(6);
    doc.setTextColor(...mutedColor);
    doc.text("Scan to view invoice", pageWidth - margin - 11, footerY + 14, { align: "center" });
    doc.text("Scan for details", pageWidth - margin - 11, footerY + 17, { align: "center" });
  } catch (error) {
    console.error("Failed to generate QR code:", error);
  }

  // Save the PDF
  doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
};
