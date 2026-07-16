export interface INetworkNode {
  id: string; // The graph library expects id
  nodeId?: string;
  type: string;
  label: string;
  ip?: string;
  risk: "info" | "low" | "medium" | "high" | "critical";
  x?: number;
  y?: number;
}

export interface INetworkLink {
  source: string | INetworkNode;
  target: string | INetworkNode;
}

export interface ICameraFeed {
  _id: string;
  name: string;
  location: string;
  status: string;
  latency: number;
  fps: number;
  uptime: string;
}

export interface ISurveillanceEvent {
  _id: string;
  cameraId: string;
  type: string;
  description: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  timestamp: string;
}

export interface IFeedItem {
  _id: string;
  category: string;
  title: string;
  summary: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  source: string;
  time: string;
  tags: string[];
  iocs: string[];
}
