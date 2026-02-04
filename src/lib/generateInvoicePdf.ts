import jsPDF from "jspdf";
import QRCode from "qrcode";
import { Invoice, Company } from "@/types";

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-BD", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: Date | undefined): string => {
  if (!date) return "N/A";
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const generateInvoicePdf = async (invoice: Invoice, company?: Company) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate-900
  const accentColor: [number, number, number] = [20, 184, 166]; // Teal-500
  const textColor: [number, number, number] = [30, 41, 59]; // Slate-800
  const mutedColor: [number, number, number] = [100, 116, 139]; // Slate-500
  const lightBg: [number, number, number] = [248, 250, 252]; // Slate-50
  const borderColor: [number, number, number] = [226, 232, 240]; // Slate-200

  // Status colors
  const statusColors: Record<string, [number, number, number]> = {
    paid: [34, 197, 94],
    partial: [234, 179, 8],
    unpaid: [239, 68, 68],
  };

  let yPos = margin;

  // ===================== HEADER SECTION =====================
  // Company Logo or placeholder
  if (company?.logo && company.logo.startsWith("data:image")) {
    try {
      doc.addImage(company.logo, "JPEG", margin, yPos, 14, 14);
    } catch {
      // Fallback to placeholder if image fails
      doc.setFillColor(...accentColor);
      doc.roundedRect(margin, yPos, 14, 14, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      if (company?.name) {
        doc.text(company.name.substring(0, 2).toUpperCase(), margin + 7, yPos + 9, { align: "center" });
      }
    }
  } else {
    doc.setFillColor(...accentColor);
    doc.roundedRect(margin, yPos, 14, 14, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    if (company?.name) {
      doc.text(company.name.substring(0, 2).toUpperCase(), margin + 7, yPos + 9, { align: "center" });
    }
  }

  // Company Name
  doc.setTextColor(...primaryColor);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(company?.name || "Your Company", margin + 18, yPos + 10);

  // INVOICE title on right
  doc.setFontSize(28);
  doc.setTextColor(...accentColor);
  doc.text("INVOICE", pageWidth - margin, yPos + 9, { align: "right" });

  yPos += 25;

  // Divider line
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);

  yPos += 15;

  // ===================== INFO SECTION =====================
  // Left side - Company & Client Info
  const leftColX = margin;
  const rightColX = pageWidth / 2 + 10;

  // FROM section
  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  doc.setFont("helvetica", "bold");
  doc.text("FROM", leftColX, yPos);

  yPos += 6;
  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(company?.name || "Your Company", leftColX, yPos);

  yPos += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  if (company?.address) {
    const addressLines = doc.splitTextToSize(company.address, 70);
    doc.text(addressLines, leftColX, yPos);
    yPos += addressLines.length * 4;
  }
  if (company?.email) {
    doc.text(company.email, leftColX, yPos);
    yPos += 4;
  }
  if (company?.phone) {
    doc.text(company.phone, leftColX, yPos);
  }

  // BILL TO section (right column, same starting Y)
  let billToY = yPos - 19;
  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO", rightColX, billToY);

  billToY += 6;
  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.clientName, rightColX, billToY);

  billToY += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  if (invoice.clientAddress) {
    const clientAddressLines = doc.splitTextToSize(invoice.clientAddress, 70);
    doc.text(clientAddressLines, rightColX, billToY);
    billToY += clientAddressLines.length * 4;
  }
  if (invoice.clientEmail) {
    doc.text(invoice.clientEmail, rightColX, billToY);
    billToY += 4;
  }
  if (invoice.clientPhone) {
    doc.text(invoice.clientPhone, rightColX, billToY);
  }

  yPos = Math.max(yPos, billToY) + 15;

  // ===================== INVOICE DETAILS BOX =====================
  const detailsBoxHeight = 28;
  doc.setFillColor(...lightBg);
  doc.roundedRect(margin, yPos, contentWidth, detailsBoxHeight, 3, 3, "F");
  doc.setDrawColor(...borderColor);
  doc.roundedRect(margin, yPos, contentWidth, detailsBoxHeight, 3, 3, "S");

  const colWidth = contentWidth / 4;
  const detailsY = yPos + 10;

  // Invoice Number
  doc.setFontSize(7);
  doc.setTextColor(...mutedColor);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE NO.", margin + 10, detailsY);
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.invoiceNumber, margin + 10, detailsY + 8);

  // Invoice Date
  doc.setFontSize(7);
  doc.setTextColor(...mutedColor);
  doc.text("INVOICE DATE", margin + colWidth + 10, detailsY);
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "normal");
  doc.text(formatDate(invoice.date), margin + colWidth + 10, detailsY + 8);

  // Due Date
  doc.setFontSize(7);
  doc.setTextColor(...mutedColor);
  doc.setFont("helvetica", "bold");
  doc.text("DUE DATE", margin + colWidth * 2 + 10, detailsY);
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "normal");
  doc.text(formatDate(invoice.dueDate), margin + colWidth * 2 + 10, detailsY + 8);

  // Status
  doc.setFontSize(7);
  doc.setTextColor(...mutedColor);
  doc.setFont("helvetica", "bold");
  doc.text("STATUS", margin + colWidth * 3 + 10, detailsY);

  const statusColor = statusColors[invoice.status] || textColor;
  doc.setFillColor(...statusColor);
  doc.roundedRect(margin + colWidth * 3 + 10, detailsY + 2, 24, 8, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.status.toUpperCase(), margin + colWidth * 3 + 22, detailsY + 7, { align: "center" });

  yPos += detailsBoxHeight + 15;

  // ===================== ITEMS TABLE =====================
  const tableHeaders = ["#", "Description", "Amount"];
  const colWidths = [15, contentWidth - 65, 50];
  const tableX = margin;
  const headerHeight = 12;
  const rowHeight = 10;

  // Table Header
  doc.setFillColor(...primaryColor);
  doc.roundedRect(tableX, yPos, contentWidth, headerHeight, 2, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");

  let headerX = tableX + 5;
  doc.text(tableHeaders[0], headerX, yPos + 8);
  headerX += colWidths[0];
  doc.text(tableHeaders[1], headerX, yPos + 8);
  headerX += colWidths[1];
  doc.text(tableHeaders[2], headerX + colWidths[2] - 5, yPos + 8, { align: "right" });

  yPos += headerHeight;

  // Table Rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  invoice.items.forEach((item, index) => {
    const isEven = index % 2 === 0;
    if (isEven) {
      doc.setFillColor(...lightBg);
      doc.rect(tableX, yPos, contentWidth, rowHeight, "F");
    }

    doc.setDrawColor(...borderColor);
    doc.line(tableX, yPos + rowHeight, tableX + contentWidth, yPos + rowHeight);

    let rowX = tableX + 5;
    doc.setTextColor(...mutedColor);
    doc.text(`${index + 1}`, rowX, yPos + 7);

    rowX += colWidths[0];
    doc.setTextColor(...textColor);
    const title = item.title || "Untitled Item";
    const truncatedTitle = title.length > 45 ? title.substring(0, 42) + "..." : title;
    doc.text(truncatedTitle, rowX, yPos + 7);

    rowX += colWidths[1];
    doc.setFont("helvetica", "bold");
    doc.text(`৳${formatCurrency(item.amount)}`, rowX + colWidths[2] - 5, yPos + 7, { align: "right" });
    doc.setFont("helvetica", "normal");

    yPos += rowHeight;
  });

  yPos += 10;

  // ===================== TOTALS SECTION =====================
  const totalsX = pageWidth - margin - 90;
  const totalsWidth = 90;
  const totalsLabelX = totalsX;
  const totalsValueX = pageWidth - margin - 5;

  // Calculate subtotal (sum of items)
  const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
  const vatRate = invoice.vatRate || 0;
  const vatAmount = invoice.vatAmount || (subtotal * vatRate) / 100;
  const totalWithVat = subtotal + vatAmount;

  // Subtotal
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  doc.setFont("helvetica", "normal");
  doc.text("Subtotal", totalsLabelX, yPos);
  doc.setTextColor(...textColor);
  doc.text(`৳${formatCurrency(subtotal)}`, totalsValueX, yPos, { align: "right" });

  yPos += 8;

  // VAT (if applicable)
  if (vatRate > 0 || vatAmount > 0) {
    doc.setTextColor(...mutedColor);
    doc.text(`VAT (${vatRate}%)`, totalsLabelX, yPos);
    doc.setTextColor(...textColor);
    doc.text(`৳${formatCurrency(vatAmount)}`, totalsValueX, yPos, { align: "right" });
    yPos += 8;
  }

  // Total
  doc.setDrawColor(...borderColor);
  doc.line(totalsX, yPos, pageWidth - margin, yPos);
  yPos += 6;

  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "bold");
  doc.text("Total", totalsLabelX, yPos);
  doc.text(`৳${formatCurrency(totalWithVat)}`, totalsValueX, yPos, { align: "right" });

  yPos += 10;

  // Paid Amount
  doc.setFontSize(9);
  doc.setTextColor(34, 197, 94);
  doc.setFont("helvetica", "normal");
  doc.text("Paid Amount", totalsLabelX, yPos);
  doc.text(`৳${formatCurrency(invoice.paidAmount)}`, totalsValueX, yPos, { align: "right" });

  yPos += 8;

  // Due Amount
  doc.setTextColor(239, 68, 68);
  doc.text("Amount Due", totalsLabelX, yPos);
  doc.setFont("helvetica", "bold");
  doc.text(`৳${formatCurrency(invoice.dueAmount)}`, totalsValueX, yPos, { align: "right" });

  yPos += 15;

  // ===================== AMOUNT DUE BOX =====================
  doc.setFillColor(...accentColor);
  doc.roundedRect(totalsX - 10, yPos, totalsWidth + 10, 20, 3, 3, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("AMOUNT DUE", totalsX, yPos + 8);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`৳${formatCurrency(invoice.dueAmount)}`, totalsValueX - 5, yPos + 14, { align: "right" });

  // ===================== PAYMENT HISTORY =====================
  if (invoice.installments.length > 0) {
    yPos += 35;

    doc.setTextColor(...primaryColor);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Payment History", margin, yPos);

    yPos += 8;

    invoice.installments.forEach((inst, index) => {
      doc.setFillColor(...lightBg);
      doc.roundedRect(margin, yPos, contentWidth, 10, 2, 2, "F");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(34, 197, 94);
      doc.text(`Payment #${index + 1}`, margin + 5, yPos + 7);

      doc.setTextColor(...mutedColor);
      doc.text(formatDate(inst.paidDate), margin + 50, yPos + 7);

      doc.setTextColor(...textColor);
      doc.setFont("helvetica", "bold");
      doc.text(`৳${formatCurrency(inst.amount)}`, pageWidth - margin - 5, yPos + 7, { align: "right" });

      yPos += 12;
    });
  }

  // ===================== FOOTER =====================
  const footerY = pageHeight - 30;

  doc.setDrawColor(...borderColor);
  doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);

  // Generate QR code for invoice URL
  const invoiceUrl = `${window.location.origin}/invoices/${invoice.id}`;
  try {
    const qrDataUrl = await QRCode.toDataURL(invoiceUrl, {
      width: 60,
      margin: 1,
      errorCorrectionLevel: "M",
    });
    doc.addImage(qrDataUrl, "PNG", pageWidth - margin - 25, footerY - 8, 25, 25);
    doc.setFontSize(6);
    doc.setTextColor(...mutedColor);
    doc.text("Scan to view", pageWidth - margin - 12.5, footerY + 20, { align: "center" });
  } catch (error) {
    console.error("Failed to generate QR code:", error);
  }

  doc.setTextColor(...mutedColor);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for your business!", margin + 40, footerY, { align: "center" });

  doc.setFontSize(7);
  doc.text(
    `Generated on ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`,
    margin + 40,
    footerY + 6,
    { align: "center" }
  );

  // Save the PDF with proper naming format
  doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
};
