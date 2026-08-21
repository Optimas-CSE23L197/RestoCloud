// printer/discovery/index.js
export { scanWifiPrinters, verifyWifiPrinter } from "./WifiDiscovery";
export {
  getPairedPrinters,
  scanNearbyPrinters,
  discoverAllPrinters,
} from "./BluetoothDiscovery";
