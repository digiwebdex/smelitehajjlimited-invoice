

## Fix: Move Signature Section to Bottom (Near Footer)

The signature section is currently placed right after the invoice content (notes/payment history) with a small top margin, leaving a large empty gap between it and the footer. It needs to be anchored near the bottom of the page, just above the footer.

### Changes Across All 3 Templates

**1. Web View (`ThemedInvoiceDocument.tsx`)**
- Remove `mt-16` from the signature section
- Position the signature section at the bottom of the invoice container, just above the footer, using `margin-top: auto` on a wrapper or a large enough top margin to push it down
- Since the container doesn't use flex column, use a fixed `mt-auto` approach by wrapping the signature + footer in a bottom-anchored group

**2. A4 Print Template (`A4PrintTemplate.tsx`)**
- Move the signature section to use absolute positioning near the footer (similar to how the footer itself is positioned)
- Place it approximately 20mm above the footer divider line

**3. PDF Export (`generateInvoicePdf.ts`)**
- Change `sigY` from `yPos + 10` (relative to content) to a fixed position relative to the footer (e.g., `footerY - 30`), so signatures always appear just above the footer regardless of content length

### Technical Details

**`ThemedInvoiceDocument.tsx` (line 385)**
- Change the outer div wrapper to use `min-height` on the main container and position signature+footer at the bottom
- Or simply increase the signature margin to push it closer to footer area

**`A4PrintTemplate.tsx` (line ~265)**
- Move signature section to absolute positioning: `bottom: 52mm` (above the footer at `bottom: 20mm`)

**`generateInvoicePdf.ts` (line 497)**
- Change `const sigY = yPos + 10;` to `const sigY = footerY - 25;` so the signature lines appear at a fixed position just above the footer

This ensures the signature section sits consistently near the bottom of the page across screen, print, and PDF outputs.
