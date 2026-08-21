import ReceiptPrinterEncoder from "@point-of-sale/receipt-printer-encoder";

const COLUMN_MAP = {
  58: 32,
  80: 48,
};

export function createEncoder(paperWidth = 80) {
  const columns = COLUMN_MAP[paperWidth];

  if (!columns) {
    console.warn(
      `[EscPosEncoder] Unknown paperWidth: ${paperWidth}, falling back to 80mm/48 columns`,
    );
  }

  return new ReceiptPrinterEncoder({
    language: "esc-pos",
    codepageMapping: "epson",
    width: columns || 48,
  });
}

export function encodeTestPrint(paperWidth = 80) {
  const encoder = createEncoder(paperWidth);

  return encoder
    .initialize()
    .align("center")
    .bold(true)
    .text("RESTOCLOUD")
    .bold(false)
    .newline()
    .text("Printer Test")
    .newline()
    .text("------------------------------")
    .newline()
    .align("left")
    .text("Connection: OK")
    .newline()
    .text(`Paper: ${paperWidth}mm`)
    .newline()
    .newline()
    .align("center")
    .text("Thank You")
    .newline()
    .newline()
    .cut()
    .encode();
}
