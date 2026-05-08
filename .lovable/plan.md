## Goal

Make the downloaded PDF look identical to the on-screen software view (image 2). Currently the PDF (image 1) renders the same content but with much larger vertical gaps, pushing the payment history, signatures, address, and QR code onto a second page. The software view fits all of that on a single page with tight spacing.

## Root cause

In `src/components/invoice/ThemedInvoiceDocument.tsx`, the footer wrapper and payment history use generous margins that look fine on screen inside a scrollable card but overflow A4 in the PDF capture:

- Footer wrapper: `mt-16` (64px) above signatures
- Bottom row (address + QR): `mt-12` (48px) above
- Payment History card: `mt-10` + `p-6` (40px top, 24px padding)
- Notes card: `mt-10` + `p-6`
- Bill To section: `mt-6 pt-6`
- Table summary rows: `py-1.5`

The on-screen view in image 2 uses much smaller gaps. The PDF generator (`generateInvoicePdfFromDom.ts`) captures the DOM as-is, so the only fix needed is reducing these spacings in the shared component.

## Changes (single file)

**`src/components/invoice/ThemedInvoiceDocument.tsx`**

1. **Header pb-6 → pb-4** — tighter gap below header.
2. **Bill To block: `mt-6 pt-6` → `mt-4 pt-4`** — match compact software view.
3. **Table wrapper: `mt-6` → `mt-4`**.
4. **Notes card: `mt-10 p-6` → `mt-4 p-4`** — only when notes exist.
5. **Payment History card: `mt-10 p-6` → `mt-4 p-4`**, inner `space-y-3` → `space-y-2`, row `py-2` → `py-1`.
6. **Footer wrapper: `mt-16` → `mt-6`**.
7. **Signature row gap: `24px` → `16px`**, signature image `height: 36px` → `32px`.
8. **Thank you `mt-3` → `mt-2`**.
9. **Bottom row (address + QR): `mt-12` → `mt-6`**.
10. **QR size: 70 → 64**.

These changes apply to both the on-screen view AND the PDF (since the PDF is captured from this same component via `renderAndDownloadInvoicePdf`). The software view in image 2 already looks compact — these reductions bring it slightly tighter, matching the reference, and crucially make the PDF page 1 fit everything just like the screenshot.

## Out of scope

- No changes to `generateInvoicePdfFromDom.ts` (pagination logic stays as-is — once content fits naturally, no page break is needed).
- No changes to colors, fonts, or table column widths.
- No changes to print stylesheet.

## Verification

After the edit, download the PDF for the same invoice (INV-2026-015) and confirm:
- Single page output (matches image 2 layout top-to-bottom)
- Header, Bill To, table, totals, In Word, Payment History, signatures, Thank you, address + QR all visible on page 1
- Spacing between sections matches the software view screenshot
