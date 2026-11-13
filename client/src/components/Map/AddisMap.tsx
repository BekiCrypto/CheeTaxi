import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
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
        <div style="width: 34px; height: 34px; background: ${color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.35); border: 2.5px solid #ffffff; transform: rotate(${heading}deg); transition: transform 0.3s ease;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/>
            <circle cx="17" cy="17" r="2"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
            icon={createCarIcon(activeDriverHeading, '#f59e0b', activeDriverPlate || 'Your Taxi')}
          >
            <Popup>
              <div className="text-xs font-bold text-amber-700">
                🚖 Assigned Taxi: {activeDriverPlate}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};
