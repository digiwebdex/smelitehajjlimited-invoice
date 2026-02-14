

## Sync PDF Table Row Height to Match Web View

**Problem**: The PDF table rows are shorter than the web view. The web view (A4PrintTemplate) uses `height: 8mm` + `padding: 3mm 0` per cell, totaling approximately 14mm per row. The PDF generator currently uses `minRowHeight = 6` with 3mm top/bottom padding, resulting in only ~10mm rows.

**Solution**: Increase the PDF row padding and minimum height to match the web view's 14mm row height.

### Technical Changes

**File: `src/lib/generateInvoicePdf.ts`**

1. Increase `rowPaddingTop` from `3` to `4`
2. Increase `rowPaddingBottom` from `3` to `4`
3. Set `minRowHeight` to `14` to match the web view's cell sizing (8mm content height + 6mm padding)
4. Increase the post-divider spacing from `3` to `4` to add breathing room between rows, matching the web view's visual spacing

These changes ensure the PDF table rows have the same generous vertical spacing seen in the web view.
