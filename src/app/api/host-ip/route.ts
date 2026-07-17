import { NextResponse } from "next/server";
import os from "os";
import fs from "fs";
import path from "path";

export async function GET() {
  // First, check if a public localtunnel is running and parse its URL
  try {
    const logPath = path.join(process.cwd(), "tunnel.txt");
    if (fs.existsSync(logPath)) {
      const content = fs.readFileSync(logPath, "utf-8");
      // Search for URL pattern like: url: https://wise-radios-double.loca.lt
      const match = content.match(/url:\s+(https:\/\/[^\s]+)/i);
      if (match && match[1]) {
        return NextResponse.json({ url: match[1].trim() });
      }
    }
  } catch (err) {
    console.error("Failed to read tunnel log:", err);
  }

  const interfaces = os.networkInterfaces();
  let fallbackIp = "";

  for (const name of Object.keys(interfaces)) {
    const networkInterface = interfaces[name];
    if (!networkInterface) continue;

    for (const iface of networkInterface) {
      if (iface.family === "IPv4" && !iface.internal) {
        const interfaceName = name.toLowerCase();
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
