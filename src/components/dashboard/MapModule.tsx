"use client";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default Leaflet marker icons in Next.js
import L from "leaflet";
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapProps {
  threats: Array<{ id: string; lat: number; lng: number; risk: string; desc: string }>;
}

export default function MapModule({ threats }: MapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-full w-full bg-[#050b14] animate-pulse rounded-xl" />;

  return (
    <div className="h-full w-full rounded-xl overflow-hidden border border-[#1e3a5f]/60 relative z-0">
      <MapContainer 
        center={[20, 0]} 
        zoom={2} 
        style={{ height: "100%", width: "100%", background: "#050b14" }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        {threats.map((threat) => (
          <div key={threat.id}>
            <Marker position={[threat.lat, threat.lng]} icon={icon}>
              <Popup className="custom-popup">
                <div className="text-sm font-bold text-slate-800">{threat.desc}</div>
                <div className="text-xs text-red-500 font-mono">Risk: {threat.risk}</div>
              </Popup>
            </Marker>
            <Circle 
              center={[threat.lat, threat.lng]} 
              pathOptions={{ fillColor: threat.risk === 'critical' ? 'red' : 'orange', color: 'transparent', fillOpacity: 0.4 }} 
              radius={200000} 
            />
          </div>
        ))}
      </MapContainer>
    </div>
  );
}
