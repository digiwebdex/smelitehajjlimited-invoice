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

  // Colors matching the invoice view page
  const primaryColor: [number, number, number] = [15, 23, 42]; // Primary/Navy
  const accentColor: [number, number, number] = [20, 184, 166]; // Accent/Teal
  const mutedColor: [number, number, number] = [100, 116, 139]; // Muted gray
  const textColor: [number, number, number] = [30, 41, 59]; // Foreground
  const greenColor: [number, number, number] = [22, 163, 74]; // Green-600
  const redColor: [number, number, number] = [220, 38, 38]; // Red-600
  const borderColor: [number, number, number] = [229, 231, 235]; // Gray-200

  let yPos = margin;

  // ===================== HEADER SECTION =====================
  // Company Logo (circular)
  const logoSize = 14;
  if (company?.logo && company.logo.startsWith("data:image")) {
    try {
      doc.addImage(company.logo, "JPEG", margin, yPos, logoSize, logoSize);
    } catch {
      doc.setFillColor(...primaryColor);
      doc.circle(margin + logoSize / 2, yPos + logoSize / 2, logoSize / 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(company?.name?.charAt(0) || "C", margin + logoSize / 2, yPos + logoSize / 2 + 3, { align: "center" });
    }
  } else {
    doc.setFillColor(...primaryColor);
    doc.circle(margin + logoSize / 2, yPos + logoSize / 2, logoSize / 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(company?.name?.charAt(0) || "C", margin + logoSize / 2, yPos + logoSize / 2 + 3, { align: "center" });
  }

  // Company Name and Details
  const companyInfoX = margin + logoSize + 4;
  doc.setTextColor(...primaryColor);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(company?.name || "Company Name", companyInfoX, yPos + 5);

  if (company?.tagline) {
    doc.setTextColor(...mutedColor);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(company.tagline, companyInfoX, yPos + 10);
  }

  doc.setTextColor(...mutedColor);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  let companyDetailY = yPos + (company?.tagline ? 14 : 10);
  if (company?.email) {
    doc.text(company.email, companyInfoX, companyDetailY);
    companyDetailY += 4;
  }
  if (company?.phone) {
    doc.text(company.phone, companyInfoX, companyDetailY);
  }

  // INVOICE title on right
  doc.setTextColor(...primaryColor);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", pageWidth - margin, yPos + 5, { align: "right" });

  // Invoice number in accent color
  doc.setTextColor(...accentColor);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.invoiceNumber, pageWidth - margin, yPos + 12, { align: "right" });

  // Status badge with proper colors
  const statusColors: Record<string, { bg: [number, number, number]; text: [number, number, number] }> = {
    paid: { bg: [34, 197, 94], text: [255, 255, 255] }, // Green with white text
    partial: { bg: [234, 179, 8], text: [255, 255, 255] }, // Yellow with white text
    unpaid: { bg: [239, 68, 68], text: [255, 255, 255] }, // Red with white text
  };
  const statusStyle = statusColors[invoice.status] || statusColors.unpaid;
  const statusText = invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1);
  const statusWidth = 18;
  const statusHeight = 6;
  const statusX = pageWidth - margin - statusWidth;
  const statusY = yPos + 15;

  doc.setFillColor(...statusStyle.bg);
  doc.roundedRect(statusX, statusY, statusWidth, statusHeight, 3, 3, "F");
  doc.setTextColor(...statusStyle.text);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text(statusText, statusX + statusWidth / 2, statusY + 4.2, { align: "center" });

  yPos += 28;

  // ===================== BILL TO & DATES SECTION =====================
  // Bill To label
  doc.setTextColor(...mutedColor);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("BILL TO", margin, yPos);

  // Dates on right
  doc.setTextColor(...accentColor);
  doc.setFontSize(8);
  doc.text("Invoice Date:", pageWidth - margin - 45, yPos);
  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "bold");
  doc.text(formatDate(invoice.date), pageWidth - margin, yPos, { align: "right" });

  yPos += 5;

  // Client Name
  doc.setTextColor(...textColor);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.clientName, margin, yPos);

  // Due Date
  doc.setTextColor(...accentColor);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Due Date:", pageWidth - margin - 45, yPos);
  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "bold");
  doc.text(formatDate(invoice.dueDate), pageWidth - margin, yPos, { align: "right" });

  yPos += 4;

  // Client details
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mutedColor);

  if (invoice.clientEmail) {
    doc.text(invoice.clientEmail, margin, yPos);
    yPos += 4;
  }
  if (invoice.clientPhone) {
    doc.text(invoice.clientPhone, margin, yPos);
    yPos += 4;
  }
  if (invoice.clientAddress) {
    doc.text(invoice.clientAddress, margin, yPos);
    yPos += 4;
  }

  yPos += 8;

  // ===================== ITEMS TABLE =====================
  const tableX = margin;
  const colWidths = [10, contentWidth - 45, 35];
  const rowHeight = 8;

  // Table Header
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.line(tableX, yPos + 6, tableX + contentWidth, yPos + 6);

  doc.setTextColor(...mutedColor);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("#", tableX, yPos + 4);
  doc.text("DESCRIPTION", tableX + colWidths[0], yPos + 4);
  doc.text("AMOUNT", tableX + contentWidth, yPos + 4, { align: "right" });

  yPos += 10;

  // Table Rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  invoice.items.forEach((item, index) => {
    // Row number
    doc.setTextColor(...mutedColor);
    doc.text(`${index + 1}`, tableX, yPos + 4);

    // Description
    doc.setTextColor(...textColor);
    doc.setFont("helvetica", "bold");
    const title = item.title || "—";
    doc.text(title, tableX + colWidths[0], yPos + 4);

    // Amount
    doc.text(formatCurrency(item.amount), tableX + contentWidth, yPos + 4, { align: "right" });

    yPos += rowHeight;
  });

  yPos += 10;

  // ===================== SUMMARY SECTION =====================
  const summaryX = pageWidth - margin - 65;

  // Subtotal
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  doc.setFont("helvetica", "normal");
  doc.text("Subtotal", summaryX, yPos);
  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "bold");
  const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
  doc.text(formatCurrency(subtotal), pageWidth - margin, yPos, { align: "right" });

  yPos += 6;

  // VAT (if applicable)
  const vatRate = invoice.vatRate || 0;
  const vatAmount = invoice.vatAmount || (subtotal * vatRate) / 100;
  if (vatRate > 0 || vatAmount > 0) {
    doc.setTextColor(...mutedColor);
    doc.setFont("helvetica", "normal");
    doc.text(`VAT (${vatRate}%)`, summaryX, yPos);
    doc.setTextColor(...textColor);
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(vatAmount), pageWidth - margin, yPos, { align: "right" });
    yPos += 6;
  }

  yPos += 2;

  // Total
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "bold");
  doc.text("Total", summaryX, yPos);
  const totalWithVat = subtotal + vatAmount;
  doc.text(formatCurrency(totalWithVat), pageWidth - margin, yPos, { align: "right" });

  yPos += 6;

  // Total Paid (green)
  doc.setFontSize(9);
  doc.setTextColor(...greenColor);
  doc.setFont("helvetica", "normal");
  doc.text("Total Paid", summaryX, yPos);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(invoice.paidAmount), pageWidth - margin, yPos, { align: "right" });

  yPos += 8;

  // Balance Due Box
  const balanceBoxWidth = 65;
  const balanceBoxHeight = 8;
  const balanceColor = invoice.dueAmount > 0 ? redColor : greenColor;
  doc.setFillColor(...balanceColor);
  doc.roundedRect(summaryX, yPos - 2, balanceBoxWidth, balanceBoxHeight, 2, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  const balanceLabel = invoice.dueAmount > 0 ? "Balance Due" : "Paid in Full";
  doc.text(balanceLabel, summaryX + 4, yPos + 3);
  doc.text(formatCurrency(invoice.dueAmount), pageWidth - margin - 4, yPos + 3, { align: "right" });

  yPos += balanceBoxHeight + 10;

  // ===================== PAYMENT HISTORY =====================
  if (invoice.installments.length > 0) {
    // Payment History Header
    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("PAYMENT HISTORY", margin, yPos);

    yPos += 6;

    // Payment entries (simple list without borders)
    invoice.installments.forEach((inst, index) => {
      doc.setFontSize(8);
      doc.setTextColor(...mutedColor);
      doc.setFont("helvetica", "bold");
      doc.text(`#${index + 1}`, margin, yPos + 4);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...accentColor);
      doc.text(formatDate(inst.paidDate), margin + 10, yPos + 4);

      doc.setTextColor(...greenColor);
      doc.setFont("helvetica", "bold");
      doc.text(formatCurrency(inst.amount), pageWidth - margin, yPos + 4, { align: "right" });

      yPos += 8;
    });

    yPos += 6;
  }

  // ===================== FOOTER =====================
  // Position footer at bottom
  const footerY = pageHeight - 30;

  // Thank you message
  doc.setTextColor(...accentColor);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for your business!", margin, footerY);

  // Company email and phone
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

  // Company address
  if (company?.address) {
    const addressLines = doc.splitTextToSize(company.address, 80);
    doc.text(addressLines, margin, footerDetailY);
    footerDetailY += addressLines.length * 3;
  }

  // Generation date
  doc.text(`Generated on ${formatDate(new Date())}`, margin, footerDetailY + 2);

  // QR Code
  const invoiceUrl = `${window.location.origin}/view/${invoice.id}`;
  try {
    const qrDataUrl = await QRCode.toDataURL(invoiceUrl, {
      width: 100,
      margin: 1,
      errorCorrectionLevel: "M",
    });
    doc.addImage(qrDataUrl, "PNG", pageWidth - margin - 20, footerY - 5, 20, 20);

    // Scan label
    doc.setFontSize(6);
    doc.setTextColor(...mutedColor);
    doc.text("Scan to view invoice", pageWidth - margin - 10, footerY + 17, { align: "center" });
  } catch (error) {
    console.error("Failed to generate QR code:", error);
  }

  // Save the PDF
  doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
};
