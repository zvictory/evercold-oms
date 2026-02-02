'use client';

import { useEffect, useRef, useState } from 'react';

interface MapMarker {
  id: string;
  longitude: number;
  latitude: number;
  label: string;
  color?: string;
  onClick?: () => void;
}

interface DraggableMarker {
  latitude: number;
  longitude: number;
  onDragEnd: (lat: number, lng: number) => void;
}

interface LeafletMapProps {
  center?: [number, number]; // [longitude, latitude]
  zoom?: number;
  markers?: MapMarker[];
  route?: Array<[number, number]>; // Array of [lng, lat]
  height?: string;
  onMarkerClick?: (markerId: string) => void;
  showTraffic?: boolean;
  draggableMarker?: DraggableMarker;
  onClick?: (lat: number, lng: number) => void;
}

/**
 * Leaflet Map component for displaying delivery routes and locations
 * Uses OpenStreetMap (free, no API key required)
 * Optimized for Tashkent, Uzbekistan
 */
export default function LeafletMap({
  center = [69.2401, 41.2995], // Tashkent default [lng, lat]
  zoom = 11,
  markers = [],
  route = [],
  height = '500px',
  onMarkerClick,
  showTraffic = false,
  draggableMarker,
  onClick,
}: LeafletMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersLayer = useRef<any>(null);
  const draggableMarkerRef = useRef<any>(null);
  const routeLayer = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [L, setL] = useState<any>(null);
  // Use timestamp to ensure unique container on each mount
  const [containerKey] = useState(() => `map-${Date.now()}-${Math.random()}`);

  // Initialize map ONCE
  useEffect(() => {
    if (!mapContainer.current || typeof window === 'undefined') return;
    if (mapInstance.current) return;

    let mounted = true;

    const loadMap = async () => {
      try {
        const LeafletModule = (await import('leaflet')).default;

        if (!mounted || !mapContainer.current) return;

        // Fix icon issue
        delete (LeafletModule.Icon.Default.prototype as any)._getIconUrl;
        LeafletModule.Icon.Default.mergeOptions({
          iconRetinaUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        // Create map instance
        mapInstance.current = LeafletModule.map(mapContainer.current, {
          attributionControl: true,
        }).setView(
          [center[1], center[0]], // Leaflet uses [lat, lng]
          zoom
        );

        // Add OpenStreetMap tiles
        LeafletModule.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(mapInstance.current);

        // Create layer groups
        markersLayer.current = LeafletModule.layerGroup().addTo(mapInstance.current);
        routeLayer.current = LeafletModule.layerGroup().addTo(mapInstance.current);

        if (mounted) {
          setL(LeafletModule);
          setIsLoaded(true);
        }
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    loadMap();

    return () => {
      mounted = false;
      // Clean up Leaflet
      if (mapInstance.current) {
        try {
          mapInstance.current.off();
          mapInstance.current.remove();
        } catch (e) {
          // Silently ignore cleanup errors
        }
        mapInstance.current = null;
      }
    };
  }, []); // Empty array - only run once

  // Update map view when center/zoom changes
  useEffect(() => {
    if (!mapInstance.current || !L) return;

    mapInstance.current.setView([center[1], center[0]], zoom);
  }, [center, zoom, L]);

  // Update route when it changes
  useEffect(() => {
    if (!mapInstance.current || !routeLayer.current || !L) return;

    // Clear existing route
    routeLayer.current.clearLayers();

    if (route && route.length > 0) {
      const routeLatLng = route.map((point) => [point[1], point[0]] as [number, number]);

      // Add solid polyline for route
      L.polyline(routeLatLng, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(routeLayer.current);

      // Add glow effect
      L.polyline(routeLatLng, {
        color: '#60a5fa',
        weight: 8,
        opacity: 0.2,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(routeLayer.current);

      // Fit bounds to show all route points
      const bounds = L.latLngBounds(routeLatLng);
      mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [route, L]);

  // Update markers when they change
  useEffect(() => {
    if (!mapInstance.current || !markersLayer.current || !L) return;

    // Clear existing markers
    markersLayer.current.clearLayers();

    markers.forEach((marker) => {
      const markerLatLng = [marker.latitude, marker.longitude] as [number, number];

      const markerColor = marker.color?.includes('green')
        ? '#16a34a'
        : marker.color?.includes('yellow')
        ? '#eab308'
        : '#4f46e5';

      const leafletMarker = L.circleMarker(markerLatLng, {
        radius: 8,
        fillColor: markerColor,
        color: 'white',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      })
        .bindPopup(`<b>${marker.label}</b>`)
        .addTo(markersLayer.current);

      leafletMarker.on('click', () => {
        onMarkerClick?.(marker.id);
        marker.onClick?.();
      });
    });
  }, [markers, onMarkerClick, L]);

  // Update draggable marker when it changes
  useEffect(() => {
    if (!mapInstance.current || !L) return;

    // Remove existing draggable marker
    if (draggableMarkerRef.current) {
      draggableMarkerRef.current.remove();
      draggableMarkerRef.current = null;
    }

    if (draggableMarker) {
      const markerLatLng = [draggableMarker.latitude, draggableMarker.longitude] as [number, number];

      // Create custom red pin icon
      const redIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      draggableMarkerRef.current = L.marker(markerLatLng, {
        draggable: true,
        icon: redIcon,
      })
        .bindPopup(`<b>Drag to adjust location</b><br/>Lat: ${draggableMarker.latitude.toFixed(6)}<br/>Lng: ${draggableMarker.longitude.toFixed(6)}`)
        .addTo(mapInstance.current);

      // Handle drag end event
      draggableMarkerRef.current.on('dragend', (event: any) => {
        const position = event.target.getLatLng();
        draggableMarker.onDragEnd(position.lat, position.lng);

        // Update popup content with new coordinates
        event.target.setPopupContent(
          `<b>Drag to adjust location</b><br/>Lat: ${position.lat.toFixed(6)}<br/>Lng: ${position.lng.toFixed(6)}`
        );
      });

      // Center map on draggable marker if no route
      if (route.length === 0) {
        mapInstance.current.setView(markerLatLng, zoom);
      }
    }
  }, [draggableMarker, route.length, zoom, L]);

  // Update click handler when onClick changes
  useEffect(() => {
    if (!mapInstance.current) return;

    // Remove previous click handler
    mapInstance.current.off('click');

    // Add new click handler
    if (onClick) {
      mapInstance.current.on('click', (event: any) => {
        onClick(event.latlng.lat, event.latlng.lng);
      });
    }
  }, [onClick]);

  return (
    <div className="w-full border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
      <div key={containerKey} ref={mapContainer} style={{ height, width: '100%' }} className="relative">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="text-center p-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading OpenStreetMap...</p>
            </div>
          </div>
        )}
      </div>

      {/* Map Info */}
      {markers.length > 0 && (
        <div className="bg-white border-t border-gray-200 p-3">
          <p className="text-sm text-gray-600">
            📍 {markers.length} location{markers.length !== 1 ? 's' : ''} •{' '}
            {route.length > 0 && `✓ Route loaded`}
          </p>
        </div>
      )}
    </div>
  );
}
