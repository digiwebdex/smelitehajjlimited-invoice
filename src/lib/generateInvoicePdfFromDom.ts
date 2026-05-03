import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const FOOTER_MARGIN_MM = 1.27; // 0.05 inch bottom margin on multi-page

/**
 * Capture a DOM element and produce a multi-page A4 PDF.
 * The element marked with [data-pdf-footer] (signature + footer block)
 * is always placed at the bottom of the LAST page.
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

  const pixelsPerMm = bodyCanvas.width / pdfWidth;
  const bodyHeightMm = bodyCanvas.height / pixelsPerMm;
  const footerHeightMm = footerCanvas ? footerCanvas.height / pixelsPerMm : 0;

  // Determine if multi-page (body + footer cannot fit one page)
  const fitsSinglePage = bodyHeightMm + footerHeightMm <= pdfHeight;

  if (fitsSinglePage) {
    // Single page: render body at top, footer at natural position (bottom area)
    pdf.addImage(
      bodyCanvas.toDataURL("image/jpeg", 0.98),
      "JPEG",
      0,
      0,
      pdfWidth,
      bodyHeightMm,
      undefined,
      "FAST"
    );
    if (footerCanvas) {
      const footerY = pdfHeight - footerHeightMm; // pinned to bottom
      pdf.addImage(
        footerCanvas.toDataURL("image/jpeg", 0.98),
        "JPEG",
        0,
        Math.max(bodyHeightMm, footerY),
        pdfWidth,
        footerHeightMm,
        undefined,
        "FAST"
      );
    }
    pdf.save(filename);
    return;
  }

  // Multi-page: slice body across pages with FOOTER_MARGIN reserved at bottom
  const usableHeightMm = pdfHeight - FOOTER_MARGIN_MM;
  const pageHeightPx = Math.floor(usableHeightMm * pixelsPerMm);

  let sourceY = 0;
  let isFirst = true;

  while (sourceY < bodyCanvas.height) {
    const remaining = bodyCanvas.height - sourceY;
    let sliceHeightPx = Math.min(pageHeightPx, remaining);
    const isLastBodyPage = sourceY + sliceHeightPx >= bodyCanvas.height;

    // On the last body page, reserve room for the footer
    if (isLastBodyPage && footerCanvas) {
      const footerHeightPx = footerCanvas.height;
      const availablePx = pageHeightPx - footerHeightPx;
      if (remaining > availablePx) {
        // Body remainder doesn't fit with footer — shrink slice and push footer to a new page
        sliceHeightPx = Math.min(remaining, pageHeightPx);
      }
    }

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
      0,
      0,
      pdfWidth,
      sliceHeightPx / pixelsPerMm,
      undefined,
      "FAST"
    );

    sourceY += sliceHeightPx;
    isFirst = false;
  }

  // Place footer on the last page, pinned to bottom (respecting margin)
  if (footerCanvas) {
    const lastPageBodyHeightMm =
      ((bodyCanvas.height % pageHeightPx) || pageHeightPx) / pixelsPerMm;
    const footerY = pdfHeight - FOOTER_MARGIN_MM - footerHeightMm;

    if (lastPageBodyHeightMm + footerHeightMm + FOOTER_MARGIN_MM > pdfHeight) {
      // Not enough room — add a new page for footer
      pdf.addPage();
      pdf.addImage(
        footerCanvas.toDataURL("image/jpeg", 0.98),
        "JPEG",
        0,
        pdfHeight - FOOTER_MARGIN_MM - footerHeightMm,
        pdfWidth,
        footerHeightMm,
        undefined,
        "FAST"
      );
    } else {
      pdf.addImage(
        footerCanvas.toDataURL("image/jpeg", 0.98),
        "JPEG",
        0,
        footerY,
        pdfWidth,
        footerHeightMm,
        undefined,
        "FAST"
      );
    }
  }

  pdf.save(filename);
}
