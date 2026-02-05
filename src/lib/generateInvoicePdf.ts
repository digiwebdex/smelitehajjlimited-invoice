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
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Use Times font for professional serif look (similar to Noto Serif/MoolBoran)
  const serifFont = "times";

  // Colors matching reference design
  const navyColor: [number, number, number] = [30, 58, 90];
  const orangeColor: [number, number, number] = [245, 158, 11];
  const greenColor: [number, number, number] = [34, 197, 94];
  const redColor: [number, number, number] = [239, 68, 68];
  const grayColor: [number, number, number] = [107, 114, 128];
  const lightGrayColor: [number, number, number] = [156, 163, 175];
  const textColor: [number, number, number] = [55, 65, 81];
  const borderColor: [number, number, number] = [229, 231, 235];

  let yPos = margin;

  // ===================== HEADER SECTION =====================
  // Company Logo (circular)
  const logoSize = 18;
  if (company?.logo && company.logo.startsWith("data:image")) {
    try {
      // Draw circular clip background
      doc.setFillColor(250, 245, 235); // Cream background
      doc.circle(margin + logoSize / 2, yPos + logoSize / 2, logoSize / 2, "F");
      doc.addImage(company.logo, "JPEG", margin, yPos, logoSize, logoSize);
    } catch {
      // Fallback placeholder
      doc.setFillColor(...orangeColor);
      doc.circle(margin + logoSize / 2, yPos + logoSize / 2, logoSize / 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont(serifFont, "bold");
      if (company?.name) {
        doc.text(company.name.substring(0, 2).toUpperCase(), margin + logoSize / 2, yPos + logoSize / 2 + 3, { align: "center" });
      }
    }
  } else {
    doc.setFillColor(...orangeColor);
    doc.circle(margin + logoSize / 2, yPos + logoSize / 2, logoSize / 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont(serifFont, "bold");
    if (company?.name) {
      doc.text(company.name.substring(0, 2).toUpperCase(), margin + logoSize / 2, yPos + logoSize / 2 + 3, { align: "center" });
    }
  }

  // Company Name and Tagline
  doc.setTextColor(...navyColor);
  doc.setFontSize(14);
  doc.setFont(serifFont, "bold");
  doc.text(company?.name || "Your Company", margin + logoSize + 5, yPos + 8);

  doc.setTextColor(...grayColor);
  doc.setFontSize(9);
  doc.setFont(serifFont, "italic");
  doc.text(company?.tagline || "Excellence in Every Step", margin + logoSize + 5, yPos + 14);

  // INVOICE title on right
  doc.setTextColor(...navyColor);
  doc.setFontSize(24);
  doc.setFont(serifFont, "bold");
  doc.text("INVOICE", pageWidth - margin, yPos + 8, { align: "right" });

  // Invoice number in orange
  doc.setTextColor(...orangeColor);
  doc.setFontSize(11);
  doc.setFont(serifFont, "bold");
  doc.text(invoice.invoiceNumber, pageWidth - margin, yPos + 16, { align: "right" });

  yPos += 28;

  // Divider line
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);

  yPos += 12;

  // ===================== BILL TO & DATES SECTION =====================
  const leftColX = margin;
  const rightColX = pageWidth - margin - 70;

  // BILL TO label
  doc.setFontSize(9);
  doc.setTextColor(...orangeColor);
  doc.setFont(serifFont, "bold");
  doc.text("BILL TO", leftColX, yPos);

  // Invoice Date on right
  doc.setTextColor(...grayColor);
  doc.setFont(serifFont, "bold");
  doc.text("INVOICE DATE:", rightColX, yPos);
  doc.setTextColor(...textColor);
  doc.setFont(serifFont, "normal");
  doc.text(formatDate(invoice.date), pageWidth - margin, yPos, { align: "right" });

  yPos += 7;

  // Client Name (bold)
  doc.setTextColor(...textColor);
  doc.setFontSize(11);
  doc.setFont(serifFont, "bold");
  doc.text(invoice.clientName, leftColX, yPos);

  // Due Date on right
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);
  doc.setFont(serifFont, "bold");
  doc.text("DUE DATE:", rightColX, yPos);
  doc.setTextColor(...textColor);
  doc.setFont(serifFont, "normal");
  doc.text(formatDate(invoice.dueDate), pageWidth - margin, yPos, { align: "right" });

  yPos += 5;

  // Client details
  doc.setFontSize(9);
  doc.setFont(serifFont, "normal");
  doc.setTextColor(...grayColor);

  if (invoice.clientEmail) {
    doc.text(invoice.clientEmail, leftColX, yPos);
    yPos += 4;
  }
  if (invoice.clientPhone) {
    doc.text(invoice.clientPhone, leftColX, yPos);
    yPos += 4;
  }
  if (invoice.clientAddress) {
    const addressLines = doc.splitTextToSize(invoice.clientAddress, 90);
    doc.text(addressLines, leftColX, yPos);
    yPos += addressLines.length * 4;
  }

  yPos += 10;

  // ===================== ITEMS TABLE =====================
  const tableHeaders = ["DESCRIPTION", "QTY", "UNIT PRICE", "TOTAL"];
  const colWidths = [contentWidth * 0.5, contentWidth * 0.12, contentWidth * 0.19, contentWidth * 0.19];
  const tableX = margin;
  const headerHeight = 10;
  const rowHeight = 10;

  // Table Header with orange background
  doc.setFillColor(...orangeColor);
  doc.rect(tableX, yPos, contentWidth, headerHeight, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont(serifFont, "bold");

  let headerX = tableX + 4;
  doc.text(tableHeaders[0], headerX, yPos + 7);
  headerX += colWidths[0];
  doc.text(tableHeaders[1], headerX + colWidths[1] / 2, yPos + 7, { align: "center" });
  headerX += colWidths[1];
  doc.text(tableHeaders[2], headerX + colWidths[2] - 4, yPos + 7, { align: "right" });
  headerX += colWidths[2];
  doc.text(tableHeaders[3], headerX + colWidths[3] - 4, yPos + 7, { align: "right" });

  yPos += headerHeight;

  // Table Rows
  doc.setFont(serifFont, "normal");
  doc.setFontSize(9);

  invoice.items.forEach((item, index) => {
    // Alternate row background
    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(tableX, yPos, contentWidth, rowHeight, "F");
    }

    // Row border
    doc.setDrawColor(...borderColor);
    doc.line(tableX, yPos + rowHeight, tableX + contentWidth, yPos + rowHeight);

    let rowX = tableX + 4;

    // Description
    doc.setTextColor(...textColor);
    const title = item.title || "Untitled Item";
    const truncatedTitle = title.length > 40 ? title.substring(0, 37) + "..." : title;
    doc.text(truncatedTitle, rowX, yPos + 7);

    // QTY (always 1)
    rowX += colWidths[0];
    doc.text("1", rowX + colWidths[1] / 2, yPos + 7, { align: "center" });

    // Unit Price
    rowX += colWidths[1];
    doc.text(`BDT ${formatCurrency(item.amount)}`, rowX + colWidths[2] - 4, yPos + 7, { align: "right" });

    // Total
    rowX += colWidths[2];
    doc.setFont(serifFont, "bold");
    doc.text(`BDT ${formatCurrency(item.amount)}`, rowX + colWidths[3] - 4, yPos + 7, { align: "right" });
    doc.setFont(serifFont, "normal");

    yPos += rowHeight;
  });

  yPos += 12;

  // ===================== TOTALS SECTION =====================
  const totalsX = pageWidth - margin - 80;
  const totalsValueX = pageWidth - margin;

  // Calculate amounts
  const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
  const vatRate = invoice.vatRate || 0;
  const vatAmount = invoice.vatAmount || (subtotal * vatRate) / 100;
  const totalWithVat = subtotal + vatAmount;

  // Subtotal
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);
  doc.setFont(serifFont, "normal");
  doc.text("Subtotal", totalsX, yPos);
  doc.setTextColor(...textColor);
  doc.text(`BDT ${formatCurrency(subtotal)}`, totalsValueX, yPos, { align: "right" });

  yPos += 6;

  // Tax
  doc.setTextColor(...grayColor);
  doc.text("Tax", totalsX, yPos);
  doc.setTextColor(...textColor);
  doc.text(`BDT ${formatCurrency(vatAmount)}`, totalsValueX, yPos, { align: "right" });

  yPos += 6;

  // Total
  doc.setTextColor(...textColor);
  doc.setFont(serifFont, "bold");
  doc.text("Total", totalsX, yPos);
  doc.text(`BDT ${formatCurrency(totalWithVat)}`, totalsValueX, yPos, { align: "right" });

  yPos += 6;

  // Total Paid (green)
  doc.setTextColor(...greenColor);
  doc.setFont(serifFont, "normal");
  doc.text("Total Paid", totalsX, yPos);
  doc.text(`BDT ${formatCurrency(invoice.paidAmount)}`, totalsValueX, yPos, { align: "right" });

  yPos += 10;

  // Balance Box with red/orange styling
  const balanceBoxWidth = 85;
  const balanceBoxHeight = 12;
  const balanceBoxX = pageWidth - margin - balanceBoxWidth;

  // Red left border
  doc.setFillColor(...redColor);
  doc.rect(balanceBoxX, yPos, 3, balanceBoxHeight, "F");

  // White background with border
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...borderColor);
  doc.rect(balanceBoxX + 3, yPos, balanceBoxWidth - 3, balanceBoxHeight, "FD");

  // Balance label
  doc.setTextColor(...redColor);
  doc.setFontSize(9);
  doc.setFont(serifFont, "bold");
  doc.text("Balance", balanceBoxX + 8, yPos + 8);

  // Balance amount
  doc.setFontSize(11);
  doc.text(`BDT ${formatCurrency(invoice.dueAmount)}`, pageWidth - margin - 5, yPos + 8, { align: "right" });

  yPos += balanceBoxHeight + 15;

  // ===================== PAYMENT HISTORY =====================
  if (invoice.installments.length > 0) {
    // Section header with orange left border
    doc.setFillColor(...orangeColor);
    doc.rect(margin, yPos, 3, 8, "F");

    doc.setTextColor(...navyColor);
    doc.setFontSize(10);
    doc.setFont(serifFont, "bold");
    doc.text("PAYMENT HISTORY", margin + 8, yPos + 6);

    yPos += 14;

    // Payment table header
    doc.setFillColor(249, 250, 251);
    doc.rect(margin, yPos, contentWidth, 8, "F");

    doc.setTextColor(...grayColor);
    doc.setFontSize(8);
    doc.setFont(serifFont, "bold");
    doc.text("DATE", margin + 4, yPos + 5.5);
    doc.text("TYPE", margin + 45, yPos + 5.5);
    doc.text("DESCRIPTION", margin + 85, yPos + 5.5);
    doc.text("AMOUNT", pageWidth - margin - 4, yPos + 5.5, { align: "right" });

    yPos += 8;

    // Payment rows
    doc.setFont(serifFont, "normal");
    doc.setFontSize(9);

    invoice.installments.forEach((inst, index) => {
      doc.setDrawColor(...borderColor);
      doc.line(margin, yPos + 8, pageWidth - margin, yPos + 8);

      doc.setTextColor(...textColor);
      doc.text(formatDate(inst.paidDate), margin + 4, yPos + 6);
      doc.text("Bank Transfer", margin + 45, yPos + 6);
      doc.text(`Payment #${index + 1}`, margin + 85, yPos + 6);

      doc.setTextColor(...greenColor);
      doc.setFont(serifFont, "bold");
      doc.text(`BDT ${formatCurrency(inst.amount)}`, pageWidth - margin - 4, yPos + 6, { align: "right" });
      doc.setFont(serifFont, "normal");

      yPos += 10;
    });
  }

  // ===================== FOOTER =====================
  const footerY = pageHeight - 35;

  // Divider line
  doc.setDrawColor(...borderColor);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  // Thank you message
  doc.setTextColor(...grayColor);
  doc.setFontSize(10);
  doc.setFont(serifFont, "italic");
  doc.text("Thank you for staying with us.", margin, footerY + 5);

  // Generate QR code
  const invoiceUrl = `${window.location.origin}/view/${invoice.id}`;
  try {
    const qrDataUrl = await QRCode.toDataURL(invoiceUrl, {
      width: 80,
      margin: 1,
      errorCorrectionLevel: "M",
    });
    doc.addImage(qrDataUrl, "PNG", pageWidth - margin - 28, footerY - 3, 28, 28);

    // Scan for details label
    doc.setFontSize(7);
    doc.setTextColor(...lightGrayColor);
    doc.setFont(serifFont, "normal");
    doc.text("Scan for details", pageWidth - margin - 14, footerY + 28, { align: "center" });
  } catch (error) {
    console.error("Failed to generate QR code:", error);
  }

  // Save the PDF
  doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
};
