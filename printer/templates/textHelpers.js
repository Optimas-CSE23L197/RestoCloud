// printer/templates/textHelpers.js
//
// Shared plain-text formatting helpers for thermal receipts.
// Width is NOT hardcoded here — every function takes it as a param,
// driven by the printer's paperWidth (58mm -> 32 cols, 80mm -> 48 cols).

export function padLine(left, right, width) {
  const cleanLeft = String(left || "").trim();
  let cleanRight = String(right || "").trim();

  if (cleanRight.length > width - 1) {
    cleanRight = cleanRight.substring(0, width - 4) + "...";
  }

  const totalLength = cleanLeft.length + cleanRight.length;

  // If left + right can't both fit on one line (common on narrow 58mm
  // paper), push right onto its own right-aligned line instead of
  // letting it dangle unaligned on the next line.
  if (totalLength >= width) {
    const rightPad = Math.max(width - cleanRight.length, 0);
    return cleanLeft + "\n" + " ".repeat(rightPad) + cleanRight;
  }

  const space = Math.max(width - cleanLeft.length - cleanRight.length, 1);
  return cleanLeft + " ".repeat(space) + cleanRight;
}

export function centerLine(text, width) {
  const clean = String(text || "").trim();
  if (clean.length === 0) return "";

  const pad = Math.max(Math.floor((width - clean.length) / 2), 0);
  return " ".repeat(pad) + clean;
}

export function divider(width, char = "-") {
  return char.repeat(width);
}

export function parseDate(dateStr) {
  if (!dateStr) return new Date().toLocaleString();
  const d = new Date(dateStr);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// Strip HTML tags from backend terms
export function stripHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Wraps a long item name across multiple lines that fit `width`,
 * padding the final chunk with `rightValue` (e.g. qty), right-aligned.
 * Wraps on word boundaries so words are never cut mid-way — only a
 * single word longer than the available width gets hard-chopped.
 * Returns an array of lines to push into the receipt.
 */
export function wrapNameWithRight(name, rightValue, width) {
  const cleanName = String(name || "").trim();
  const rightStr = String(rightValue ?? "").trim();
  const gap = 1;
  const maxLineWidth = width - rightStr.length - gap;

  // Fallback if paper is absurdly narrow for even the qty column
  if (maxLineWidth <= 0) {
    return [cleanName, rightStr];
  }

  const words = cleanName.split(" ").filter(Boolean);
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    // A single word longer than the line: hard-chop just that word
    if (word.length > maxLineWidth) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = "";
      }
      let remaining = word;
      while (remaining.length > maxLineWidth) {
        lines.push(remaining.substring(0, maxLineWidth));
        remaining = remaining.substring(maxLineWidth);
      }
      currentLine = remaining;
      return;
    }

    const test = currentLine ? `${currentLine} ${word}` : word;
    if (test.length <= maxLineWidth) {
      currentLine = test;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  });

  if (currentLine) lines.push(currentLine);
  if (lines.length === 0) lines.push("");

  // Right-align rightValue only on the last line
  const lastIdx = lines.length - 1;
  return lines.map((line, idx) => {
    if (idx !== lastIdx) return line;
    const padding = Math.max(width - line.length - rightStr.length, gap);
    return line + " ".repeat(padding) + rightStr;
  });
}

// ---------- Amount in Words (Indian numbering) ----------
const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function twoDigitWords(n) {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
}

function threeDigitWords(n) {
  let str = "";
  if (n >= 100) {
    str += ONES[Math.floor(n / 100)] + " Hundred";
    n %= 100;
    if (n) str += " ";
  }
  if (n) str += twoDigitWords(n);
  return str;
}

export function numberToWords(num) {
  num = Math.round(num);
  if (num === 0) return "Zero";

  let str = "";
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = num;

  if (crore) str += threeDigitWords(crore) + " Crore ";
  if (lakh) str += threeDigitWords(lakh) + " Lakh ";
  if (thousand) str += threeDigitWords(thousand) + " Thousand ";
  if (hundred) str += threeDigitWords(hundred);

  return str.trim();
}

export function rupeesInWords(amount) {
  const rupees = Math.round(parseFloat(amount || 0));
  return `Rupees : ${numberToWords(rupees)} Only`;
}
