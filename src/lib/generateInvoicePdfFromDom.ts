import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Standard A4 page margins (mm) — matches typical "Normal" Word/Print preset
const MARGIN_TOP_MM = 10;
const MARGIN_BOTTOM_MM = 10;
const MARGIN_LEFT_MM = 10;
const MARGIN_RIGHT_MM = 10;
const PAGE_BREAK_SAFETY_MM = 3;
const FOOTER_SAFETY_MM = 4;

const getBreakpointsFromDom = (element: HTMLElement, pixelsPerMmGuess: number): number[] => {
  const rootRect = element.getBoundingClientRect();
  const selectors = [
    "tbody tr",
    "[data-pdf-footer]",
    "img",
    "h1, h2, h3, h4, h5, h6",
    "p",
    "table",
    "thead",
    "tbody",
    "section",
    "article",
    "div",
  ];

  const nodes = element.querySelectorAll<HTMLElement>(selectors.join(", "));
  const positions = new Set<number>([0]);

  nodes.forEach((node) => {
    if (node.hasAttribute("data-pdf-footer")) return;

    const style = window.getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") return;

    const rect = node.getBoundingClientRect();
    const top = rect.top - rootRect.top;
    const bottom = rect.bottom - rootRect.top;
    const height = rect.height;

    if (height <= 0) return;

    positions.add(Math.max(0, Math.round(top * pixelsPerMmGuess) / pixelsPerMmGuess));
    positions.add(Math.max(0, Math.round(bottom * pixelsPerMmGuess) / pixelsPerMmGuess));
  });

  return Array.from(positions).sort((a, b) => a - b);
};

const chooseSliceHeightPx = (
  sourceY: number,
  maxSliceHeightPx: number,
  totalHeightPx: number,
  breakpointsPx: number[],
  minSliceHeightPx: number
) => {
  const remaining = totalHeightPx - sourceY;
  if (remaining <= maxSliceHeightPx) return remaining;

  const maxTarget = sourceY + maxSliceHeightPx;
  const minTarget = sourceY + minSliceHeightPx;

  let bestBreakpoint: number | null = null;
  for (const point of breakpointsPx) {
    if (point <= minTarget) continue;
    if (point > maxTarget) break;
    bestBreakpoint = point;
  }

  if (bestBreakpoint && bestBreakpoint > sourceY) {
    return bestBreakpoint - sourceY;
  }

  return maxSliceHeightPx;
};

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

  // Hide footer + collapse min-height so body capture has no trailing gap
  let prevFooterDisplay = "";
  let prevMinHeight = "";
  let prevHeight = "";
  if (footerEl) {
    prevFooterDisplay = footerEl.style.display;
    footerEl.style.display = "none";
  }
  prevMinHeight = element.style.minHeight;
  prevHeight = element.style.height;
  element.style.minHeight = "0";
  element.style.height = "auto";

  const bodyCanvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    windowWidth: element.scrollWidth,
  });

  // Restore min-height
  element.style.minHeight = prevMinHeight;
  element.style.height = prevHeight;

  // Restore footer and capture it separately
  let footerCanvas: HTMLCanvasElement | null = null;
  if (footerEl) {
    footerEl.style.display = prevFooterDisplay;
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
  const usableContentHeightMm = contentHeightMm - PAGE_BREAK_SAFETY_MM;

  // Scale based on content width (not full page width)
  const pixelsPerMm = bodyCanvas.width / contentWidthMm;
  const bodyHeightMm = bodyCanvas.height / pixelsPerMm;
  const footerHeightMm = footerCanvas ? footerCanvas.height / pixelsPerMm : 0;
  const breakpointsMm = getBreakpointsFromDom(element, pixelsPerMm);
  const breakpointsPx = breakpointsMm.map((point) => Math.round(point * pixelsPerMm));

  // Single page if body + footer fits within content area (with small rounding tolerance)
  const fitsSinglePage = bodyHeightMm + footerHeightMm + FOOTER_SAFETY_MM <= contentHeightMm + 2;

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
      const footerY = pdfHeight - MARGIN_BOTTOM_MM - footerHeightMm - FOOTER_SAFETY_MM;
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
  const pageHeightPx = Math.floor(usableContentHeightMm * pixelsPerMm);
  const minSliceHeightPx = Math.floor(Math.max(25, 18 * pixelsPerMm));

  let sourceY = 0;
  let isFirst = true;
  let lastRenderedSlicePx = 0;

  while (sourceY < bodyCanvas.height) {
    const sliceHeightPx = chooseSliceHeightPx(
      sourceY,
      pageHeightPx,
      bodyCanvas.height,
      breakpointsPx,
      minSliceHeightPx
    );

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
    lastRenderedSlicePx = sliceHeightPx;
    isFirst = false;
  }

  // Place footer on the last page pinned above the bottom margin
  if (footerCanvas) {
    const lastPageBodyHeightMm = lastRenderedSlicePx / pixelsPerMm;
    const remainingSpaceMm = contentHeightMm - lastPageBodyHeightMm - FOOTER_SAFETY_MM;

    if (remainingSpaceMm < footerHeightMm) {
      // Not enough room — add a new page for footer
      pdf.addPage();
    }
    pdf.addImage(
      footerCanvas.toDataURL("image/jpeg", 0.98),
      "JPEG",
      MARGIN_LEFT_MM,
      pdfHeight - MARGIN_BOTTOM_MM - footerHeightMm - FOOTER_SAFETY_MM,
      contentWidthMm,
      footerHeightMm,
      undefined,
      "FAST"
    );
  }

  pdf.save(filename);
}
