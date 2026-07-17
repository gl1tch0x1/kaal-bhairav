import { NextResponse } from "next/server";
import os from "os";

export async function GET() {
  const interfaces = os.networkInterfaces();
  let fallbackIp = "";

  for (const name of Object.keys(interfaces)) {
    const networkInterface = interfaces[name];
    if (!networkInterface) continue;

    for (const iface of networkInterface) {
      // Look for non-internal IPv4 address (e.g. 192.168.x.x)
      if (iface.family === "IPv4" && !iface.internal) {
        const interfaceName = name.toLowerCase();
        // Prioritize Wi-Fi, Ethernet, and WLAN interfaces
        if (
          interfaceName.includes("wi-fi") || 
          interfaceName.includes("ethernet") || 
          interfaceName.includes("wlan") || 
          interfaceName.includes("eth") || 
          interfaceName.includes("en0")
        ) {
          return NextResponse.json({ ip: iface.address });
        }
        fallbackIp = iface.address;
      }
    }
  }

  return NextResponse.json({ ip: fallbackIp || "localhost" });
}
