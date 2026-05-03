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

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const FOOTER_MARGIN_MM = 1.27;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;
  const isMultiPage = imgHeight > pdfHeight;
  const usableHeight = isMultiPage ? pdfHeight - FOOTER_MARGIN_MM : pdfHeight;

  const pixelsPerMm = canvas.width / pdfWidth;
  const pageHeightPx = Math.floor(usableHeight * pixelsPerMm);

  let sourceY = 0;
  let isFirstPage = true;

  while (sourceY < canvas.height) {
    const sliceHeightPx = Math.min(pageHeightPx, canvas.height - sourceY);
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeightPx;

    const pageContext = pageCanvas.getContext("2d");
    if (!pageContext) {
      throw new Error("Could not prepare PDF page rendering context.");
    }

    pageContext.fillStyle = "#ffffff";
    pageContext.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    pageContext.drawImage(
      canvas,
      0,
      sourceY,
      canvas.width,
      sliceHeightPx,
      0,
      0,
      pageCanvas.width,
      pageCanvas.height
    );

    const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.98);
    const pageImgHeightMm = sliceHeightPx / pixelsPerMm;

    if (!isFirstPage) {
      pdf.addPage();
    }

    pdf.addImage(pageImgData, "JPEG", 0, 0, pdfWidth, pageImgHeightMm, undefined, "FAST");
    sourceY += sliceHeightPx;
    isFirstPage = false;
  }

  if (pdf.getNumberOfPages() === 0) {
    pdf.addPage();
  }

  pdf.save(filename);
}
