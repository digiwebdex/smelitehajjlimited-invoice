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
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Colors matching the invoice view page
  const primaryColor: [number, number, number] = [15, 23, 42]; // Primary/Navy
  const accentColor: [number, number, number] = [20, 184, 166]; // Accent/Teal
  const mutedColor: [number, number, number] = [100, 116, 139]; // Muted gray
  const textColor: [number, number, number] = [30, 41, 59]; // Foreground
  const greenColor: [number, number, number] = [22, 163, 74]; // Green-600
  const redColor: [number, number, number] = [220, 38, 38]; // Red-600
  const borderColor: [number, number, number] = [229, 231, 235]; // Gray-200
  const lightBgColor: [number, number, number] = [249, 250, 251]; // Gray-50

  let yPos = margin;

  // ===================== HEADER SECTION =====================
  // Company Logo (circular)
  const logoSize = 16;
  if (company?.logo && company.logo.startsWith("data:image")) {
    try {
      doc.addImage(company.logo, "JPEG", margin, yPos, logoSize, logoSize);
    } catch {
      // Fallback placeholder circle
      doc.setFillColor(...primaryColor);
      doc.circle(margin + logoSize / 2, yPos + logoSize / 2, logoSize / 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(company?.name?.charAt(0) || "C", margin + logoSize / 2, yPos + logoSize / 2 + 3, { align: "center" });
    }
  } else {
    doc.setFillColor(...primaryColor);
    doc.circle(margin + logoSize / 2, yPos + logoSize / 2, logoSize / 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(company?.name?.charAt(0) || "C", margin + logoSize / 2, yPos + logoSize / 2 + 3, { align: "center" });
  }

  // Company Name and Details
  const companyInfoX = margin + logoSize + 4;
  doc.setTextColor(...primaryColor);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(company?.name || "Company Name", companyInfoX, yPos + 6);

  if (company?.tagline) {
    doc.setTextColor(...mutedColor);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(company.tagline, companyInfoX, yPos + 11);
  }

  doc.setTextColor(...mutedColor);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  if (company?.email) {
    doc.text(company.email, companyInfoX, yPos + 15);
  }
  if (company?.phone) {
    doc.text(company.phone, companyInfoX, yPos + 19);
  }

  // INVOICE title on right
  doc.setTextColor(...primaryColor);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", pageWidth - margin, yPos + 6, { align: "right" });

  // Invoice number in accent color
  doc.setTextColor(...accentColor);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.invoiceNumber, pageWidth - margin, yPos + 13, { align: "right" });

  // Status badge
  const statusColors: Record<string, { bg: [number, number, number]; text: [number, number, number] }> = {
    paid: { bg: [220, 252, 231], text: [22, 101, 52] }, // green
    partial: { bg: [254, 249, 195], text: [133, 77, 14] }, // yellow
    unpaid: { bg: [254, 226, 226], text: [153, 27, 27] }, // red
  };
  const statusStyle = statusColors[invoice.status] || statusColors.unpaid;
  const statusText = invoice.status.toUpperCase();
  const statusWidth = 20;
  const statusHeight = 6;
  const statusX = pageWidth - margin - statusWidth;
  const statusY = yPos + 16;

  doc.setFillColor(...statusStyle.bg);
  doc.roundedRect(statusX, statusY, statusWidth, statusHeight, 2, 2, "F");
  doc.setTextColor(...statusStyle.text);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text(statusText, statusX + statusWidth / 2, statusY + 4.2, { align: "center" });

  yPos += 28;

  // Header divider
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageWidth - margin, yPos);

  yPos += 10;

  // ===================== BILL TO & DATES SECTION =====================
  // Bill To label
  doc.setTextColor(...mutedColor);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("BILL TO", margin, yPos);

  yPos += 5;

  // Client Name
  doc.setTextColor(...textColor);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.clientName, margin, yPos);

  // Dates on right
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mutedColor);
  doc.text("Invoice Date:", pageWidth - margin - 50, yPos - 5);
  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "bold");
  doc.text(formatDate(invoice.date), pageWidth - margin, yPos - 5, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mutedColor);
  doc.text("Due Date:", pageWidth - margin - 50, yPos + 1);
  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "bold");
  doc.text(formatDate(invoice.dueDate), pageWidth - margin, yPos + 1, { align: "right" });

  yPos += 5;

  // Client details
  doc.setFontSize(9);
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
    const addressLines = doc.splitTextToSize(invoice.clientAddress, 80);
    doc.text(addressLines, margin, yPos);
    yPos += addressLines.length * 4;
  }

  yPos += 10;

  // ===================== ITEMS TABLE =====================
  const tableX = margin;
  const colWidths = [12, contentWidth - 52, 40];
  const headerHeight = 8;
  const rowHeight = 10;

  // Table Header
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.5);
  doc.line(tableX, yPos + headerHeight, tableX + contentWidth, yPos + headerHeight);

  doc.setTextColor(...mutedColor);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("#", tableX, yPos + 5);
  doc.text("DESCRIPTION", tableX + colWidths[0], yPos + 5);
  doc.text("AMOUNT", tableX + contentWidth, yPos + 5, { align: "right" });

  yPos += headerHeight + 2;

  // Table Rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  invoice.items.forEach((item, index) => {
    // Row number
    doc.setTextColor(...mutedColor);
    doc.text(`${index + 1}`, tableX, yPos + 5);

    // Description
    doc.setTextColor(...textColor);
    doc.setFont("helvetica", "bold");
    const title = item.title || "—";
    const truncatedTitle = title.length > 50 ? title.substring(0, 47) + "..." : title;
    doc.text(truncatedTitle, tableX + colWidths[0], yPos + 5);

    // Amount
    doc.text(formatCurrency(item.amount), tableX + contentWidth, yPos + 5, { align: "right" });

    yPos += rowHeight;

    // Row border
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.1);
    doc.line(tableX, yPos - 2, tableX + contentWidth, yPos - 2);
  });

  yPos += 10;

  // ===================== SUMMARY SECTION =====================
  const summaryX = pageWidth - margin - 72;
  const summaryWidth = 72;

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

  // Total line
  doc.setDrawColor(...borderColor);
  doc.line(summaryX, yPos, pageWidth - margin, yPos);
  yPos += 5;

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
  doc.setFont("helvetica", "bold");
  doc.text("Total Paid", summaryX, yPos);
  doc.text(formatCurrency(invoice.paidAmount), pageWidth - margin, yPos, { align: "right" });

  yPos += 8;

  // Balance Due Box
  const balanceBoxHeight = 10;
  const balanceColor = invoice.dueAmount > 0 ? redColor : greenColor;
  doc.setFillColor(...balanceColor);
  doc.roundedRect(summaryX, yPos - 2, summaryWidth, balanceBoxHeight, 2, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  const balanceLabel = invoice.dueAmount > 0 ? "Balance Due" : "Paid in Full";
  doc.text(balanceLabel, summaryX + 4, yPos + 4);
  doc.text(formatCurrency(invoice.dueAmount), pageWidth - margin - 4, yPos + 4, { align: "right" });

  yPos += balanceBoxHeight + 12;

  // ===================== PAYMENT HISTORY =====================
  if (invoice.installments.length > 0) {
    // Payment History Box
    doc.setFillColor(...lightBgColor);
    doc.setDrawColor(...borderColor);
    const paymentBoxHeight = 12 + (invoice.installments.length * 12);
    doc.roundedRect(margin, yPos, contentWidth, paymentBoxHeight, 2, 2, "FD");

    yPos += 6;

    // Header
    doc.setTextColor(...textColor);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("PAYMENT HISTORY", margin + 6, yPos);

    yPos += 6;

    // Payment entries
    invoice.installments.forEach((inst, index) => {
      // Payment row background
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...borderColor);
      doc.roundedRect(margin + 4, yPos, contentWidth - 8, 10, 1, 1, "FD");

      doc.setFontSize(8);
      doc.setTextColor(...mutedColor);
      doc.setFont("helvetica", "bold");
      doc.text(`#${index + 1}`, margin + 8, yPos + 6);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...textColor);
      doc.text(formatDate(inst.paidDate), margin + 20, yPos + 6);

      doc.setTextColor(...greenColor);
      doc.setFont("helvetica", "bold");
      doc.text(formatCurrency(inst.amount), pageWidth - margin - 8, yPos + 6, { align: "right" });

      yPos += 12;
    });

    yPos += 6;
  }

  // ===================== FOOTER =====================
  // Ensure footer is at bottom of page
  const footerY = Math.max(yPos + 10, pageHeight - 40);

  // Footer divider
  doc.setDrawColor(...borderColor);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  // Thank you message
  doc.setTextColor(...mutedColor);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for your business!", margin, footerY + 8);

  // Company address
  if (company?.address) {
    doc.setFontSize(7);
    const addressLines = doc.splitTextToSize(company.address, 70);
    doc.text(addressLines, margin, footerY + 14);
  }

  // Generation date
  doc.setFontSize(7);
  doc.text(`Generated on ${formatDate(new Date())}`, margin, footerY + 22);

  // QR Code
  const invoiceUrl = `${window.location.origin}/view/${invoice.id}`;
  try {
    const qrDataUrl = await QRCode.toDataURL(invoiceUrl, {
      width: 100,
      margin: 1,
      errorCorrectionLevel: "M",
    });
    doc.addImage(qrDataUrl, "PNG", pageWidth - margin - 22, footerY + 4, 22, 22);

    // Scan label
    doc.setFontSize(6);
    doc.setTextColor(...mutedColor);
    doc.text("Scan to view invoice", pageWidth - margin - 11, footerY + 28, { align: "center" });
  } catch (error) {
    console.error("Failed to generate QR code:", error);
  }

  // Save the PDF
  doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
};
