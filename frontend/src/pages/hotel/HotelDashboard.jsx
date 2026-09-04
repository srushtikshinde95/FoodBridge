import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import { 
  Utensils, 
  PlusCircle, 
  Users, 
  CheckCircle2, 
  Truck, 
  Clock, 
  ChevronRight, 
  Hotel, 
  AlertCircle, 
  MapPin,
  Leaf
} from 'lucide-react';

export function HotelDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/hotels/my/dashboard');
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        Loading Hotel Dashboard...
      </div>
    );
  }

  const stats = data?.stats || {};
  const hotel = data?.hotel || {};
  const recentDonations = data?.recent_donations || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-950 via-slate-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">
            <Hotel className="w-4 h-4" />
            <span>Donor Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">{hotel.hotel_name || user?.name}</h1>
          <p className="text-xs text-slate-300 mt-1 flex items-center">
            <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
            {hotel.address || 'Central City Hub'} | FSSAI: <span className="text-emerald-400 font-mono ml-1">{hotel.fssai_license || 'Verified'}</span>
          </p>
        </div>

        <Link
          to="/donate"
          className="px-5 py-3 rounded-2xl font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/25 transition transform hover:-translate-y-0.5 flex items-center flex-shrink-0"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Add Surplus Food Donation
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">Active Donations</div>
          <div className="text-3xl font-black text-indigo-600 mt-1">{stats.active_donations || 0}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Under screening & transit</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">Servings Donated</div>
          <div className="text-3xl font-black text-emerald-600 mt-1">{stats.total_servings_donated || 0}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Total meal portions</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">People Fed</div>
          <div className="text-3xl font-black text-blue-600 mt-1">{stats.people_served || 0}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Beneficiaries reached</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">Food Saved</div>
          <div className="text-3xl font-black text-teal-600 mt-1">{stats.food_saved_kg || 0} kg</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Waste prevented</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm col-span-2 lg:col-span-1">
          <div className="text-xs font-bold text-slate-400 uppercase">Completed</div>
          <div className="text-3xl font-black text-slate-800 mt-1">{stats.completed_donations || 0}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">100% On-Time Delivery</div>
        </div>

      </div>

      {/* Recent Food Donations Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Your Food Donations & Logistics Tracking</h2>
            <p className="text-xs text-slate-500">Live safety status, assigned NGO, and real-time delivery status</p>
          </div>
          <Link
            to="/donate"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center"
          >
            + New Donation
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="px-6 py-3.5">Food Item</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Servings</th>
                <th className="px-6 py-3.5">Safety Screening</th>
                <th className="px-6 py-3.5">Assigned NGO</th>
                <th className="px-6 py-3.5">Delivery Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {recentDonations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
                    No donations registered yet. Click "Add Surplus Food Donation" to get started.
                  </td>
                </tr>
              ) : (
                recentDonations.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      <div>{d.food_name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Prep: {new Date(d.preparation_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} | Safe: {new Date(d.safe_until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-semibold">
                        {d.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {d.servings} portions <span className="text-[10px] font-normal text-slate-400">({d.quantity} {d.unit})</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={d.safety_status} type="safety" />
                    </td>
                    <td className="px-6 py-4">
                      {d.ngo_name ? (
                        <div>
                          <div className="font-bold text-indigo-900">{d.ngo_name}</div>
                          <div className="text-[10px] text-slate-400">{d.allocated_servings} servings (Score: {d.match_score}/100)</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Finding Best Match...</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={d.delivery_status || d.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/matching?donationId=${d.id}`}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition"
                      >
                        Inspect AI <ChevronRight className="w-3 h-3 ml-0.5" />
                      </Link>
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

export default HotelDashboard;
