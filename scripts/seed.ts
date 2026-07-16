import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { 
  User, Target, FeedItem, Report, DataSource, 
  NetworkNode, NetworkLink, OSINTResult, CameraFeed, SurveillanceEvent 
} from "../src/db/schema";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/osint";

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected.");

    console.log("Clearing existing data...");
    await User.deleteMany({});
    await Target.deleteMany({});
    await FeedItem.deleteMany({});
    await Report.deleteMany({});
    await DataSource.deleteMany({});
    await NetworkNode.deleteMany({});
    await NetworkLink.deleteMany({});
    await OSINTResult.deleteMany({});
    await CameraFeed.deleteMany({});
    await SurveillanceEvent.deleteMany({});

    console.log("Seeding Admin User...");
    const hashedPassword = await bcrypt.hash("admin", 12);
    await User.create({
      username: "admin",
      email: "admin@example.com",
      password: hashedPassword,
      fullName: "System Admin",
      role: "admin",
    });

    console.log("Seeding Targets...");
    await Target.insertMany([
      { type: "person", label: "John Smith", value: "john.smith@techcorp.com", notes: "Executive target", risk: "high", tags: ["fraud"] },
      { type: "domain", label: "malicious-site.xyz", value: "malicious-site.xyz", notes: "Phishing infrastructure", risk: "critical", tags: ["phishing"] },
      { type: "ip", label: "TOR Exit Node", value: "185.220.101.47", notes: "Known TOR exit node", risk: "high", tags: ["tor"] }
    ]);

    console.log("Seeding Feed Items...");
    await FeedItem.insertMany([
      { category: "APT", title: "APT29 Targeting Financial Sector", summary: "Russian state-sponsored group detected...", severity: "critical", source: "CISA", tags: ["APT"] },
      { category: "Breach", title: "2.1M Records Exposed", summary: "Darknet marketplace listing...", severity: "high", source: "HaveIBeenPwned", tags: ["Breach"] }
    ]);

    console.log("Seeding Reports...");
    await Report.insertMany([
      { title: "APT29 Campaign Analysis", description: "Comprehensive analysis", type: "Threat Intelligence", date: "2024-01-15", pages: 24, status: "published", author: "Lead Analyst", severity: "critical" },
      { title: "Q4 2023 OSINT Summary", description: "Quarterly summary", type: "Quarterly Report", date: "2024-01-05", pages: 48, status: "published", author: "Team", severity: "medium" }
    ]);

    console.log("Seeding Data Sources...");
    await DataSource.insertMany([
      { name: "Shodan", category: "Network", status: "online", latency: "142ms", lastChecked: "1m ago", description: "Internet scanner", icon: "🔍", docs: "https://shodan.io" },
      { name: "VirusTotal", category: "Malware", status: "online", latency: "89ms", lastChecked: "2m ago", description: "Malware analysis", icon: "🦠", docs: "https://virustotal.com" }
    ]);

    console.log("Seeding Network Graph...");
    const INITIAL_NODES = [
      { id: "A", type: "target", label: "Suspect A", ip: "185.220.101.47", risk: "critical", connections: ["B", "C", "E"] },
      { id: "B", type: "domain", label: "evil-c2.xyz", ip: "N/A", risk: "critical", connections: ["A", "D"] },
      { id: "C", type: "ip", label: "Proxy Node", ip: "103.21.244.0", risk: "high", connections: ["A", "F"] },
      { id: "D", type: "email", label: "phish@dark.ru", ip: "N/A", risk: "high", connections: ["B", "E"] },
      { id: "E", type: "target", label: "Suspect B", ip: "91.108.4.0", risk: "medium", connections: ["A", "D"] },
      { id: "F", type: "server", label: "C2 Server", ip: "45.33.32.156", risk: "critical", connections: ["C"] },
    ];
    
    // Convert to DB format
    const dbNodes = INITIAL_NODES.map(n => ({ nodeId: n.id, type: n.type, label: n.label, ip: n.ip, risk: n.risk }));
    const dbLinks: { source: string, target: string }[] = [];
    INITIAL_NODES.forEach(n => {
      n.connections.forEach(target => dbLinks.push({ source: n.id, target }));
    });
    
    await NetworkNode.insertMany(dbNodes);
    await NetworkLink.insertMany(dbLinks);

    console.log("Seeding Cameras...");
    const cam1 = await CameraFeed.create({ name: "CAM-01-MAIN", location: "Main Entry", status: "online", latency: 24, fps: 30, uptime: "99.9%" });
    const cam2 = await CameraFeed.create({ name: "CAM-02-PERIMETER", location: "North Fence", status: "online", latency: 32, fps: 24, uptime: "98.5%" });

    console.log("Seeding Camera Events...");
    await SurveillanceEvent.insertMany([
      { cameraId: cam1._id, type: "FACIAL_MATCH", description: "Watchlist match detected: Subject A", severity: "critical" },
      { cameraId: cam2._id, type: "MOTION", description: "Unauthorized movement detected", severity: "medium" }
    ]);

    console.log("Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();
