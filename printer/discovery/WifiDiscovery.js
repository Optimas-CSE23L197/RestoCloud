// printer/discovery/WifiDiscovery.js
//
// Scans the local subnet for devices listening on port 9100 (the
// standard raw ESC/POS printing port). Best-effort — caller should
// always offer manual IP entry as a fallback.
//
// FIX: earlier version could report many/most IPs as "reachable"
// on some routers, because some home routers respond to ANY probe
// on a closed port within the LAN (e.g. via ARP-level tricks or
// aggressive connection accept/immediate-reset behavior), and a
// same-tick 'connect' followed by an immediate 'error'/'close' was
// being counted as success. We now require the socket to survive
// briefly and confirm no immediate error before treating it as a
// real printer.

import TcpSocket from "react-native-tcp-socket";
import NetInfo from "@react-native-community/netinfo";

const PRINTER_PORT = 9100;
const PROBE_TIMEOUT_MS = 700; // max wait for a connection attempt
const CONFIRM_DELAY_MS = 150; // after 'connect', wait this long for a stray error before trusting it
const MAX_CONCURRENT = 16; // lower concurrency reduces false positives from router-level throttling

async function getLocalSubnet() {
  const state = await NetInfo.fetch();

  if (state.type !== "wifi" || !state.details?.ipAddress) {
    return null;
  }

  const ip = state.details.ipAddress;
  const parts = ip.split(".");

  if (parts.length !== 4) return null;

  return {
    ip,
    prefix: `${parts[0]}.${parts[1]}.${parts[2]}`,
  };
}

/**
 * Probes a single IP:port. Resolves true ONLY if:
 *  1. A TCP connection is established, AND
 *  2. No error/close event fires within CONFIRM_DELAY_MS afterwards.
 * This filters out routers that accept-then-immediately-reset
 * connections on closed ports, which was causing near-every IP in
 * the subnet to show up as a "printer".
 */
function probeHost(ip, port = PRINTER_PORT) {
  return new Promise((resolve) => {
    let settled = false;
    let socket = null;
    let confirmTimer = null;

    const cleanup = () => {
      clearTimeout(overallTimer);
      clearTimeout(confirmTimer);
      try {
        socket?.destroy();
      } catch {}
    };

    const finish = (result) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };

    const overallTimer = setTimeout(() => finish(false), PROBE_TIMEOUT_MS);

    try {
      socket = TcpSocket.createConnection({ host: ip, port }, () => {
        // Connected — but don't trust it yet. Wait a short beat to
        // see if the router/OS immediately tears it down, which is
        // the pattern that caused false positives.
        confirmTimer = setTimeout(() => finish(true), CONFIRM_DELAY_MS);
      });

      socket.on("error", () => finish(false));
      socket.on("close", () => {
        // If we haven't confirmed success yet and the socket closes,
        // this was NOT a real open port.
        if (!settled) finish(false);
      });
    } catch {
      finish(false);
    }
  });
}

/**
 * Scans the /24 subnet (1-254) for hosts with a genuinely open
 * printer port. Calls onProgress(scanned, total) as it goes.
 * Returns [{ ip, port }] for confirmed-reachable hosts.
 *
 * NOTE: this only confirms "something is listening on 9100 and
 * stayed connected" — it does NOT confirm the device is actually a
 * printer. Always offer a test print before treating it as final.
 */
export async function scanWifiPrinters({ onProgress } = {}) {
  const subnet = await getLocalSubnet();

  if (!subnet) {
    throw new Error("Not connected to WiFi, or local IP unavailable");
  }

  const found = [];
  const ips = [];

  for (let i = 1; i <= 254; i++) {
    ips.push(`${subnet.prefix}.${i}`);
  }

  let scanned = 0;

  async function worker(queue) {
    while (queue.length > 0) {
      const ip = queue.shift();
      const isOpen = await probeHost(ip);

      scanned++;
      onProgress?.(scanned, ips.length);

      if (isOpen) {
        found.push({ ip, port: PRINTER_PORT });
      }
    }
  }

  const queue = [...ips];
  const workers = Array.from({ length: MAX_CONCURRENT }, () => worker(queue));

  await Promise.all(workers);

  return found;
}

/**
 * Validates a manually-entered IP by probing it directly.
 */
export async function verifyWifiPrinter(ip, port = PRINTER_PORT) {
  const isOpen = await probeHost(ip, port);
  return { ip, port, reachable: isOpen };
}
