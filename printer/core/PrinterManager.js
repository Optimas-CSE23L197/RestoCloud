import { PRINTER_TYPE } from "./PrinterTypes";

import WifiPrinter from "../transports/WifiPrinter";
import BluetoothPrinter from "../transports/BluetoothPrinter";

import PrinterStorage from "../storage/PrinterStorage";
import PrintQueue from "../queue/PrintQueue";

import { encodePlainReceipt } from "../encoding/EscPosEncoder";

class PrinterManager {
  createTransport(config) {
    if (!config) {
      throw new Error("Printer is not configured");
    }

    switch (config.type) {
      case PRINTER_TYPE.WIFI:
        return new WifiPrinter(config);

      case PRINTER_TYPE.BLUETOOTH:
        return new BluetoothPrinter(config);

      default:
        throw new Error(`Unsupported printer type: ${config.type}`);
    }
  }

  async printRaw(printer, data) {
    const transport = this.createTransport(printer);

    return PrintQueue.add({
      task: async () => {
        try {
          return await transport.print(data);
        } finally {
          transport.destroy?.();
        }
      },
    });
  }

  async printText(role, text) {
    const printer = await PrinterStorage.getRole(role);

    if (!printer) {
      throw new Error(`No printer configured for ${role}`);
    }

    const data = encodePlainReceipt(text, printer.paperWidth || 80);

    return this.printRaw(printer, data);
  }

  async getPrinterForRole(role) {
    return PrinterStorage.getRole(role);
  }

  async testPrinter(printer) {
    const transport = this.createTransport(printer);

    return PrintQueue.add({
      task: async () => {
        try {
          return await transport.testPrint();
        } finally {
          transport.destroy?.();
        }
      },
    });
  }
}

export default new PrinterManager();
