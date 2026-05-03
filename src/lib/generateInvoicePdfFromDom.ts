import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Standard A4 page margins (mm) — matches typical "Normal" Word/Print preset
const MARGIN_TOP_MM = 10;
const MARGIN_BOTTOM_MM = 10;
const MARGIN_LEFT_MM = 10;
const MARGIN_RIGHT_MM = 10;

/**
 * Capture a DOM element and produce a multi-page A4 PDF with standard margins.
 * The element marked with [data-pdf-footer] (signature + footer block)
 * is always placed at the bottom of the LAST page (above the bottom margin).
 */
export async function generateInvoicePdfFromDom(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const footerEl = element.querySelector<HTMLElement>("[data-pdf-footer]");

  // Hide footer while capturing body so body canvas excludes it
  let prevDisplay = "";
  if (footerEl) {
    prevDisplay = footerEl.style.display;
    footerEl.style.display = "none";
  }

  const bodyCanvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    windowWidth: element.scrollWidth,
  });

  // Restore footer and capture it separately
  let footerCanvas: HTMLCanvasElement | null = null;
  if (footerEl) {
    footerEl.style.display = prevDisplay;
    footerCanvas = await html2canvas(footerEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: element.scrollWidth,
    });
  }

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const contentWidthMm = pdfWidth - MARGIN_LEFT_MM - MARGIN_RIGHT_MM;
  const contentHeightMm = pdfHeight - MARGIN_TOP_MM - MARGIN_BOTTOM_MM;

  // Scale based on content width (not full page width)
  const pixelsPerMm = bodyCanvas.width / contentWidthMm;
  const bodyHeightMm = bodyCanvas.height / pixelsPerMm;
  const footerHeightMm = footerCanvas ? footerCanvas.height / pixelsPerMm : 0;

  // Single page if body + footer fits within content area (with small rounding tolerance)
  const fitsSinglePage = bodyHeightMm + footerHeightMm <= contentHeightMm + 2;

  if (fitsSinglePage) {
    pdf.addImage(
      bodyCanvas.toDataURL("image/jpeg", 0.98),
      "JPEG",
      MARGIN_LEFT_MM,
      MARGIN_TOP_MM,
      contentWidthMm,
      bodyHeightMm,
      undefined,
      "FAST"
    );
    if (footerCanvas) {
      const footerY = pdfHeight - MARGIN_BOTTOM_MM - footerHeightMm;
      pdf.addImage(
        footerCanvas.toDataURL("image/jpeg", 0.98),
        "JPEG",
        MARGIN_LEFT_MM,
        Math.max(MARGIN_TOP_MM + bodyHeightMm, footerY),
        contentWidthMm,
        footerHeightMm,
        undefined,
        "FAST"
      );
    }
    pdf.save(filename);
    return;
  }

  // Multi-page: slice body across pages, respecting top + bottom margins
  const pageHeightPx = Math.floor(contentHeightMm * pixelsPerMm);

  let sourceY = 0;
  let isFirst = true;

  while (sourceY < bodyCanvas.height) {
    const remaining = bodyCanvas.height - sourceY;
    const sliceHeightPx = Math.min(pageHeightPx, remaining);

    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = bodyCanvas.width;
    pageCanvas.height = sliceHeightPx;
    const ctx = pageCanvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx.drawImage(
      bodyCanvas,
      0,
      sourceY,
      bodyCanvas.width,
      sliceHeightPx,
      0,
      0,
      pageCanvas.width,
      pageCanvas.height
    );

    if (!isFirst) pdf.addPage();
    pdf.addImage(
      pageCanvas.toDataURL("image/jpeg", 0.98),
      "JPEG",
      MARGIN_LEFT_MM,
      MARGIN_TOP_MM,
      contentWidthMm,
      sliceHeightPx / pixelsPerMm,
      undefined,
      "FAST"
    );

    sourceY += sliceHeightPx;
    isFirst = false;
  }

  // Place footer on the last page pinned above the bottom margin
  if (footerCanvas) {
    const lastSlicePx = (bodyCanvas.height % pageHeightPx) || pageHeightPx;
    const lastPageBodyHeightMm = lastSlicePx / pixelsPerMm;
    const remainingSpaceMm = contentHeightMm - lastPageBodyHeightMm;

    if (remainingSpaceMm < footerHeightMm) {
      // Not enough room — add a new page for footer
      pdf.addPage();
    }
    pdf.addImage(
      footerCanvas.toDataURL("image/jpeg", 0.98),
      "JPEG",
      MARGIN_LEFT_MM,
      pdfHeight - MARGIN_BOTTOM_MM - footerHeightMm,
      contentWidthMm,
      footerHeightMm,
      undefined,
      "FAST"
    );
  }

  pdf.save(filename);
}
