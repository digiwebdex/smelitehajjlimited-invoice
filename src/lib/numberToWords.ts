/**
 * Convert a number to English words.
 * Handles integers up to 999,999,999,999 (billions).
 * Decimals are ignored (floor applied).
 */

const ones = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];

const tens = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
];

const scales = ["", "Thousand", "Million", "Billion"];

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

  const chunks: number[] = [];
  let remaining = n;
  while (remaining > 0) {
    chunks.push(remaining % 1000);
    remaining = Math.floor(remaining / 1000);
  }

  const parts = chunks
    .map((chunk, i) => {
      if (chunk === 0) return "";
      return chunkToWords(chunk) + (scales[i] ? " " + scales[i] : "");
    })
    .filter(Boolean)
    .reverse();

  const result = parts.join(" ");
  return num < 0 ? "Minus " + result : result;
}
