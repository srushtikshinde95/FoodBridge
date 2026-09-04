import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import SupplyChainMap from '../../components/map/SupplyChainMap';
import { MapPin, Truck, Hotel, Building2, Layers, RefreshCw } from 'lucide-react';

export function MapOverviewPage() {
  const [hotels, setHotels] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMapData();
  }, []);

  const fetchMapData = async () => {
    setLoading(true);
    try {
      const [hRes, nRes, dRes] = await Promise.all([
        api.get('/hotels'),
        api.get('/ngos'),
        api.get('/deliveries')
      ]);
      setHotels(hRes.data?.hotels || []);
      setNgos(nRes.data?.ngos || []);
      setDeliveries(dRes.data?.deliveries || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider mb-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>GEOSPATIAL SUPPLY CHAIN MAP</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Live City Logistics Map
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Interactive map visualizing registered donor hotels, beneficiary NGO shelters, and active delivery routes.
          </p>
        </div>

        <button
          onClick={fetchMapData}
          disabled={loading}
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition flex items-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Locations
        </button>
      </div>

      {/* Map Component */}
      <SupplyChainMap
        hotels={hotels}
        ngos={ngos}
        deliveries={deliveries}
        height="620px"
      />

    </div>
  );
}

export default MapOverviewPage;
