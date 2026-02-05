

# PDF Invoice Redesign Plan

## Overview
Redesign the `generateInvoicePdf.ts` to match the professional invoice layout shown in the reference image. The new design features a cleaner, more business-oriented look with improved visual hierarchy.

## Reference Design Analysis

The target design has these key sections:

1. **Header** - Company logo (circular), company name + tagline, "INVOICE" title with invoice number
2. **Two-column info** - Bill To (left) and Invoice/Due Dates (right)
3. **Items table** - Yellow/orange header with DESCRIPTION, QTY, UNIT PRICE, TOTAL columns
4. **Totals section** - Right-aligned with Subtotal, Tax, Total, Total Paid (green), Balance (red box)
5. **Payment History** - Yellow left border accent with payment entries
6. **Footer** - Thank you message and QR code

## Changes Required

### 1. Update Color Scheme
```text
Current                    New Design
---------                  -----------
Teal accent (#14B8A6)  ->  Navy blue (#1E3A5A)
Slate headers          ->  Orange/Yellow (#F59E0B)
```

**New colors:**
- Primary Navy: RGB(30, 58, 90)
- Accent Orange: RGB(245, 158, 11)
- Green (paid): RGB(34, 197, 94)
- Red (balance): RGB(239, 68, 68)

### 2. Redesign Header Section
- Circular company logo (20x20mm) on left
- Company name in bold navy text
- Company tagline below name in gray
- "INVOICE" title in navy on right (large, bold)
- Invoice number in orange below "INVOICE"

### 3. Simplify Info Section
- Remove "FROM" section (company info)
- Keep only "BILL TO" on the left with:
  - Client name (bold)
  - Client email
  - Client phone
  - Client address
- Right side shows:
  - "INVOICE DATE:" label + date value
  - "DUE DATE:" label + date value

### 4. Redesign Items Table
- Orange/yellow background header row
- Columns: DESCRIPTION | QTY | UNIT PRICE | TOTAL
- QTY column shows "1" for each item (since items don't have quantity)
- UNIT PRICE = item amount
- TOTAL = item amount
- Clean white rows with subtle borders

### 5. Update Totals Section
Right-aligned totals with:
- Subtotal (right-aligned)
- Tax (show VAT amount)
- Total (bold)
- Total Paid (green text)
- Balance (red background box with white text)

### 6. Redesign Payment History
- Section header "PAYMENT HISTORY" with yellow left border accent
- Each payment row shows: Date | Payment type | Description | Amount
- Clean table format

### 7. Update Footer
- Left side: "Thank you for staying with us."
- Right side: QR code with "Scan for details" label

## Technical Implementation

### File Modified
`src/lib/generateInvoicePdf.ts` - Complete rewrite of the PDF generation logic

### Key Code Changes

1. **Color definitions:**
```typescript
const navyColor: [number, number, number] = [30, 58, 90];
const orangeColor: [number, number, number] = [245, 158, 11];
const greenColor: [number, number, number] = [34, 197, 94];
const redColor: [number, number, number] = [239, 68, 68];
```

2. **Header layout:**
- Circular logo with cream background
- Company name + tagline stacked
- INVOICE + invoice number right-aligned

3. **Table with 4 columns:**
- DESCRIPTION (60% width)
- QTY (10% width, centered)
- UNIT PRICE (15% width, right-aligned)
- TOTAL (15% width, right-aligned)

4. **Balance box styling:**
- Red/orange left border
- White background
- "Balance" label in red
- Amount in red, bold

5. **QR code positioning:**
- Bottom-right corner
- "Scan for details" label below

## Visual Layout Diagram

```text
+----------------------------------------------------------+
|  [LOGO]  S M Elite Hajj Limited           INVOICE        |
|          Excellence in Every Step of Hajj  INV-XXXX      |
+----------------------------------------------------------+
|                                                          |
|  BILL TO                      INVOICE DATE: Jan 23, 2026 |
|  Mohammad Abdul Rahman            DUE DATE: Mar 15, 2026 |
|  email@example.com                                       |
|  +880 1712-345678                                        |
|  House 45, Road 12, Block D                              |
|                                                          |
+----------------------------------------------------------+
|  DESCRIPTION        |  QTY  |  UNIT PRICE  |    TOTAL   |
|---------------------|-------|--------------|------------|
|  Hajj Package 2026  |   1   |  ৳380,000    |  ৳380,000  |
|  Qurbani Service    |   1   |  ৳45,000     |  ৳45,000   |
|  Travel Insurance   |   1   |  ৳25,000     |  ৳25,000   |
+----------------------------------------------------------+
|                                   Subtotal    ৳450,000   |
|                                        Tax         ৳0    |
|                                      Total    ৳450,000   |
|                                 Total Paid    ৳150,000   |
|                              +---------+---------------+ |
|                              | Balance |    ৳300,000   | |
|                              +---------+---------------+ |
+----------------------------------------------------------+
|  PAYMENT HISTORY                                         |
|  Jan 05, 2026 | Bank Transfer | Advance | ৳150,000      |
+----------------------------------------------------------+
|                                                          |
|  Thank you for staying with us.              [QR CODE]   |
|                                            Scan for      |
|                                             details      |
+----------------------------------------------------------+
```

## Summary

This redesign will create a professional, clean invoice PDF that matches your reference design with:
- Navy and orange color scheme
- Improved visual hierarchy
- 4-column items table (with QTY column)
- Clean totals section with highlighted balance
- Professional payment history formatting
- Updated footer with thank you message and QR code

