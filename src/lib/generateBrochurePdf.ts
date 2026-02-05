 import jsPDF from "jspdf";
 
 export const generateBrochurePdf = () => {
   const doc = new jsPDF();
   const pageWidth = doc.internal.pageSize.getWidth();
   const pageHeight = doc.internal.pageSize.getHeight();
   const margin = 20;
   let y = margin;
 
   const primaryColor: [number, number, number] = [30, 58, 95]; // Navy
   const accentColor: [number, number, number] = [20, 184, 166]; // Teal
   const textColor: [number, number, number] = [51, 51, 51];
   const lightGray: [number, number, number] = [245, 245, 245];
 
   // Header background
   doc.setFillColor(...primaryColor);
   doc.rect(0, 0, pageWidth, 60, "F");
 
   // Title
   doc.setTextColor(255, 255, 255);
   doc.setFontSize(28);
   doc.setFont("helvetica", "bold");
   doc.text("S M Invoice Software", pageWidth / 2, 30, { align: "center" });
 
   doc.setFontSize(12);
   doc.setFont("helvetica", "normal");
   doc.text("Professional Invoice Management for Modern Businesses", pageWidth / 2, 45, { align: "center" });
 
   y = 75;
 
   // Tagline
   doc.setTextColor(...accentColor);
   doc.setFontSize(14);
   doc.setFont("helvetica", "italic");
   doc.text("Streamline Your Billing. Grow Your Business.", pageWidth / 2, y, { align: "center" });
 
   y += 20;
 
   // Features sections
   const features = [
     {
       title: "📊 Smart Dashboard",
       items: [
         "Real-time revenue overview with visual charts",
         "Company-wise revenue breakdown",
         "Collection rate & average invoice analytics",
         "Status tracking: Paid, Partial, Pending",
       ],
     },
     {
       title: "🏢 Company Management",
       items: [
         "Manage multiple companies from one account",
         "Custom logo upload with auto-placeholder",
         "Taglines displayed on all invoices",
         "Complete contact details management",
       ],
     },
     {
       title: "📄 Professional Invoicing",
       items: [
         "Dynamic invoice creation with multiple items",
         "Auto-calculated subtotal, VAT & totals",
         "Status tracking: Unpaid → Partial → Paid",
         "Fully customizable invoice numbers & dates",
       ],
     },
     {
       title: "💳 Installment Payments",
       items: [
         "Track partial payments with dates",
         "Auto-update paid/due amounts",
         "Complete payment history on invoices",
         "Flexible payment scheduling",
       ],
     },
   ];
 
   const colWidth = (pageWidth - margin * 2 - 10) / 2;
 
   features.forEach((feature, index) => {
     const col = index % 2;
     const row = Math.floor(index / 2);
     const x = margin + col * (colWidth + 10);
     const boxY = y + row * 55;
 
     // Feature box
     doc.setFillColor(...lightGray);
     doc.roundedRect(x, boxY, colWidth, 50, 3, 3, "F");
 
     // Feature title
     doc.setTextColor(...primaryColor);
     doc.setFontSize(11);
     doc.setFont("helvetica", "bold");
     doc.text(feature.title, x + 5, boxY + 10);
 
     // Feature items
     doc.setTextColor(...textColor);
     doc.setFontSize(8);
     doc.setFont("helvetica", "normal");
     feature.items.forEach((item, i) => {
       doc.text(`• ${item}`, x + 7, boxY + 20 + i * 7);
     });
   });
 
   y += 120;
 
   // More features section
   const moreFeatures = [
     {
       title: "🔗 Easy Sharing",
       items: [
         "Public shareable invoice links",
         "WhatsApp integration",
         "Email sharing with pre-filled content",
         "QR codes for quick mobile access",
       ],
     },
     {
       title: "📤 Export Options",
       items: [
         "Professional PDF export",
         "Excel export for reporting",
         "Print-optimized layouts",
         "QR codes embedded in PDFs",
       ],
     },
     {
       title: "🔍 Search & Filter",
       items: [
         "Filter by invoice number, client, status",
         "Company-wise filtering",
         "Date range selection",
         "Quick search across all fields",
       ],
     },
     {
       title: "👥 Multi-User Support",
       items: [
         "Email verification & admin approval",
         "Role-based access control",
         "Admin panel for user management",
         "Secure data isolation per user",
       ],
     },
   ];
 
   moreFeatures.forEach((feature, index) => {
     const col = index % 2;
     const row = Math.floor(index / 2);
     const x = margin + col * (colWidth + 10);
     const boxY = y + row * 55;
 
     doc.setFillColor(...lightGray);
     doc.roundedRect(x, boxY, colWidth, 50, 3, 3, "F");
 
     doc.setTextColor(...primaryColor);
     doc.setFontSize(11);
     doc.setFont("helvetica", "bold");
     doc.text(feature.title, x + 5, boxY + 10);
 
     doc.setTextColor(...textColor);
     doc.setFontSize(8);
     doc.setFont("helvetica", "normal");
     feature.items.forEach((item, i) => {
       doc.text(`• ${item}`, x + 7, boxY + 20 + i * 7);
     });
   });
 
   // Footer
   doc.setFillColor(...primaryColor);
   doc.rect(0, pageHeight - 35, pageWidth, 35, "F");
 
   doc.setTextColor(255, 255, 255);
   doc.setFontSize(12);
   doc.setFont("helvetica", "bold");
   doc.text("S M Elite Hajj Limited", pageWidth / 2, pageHeight - 22, { align: "center" });
 
   doc.setFontSize(9);
   doc.setFont("helvetica", "normal");
   doc.text("Excellence in Every Step", pageWidth / 2, pageHeight - 14, { align: "center" });
 
   doc.setFontSize(8);
   doc.text("+880 1867 666 888  •  smelitehajj@gmail.com", pageWidth / 2, pageHeight - 6, { align: "center" });
 
   // Save the PDF
   doc.save("SM-Invoice-Software-Brochure.pdf");
 };