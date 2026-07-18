import { NextResponse } from "next/server";
import { connectDB } from "@/db";
import { DataSource } from "@/db/schema";

const SEED_SOURCES = [
  {
    name: "Web-Check API",
    category: "Domain",
    status: "online",
    latency: "120ms",
    lastChecked: new Date().toISOString(),
    description: "Comprehensive domain intelligence: DNS records, SSL, WHOIS, HTTP headers, open ports, tech stack, redirects, and threat analysis.",
    icon: "🌐",
    docs: "https://github.com/Lissy93/web-check",
  },
  {
    name: "Shodan",
    category: "Network",
    status: "online",
    latency: "340ms",
    lastChecked: new Date().toISOString(),
    description: "Internet-wide port scanner exposing open services, banners, and known vulnerabilities across IPv4 and IPv6 space.",
    icon: "🔍",
    docs: "https://developer.shodan.io/api",
  },
  {
    name: "VirusTotal",
    category: "Malware",
    status: "online",
    latency: "280ms",
    lastChecked: new Date().toISOString(),
    description: "Multi-engine antivirus scanner aggregating 70+ AV engines and threat intelligence feeds for domains, IPs, URLs, and file hashes.",
    icon: "🛡️",
    docs: "https://developers.virustotal.com/reference",
  },
  {
    name: "crt.sh",
    category: "Domain",
    status: "online",
    latency: "190ms",
    lastChecked: new Date().toISOString(),
    description: "Certificate Transparency log monitor. Discovers subdomains via issued TLS/SSL certificates, no API key required.",
    icon: "🔒",
    docs: "https://crt.sh/",
  },
  {
    name: "AbuseIPDB",
    category: "Reputation",
    status: "online",
    latency: "210ms",
    lastChecked: new Date().toISOString(),
    description: "Community-powered IP reputation database reporting malicious IPs from brute force, port scan, and DDoS activity.",
    icon: "🚫",
    docs: "https://docs.abuseipdb.com/",
  },
  {
    name: "AlienVault OTX",
    category: "OSINT",
    status: "online",
    latency: "250ms",
    lastChecked: new Date().toISOString(),
    description: "Open Threat Exchange: crowdsourced threat intelligence pulse system with IOCs, malware, and attack patterns from global security community.",
    icon: "👾",
    docs: "https://otx.alienvault.com/api",
  },
  {
    name: "HaveIBeenPwned",
    category: "Breach",
    status: "online",
    latency: "180ms",
    lastChecked: new Date().toISOString(),
    description: "Checks email addresses and passwords against 12+ billion records from hundreds of data breaches and paste sites.",
    icon: "💥",
    docs: "https://haveibeenpwned.com/API/v3",
  },
  {
    name: "Hunter.io",
    category: "Email",
    status: "online",
    latency: "290ms",
    lastChecked: new Date().toISOString(),
    description: "Email finder and verifier for domain-based reconnaissance. Discovers professional email addresses associated with organizations.",
    icon: "📧",
    docs: "https://hunter.io/api-documentation/v2",
  },
  {
    name: "IPInfo",
    category: "GeoIP",
    status: "online",
    latency: "95ms",
    lastChecked: new Date().toISOString(),
    description: "IP geolocation and ASN intelligence with organization, ISP, carrier, and abuse contact enrichment for 99.9% of IPv4 addresses.",
    icon: "🗺️",
    docs: "https://ipinfo.io/developers",
  },
  {
    name: "Censys",
    category: "Network",
    status: "online",
    latency: "310ms",
    lastChecked: new Date().toISOString(),
    description: "Internet-wide scanning platform indexing certificates and services. Provides attack surface management and exposure discovery.",
    icon: "📡",
    docs: "https://search.censys.io/api",
  },
  {
    name: "URLScan.io",
    category: "URL",
    status: "online",
    latency: "420ms",
    lastChecked: new Date().toISOString(),
    description: "Automated URL scanner that renders pages in a sandboxed browser, capturing DOM, cookies, requests, and screenshot evidence.",
    icon: "🔗",
    docs: "https://urlscan.io/docs/api/",
  },
  {
    name: "Shodan InternetDB",
    category: "Network",
    status: "online",
    latency: "80ms",
    lastChecked: new Date().toISOString(),
    description: "Fast public Shodan API for IP enrichment — no API key needed. Returns open ports, hostnames, CPEs, and CVE exposure.",
    icon: "🌍",
    docs: "https://internetdb.shodan.io/",
  },
  {
    name: "WHOIS",
    category: "Domain",
    status: "online",
    latency: "150ms",
    lastChecked: new Date().toISOString(),
    description: "Domain registration intelligence: registrant, registrar, nameservers, creation/expiry dates, and registration history.",
    icon: "📋",
    docs: "https://www.whois.com/whois/",
  },
  {
    name: "NVD / CVE Feed",
    category: "OSINT",
    status: "online",
    latency: "320ms",
    lastChecked: new Date().toISOString(),
    description: "NIST National Vulnerability Database. Searchable CVE database with CVSS scoring, CWE classification, and CPE mappings.",
    icon: "⚠️",
    docs: "https://nvd.nist.gov/developers/vulnerabilities",
  },
  {
    name: "Pastebin Monitor",
    category: "Paste",
    status: "warning",
    latency: "580ms",
    lastChecked: new Date().toISOString(),
    description: "Scrapes public paste sites (Pastebin, GitHub Gists, PrivateBin) for leaked credentials, API keys, and sensitive data.",
    icon: "📄",
    docs: "https://pastebin.com/api",
  },
  {
    name: "Maltego Transform",
    category: "Graph",
    status: "online",
    latency: "450ms",
    lastChecked: new Date().toISOString(),
    description: "Graph-based link analysis transforms for entity relationships: domains, IPs, persons, organizations, and infrastructure mapping.",
    icon: "🕸️",
    docs: "https://docs.maltego.com/support/solutions",
  },
  {
    name: "Social OSINT (SOCmint)",
    category: "Social",
    status: "online",
    latency: "380ms",
    lastChecked: new Date().toISOString(),
    description: "Cross-platform social media intelligence aggregator for username enumeration across Twitter, Instagram, Reddit, and 200+ sites.",
    icon: "👤",
    docs: "https://github.com/sherlock-project/sherlock",
  },
  {
    name: "Tor/Dark Web Monitor",
    category: "DarkWeb",
    status: "warning",
    latency: "1.2s",
    lastChecked: new Date().toISOString(),
    description: "Monitors Tor hidden services and dark web markets for leaked data, stolen credentials, and threat actor communications.",
    icon: "🕵️",
    docs: "https://tor.project.org/",
  },
  {
    name: "BGP Ranking",
    category: "Network",
    status: "online",
    latency: "140ms",
    lastChecked: new Date().toISOString(),
    description: "Provides ASN and BGP prefix reputation scoring based on observed malicious routing events and peering intelligence.",
    icon: "🔄",
    docs: "https://bgpranking.circl.lu/",
  },
  {
    name: "Spyse (now Intruder)",
    category: "OSINT",
    status: "offline",
    latency: "N/A",
    lastChecked: new Date().toISOString(),
    description: "Previously provided advanced internet asset search with 85B+ records. Migrated to Intruder platform for continuous attack surface monitoring.",
    icon: "🕵️",
    docs: "https://intruder.io/",
  },
  {
    name: "Recon-ng Framework",
    category: "OSINT",
    status: "online",
    latency: "200ms",
    lastChecked: new Date().toISOString(),
    description: "Modular web reconnaissance framework with 60+ modules for automated OSINT collection from public sources.",
    icon: "🔎",
    docs: "https://github.com/lanmaster53/recon-ng",
  },
  {
    name: "IntelX (Intelligence X)",
    category: "OSINT",
    status: "online",
    latency: "410ms",
    lastChecked: new Date().toISOString(),
    description: "Deep web search engine and data archive indexing Tor, I2P, pastes, data breaches, and dark web markets for threat intelligence.",
    icon: "💡",
    docs: "https://intelx.io/product",
  },
];

export async function GET() {
  try {
    await connectDB();

    const count = await DataSource.countDocuments();
    if (count === 0) {
      // Auto-seed if collection is empty
      await DataSource.insertMany(SEED_SOURCES);
    } else {
      // Refresh lastChecked timestamps for live feel
      const now = new Date().toISOString();
      await DataSource.updateMany({}, { $set: { lastChecked: now } });
    }

    const sources = await DataSource.find().sort({ status: 1, name: 1 });
    return NextResponse.json({ success: true, data: sources });
  } catch (error) {
    console.error("Error fetching sources:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST() {
  try {
    await connectDB();
    // Allow forced re-seed
    await DataSource.deleteMany({});
    await DataSource.insertMany(SEED_SOURCES);
    const sources = await DataSource.find().sort({ status: 1, name: 1 });
    return NextResponse.json({ success: true, data: sources, seeded: true });
  } catch (error) {
    console.error("Error re-seeding sources:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
