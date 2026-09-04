import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import { 
  Building2, 
  HeartHandshake, 
  Users, 
  Clock, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  MapPin, 
  ChevronRight,
  PlusCircle
} from 'lucide-react';

export function NgoDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ngos/my/dashboard');
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRespondMatch = async (matchId, action) => {
    setRespondingId(matchId);
    try {
      const res = await api.post(`/ngos/matches/${matchId}/respond`, { action });
      setMessage(res.data.message);
      fetchDashboard();
    } catch (e) {
      setMessage('Error responding: ' + (e.response?.data?.error || e.message));
    } finally {
      setRespondingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        Loading NGO Dashboard...
      </div>
    );
  }

  const stats = data?.stats || {};
  const ngo = data?.ngo || {};
  const activeReqs = data?.active_requirements || [];
  const incomingDonations = data?.incoming_donations || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Beneficiary Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">{ngo.ngo_name || user?.name}</h1>
          <p className="text-xs text-slate-300 mt-1 flex items-center">
            <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
            {ngo.address} | Daily Capacity: <strong className="text-emerald-400 font-bold ml-1">{ngo.default_people_count || 50} Beneficiaries</strong>
          </p>
        </div>

        <Link
          to="/request-food"
          className="px-5 py-3 rounded-2xl font-bold text-sm bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 transition transform hover:-translate-y-0.5 flex items-center flex-shrink-0"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Post New Food Request
        </Link>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-emerald-600 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">Active Requests</div>
          <div className="text-3xl font-black text-indigo-600 mt-1">{stats.active_requirements || 0}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Open food requirements</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">Incoming Deliveries</div>
          <div className="text-3xl font-black text-amber-600 mt-1">{stats.incoming_deliveries || 0}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">En route to your shelter</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">Servings Received</div>
          <div className="text-3xl font-black text-emerald-600 mt-1">{stats.total_servings_received || 0}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Total meals delivered</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">People Fed</div>
          <div className="text-3xl font-black text-teal-600 mt-1">{stats.people_served || 0}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Children & elders nourished</div>
        </div>

      </div>

      {/* Incoming / Assigned Donations */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Incoming & Assigned Food Donations</h2>
            <p className="text-xs text-slate-500">Review AI allocations and track delivery vehicle arrival in real time</p>
          </div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            {incomingDonations.length} Active
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {incomingDonations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No incoming food allocations right now. When a donor hotel registers matching food, the AI engine will immediately notify you.
            </div>
          ) : (
            incomingDonations.map((d) => (
              <div key={d.match_id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/60 transition">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-base text-slate-900">{d.food_name}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      {d.allocated_servings} Servings
                    </span>
                    <StatusBadge status={d.delivery_status || 'ASSIGNED'} />
                  </div>
                  <div className="text-xs text-slate-600">
                    <strong>From:</strong> {d.hotel_name} ({d.hotel_address}) | <strong>Distance:</strong> {d.distance_km} km
                  </div>
                  <div className="text-xs text-slate-500 flex items-center space-x-3">
                    <span className="flex items-center text-teal-600 font-semibold">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      ETA: ~{d.estimated_duration_mins} mins
                    </span>
                    {d.driver_name && (
                      <span className="flex items-center text-indigo-600 font-medium">
                        <Truck className="w-3.5 h-3.5 mr-1" />
                        Driver: {d.driver_name} ({d.driver_phone})
                      </span>
                    )}
                  </div>
                </div>

                {/* Accept / Reject Buttons */}
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {d.match_status === 'PROPOSED' ? (
                    <>
                      <button
                        onClick={() => handleRespondMatch(d.match_id, 'ACCEPT')}
                        disabled={respondingId === d.match_id}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center transition"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                        Accept Allocation
                      </button>
                      <button
                        onClick={() => handleRespondMatch(d.match_id, 'REJECT')}
                        disabled={respondingId === d.match_id}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center transition"
                      >
                        <XCircle className="w-4 h-4 mr-1.5" />
                        Decline
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/map"
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center transition"
                    >
                      <MapPin className="w-4 h-4 mr-1.5 text-indigo-600" />
                      Live Route Map
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Active Food Requirements Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Your Active Food Requirements</h2>
            <p className="text-xs text-slate-500">Demands registered in the AI matching pool</p>
          </div>
          <Link
            to="/request-food"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
          >
            + Post Requirement
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="px-6 py-3.5">Required Categories</th>
                <th className="px-6 py-3.5">Servings Needed</th>
                <th className="px-6 py-3.5">Urgency</th>
                <th className="px-6 py-3.5">Required By</th>
                <th className="px-6 py-3.5">Dietary / Notes</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {activeReqs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                    No active requirements. Click "Post New Food Request" to list your shelter's meal needs.
                  </td>
                </tr>
              ) : (
                activeReqs.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {r.food_categories}
                    </td>
                    <td className="px-6 py-4 font-bold text-indigo-600">
                      {r.servings_required} Servings
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={r.urgency} type="urgency" />
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-mono">
                      {new Date(r.required_by).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <div>{r.dietary_restrictions || 'Any'}</div>
                      {r.notes && <div className="text-[10px] text-slate-400 italic">{r.notes}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

export default NgoDashboard;
