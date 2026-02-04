import jsPDF from "jspdf";
import { Invoice, Company } from "@/types";

export const generateInvoicePdf = (invoice: Invoice, company?: Company) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Colors
  const primaryColor = [59, 130, 246]; // Blue
  const textColor = [31, 41, 55]; // Dark gray
  const mutedColor = [107, 114, 128]; // Muted gray
  
  // Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 40, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", 20, 28);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.invoiceNumber, pageWidth - 20, 28, { align: "right" });
  
  // Reset text color
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  
  // Invoice Details Section
  let yPos = 55;
  
  // Left column - Bill To
  doc.setFontSize(10);
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text("BILL TO", 20, yPos);
  
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.clientName, 20, yPos + 8);
  
  if (company) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(company.name, 20, yPos + 16);
  }
  
  // Right column - Invoice Info
  doc.setFontSize(10);
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text("DATE", pageWidth - 60, yPos);
  doc.text("STATUS", pageWidth - 60, yPos + 20);
  
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont("helvetica", "normal");
  const dateStr = invoice.date instanceof Date 
    ? invoice.date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : new Date(invoice.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  doc.text(dateStr, pageWidth - 60, yPos + 8);
  
  // Status with color
  const statusColors: Record<string, number[]> = {
    paid: [34, 197, 94],
    partial: [234, 179, 8],
    unpaid: [239, 68, 68],
  };
  const statusColor = statusColors[invoice.status] || textColor;
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.status.toUpperCase(), pageWidth - 60, yPos + 28);
  
  // Line Items Table
  yPos = 100;
  
  // Table Header
  doc.setFillColor(248, 250, 252);
  doc.rect(20, yPos, pageWidth - 40, 12, "F");
  
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DESCRIPTION", 25, yPos + 8);
  doc.text("AMOUNT", pageWidth - 25, yPos + 8, { align: "right" });
  
  yPos += 18;
  
  // Table Items
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont("helvetica", "normal");
  
  invoice.items.forEach((item) => {
    doc.text(item.title || "Untitled Item", 25, yPos);
    doc.text(formatCurrency(item.amount), pageWidth - 25, yPos, { align: "right" });
    yPos += 10;
  });
  
  // Divider line
  yPos += 5;
  doc.setDrawColor(229, 231, 235);
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 15;
  
  // Totals Section
  const totalsX = pageWidth - 80;
  
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.setFont("helvetica", "normal");
  doc.text("Subtotal", totalsX, yPos);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(formatCurrency(invoice.totalAmount), pageWidth - 25, yPos, { align: "right" });
  
  yPos += 10;
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text("Paid", totalsX, yPos);
  doc.setTextColor(34, 197, 94);
  doc.text(formatCurrency(invoice.paidAmount), pageWidth - 25, yPos, { align: "right" });
  
  yPos += 10;
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text("Due", totalsX, yPos);
  doc.setTextColor(239, 68, 68);
  doc.text(formatCurrency(invoice.dueAmount), pageWidth - 25, yPos, { align: "right" });
  
  // Total box
  yPos += 15;
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(totalsX - 10, yPos - 5, pageWidth - totalsX, 15, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TOTAL", totalsX, yPos + 5);
  doc.text(formatCurrency(invoice.totalAmount), pageWidth - 25, yPos + 5, { align: "right" });
  
  // Payment History Section (if there are installments)
  if (invoice.installments.length > 0) {
    yPos += 35;
    
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Payment History", 20, yPos);
    
    yPos += 10;
    
    invoice.installments.forEach((inst, index) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(34, 197, 94);
      doc.text(`Payment #${index + 1}`, 25, yPos);
      
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
      const paidDateStr = inst.paidDate instanceof Date
        ? inst.paidDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
        : new Date(inst.paidDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
      doc.text(paidDateStr, 70, yPos);
      
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(formatCurrency(inst.amount), pageWidth - 25, yPos, { align: "right" });
      
      yPos += 8;
    });
  }
  
  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for your business!", pageWidth / 2, footerY, { align: "center" });
  
  // Save the PDF
  doc.save(`${invoice.invoiceNumber}.pdf`);
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
