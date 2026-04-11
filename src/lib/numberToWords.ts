/**
 * Convert a number to English words using Bangladeshi numbering system.
 * Uses Lakh (1,00,000) and Crore (1,00,00,000) instead of Million/Billion.
 */

const ones = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];

const tens = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
];

function chunkToWords(n: number): string {
  if (n === 0) return "";
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + chunkToWords(n % 100) : "");
}

export function numberToWords(num: number): string {
  if (num === 0) return "Zero";

  const n = Math.abs(Math.floor(num));
  if (n === 0) return "Zero";

  const parts: string[] = [];
  let remaining = n;

  // Extract Crores (1,00,00,000)
  if (remaining >= 10000000) {
    const crores = Math.floor(remaining / 10000000);
    parts.push(chunkToWords(crores) + " Crore");
    remaining %= 10000000;
  }

  // Extract Lakhs (1,00,000)
  if (remaining >= 100000) {
    const lakhs = Math.floor(remaining / 100000);
    parts.push(chunkToWords(lakhs) + " Lac");
    remaining %= 100000;
  }

  // Extract Thousands
  if (remaining >= 1000) {
    const thousands = Math.floor(remaining / 1000);
    parts.push(chunkToWords(thousands) + " Thousand");
    remaining %= 1000;
  }

  // Remaining (0-999)
  if (remaining > 0) {
    parts.push(chunkToWords(remaining));
  }

  const result = parts.join(" ");
  return num < 0 ? "Minus " + result : result;
}
