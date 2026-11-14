import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import { Plus, Minus, Crosshair, Maximize2 } from 'lucide-react';
import L from 'leaflet';
import { Driver, LocationPoint } from '@shared/types';

// Fix leaflet default icon issue in bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Car SVG Marker
function createCarIcon(heading: number = 0, color: string = '#149d9f', label?: string) {
  return L.divIcon({
    className: 'custom-car-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
        ${label ? `<div style="background: rgba(15, 23, 42, 0.88); color: #fff; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 9999px; white-space: nowrap; margin-bottom: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2);">${label}</div>` : ''}
        <div style="width: 32px; height: 32px; background: ${color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.35); border: 2px solid #ffffff; transform: rotate(${heading}deg); transition: transform 0.4s ease;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/>
            <circle cx="17" cy="17" r="2"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

// Active Assigned Taxi Marker with Halo Glow & Smooth Rotation
function createActiveTaxiIcon(heading: number = 0, label: string = 'Your Taxi') {
  return L.divIcon({
    className: 'active-taxi-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
        <div style="background: #0f172a; color: #f59e0b; font-size: 11px; font-weight: 800; font-family: monospace; padding: 2px 8px; border-radius: 9999px; white-space: nowrap; margin-bottom: 3px; box-shadow: 0 4px 12px rgba(0,0,0,0.35); border: 1.5px solid #f59e0b; display: flex; align-items: center; gap: 4px;">
          <span style="width: 6px; height: 6px; border-radius: 50%; background: #10b981; display: inline-block;"></span>
          ${label}
        </div>
        <div style="position: relative;">
          <div style="width: 38px; height: 38px; background: #0f172a; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.45); border: 2.5px solid #f59e0b; transform: rotate(${heading}deg); transition: transform 0.4s ease;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
              <circle cx="7" cy="17" r="2"/>
              <circle cx="17" cy="17" r="2"/>
            </svg>
          </div>
        </div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
}

// Pickup Marker Icon
function createPickupIcon(title: string = 'Pickup') {
  return L.divIcon({
    className: 'custom-pickup-marker',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
        <div style="background: #10b981; color: #fff; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 6px; white-space: nowrap; margin-bottom: 3px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
          📍 ${title}
        </div>
        <div style="width: 18px; height: 18px; background: #10b981; border: 3px solid #fff; border-radius: 50%; box-shadow: 0 0 12px #10b981;"></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 20],
  });
}

// Destination Marker Icon
function createDestinationIcon(title: string = 'Destination') {
  return L.divIcon({
    className: 'custom-destination-marker',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
        <div style="background: #ef4444; color: #fff; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 6px; white-space: nowrap; margin-bottom: 3px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
          🏁 ${title}
        </div>
        <div style="width: 18px; height: 18px; background: #ef4444; border: 3px solid #fff; border-radius: 50%; box-shadow: 0 0 12px #ef4444;"></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 20],
  });
}

// Auto-fit bounds component
function BoundsManager({
  pickup,
  destination,
  driverLocation,
}: {
  pickup?: LocationPoint;
  destination?: LocationPoint;
  driverLocation?: [number, number];
}) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [];
    if (pickup) points.push([pickup.lat, pickup.lng]);
    if (destination) points.push([destination.lat, destination.lng]);
    if (driverLocation) points.push(driverLocation);

    if (points.length >= 2) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    } else if (points.length === 1) {
      map.setView(points[0], 14);
    }
  }, [map, pickup, destination, driverLocation]);

  return null;
}

