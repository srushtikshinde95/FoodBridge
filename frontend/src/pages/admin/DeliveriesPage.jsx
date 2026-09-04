import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import { Truck, MapPin, Clock, CheckCircle2, ChevronRight, User, Phone, Navigation, ArrowRight } from 'lucide-react';

export function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchDeliveries();
  }, [filter]);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const url = filter === 'ALL' ? '/deliveries' : `/deliveries?status=${filter}`;
      const res = await api.get(url);
      setDeliveries(res.data?.deliveries || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, nextStatus) => {
    setUpdatingId(id);
    try {
      await api.patch(`/deliveries/${id}/status`, { status: nextStatus });
      await fetchDeliveries();
      if (selectedDelivery && selectedDelivery.id === id) {
        const updated = await api.get(`/deliveries/${id}`);
        setSelectedDelivery(updated.data?.delivery);
      }
    } catch (e) {
      alert('Failed to update status: ' + (e.response?.data?.error || e.message));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider mb-1">
            <Truck className="w-3.5 h-3.5" />
            <span>DISPATCH & ROUTE LOGISTICS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Delivery Fleet & Route Dispatch
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track active driver assignments, advance delivery lifecycle, and review route turn directions.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs text-xs font-semibold">
          {['ALL', 'ASSIGNED', 'PICKUP_READY', 'IN_TRANSIT', 'DELIVERED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === st ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st === 'ALL' ? 'All' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Deliveries Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <span className="font-bold text-sm text-slate-900">Delivery Records ({deliveries.length})</span>
            <span className="text-xs text-slate-400">Click any card to view turn directions</span>
          </div>

          <div className="divide-y divide-slate-100">
            {deliveries.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No deliveries found under this filter.
              </div>
            ) : (
              deliveries.map((del) => (
                <div
                  key={del.id}
                  onClick={() => setSelectedDelivery(del)}
                  className={`p-6 cursor-pointer transition hover:bg-slate-50/80 ${
                    selectedDelivery?.id === del.id ? 'bg-indigo-50/40 border-l-4 border-indigo-600' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-sm text-slate-900">Delivery #{del.id}</span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {del.allocated_servings || del.servings} Servings
                      </span>
                      <StatusBadge status={del.status} />
                    </div>
                    <div className="text-xs text-slate-500 font-mono flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1 text-teal-600" />
                      {del.distance_km} km | ~{del.estimated_duration_mins} mins
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 space-y-1 mb-3">
                    <div className="font-bold text-slate-900">{del.food_name}</div>
                    <div className="text-slate-500">
                      <strong>From:</strong> {del.hotel_name} ➔ <strong>To:</strong> {del.ngo_name}
                    </div>
                  </div>

                  {/* Driver and Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 gap-2 text-xs">
                    <div className="text-slate-500 flex items-center space-x-3">
                      <span>🚚 {del.driver_name || 'Volunteer Driver'}</span>
                      <span>📞 {del.driver_phone || '+91 98765 43210'}</span>
                    </div>

                    {/* Step Advancement Buttons */}
                    <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                      {del.status === 'ASSIGNED' && (
                        <button
                          onClick={() => handleStatusUpdate(del.id, 'PICKUP_READY')}
                          disabled={updatingId === del.id}
                          className="px-3 py-1 rounded-lg font-bold text-[11px] bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100"
                        >
                          Mark Pickup Ready ➔
                        </button>
                      )}
                      {del.status === 'PICKUP_READY' && (
                        <button
                          onClick={() => handleStatusUpdate(del.id, 'IN_TRANSIT')}
                          disabled={updatingId === del.id}
                          className="px-3 py-1 rounded-lg font-bold text-[11px] bg-indigo-600 text-white shadow-xs hover:bg-indigo-700"
                        >
                          Dispatch (In Transit) ➔
                        </button>
                      )}
                      {del.status === 'IN_TRANSIT' && (
                        <button
                          onClick={() => handleStatusUpdate(del.id, 'DELIVERED')}
                          disabled={updatingId === del.id}
                          className="px-3 py-1 rounded-lg font-bold text-[11px] bg-emerald-600 text-white shadow-xs hover:bg-emerald-700"
                        >
                          Confirm Handover (Delivered) ✓
                        </button>
                      )}
                      {del.status === 'DELIVERED' && (
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Completed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col: Route Waypoints & Turn Directions Detail Drawer */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center">
            <Navigation className="w-4 h-4 mr-2 text-indigo-600" />
            Route & Logistics Plan
          </h3>

          {selectedDelivery ? (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl space-y-1.5">
                <div className="font-bold text-slate-900">Delivery #{selectedDelivery.id}</div>
                <div className="text-slate-600"><strong>Item:</strong> {selectedDelivery.food_name}</div>
                <div className="text-slate-600"><strong>Quantity:</strong> {selectedDelivery.allocated_servings || selectedDelivery.servings} Servings</div>
                <div className="text-slate-600"><strong>Distance:</strong> {selectedDelivery.distance_km} km (ETA: {selectedDelivery.estimated_duration_mins}m)</div>
                <div className="text-slate-600"><strong>Vehicle:</strong> {selectedDelivery.vehicle_number || 'MH-12-FB-8842'}</div>
              </div>

              {/* Turn-by-Turn Directions */}
              <div>
                <div className="font-bold text-slate-700 mb-2 uppercase text-[11px] tracking-wider">
                  Turn-By-Turn Waypoints:
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {selectedDelivery.route?.turn_directions?.map((dir, i) => (
                    <div key={i} className="flex items-start space-x-2 text-[11px] text-slate-600 bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                      <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{dir}</span>
                    </div>
                  )) || (
                    <div className="text-slate-400 italic">Direct street navigation path calculated.</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
              Select any delivery record from the left to view turn directions and route waypoints.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

export default DeliveriesPage;
