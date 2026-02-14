

## Plan: Invoice Layout Fixes (3 Issues)

### Issue 1: Equal Table Row Heights
All item rows in the table should have consistent, equal heights regardless of content length.

**Changes needed in:**
- `A4PrintTemplate.tsx` - Add fixed minimum height to table row cells
- `ThemedInvoiceDocument.tsx` - Add consistent vertical padding to table cells
- `generateInvoicePdf.ts` - Already uses `rowPaddingTop`/`rowPaddingBottom` but ensure minimum row height is enforced uniformly

### Issue 2: "In Word" Line Wrapping
When the amount-in-words text is long (e.g., "One Hundred Fifty Seven Thousand Five Hundred"), it overflows past the right margin. The text should wrap to a second line and stay within the summary block width.

**Changes needed in:**
- `A4PrintTemplate.tsx` - Add `maxWidth` and `wordBreak`/`overflowWrap` to the "In Word" div so text wraps within the 75mm summary block
- `ThemedInvoiceDocument.tsx` - Ensure the "In Word" text wraps within the w-80 summary container
- `generateInvoicePdf.ts` - Use `doc.splitTextToSize()` for the "In Word" text to wrap within the summary width (75mm)

### Issue 3: Signature Section Alignment
"Received by" should be aligned to the left margin, "Prepared by" stays centered, and "Authorize by" should be at the right margin. Currently all three are equally spaced in the center.

**Changes needed in:**
- `A4PrintTemplate.tsx` - Change the three signature columns: first aligns left (starting at left margin), last aligns right (ending at right margin), middle stays centered
- `ThemedInvoiceDocument.tsx` - Same alignment: left, center, right using `justify-between` layout
- `generateInvoicePdf.ts` - Adjust signature line and label positions: first at left margin, last ending at right margin

---

### Technical Details

**Files to modify (3 files, all changes synchronized for visual parity):**

1. **`src/components/invoice/A4PrintTemplate.tsx`**
   - Table rows: add `height: "8mm"` to each `<td>` for uniform sizing
   - "In Word" div: constrain width to `75mm` and add `overflowWrap: "break-word"`
   - Signature: change from three equal `33%` centered blocks to `justify-between` layout with left/center/right alignment

2. **`src/components/invoice/ThemedInvoiceDocument.tsx`**
   - Table rows: ensure consistent `py-4` and add `min-h` if needed
   - "In Word": add `break-words` class or constrain max-width
   - Signature: use `flex justify-between` with left-aligned first, centered middle, right-aligned last

3. **`src/lib/generateInvoicePdf.ts`**
   - Table rows: enforce a fixed minimum `totalRowHeight` (e.g., 10mm) regardless of content
   - "In Word": use `splitTextToSize(text, summaryWidth)` and render multi-line
   - Signature: position "Received by" line starting at `margin`, "Authorize by" line ending at `pageWidth - margin`