// Map Controls: Recenter, Zoom In/Out, and Fit Route Bounds
function MapControls({
  pickup,
  destination,
}: {
  pickup?: LocationPoint;
  destination?: LocationPoint;
}) {
  const map = useMap();

  const handleRecenter = () => {
    if (pickup) {
      map.flyTo([pickup.lat, pickup.lng], 15, { duration: 0.8 });
    } else {
      map.flyTo([9.0105, 38.7615], 13, { duration: 0.8 });
    }
  };

  const handleFitRoute = () => {
    if (pickup && destination) {
      const bounds = L.latLngBounds([
        [pickup.lat, pickup.lng],
        [destination.lat, destination.lng],
      ]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  };

  return (
    <div className="absolute right-4 bottom-8 z-[1000] flex flex-col gap-2">
      <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-200/80 p-1 flex flex-col divide-y divide-slate-100">
        <button
          type="button"
          onClick={() => map.zoomIn()}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-700 transition"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => map.zoomOut()}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-700 transition"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={handleRecenter}
        className="p-2.5 bg-white/95 backdrop-blur-md hover:bg-slate-100 rounded-xl shadow-lg border border-slate-200/80 text-slate-700 transition flex items-center justify-center"
        title="Recenter to Pickup Location"
      >
        <Crosshair className="w-4 h-4 text-brand-600" />
      </button>

      {pickup && destination && (
        <button
          type="button"
          onClick={handleFitRoute}
          className="p-2.5 bg-white/95 backdrop-blur-md hover:bg-slate-100 rounded-xl shadow-lg border border-slate-200/80 text-slate-700 transition flex items-center justify-center"
          title="Fit Full Route"
        >
          <Maximize2 className="w-4 h-4 text-slate-700" />
        </button>
      )}
    </div>
  );
}

// Map Click Handler
function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

interface AddisMapProps {
  pickup?: LocationPoint;
  destination?: LocationPoint;
  drivers?: Driver[];
  activeDriverLocation?: [number, number];
  activeDriverHeading?: number;
  activeDriverPlate?: string;
  routeCoordinates?: [number, number][];
  onMapClick?: (lat: number, lng: number) => void;
  pickingMode?: 'pickup' | 'destination' | null;
  onCancelPicking?: () => void;
  className?: string;
  interactive?: boolean;
}

export const AddisMap: React.FC<AddisMapProps> = ({
  pickup,
  destination,
  drivers = [],
  activeDriverLocation,
  activeDriverHeading = 0,
  activeDriverPlate,
  routeCoordinates = [],
  onMapClick,
  pickingMode = null,
  onCancelPicking,
  className = 'h-full w-full',
  interactive = true,
}) => {
  // Center of Addis Ababa (Meskel Square)
  const defaultCenter: [number, number] = [9.0105, 38.7615];

  const polylinePositions = useMemo(() => {
    if (routeCoordinates && routeCoordinates.length > 0) {
      return routeCoordinates;
    }
    if (pickup && destination) {
      return [
        [pickup.lat, pickup.lng],
        [destination.lat, destination.lng],
      ] as [number, number][];
    }
    return [];
  }, [routeCoordinates, pickup, destination]);

  return (
    <div className={`relative ${className} overflow-hidden rounded-xl shadow-inner`}>
      <MapContainer
        center={pickup ? [pickup.lat, pickup.lng] : defaultCenter}
        zoom={13}
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={interactive}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        <BoundsManager
          pickup={pickup}
          destination={destination}
          driverLocation={activeDriverLocation}
        />

        {onMapClick && <MapClickHandler onMapClick={onMapClick} />}

        {/* Route Polyline */}
        {polylinePositions.length > 0 && (
          <>
            {/* Outer glow stroke */}
            <Polyline
              positions={polylinePositions}
              color="#0e7e81"
              weight={7}
              opacity={0.4}
              lineCap="round"
            />
            {/* Inner vibrant stroke */}
            <Polyline
              positions={polylinePositions}
              color="#149d9f"
              weight={4}
              opacity={0.95}
              dashArray="6, 8"
              lineCap="round"
            />
          </>
        )}

        {/* Pickup Marker */}
        {pickup && (
          <Marker
            position={[pickup.lat, pickup.lng]}
            icon={createPickupIcon(pickup.address.split(',')[0])}
          >
            <Popup>
              <div className="text-xs font-semibold">
                <span className="text-emerald-600">Pickup:</span> {pickup.address}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Marker */}
        {destination && (
          <Marker
            position={[destination.lat, destination.lng]}
            icon={createDestinationIcon(destination.address.split(',')[0])}
          >
            <Popup>
              <div className="text-xs font-semibold">
                <span className="text-rose-600">Destination:</span> {destination.address}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Nearby Online Drivers */}
        {drivers.map((d) => (
          <Marker
            key={d.id}
            position={[d.currentLat, d.currentLng]}
            icon={createCarIcon(d.heading || 0, d.isBusy ? '#eab308' : '#149d9f', d.vehiclePlate)}
          >
            <Popup>
              <div className="text-xs space-y-1">
                <div className="font-bold text-slate-800">{d.fullName}</div>
                <div className="text-slate-600">
                  {d.vehicleMake} {d.vehicleModel} ({d.vehiclePlate})
                </div>
                <div className="text-slate-500 text-[10px]">
                  Rating: ★{d.rating} | Category: {d.vehicleCategory.toUpperCase()}
                </div>
                <div className="text-emerald-600 font-medium">
                  {d.isBusy ? '● On Active Trip' : '● Online & Available'}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Active Driver Dedicated Marker */}
        {activeDriverLocation && (
          <Marker
            position={activeDriverLocation}
            icon={createActiveTaxiIcon(activeDriverHeading, activeDriverPlate || 'Your Taxi')}
          >
            <Popup>
              <div className="text-xs font-bold text-amber-700">
                🚖 Assigned Taxi: {activeDriverPlate}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Interactive Floating Map Controls */}
        <MapControls pickup={pickup} destination={destination} />
      </MapContainer>

      {/* Top Live Taxis Badge */}
      <div className="absolute top-4 right-4 z-[1000] pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1.5 rounded-full border border-slate-700 shadow-xl flex items-center gap-2 pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{drivers.length || 5} Taxis Online</span>
          <span className="text-slate-500">•</span>
          <span className="text-brand-300">Addis Ababa</span>
        </div>
      </div>

      {/* Map Picking Banner Indicator */}
      {pickingMode && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] pointer-events-auto">
          <div className="bg-slate-900/95 backdrop-blur-md text-white border border-brand-500/50 shadow-2xl px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2.5 animate-in slide-in-from-top">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-400 animate-ping" />
            <span>
              Tap anywhere on the map to set{' '}
              <strong className="text-brand-300 uppercase">
                {pickingMode === 'pickup' ? 'Pickup' : 'Destination'}
              </strong>
            </span>
            {onCancelPicking && (
              <button
                type="button"
                onClick={onCancelPicking}
                className="ml-1 bg-white/20 hover:bg-white/30 text-white rounded-full px-2 py-0.5 text-[10px] font-normal transition"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
