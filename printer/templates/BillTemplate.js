// printer/templates/BillTemplate.js
//
// Moved out of components/popup/BillPrintPopup.jsx.
// The popup now only handles UI + fetching; all receipt-text
// formatting lives here so PrinterManager/PrintQueue can call it too.

import {
  padLine,
  centerLine,
  divider,
  parseDate,
  stripHtml,
  numberToWords,
  wrapNameWithRight,
} from "./textHelpers";

// paperWidth (58 | 80) -> character columns. Same mapping as EscPosEncoder.
const COLUMN_MAP = { 58: 32, 80: 48 };

function resolveWidth(paperWidth) {
  return COLUMN_MAP[paperWidth] || 48;
}

export function buildFoodBillText(data, meta, paperWidth = 80) {
  if (!data) return "No data available";

  const width = resolveWidth(paperWidth);
  const { restaurantName, restaurantAddress, gstin, phone, email } = meta;
  const lines = [];

  lines.push(centerLine(restaurantName || "RESTAURANT", width));
  lines.push(centerLine(restaurantAddress || "", width));
  lines.push(`GST No. : ${gstin || ""}`);
  lines.push(`FSSAI No. : ${data?.fssaino || "0"}`);
  lines.push(padLine(`Ph : ${phone || ""}`, phone || "", width));
  lines.push(centerLine(`@ : ${email || ""}`, width));
  lines.push(centerLine("Tax-Invoice", width));
  lines.push(centerLine(`Table. : ${data?.tableno || "-"}`, width));
  lines.push(divider(width));

  lines.push(`Bill No. : ${data?.fbillno || data?.billno || "-"}`);
  lines.push(`Date     : ${parseDate(data?.fbilldttm || data?.billdt)}`);

  lines.push(`Cashier : ${data?.waiternm || "admin"}`);
  lines.push(divider(width));
  lines.push(padLine("Qty", "Particulars", width));
  lines.push(padLine("", "Rate     Amt", width));
  lines.push(divider(width));

  const foodItems = (data?.items || []).filter(
    (item) => item.fb === "N" || item.fb === "F",
  );

  foodItems.forEach((item) => {
    const qty = parseFloat(item.qty || 0).toFixed(0);
    const rate = parseFloat(item.rate || 0).toFixed(2);
    const amt = parseFloat(item.amt || 0).toFixed(2);
    const name = item.menunm || item.name || "Item";
    const peg = item.sbpeg ? ` ${item.sbpeg}` : "";

    lines.push(...wrapNameWithRight(`${name}${peg}`, qty, width));
    lines.push(padLine("", `${rate}     ${amt}`, width));

    if (item.altermenunm) {
      lines.push(`  ${item.altermenunm}`);
    }
  });

  lines.push(divider(width));
  const gross = parseFloat(data?.basicamt || data?.dramt || 0).toFixed(2);
  lines.push(padLine("Gross", ` ${gross}`, width));
  lines.push(
    padLine("CGST", ` ${parseFloat(data?.cgstamt || 0).toFixed(2)}`, width),
  );
  lines.push(
    padLine("SGST", ` ${parseFloat(data?.sgstamt || 0).toFixed(2)}`, width),
  );
  lines.push(
    padLine("Schg", ` ${parseFloat(data?.schgamt || 0).toFixed(2)}`, width),
  );
  lines.push(
    padLine("R.Off", ` ${parseFloat(data?.rndoff || 0).toFixed(2)}`, width),
  );
  lines.push(divider(width));

  const netAmt = parseFloat(data?.dramt || 0).toFixed(2);
  lines.push(centerLine(`Net Bill Amount : ${netAmt}`, width));
  lines.push(divider(width));
  lines.push(`Rupees : ${numberToWords(netAmt)} Only`);
  lines.push(divider(width));
  lines.push(`HSN Code : ${data?.hsncd || "996331"}`);
  lines.push(`Narration : ${data?.billnarr || "-"}`);
  lines.push(divider(width));
  lines.push("E & O.E.                Signature");
  lines.push("");
  lines.push(centerLine("Terms and Conditions:-", width));

  const foodTerms = stripHtml(data?.terms_condition);
  if (foodTerms) lines.push(centerLine(foodTerms, width));

  return lines.join("\n");
}

