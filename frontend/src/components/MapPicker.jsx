import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet marker icon issue with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const LocationPicker = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const MapPicker = ({ lat = 17.385, lng = 78.4867, onLocationSelect, readOnly = false }) => {
  const [position, setPosition] = useState({ lat, lng });

  const handleSelect = (newLat, newLng) => {
    setPosition({ lat: newLat, lng: newLng });
    if (onLocationSelect) onLocationSelect(newLat, newLng);
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
      {!readOnly && (
        <p className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2 bg-gray-50 dark:bg-gray-800">
          📍 Click on the map to set your location
        </p>
      )}
      <MapContainer
        center={[position.lat, position.lng]}
        zoom={13}
        style={{ height: '250px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[position.lat, position.lng]} />
        {!readOnly && <LocationPicker onLocationSelect={handleSelect} />}
      </MapContainer>
      {!readOnly && (
        <p className="text-xs text-gray-400 px-3 py-1.5 bg-gray-50 dark:bg-gray-800">
          Selected: {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
        </p>
      )}
    </div>
  );
};

export default MapPicker;
