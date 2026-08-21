import TcpSocket from "react-native-tcp-socket";
import { encodeTestPrint } from "../encoding/EscPosEncoder";

const DEFAULT_TIMEOUT = 5000;

class WifiPrinter {
  constructor(config) {
    this.config = config;
    this.socket = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const { ip, port = 9100 } = this.config;

      if (!ip) {
        reject(new Error("Printer IP is missing"));
        return;
      }

      let settled = false;

      const finish = (callback, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        callback(value);
      };

      const timeout = setTimeout(() => {
        this.destroy();
        finish(reject, new Error("Printer connection timeout"));
      }, DEFAULT_TIMEOUT);

      this.socket = TcpSocket.createConnection(
        {
          host: ip,
          port,
        },
        () => {
          finish(resolve);
        },
      );

      this.socket.on("error", (error) => {
        finish(reject, error);
      });

      this.socket.on("close", () => {
        this.socket = null;
      });
    });
  }

  async print(data) {
    await this.connect();

    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Printer socket unavailable"));
        return;
      }

      this.socket.write(Buffer.from(data), (error) => {
        if (error) {
          this.destroy();
          reject(error);
          return;
        }

        setTimeout(() => {
          this.destroy();
          resolve(true);
        }, 150);
      });
    });
  }

  async testPrint() {
    const data = encodeTestPrint(this.config.paperWidth);
    return this.print(data);
  }

  destroy() {
    try {
      this.socket?.destroy();
    } catch {}

    this.socket = null;
  }
}

export default WifiPrinter;
