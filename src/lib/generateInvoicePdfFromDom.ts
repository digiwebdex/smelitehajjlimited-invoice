import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Capture a DOM element and produce a multi-page A4 PDF that
 * looks identical to the web invoice preview.
 */
export async function generateInvoicePdfFromDom(
  element: HTMLElement,
  filename: string
): Promise<void> {
  // Render at 2x for sharper output
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();   // 210
  const pdfHeight = pdf.internal.pageSize.getHeight(); // 297

  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  // Reserve a small bottom margin (0.05 inch ≈ 1.27mm) on multi-page PDFs
  const FOOTER_MARGIN_MM = 1.27;
  const isMultiPage = imgHeight > pdfHeight;
  const usableHeight = isMultiPage ? pdfHeight - FOOTER_MARGIN_MM : pdfHeight;

  let heightLeft = imgHeight;
  let position = 0;

  const imgData = canvas.toDataURL("image/jpeg", 0.95);

  pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
  heightLeft -= usableHeight;

  while (heightLeft > 0) {
    position -= usableHeight;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= usableHeight;
  }

  pdf.save(filename);
}
