import { PRINTER_TYPE, PRINTER_ROLE } from "./PrinterTypes";

export function createPrinterConfig({
  id,
  name,
  type,
  role,
  ip = null,
  port = 9100,
  address = null,
  paperWidth = 80,
}) {
  const VALID_PAPER_WIDTHS = [58, 80];

  if (!id) throw new Error("Printer id is required");
  if (!name) throw new Error("Printer name is required");

  if (!Object.values(PRINTER_TYPE).includes(type)) {
    throw new Error(`Invalid printer type: ${type}`);
  }

  if (!Object.values(PRINTER_ROLE).includes(role)) {
    throw new Error(`Invalid printer role: ${role}`);
  }

  if (type === PRINTER_TYPE.WIFI && !ip) {
    throw new Error("Wi-Fi printer requires an IP address");
  }

  if (type === PRINTER_TYPE.BLUETOOTH && !address) {
    throw new Error("Bluetooth printer requires device address");
  }

  if (!VALID_PAPER_WIDTHS.includes(paperWidth)) {
    throw new Error(
      `Invalid paperWidth: ${paperWidth}. Must be one of: ${VALID_PAPER_WIDTHS.join(", ")}`,
    );
  }

  return {
    id,
    name,
    type,
    role,
    ip,
    port,
    address,
    paperWidth,
  };
}
