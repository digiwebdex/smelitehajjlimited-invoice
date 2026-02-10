

## Invoice Template Enhancements

Based on your annotated image, here are the changes to be made across all three outputs (screen view, print, and PDF):

### 1. Fix Summary Section Divider Line
The horizontal line between the items table and the summary section currently stretches too wide. It will be adjusted to align with the summary block only (right-aligned, matching the summary width).

### 2. Add "In Word" Line (Amount in Words)
A new line will appear below the Balance box showing the total due amount written out in words. For example:
- "In Word : Twenty Three Thousand"

This requires a number-to-words converter function that handles BDT amounts.

### 3. Add Signature Section
Three signature blocks will be added below the payment history (and before the footer):
- **Received by** (left)
- **Prepared by** (center)
- **Authorize by** (right)

Each will have a horizontal line above the label for the actual signature.

---

### Technical Details

**Files to modify:**
1. `src/components/invoice/ThemedInvoiceDocument.tsx` -- Web/screen view
2. `src/components/invoice/A4PrintTemplate.tsx` -- Print view
3. `src/lib/generateInvoicePdf.ts` -- PDF export

**New utility to create:**
- A `numberToWords` helper function to convert numeric amounts to English words (e.g., 23000 to "Twenty Three Thousand")

**Changes per file:**

**All three templates:**
- After the Balance box, add an "In Word" row displaying the due/total amount in English words
- Add a signature section with three equally-spaced columns showing signature lines and labels
- Adjust the item-to-summary divider line to be right-aligned and match the summary block width

**Layout for signature section (using inline-block, no flex/grid for print/PDF parity):**

```text
____________________    ____________________    ____________________
   Received by             Prepared by            Authorize by
```