export function buildLiquorBillText(
  data,
  meta,
  foodNetAmt,
  liquorNetAmt,
  paperWidth = 80,
) {
  if (!data) return "No data available";

  const width = resolveWidth(paperWidth);
  const { restaurantName, restaurantAddress, phone, email } = meta;
  const lines = [];

  lines.push(centerLine(restaurantName || "RESTAURANT", width));
  lines.push(centerLine(restaurantAddress || "", width));
  lines.push(`VAT No. : ${data?.vatno || ""}`);
  lines.push(padLine(`Ph : ${phone || ""}`, phone || "", width));
  lines.push(centerLine(`@ : ${email || ""}`, width));
  lines.push(centerLine("Invoice", width));
  lines.push(centerLine(`Table. : ${data?.tableno || "-"}`, width));
  lines.push(divider(width));

  lines.push(`Bill No. : ${data?.bbillno || data?.billno || "-"}`);
  lines.push(`Date     : ${parseDate(data?.fbilldttm || data?.billdt)}`);

  lines.push(`Waiter : ${data?.waiternm || "admin"}`);
  lines.push(divider(width));
  lines.push(padLine("Qty", "Particulars", width));
  lines.push(padLine("", "Rate     Amt", width));
  lines.push(divider(width));

  (data?.items || [])
    .filter((item) => item.fb === "Y" || item.fb === "L")
    .forEach((item) => {
      const qty = parseFloat(item.qty || 0).toFixed(0);
      const rate = parseFloat(item.rate || 0).toFixed(2);
      const amt = parseFloat(item.amt || 0).toFixed(2);
      const name = item.menunm || item.name || "Item";
      const peg = item.sbpeg ? ` ${item.sbpeg}` : "";

      lines.push(...wrapNameWithRight(`${name}${peg}`, qty, width));
      lines.push(padLine("", `${rate}     ${amt}`, width));

      if (item.altermenunm) {
        lines.push(`  ${item.altermenunm}`);
      }
    });

  lines.push(divider(width));
  const gross = parseFloat(data?.bbasicamt || data?.bdramt || 0).toFixed(2);
  lines.push(padLine("Gross", ` ${gross}`, width));
  lines.push(
    padLine("VAT", ` ${parseFloat(data?.Bvatamt || 0).toFixed(2)}`, width),
  );
  lines.push(
    padLine("Schg", ` ${parseFloat(data?.bschgamt || 0).toFixed(2)}`, width),
  );
  lines.push(
    padLine("R.Off", ` ${parseFloat(data?.brndoff || 0).toFixed(2)}`, width),
  );
  lines.push(divider(width));

  const netAmt = parseFloat(data?.bdramt || 0).toFixed(2);
  lines.push(centerLine(`Net Bill Amount : ${netAmt}`, width));
  lines.push(divider(width));
  lines.push(`Rupees : ${numberToWords(netAmt)} Only`);
  lines.push(divider(width));
  lines.push(`HSN Code : ${data?.hsncd || "996321"}`);
  lines.push(`Narration : ${data?.billnarr || "-"}`);
  lines.push(divider(width));
  lines.push("E & O.E.                Signature");
  lines.push("");
  lines.push(centerLine("Terms and Conditions:-", width));

  const liquorTerms = stripHtml(data?.terms_condition);
  if (liquorTerms) lines.push(centerLine(liquorTerms, width));

  lines.push("");
  lines.push(divider(width));
  const combinedTotal = (
    parseFloat(foodNetAmt || 0) + parseFloat(liquorNetAmt || 0)
  ).toFixed(2);
  lines.push(
    centerLine(
      `Food : ${foodNetAmt} + Liquor : ${liquorNetAmt} = Total : ${combinedTotal}`,
      width,
    ),
  );

  return lines.join("\n");
}
