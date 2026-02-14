

## Fix Table Row Height to 7mm Across All Invoice Formats

**Goal**: Ensure all invoice table rows are exactly 7mm tall with vertically centered text, consistently across PDF download, web view, and print layout.

---

### Changes Required

**1. PDF Generator (`src/lib/generateInvoicePdf.ts`)**

The current code calculates row height as `Math.max(textBlockHeight + 4, 7)`, which yields 8.2mm for single-line items (4.2 + 4 = 8.2). This makes rows inconsistent and taller than intended.

- Change the padding from `4` to `2.8` so single-line items compute to exactly 7mm: `Math.max(textBlockHeight + 2.8, 7)`
- Keep `minRowHeight = 7`
- Adjust vertical centering offset from `+1` to `+0.8` for better visual centering within the smaller row
- Reduce post-divider spacing from `3` to `2` for tighter row-to-row visual spacing matching the sample image

**2. Web View (`src/components/invoice/ThemedInvoiceDocument.tsx`)**

Currently uses `height: '48px'` (~12.7mm) and `py-4` padding -- inconsistent with 7mm target.

- Change row `height` from `'48px'` to `'26.5px'` (7mm equivalent)
- Change cell padding from `py-4` to `py-1.5` for compact vertical spacing matching 7mm

**3. A4 Print Template (`src/components/invoice/A4PrintTemplate.tsx`)**

Currently uses `height: "8mm"` and `padding: "3mm 0"`.

- Change cell `height` from `"8mm"` to `"7mm"`
- Reduce cell `padding` from `"3mm 0"` to `"1.5mm 0"` so padding doesn't push beyond 7mm

---

### Summary

All three invoice rendering paths (PDF export, web preview, A4 print) will produce uniform 7mm row heights with vertically centered text, matching the provided sample image.

