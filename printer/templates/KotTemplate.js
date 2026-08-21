// printer/templates/KotTemplate.js
//
// Moved out of components/popup/KotPrintPopup.jsx.
// The popup now only handles UI + fetching; all receipt-text
// formatting lives here so PrinterManager/PrintQueue can call it too.

import { padLine, centerLine, divider, wrapNameWithRight } from "./textHelpers";

const COLUMN_MAP = { 58: 32, 80: 48 };

function resolveWidth(paperWidth) {
  return COLUMN_MAP[paperWidth] || 48;
}

export function buildKotReceiptText(
  { table, kot, items, restaurantName, destinationLabel },
  paperWidth = 80,
) {
  const width = resolveWidth(paperWidth);
  const lines = [];

  lines.push(centerLine(restaurantName || "RESTAURANT", width));
  lines.push(centerLine("KOT RECEIPT", width));
  lines.push(divider(width));
  lines.push(
    padLine(
      `Table: ${table?.tableNo || "-"}`,
      `KOT: ${kot?.kotno || kot?.code || "-"}`,
      width,
    ),
  );
  lines.push(`Date : ${new Date().toLocaleString()}`);
  if (table?.guestName) lines.push(`Guest: ${table.guestName}`);
  lines.push(divider(width));
  lines.push(padLine("Item", "Qty", width));
  lines.push(divider(width));

  (items || []).forEach((item) => {
    const name = item.menuname || item.menunm || item.name || "Item";
    const qty = String(item.qty ?? "");

    lines.push(...wrapNameWithRight(name, qty, width));

    if (item.infoforkot) {
      lines.push(`  note: ${item.infoforkot}`);
    }
  });

  lines.push(divider(width));
  lines.push(centerLine(`*** ${destinationLabel} ***`, width));

  return lines.join("\n");
}
