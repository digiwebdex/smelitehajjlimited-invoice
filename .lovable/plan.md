

## Fix First Table Row Height in PDF

**Problem**: The first row in the PDF table appears significantly taller than the other rows. This happens because after the table header divider line, there is a 6mm gap (`yPos += 6`) before the first row starts, while subsequent rows only have a 2mm gap (`yPos += 2`). This creates a visual inconsistency where the first row looks much larger.

---

### Change

**File: `src/lib/generateInvoicePdf.ts` (line 305)**

Reduce the spacing after the header divider from `6` to `2` to match the inter-row spacing. This ensures the first row has the same 7mm visual height as all other rows.

- Before: `yPos += 6;`
- After: `yPos += 2;`

This single change will make all rows -- including the first one -- consistently 7mm tall in the downloaded PDF.

