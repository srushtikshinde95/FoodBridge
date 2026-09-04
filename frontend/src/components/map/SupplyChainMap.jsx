import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Truck, Hotel, Heart, Navigation, Clock, ShieldCheck } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issues in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom HTML Icons for Map Markers
const createCustomIcon = (bgColor, labelEmoji) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background-color: ${bgColor};
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 16px;
        font-weight: bold;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        border: 2px solid white;
      ">
        ${labelEmoji}
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -32]
  });
};

const hotelIcon = createCustomIcon('#ea580c', '🏨');
const ngoIcon = createCustomIcon('#2563eb', '🏢');
const deliveryTruckIcon = createCustomIcon('#16a34a', '🚚');

export function SupplyChainMap({ hotels = [], ngos = [], deliveries = [], height = '500px', selectedDeliveryId = null }) {
  const defaultCenter = [18.5304, 73.8567]; // Pune central
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, DELIVERIES, HOTELS, NGOS

  const filteredHotels = (activeFilter === 'ALL' || activeFilter === 'HOTELS') ? hotels : [];
  const filteredNgos = (activeFilter === 'ALL' || activeFilter === 'NGOS') ? ngos : [];
  const filteredDeliveries = (activeFilter === 'ALL' || activeFilter === 'DELIVERIES') ? deliveries : [];

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-white">
      
      {/* Map Control Filter Overlay */}
      <div className="absolute top-4 right-4 z-[400] bg-white/95 backdrop-blur-sm p-1.5 rounded-xl shadow-lg border border-slate-200 flex items-center space-x-1 text-xs font-semibold">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-2.5 py-1 rounded-lg transition ${activeFilter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          All ({hotels.length + ngos.length + deliveries.length})
        </button>
        <button
          onClick={() => setActiveFilter('DELIVERIES')}
          className={`px-2.5 py-1 rounded-lg transition flex items-center ${activeFilter === 'DELIVERIES' ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:bg-emerald-50'}`}
        >
          <span className="mr-1">🚚</span> Deliveries ({deliveries.length})
        </button>
        <button
          onClick={() => setActiveFilter('HOTELS')}
          className={`px-2.5 py-1 rounded-lg transition flex items-center ${activeFilter === 'HOTELS' ? 'bg-orange-600 text-white' : 'text-orange-700 hover:bg-orange-50'}`}
        >
          <span className="mr-1">🏨</span> Hotels ({hotels.length})
        </button>
        <button
          onClick={() => setActiveFilter('NGOS')}
          className={`px-2.5 py-1 rounded-lg transition flex items-center ${activeFilter === 'NGOS' ? 'bg-blue-600 text-white' : 'text-blue-700 hover:bg-blue-50'}`}
        >
          <span className="mr-1">🏢</span> NGOs ({ngos.length})
        </button>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-sm px-3 py-2 rounded-xl shadow-md border border-slate-200 text-xs flex items-center space-x-4">
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-orange-600"></span>
          <span className="font-medium text-slate-700">Donor Hotels</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-600"></span>
          <span className="font-medium text-slate-700">Beneficiary NGOs</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-600 animate-pulse"></span>
          <span className="font-medium text-emerald-800 font-semibold">Active Transit Route</span>
        </div>
      </div>

      <div style={{ height, width: '100%' }}>
        <MapContainer center={defaultCenter} zoom={12} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Hotel Markers */}
          {filteredHotels.map((h) => (
            <Marker key={`hotel-${h.id}`} position={[h.latitude, h.longitude]} icon={hotelIcon}>
              <Popup>
                <div className="p-1 max-w-xs text-xs">
                  <div className="font-bold text-sm text-orange-950 flex items-center mb-1">
                    <span className="mr-1">🏨</span> {h.hotel_name}
                  </div>
                  <div className="text-slate-600 mb-1.5">{h.address}</div>
                  <div className="bg-orange-50 border border-orange-200 rounded p-1.5 text-[11px] text-orange-900 font-medium">
                    📞 Contact: {h.phone || 'Available on request'}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* NGO Markers */}
          {filteredNgos.map((n) => (
            <Marker key={`ngo-${n.id}`} position={[n.latitude, n.longitude]} icon={ngoIcon}>
              <Popup>
                <div className="p-1 max-w-xs text-xs">
                  <div className="font-bold text-sm text-blue-950 flex items-center mb-1">
                    <span className="mr-1">🏢</span> {n.ngo_name}
                  </div>
                  <div className="text-slate-600 mb-1.5">{n.address}</div>
                  <div className="bg-blue-50 border border-blue-200 rounded p-1.5 text-[11px] text-blue-900 font-medium flex justify-between">
                    <span>Beneficiaries: <strong>{n.default_people_count || 50}</strong></span>
                    <span>Focus: <strong>{n.category_focus || 'Community'}</strong></span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Active Deliveries and Polyline Routes */}
          {filteredDeliveries.map((del) => {
            const waypoints = del.route?.waypoints || [];
            const polylineCoords = waypoints.map(w => [w.lat, w.lng]);
            const isSelected = selectedDeliveryId === del.id;

            // Compute midpoint for delivery truck icon
            const midIndex = Math.floor(waypoints.length / 2);
            const midPoint = waypoints[midIndex] || { lat: (del.hotel_lat + del.ngo_lat) / 2, lng: (del.hotel_lng + del.ngo_lng) / 2 };

            return (
              <React.Fragment key={`del-${del.id}`}>
                {/* Route Polyline */}
                {polylineCoords.length > 1 && (
                  <Polyline
                    positions={polylineCoords}
                    color={del.status === 'DELIVERED' || del.status === 'COMPLETED' ? '#10b981' : '#2563eb'}
                    weight={isSelected ? 6 : 4}
                    dashArray={del.status === 'IN_TRANSIT' ? '6, 8' : undefined}
                    opacity={0.85}
                  />
                )}

                {/* Delivery Truck Marker */}
                <Marker position={[midPoint.lat, midPoint.lng]} icon={deliveryTruckIcon}>
                  <Popup>
                    <div className="p-1 max-w-xs text-xs">
                      <div className="font-bold text-sm text-emerald-950 flex items-center justify-between mb-1">
                        <span>🚚 Delivery #{del.id}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold uppercase">{del.status}</span>
                      </div>
                      <div className="font-semibold text-slate-800 mb-1">{del.food_name} ({del.allocated_servings || del.servings} Servings)</div>
                      <div className="text-slate-600 text-[11px] space-y-0.5 mb-2">
                        <div><strong>From:</strong> {del.hotel_name}</div>
                        <div><strong>To:</strong> {del.ngo_name}</div>
                        <div><strong>Distance:</strong> {del.distance_km} km (ETA ~{del.estimated_duration_mins} mins)</div>
                        {del.driver_name && <div><strong>Driver:</strong> {del.driver_name} ({del.driver_phone})</div>}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}

export default SupplyChainMap;
