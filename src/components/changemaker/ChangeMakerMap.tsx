
import React from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { ChangeMaker } from '@/data/mockChangeMakers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Fix for default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createChangeMakerIcon = (type: string) => {
  const colors = {
    individual: '#3B82F6',
    group: '#10B981',
    ngo: '#8B5CF6',
    corporate: '#F59E0B'
  };
  const color = colors[type as keyof typeof colors] || '#6B7280';
  
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const createClusterIcon = (cluster: L.MarkerCluster) => {
  const count = cluster.getChildCount();
  return L.divIcon({
    html: `<div style="width: 40px; height: 40px; background-color: #10B981; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${count}</div>`,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

interface ChangeMakerMapProps {
  changeMakers: ChangeMaker[];
}

const ChangeMakerMap: React.FC<ChangeMakerMapProps> = ({ changeMakers }) => {
  const position: L.LatLngExpression = [5, 20]; // Centered on Africa

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'individual': return 'bg-blue-100 text-blue-800';
      case 'group': return 'bg-green-100 text-green-800';
      case 'ngo': return 'bg-purple-100 text-purple-800';
      case 'corporate': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <MapContainer
      center={position}
      zoom={4}
      scrollWheelZoom={true}
      className="w-full h-[600px] rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MarkerClusterGroup iconCreateFunction={createClusterIcon}>
        {changeMakers.filter(cm => cm.lat != null && cm.lng != null).map((changeMaker) => (
          <Marker
            key={changeMaker.id}
            position={[changeMaker.lat!, changeMaker.lng!]}
            icon={createChangeMakerIcon(changeMaker.type)}
          >
            <Popup>
              <div className="space-y-2">
                <div className="font-bold">{changeMaker.name}</div>
                <Badge className={getTypeColor(changeMaker.type)}>
                  {changeMaker.type.charAt(0).toUpperCase() + changeMaker.type.slice(1)}
                </Badge>
                <p className="text-sm">{changeMaker.bio}</p>
                <div className="text-xs text-gray-500">
                  {changeMaker.impactMetrics.projectsCompleted} projects completed
                </div>
                <Button variant="link" className="p-0 h-auto mt-2">
                  View Profile
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
};

export default ChangeMakerMap;
