import { Buffer } from "buffer";
import RNBluetoothClassic from "react-native-bluetooth-classic";

class BluetoothPrinter {
  constructor(config) {
    this.config = config;
    this.device = null;
  }

  async connect() {
    if (!this.config.address) {
      throw new Error("Bluetooth printer address is missing");
    }

    const devices = await RNBluetoothClassic.getBondedDevices();
    const device = devices.find((d) => d.address === this.config.address);

    if (!device) {
      throw new Error("Bluetooth printer is not paired");
    }

    this.device = device;

    const connected = await device.isConnected();

    if (!connected) {
      await device.connect();
    }

    return true;
  }

  async print(data) {
    await this.connect();

    if (!this.device) {
      throw new Error("Bluetooth device unavailable");
    }

    const base64Data = uint8ArrayToBase64(data);
    await this.device.write(base64Data, "base64");

    return true;
  }

  async testPrint() {
    console.log("Enter Bluetooth printer...");
    const { encodeTestPrint } = await import("../encoding/EscPosEncoder");

    const data = encodeTestPrint(this.config.paperWidth);
    console.log("Before printing...");
    return this.print(data);
  }

  async disconnect() {
    try {
      await this.device?.disconnect();
    } catch {}

    this.device = null;
  }
}

function uint8ArrayToBase64(uint8Array) {
  return Buffer.from(uint8Array).toString("base64");
}

export default BluetoothPrinter;
