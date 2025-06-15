
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [token, setToken] = useState(localStorage.getItem('mapbox_token') || '');
  const [tempToken, setTempToken] = useState('');
  const [isTokenSet, setIsTokenSet] = useState(!!(localStorage.getItem('mapbox_token')));

  useEffect(() => {
    if (!isTokenSet || !mapContainer.current) return;

    mapboxgl.accessToken = token;
    
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      projection: { name: 'globe' },
      zoom: 1.5,
      center: [20, 10],
    });

    map.current.on('style.load', () => {
      map.current?.setFog({
        color: 'rgb(255, 255, 255)',
        'high-color': 'rgb(200, 200, 225)',
        'horizon-blend': 0.2,
      });
    });
    
    const secondsPerRevolution = 240;
    const maxSpinZoom = 5;
    const slowSpinZoom = 3;
    let userInteracting = false;
    let spinEnabled = true;

    function spinGlobe() {
      if (!map.current) return;
      const zoom = map.current.getZoom();
      if (spinEnabled && !userInteracting && zoom < maxSpinZoom) {
        let distancePerSecond = 360 / secondsPerRevolution;
        if (zoom > slowSpinZoom) {
          const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
          distancePerSecond *= zoomDif;
        }
        const center = map.current.getCenter();
        center.lng -= distancePerSecond;
        map.current.easeTo({ center, duration: 1000, easing: (n) => n });
      }
    }

    map.current.on('mousedown', () => { userInteracting = true; });
    map.current.on('mouseup', () => { userInteracting = false; spinGlobe(); });
    map.current.on('dragstart', () => { userInteracting = true; });
    map.current.on('dragend', () => { userInteracting = false; spinGlobe(); });
    map.current.on('touchstart', () => { userInteracting = true; });
    map.current.on('touchend', () => { userInteracting = false; spinGlobe(); });
    map.current.on('moveend', () => { spinGlobe(); });

    spinGlobe();

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [isTokenSet, token]);

  const handleSetToken = () => {
    if (tempToken) {
      localStorage.setItem('mapbox_token', tempToken);
      setToken(tempToken);
      setIsTokenSet(true);
    }
  };

  if (!isTokenSet) {
    return (
      <div className="flex items-center justify-center h-full bg-muted rounded-lg">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Mapbox Access Token Required</CardTitle>
            <CardDescription>
              To view the interactive map, please provide a public access token.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You can get one from your <a href="https://account.mapbox.com/access-tokens" target="_blank" rel="noopener noreferrer" className="text-primary underline">Mapbox account</a>.
            </p>
            <div className="flex w-full items-center space-x-2">
              <Input 
                type="password" 
                placeholder="pk.ey..." 
                value={tempToken} 
                onChange={(e) => setTempToken(e.target.value)}
              />
              <Button onClick={handleSetToken}>Set Token</Button>
            </div>
             <p className="text-xs text-muted-foreground">Your token will be stored in your browser's local storage.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <div ref={mapContainer} className="w-full h-full rounded-lg" />;
};

export default Map;
