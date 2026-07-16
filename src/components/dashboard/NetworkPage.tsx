"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Map, Globe, Shield, Radar, Wifi, Activity, Server, ArrowRight, Search, Info } from "lucide-react";
import dynamic from "next/dynamic";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false, loading: () => <div className="flex-1 min-h-[500px] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div> });

const NODE_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  target: { fill: "#dc2626", stroke: "#ef4444", text: "#fca5a5" },
  domain: { fill: "#7c3aed", stroke: "#8b5cf6", text: "#c4b5fd" },
  ip: { fill: "#0891b2", stroke: "#22d3ee", text: "#67e8f9" },
  email: { fill: "#d97706", stroke: "#f59e0b", text: "#fcd34d" },
  server: { fill: "#dc2626", stroke: "#ef4444", text: "#fca5a5" },
};

const RISK_BADGE: Record<string, string> = {
  critical: "text-red-400 bg-red-500/15 border-red-500/30",
  high: "text-orange-400 bg-orange-500/15 border-orange-500/30",
  medium: "text-yellow-400 bg-yellow-500/15 border-yellow-500/30",
  low: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
  info: "text-blue-400 bg-blue-500/15 border-blue-500/30",
};

export default function NetworkPage() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("/api/network")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setNodes(data.data.nodes.map((n: any) => ({ ...n, id: n.nodeId })));
          setLinks(data.data.links);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const { graphData, edges } = useMemo(() => {
    const edgesList: Array<{ from: any; to: any }> = [];
    const seen = new Set<string>();
    
    const gNodes = nodes.map(n => ({ 
      ...n, 
      val: n.risk === "critical" ? 25 : n.risk === "high" ? 15 : 8 
    }));

    const gLinks: Array<{ source: string; target: string }> = [];

    links.forEach((link) => {
      const edgeKey = [link.source, link.target].sort().join("-");
      if (!seen.has(edgeKey)) {
        seen.add(edgeKey);
        const sourceNode = nodes.find(n => n.id === link.source);
        const targetNode = nodes.find(n => n.id === link.target);
        if (sourceNode && targetNode) {
          edgesList.push({ from: sourceNode, to: targetNode });
          gLinks.push({ source: link.source, target: link.target });
        }
      }
    });

    return { 
      graphData: { nodes: gNodes, links: gLinks }, 
      edges: edgesList 
    };
  }, [nodes, links]);

  const filteredNodes = useMemo(() => {
    if (!searchQuery) return nodes;
    const lowerQ = searchQuery.toLowerCase();
    return nodes.filter(n => 
      n.label?.toLowerCase().includes(lowerQ) || 
      n.id?.toLowerCase().includes(lowerQ) ||
      n.ip?.includes(lowerQ)
    );
  }, [searchQuery, nodes]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Map className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-mono text-emerald-400/80 tracking-wider">NETWORK ANALYSIS</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Network Intelligence Map</h1>
          <p className="text-slate-500 text-sm mt-0.5">Visual link analysis and relationship mapping</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Nodes", value: loading ? "-" : nodes.length, icon: Radar, color: "text-cyan-400" },
          { label: "Connections", value: loading ? "-" : edges.length, icon: Wifi, color: "text-emerald-400" },
          { label: "Critical Nodes", value: loading ? "-" : nodes.filter(n => n.risk === "critical").length, icon: Shield, color: "text-red-400" },
          { label: "Active Threats", value: loading ? "-" : "12", icon: Activity, color: "text-amber-400" },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-4 flex items-center gap-3">
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
            <div>
              <div className="text-xl font-bold text-white">
                {loading ? <div className="h-6 w-8 bg-[#1e3a5f]/50 rounded animate-pulse" /> : stat.value}
              </div>
              <div className="text-[10px] text-slate-500">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Network Graph */}
        <div className="lg:col-span-2 glass rounded-xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e3a5f]/40 bg-[#050b14]/50 z-10">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
              Interactive Force-Directed Topology
            </h3>
            <div className="flex gap-2 text-[10px]">
              {Object.entries(NODE_COLORS).map(([type, colors]) => (
                <div key={type} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.fill }} />
                  <span className="text-slate-500 capitalize">{type}</span>
                </div>
              ))}
            </div>
          </div>

          <div 
            ref={setContainer} 
            className="relative flex-1 bg-[#030710] min-h-[500px]"
          >
            {/* Grid overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
              backgroundImage: "linear-gradient(rgba(8,145,178,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(8,145,178,0.5) 1px, transparent 1px)",
              backgroundSize: "40px 40px"
            }} />

            {container && !loading && (
              <ForceGraph2D
                width={container.clientWidth}
                height={container.clientHeight || 500}
                graphData={graphData}
                nodeRelSize={6}
                nodeColor={(node: any) => NODE_COLORS[node.type]?.fill || "#0891b2"}
                linkColor={() => "rgba(8,145,178,0.3)"}
                linkWidth={1.5}
                linkDirectionalParticles={2}
                linkDirectionalParticleWidth={2}
                linkDirectionalParticleSpeed={0.005}
                nodeCanvasObject={(node: any, ctx, globalScale) => {
                  const label = node.label || node.id;
                  const isSelected = selectedNode?.id === node.id;
                  const colors = NODE_COLORS[node.type] || NODE_COLORS.ip;
                  
                  const fontSize = 12/globalScale;
                  ctx.font = `${fontSize}px Sans-Serif`;
                  
                  // Node Circle
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
                  ctx.fillStyle = colors.fill;
                  ctx.fill();
                  
                  // Selected Glow/Border
                  if (isSelected) {
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, node.val + 2, 0, 2 * Math.PI, false);
                    ctx.strokeStyle = colors.stroke;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                  }

                  // Label
                  const textWidth = ctx.measureText(label).width;
                  const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);
                  
                  ctx.fillStyle = 'rgba(3, 7, 16, 0.8)';
                  ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y + node.val + 2, bckgDimensions[0], bckgDimensions[1]);
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillStyle = colors.text;
                  ctx.fillText(label, node.x, node.y + node.val + 2 + fontSize/2);
                }}
                onNodeClick={(node) => setSelectedNode(node)}
                onBackgroundClick={() => setSelectedNode(null)}
              />
            )}
            {loading && (
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
               </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="glass rounded-xl p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search nodes, IP, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full input-dark pl-9 pr-4 py-2 rounded-lg text-sm"
              />
            </div>
            
            <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Node Directory</h4>
            <div className="max-h-[200px] overflow-y-auto space-y-1 pr-2 custom-scrollbar">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-8 bg-[#1e3a5f]/30 rounded animate-pulse" />)
              ) : (
                filteredNodes.map(node => (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-all ${
                      selectedNode?.id === node.id ? "bg-[#1e3a5f]/80 text-white" : "text-slate-400 hover:bg-[#1e3a5f]/40 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: NODE_COLORS[node.type]?.fill || "#fff" }} />
                      <span className="truncate">{node.label}</span>
                    </div>
                    <span className="opacity-50 text-[9px] uppercase">{node.type}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Node Inspector */}
          <div className="glass rounded-xl p-4 flex-1 min-h-[250px]">
            <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
              <Info className="w-3.5 h-3.5" /> Inspector
            </h4>
            
            {selectedNode ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-medium ${RISK_BADGE[selectedNode.risk] || RISK_BADGE.info}`}>
                      {selectedNode.risk} RISK
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase">{selectedNode.type}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white break-words">{selectedNode.label}</h3>
                  <p className="text-xs text-cyan-400 font-mono mt-1">{selectedNode.id}</p>
                </div>

                <div className="space-y-2 text-sm border-y border-[#1e3a5f]/40 py-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">IP Address</span>
                    <span className="text-white font-mono text-xs">{selectedNode.ip || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Connections</span>
                    <span className="text-white font-mono text-xs">{links.filter(l => l.source === selectedNode.id || l.target === selectedNode.id).length}</span>
                  </div>
                </div>

                <div>
                  <h5 className="text-[10px] uppercase text-slate-500 mb-2">Direct Links</h5>
                  <div className="space-y-1 max-h-[100px] overflow-y-auto custom-scrollbar">
                    {links.filter(l => l.source === selectedNode.id || l.target === selectedNode.id).map(l => {
                      const otherId = l.source === selectedNode.id ? l.target : l.source;
                      const otherNode = nodes.find(n => n.id === otherId);
                      return otherNode ? (
                        <div key={otherId} className="text-xs flex items-center gap-2 text-slate-400 bg-[#0d1b2e] p-1.5 rounded">
                          <ArrowRight className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                          <span className="truncate">{otherNode.label}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 py-8">
                <Radar className="w-8 h-8 opacity-20" />
                <p className="text-xs text-center max-w-[150px]">Select a node on the map or from the directory to inspect its intelligence profile.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
