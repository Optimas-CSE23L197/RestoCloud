// printer/discovery/BluetoothDiscovery.js
//
// Wraps react-native-bluetooth-classic to list already-paired devices
// and to run a nearby device scan (classic BT discovery). Both are
// surfaced separately since paired devices return instantly while
// nearby scan takes several seconds.
//
// IMPORTANT: Android 12+ (API 31+) requires runtime-requested
// BLUETOOTH_CONNECT / BLUETOOTH_SCAN permissions even if declared
// in the manifest. We request them here before any BT API call.

import { PermissionsAndroid, Platform } from "react-native";
import RNBluetoothClassic from "react-native-bluetooth-classic";

const SCAN_TIMEOUT_MS = 12000; // classic BT discovery is slow, give it room

/**
 * Requests the Bluetooth + location permissions needed for classic
 * BT discovery/connect on Android. No-op on iOS (handled via
 * Info.plist prompts instead) and on Android < 12 (manifest-only).
 * Throws if the user denies a required permission.
 */
async function ensureBluetoothPermissions() {
  if (Platform.OS !== "android") return;

  const sdkInt = Platform.Version; // API level on Android

  if (sdkInt >= 31) {
    // Android 12+: granular runtime permissions
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    ]);

    const connectOk =
      granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
      PermissionsAndroid.RESULTS.GRANTED;
    const scanOk =
      granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
      PermissionsAndroid.RESULTS.GRANTED;

    if (!connectOk || !scanOk) {
      throw new Error(
        "Bluetooth permission denied. Enable it in phone Settings > Apps > RestoCloud > Permissions.",
      );
    }
  } else {
    // Android < 12: classic BT scan needs location permission
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );

    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      throw new Error(
        "Location permission denied. It's required by Android for Bluetooth scanning (not used for tracking).",
      );
    }
  }
}

/**
 * Returns devices already paired in the phone's Bluetooth settings.
 * Fast — no scanning involved.
 * Shape: [{ id, name, address, bonded: true }]
 */
export async function getPairedPrinters() {
  await ensureBluetoothPermissions();

  const enabled = await RNBluetoothClassic.isBluetoothEnabled();

  if (!enabled) {
    throw new Error("Bluetooth is turned off");
  }

  const devices = await RNBluetoothClassic.getBondedDevices();

  return devices.map((d) => ({
    id: d.address,
    name: d.name || "Unknown device",
    address: d.address,
    bonded: true,
  }));
}

/**
 * Starts a nearby-device scan (unpaired devices included).
 * Resolves after SCAN_TIMEOUT_MS or when scan naturally completes,
 * whichever is first. Caller should show a spinner during this.
 * Shape: [{ id, name, address, bonded: false }]
 */
export async function scanNearbyPrinters() {
  await ensureBluetoothPermissions();

  const enabled = await RNBluetoothClassic.isBluetoothEnabled();

  if (!enabled) {
    throw new Error("Bluetooth is turned off");
  }

  try {
    const cancelResult = await RNBluetoothClassic.cancelDiscovery();
    console.log("cancelDiscovery result:", cancelResult);
  } catch (e) {
    console.log(
      "cancelDiscovery threw (expected if nothing running):",
      e.message,
    );
  }

  console.log("calling startDiscovery...");
  const scanPromise = RNBluetoothClassic.startDiscovery();
  console.log("startDiscovery called, awaiting race...");

  const timeoutPromise = new Promise((resolve) => {
    setTimeout(async () => {
      try {
        const cancelled = await RNBluetoothClassic.cancelDiscovery();
        console.log("timeout cancelDiscovery result:", cancelled);
        resolve(cancelled || []);
      } catch (e) {
        console.log("timeout cancelDiscovery threw:", e.message);
        resolve([]);
      }
    }, SCAN_TIMEOUT_MS);
  });

  const devices = await Promise.race([scanPromise, timeoutPromise]);
  console.log("race resolved with:", devices);

  return (devices || []).map((d) => ({
    id: d.address,
    name: d.name || "Unknown device",
    address: d.address,
    bonded: false,
  }));
}

/**
 * Convenience: returns paired devices immediately, then nearby
 * devices once the scan completes.
 *
 * onPaired(pairedList) fires first (fast)
 * onNearby(nearbyList) fires after scan completes (slow)
 */
export async function discoverAllPrinters({ onPaired, onNearby } = {}) {
  console.log("=== BT DEBUG ===");
  console.log(
    "isBluetoothEnabled:",
    typeof RNBluetoothClassic.isBluetoothEnabled,
  );
  console.log("getBondedDevices:", typeof RNBluetoothClassic.getBondedDevices);
  console.log("startDiscovery:", typeof RNBluetoothClassic.startDiscovery);
  console.log("cancelDiscovery:", typeof RNBluetoothClassic.cancelDiscovery);
  console.log(
    "PermissionsAndroid.requestMultiple:",
    typeof PermissionsAndroid.requestMultiple,
  );
  console.log("================");

  try {
    const paired = await getPairedPrinters();
    console.log("paired ok:", paired);
    onPaired?.(paired);

    const nearbyRaw = await scanNearbyPrinters();
    console.log("nearby ok:", nearbyRaw);

    const pairedAddresses = new Set(paired.map((d) => d.address));
    const nearby = nearbyRaw.filter((d) => !pairedAddresses.has(d.address));

    onNearby?.(nearby);

    return { paired, nearby };
  } catch (err) {
    console.log("DISCOVERY CRASHED AT:", err.message);
    console.log(err.stack);
    throw err;
  }
}
