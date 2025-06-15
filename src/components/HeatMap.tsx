
import React from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';
// @ts-ignore
import { HeatmapLayer } from 'react-leaflet-heatmap-layer-v3';
import { mockReports } from '@/data/mockReports';

// This is a common fix for an issue with the default marker icon in Leaflet when used with bundlers like Vite.
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const HeatMap = () => {
  const position: L.LatLngExpression = [5, 20]; // Centered on Africa
  
  // The heatmap layer expects an array of [lat, lng, intensity]
  const heatmapData: [number, number, number][] = mockReports.map(report => [report.lat, report.lng, 1]); 

  return (
    <MapContainer 
      center={position} 
      zoom={4} 
      scrollWheelZoom={true} 
      className="w-full h-[500px] rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <HeatmapLayer
        points={heatmapData}
        longitudeExtractor={(m: [number, number, number]) => m[1]}
        latitudeExtractor={(m: [number, number, number]) => m[0]}
        intensityExtractor={(m: [number, number, number]) => m[2]}
        radius={35}
        blur={25}
        max={1.0}
      />
    </MapContainer>
  );
};

export default HeatMap;
