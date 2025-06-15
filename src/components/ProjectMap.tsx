
import React from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { mockReports, Report } from '@/data/mockReports';
import { sdgGoalColors } from '@/lib/constants';
import { Button } from '@/components/ui/button';

// Fix for default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Function to create a custom icon for a single project marker
const createSdgIcon = (sdgGoal: string) => {
  const color = sdgGoalColors[sdgGoal] || '#888888';
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div>`,
    className: '', // Avoids default Leaflet styles
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Function to create a custom icon for a cluster of markers
const createClusterCustomIcon = (cluster: L.MarkerCluster) => {
  const childMarkers = cluster.getAllChildMarkers();
  const count = cluster.getChildCount();

  const sdgGoals = childMarkers.map(marker => (marker.options as any).sdg_goal);
  const mostCommonSdg = sdgGoals.sort((a, b) =>
    sdgGoals.filter(v => v === a).length - sdgGoals.filter(v => v === b).length
  ).pop();

  const color = sdgGoalColors[mostCommonSdg] || '#cccccc';

  return L.divIcon({
    html: `<div style="width: 40px; height: 40px; background-color: ${color}; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${count}</div>`,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

interface ProjectMapProps {
  projects?: Report[];
  onMarkerClick: (report: Report) => void;
}

const ProjectMap: React.FC<ProjectMapProps> = ({ projects, onMarkerClick }) => {
  const position: L.LatLngExpression = [5, 20]; // Centered on Africa
  const reportsToRender = projects || mockReports;

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
      <MarkerClusterGroup iconCreateFunction={createClusterCustomIcon}>
        {reportsToRender.filter(p => p.lat != null && p.lng != null).map((report) => (
          <Marker
            key={report.id}
            position={[report.lat!, report.lng!]}
            icon={createSdgIcon(report.sdg_goal)}
            // @ts-ignore - custom property to access in cluster function
            sdg_goal={report.sdg_goal}
          >
            <Popup>
              <div className="font-bold">{report.title}</div>
              <Button
                variant="link"
                className="p-0 h-auto mt-2"
                onClick={() => onMarkerClick(report)}
              >
                More Details
              </Button>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
};

export default ProjectMap;

