

## Fix: Status Badge Rounded Shape in PDF

The PDF download uses `doc.roundedRect(..., 2, 2, ...)` for the status badge, which creates slightly rounded corners. The web view uses `rounded-full` (pill shape). To match, the PDF border radius should be half the badge height (3mm for a 6mm tall badge), creating a fully rounded pill shape.

### Technical Details

**File: `src/lib/generateInvoicePdf.ts`** (line 193)
- Change `roundedRect` radius from `2, 2` to `3, 3` (half of the 6mm height) to create a pill-shaped badge matching the web view's `rounded-full` style.

Single line change:
```typescript
// Before
doc.roundedRect(pageWidth - margin - statusWidth, yPos + 16, statusWidth, 6, 2, 2, "F");

// After
doc.roundedRect(pageWidth - margin - statusWidth, yPos + 16, statusWidth, 6, 3, 3, "F");
```

