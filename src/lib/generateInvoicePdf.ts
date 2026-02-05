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
  // Company Logo (circular) - handle both base64 and URL
  const logoSize = 14;
  let logoDrawn = false;
  
  if (company?.logo) {
    try {
      // For URLs, we need to load the image first
      if (company.logo.startsWith("http") || company.logo.startsWith("https")) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((resolve) => {
          img.onload = () => {
            try {
              const canvas = document.createElement("canvas");
              canvas.width = 100;
              canvas.height = 100;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.drawImage(img, 0, 0, 100, 100);
                const dataUrl = canvas.toDataURL("image/jpeg");
                doc.addImage(dataUrl, "JPEG", margin, yPos, logoSize, logoSize);
                logoDrawn = true;
              }
            } catch (e) {
              console.error("Failed to draw logo:", e);
            }
            resolve();
          };
          img.onerror = () => resolve();
          img.src = company.logo!;
        });
      } else if (company.logo.startsWith("data:image")) {
        doc.addImage(company.logo, "JPEG", margin, yPos, logoSize, logoSize);
        logoDrawn = true;
      }
    } catch (e) {
      console.error("Failed to add logo:", e);
    }
  }
  
  // Fallback circular logo
  if (!logoDrawn) {
    doc.setFillColor(...primaryColor);
    doc.circle(margin + logoSize / 2, yPos + logoSize / 2, logoSize / 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(company?.name?.charAt(0) || "C", margin + logoSize / 2, yPos + logoSize / 2 + 3, { align: "center" });
  }

  // Company Name and Tagline only (no email/phone in header)
  const companyInfoX = margin + logoSize + 4;
  doc.setTextColor(...primaryColor);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(company?.name || "Company Name", companyInfoX, yPos + 7);

  if (company?.tagline) {
    doc.setTextColor(...mutedColor);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(company.tagline, companyInfoX, yPos + 12);
  }

  // INVOICE title on right
  doc.setTextColor(...primaryColor);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", pageWidth - margin, yPos + 7, { align: "right" });

  // Invoice number in accent color
  doc.setTextColor(...accentColor);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.invoiceNumber, pageWidth - margin, yPos + 14, { align: "right" });

  yPos += 24;

  // ===================== BILL TO & DATES SECTION =====================
  // Divider line
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 6;

  // Left accent bar for Bill To
  doc.setFillColor(...accentColor);
  doc.rect(margin, yPos, 1.5, 22, "F");

  // Bill To label
  doc.setTextColor(...mutedColor);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("BILL TO", margin + 4, yPos + 4);

  // Dates on right
  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE DATE :", pageWidth - margin - 45, yPos + 4);
  doc.setTextColor(...textColor);
  doc.text(formatDate(invoice.date), pageWidth - margin, yPos + 4, { align: "right" });

  yPos += 8;

  // Client Name
  doc.setTextColor(...textColor);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.clientName, margin + 4, yPos);

  // Due Date (orange color)
  const orangeColor: [number, number, number] = [249, 115, 22];
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...orangeColor);
  doc.text("DUE DATE :", pageWidth - margin - 45, yPos);
  doc.text(formatDate(invoice.dueDate), pageWidth - margin, yPos, { align: "right" });

  yPos += 5;

  // Client details
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mutedColor);

  if (invoice.clientEmail) {
    doc.text(invoice.clientEmail, margin + 4, yPos);
    yPos += 4;
  }
  if (invoice.clientPhone) {
    doc.text(invoice.clientPhone, margin + 4, yPos);
    yPos += 4;
  }
  if (invoice.clientAddress) {
    doc.text(invoice.clientAddress, margin + 4, yPos);
    yPos += 4;
  }

  yPos += 10;

  // ===================== ITEMS TABLE =====================
  const tableX = margin;
  const colWidths = [contentWidth - 70, 15, 27, 28]; // Description, Qty, Unit Price, Total
  const rowHeight = 8;

  // Table Header
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.5);
  doc.line(tableX, yPos + 6, tableX + contentWidth, yPos + 6);

  doc.setTextColor(...mutedColor);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("DESCRIPTION", tableX, yPos + 4);
  doc.text("QTY", tableX + colWidths[0], yPos + 4, { align: "center" });
  doc.text("UNIT PRICE", tableX + colWidths[0] + colWidths[1] + 10, yPos + 4, { align: "right" });
  doc.text("TOTAL", tableX + contentWidth, yPos + 4, { align: "right" });

  yPos += 10;

  // Table Rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  invoice.items.forEach((item) => {
    // Description
    doc.setTextColor(...textColor);
    doc.setFont("helvetica", "normal");
    const title = item.title || "—";
    doc.text(title, tableX, yPos + 4);

    // Qty (always 1)
    doc.setTextColor(...mutedColor);
    doc.text("1", tableX + colWidths[0], yPos + 4, { align: "center" });

    // Unit Price
    doc.setTextColor(...textColor);
    doc.text(formatCurrency(item.amount), tableX + colWidths[0] + colWidths[1] + 10, yPos + 4, { align: "right" });

    // Total
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(item.amount), tableX + contentWidth, yPos + 4, { align: "right" });

    // Row divider
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.2);
    doc.line(tableX, yPos + rowHeight, tableX + contentWidth, yPos + rowHeight);

    yPos += rowHeight;
  });

  yPos += 10;

  // ===================== SUMMARY SECTION =====================
  const summaryX = pageWidth - margin - 70;
  const summaryWidth = 70;

  // Subtotal
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  doc.setFont("helvetica", "bold");
  doc.text("Subtotal", summaryX, yPos);
  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "bold");
  const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
  doc.text(formatCurrency(subtotal), pageWidth - margin, yPos, { align: "right" });

  // Divider
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.2);
  doc.line(summaryX, yPos + 3, pageWidth - margin, yPos + 3);
  yPos += 8;

  // Tax
  const vatRate = invoice.vatRate || 0;
  const vatAmount = invoice.vatAmount || (subtotal * vatRate) / 100;
  doc.setTextColor(...mutedColor);
  doc.setFont("helvetica", "bold");
  doc.text("Tax", summaryX, yPos);
  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(vatAmount), pageWidth - margin, yPos, { align: "right" });

  doc.line(summaryX, yPos + 3, pageWidth - margin, yPos + 3);
  yPos += 8;

  // Total
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "bold");
  doc.text("Total", summaryX, yPos);
  const totalWithVat = subtotal + vatAmount;
  doc.text(formatCurrency(totalWithVat), pageWidth - margin, yPos, { align: "right" });

  doc.line(summaryX, yPos + 3, pageWidth - margin, yPos + 3);
  yPos += 8;

  // Total Paid (orange color)
  doc.setFontSize(9);
  doc.setTextColor(249, 115, 22); // Orange-500
  doc.setFont("helvetica", "bold");
  doc.text("Total Paid", summaryX, yPos);
  doc.text(formatCurrency(invoice.paidAmount), pageWidth - margin, yPos, { align: "right" });

  doc.line(summaryX, yPos + 3, pageWidth - margin, yPos + 3);
  yPos += 8;

  // Balance Box (red for due, green for paid)
  const balanceColor = invoice.dueAmount > 0 ? redColor : greenColor;
  doc.setFillColor(...balanceColor);
  doc.rect(summaryX, yPos - 2, summaryWidth, 8, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  const balanceLabel = invoice.dueAmount > 0 ? "Balance" : "Paid in Full";
  doc.text(balanceLabel, summaryX + 3, yPos + 3);
  doc.text(formatCurrency(invoice.dueAmount), pageWidth - margin - 3, yPos + 3, { align: "right" });

  yPos += 14;

  // ===================== PAYMENT HISTORY =====================
  if (invoice.installments.length > 0) {
    // Payment History border box
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, yPos, contentWidth, 8 + invoice.installments.length * 10, 2, 2, "S");
    
    yPos += 5;

    // Payment History Header
    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("PAYMENT HISTORY", margin + 4, yPos);

    yPos += 6;

    // Payment entries with left border accent
    invoice.installments.forEach((inst, index) => {
      // Left border accent
      doc.setFillColor(...borderColor);
      doc.rect(margin + 4, yPos, 1, 6, "F");

      doc.setFontSize(8);
      doc.setTextColor(...textColor);
      doc.setFont("helvetica", "normal");
      doc.text(formatDate(inst.paidDate), margin + 8, yPos + 4);

      // Payment badge
      doc.setFillColor(...primaryColor);
      doc.roundedRect(margin + 35, yPos, 14, 5, 1, 1, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6);
      doc.setFont("helvetica", "bold");
      doc.text("Payment", margin + 42, yPos + 3.5, { align: "center" });

      // Number badge
      doc.setFillColor(...accentColor);
      doc.roundedRect(margin + 51, yPos, 8, 5, 1, 1, "F");
      doc.setTextColor(255, 255, 255);
      doc.text(`#${index + 1}`, margin + 55, yPos + 3.5, { align: "center" });

      // Amount
      doc.setTextColor(...accentColor);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(formatCurrency(inst.amount), pageWidth - margin - 4, yPos + 4, { align: "right" });

      yPos += 10;
    });

    yPos += 6;
  }

  // ===================== FOOTER =====================
  // Position footer at bottom
  const footerY = pageHeight - 28;

  // Divider line
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  // Thank you message
  doc.setTextColor(...mutedColor);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for staying with us.", margin, footerY);

  // Company email and phone
  let footerDetailY = footerY + 5;
  doc.setFontSize(7);
  
  if (company?.email) {
    doc.text(company.email, margin, footerDetailY);
    footerDetailY += 3;
  }
  if (company?.phone) {
    doc.text(company.phone, margin, footerDetailY);
    footerDetailY += 3;
  }

  // Company address
  if (company?.address) {
    const addressLines = doc.splitTextToSize(company.address, 80);
    doc.text(addressLines, margin, footerDetailY);
  }

  // QR Code
  const invoiceUrl = `${window.location.origin}/view/${invoice.id}`;
  try {
    const qrDataUrl = await QRCode.toDataURL(invoiceUrl, {
      width: 100,
      margin: 1,
      errorCorrectionLevel: "M",
    });
    doc.addImage(qrDataUrl, "PNG", pageWidth - margin - 20, footerY - 8, 20, 20);

    // Scan label
    doc.setFontSize(6);
    doc.setTextColor(...mutedColor);
    doc.text("Scan for details", pageWidth - margin - 10, footerY + 14, { align: "center" });
  } catch (error) {
    console.error("Failed to generate QR code:", error);
  }

  // Save the PDF
  doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
};
