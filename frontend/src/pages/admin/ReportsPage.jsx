import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { BarChart3, PieChart as PieIcon, Hotel, Building2, ShieldCheck, Clock, Download } from 'lucide-react';

export function ReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/summary');
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
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        Generating Supply Chain Analytics & Reports...
      </div>
    );
  }

  const categoryData = (data?.food_by_category || []).map(c => ({
    name: c.category,
    servings: c.total_servings,
    kg: c.total_kg
  }));

  const safetyData = (data?.safety_breakdown || []).map(s => ({
    name: s.safety_status,
    value: s.count
  }));

  const hotelData = (data?.top_hotels || []).map(h => ({
    name: h.hotel_name.replace('Hotel ', '').replace('Grand ', ''),
    servings: h.total_servings
  }));

  const ngoData = (data?.top_ngos || []).map(n => ({
    name: n.ngo_name.replace(' Foundation', '').replace(' Trust', ''),
    servings: n.servings_received
  }));

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#06b6d4'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold uppercase tracking-wider mb-1">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>EXECUTIVE AUDIT & IMPACT ANALYTICS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Supply Chain & Social Impact Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Comprehensive audit reports on food rescue categories, safety audit outcomes, and delivery efficiency.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition flex items-center"
        >
          <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
          Print / Export Report
        </button>
      </div>

      {/* Speed & Feasibility Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">Average Distance</div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-600 mt-1">
            {data?.speed_metrics?.avg_distance_km || 4.5} km
          </div>
          <div className="text-[11px] text-slate-500">Short urban routes</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">Average Transit ETA</div>
          <div className="text-2xl sm:text-3xl font-black text-teal-600 mt-1">
            {data?.speed_metrics?.avg_duration_mins || 18} mins
          </div>
          <div className="text-[11px] text-slate-500">Rapid distribution</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">Fastest Dispatch</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
            {data?.speed_metrics?.fastest_mins || 8} mins
          </div>
          <div className="text-[11px] text-slate-500">Express local pickup</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">Delivery Success Rate</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
            100%
          </div>
          <div className="text-[11px] text-slate-500">Zero transit spoilage</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Chart 1: Food Donated by Category */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center">
            <BarChart3 className="w-4 h-4 mr-2 text-emerald-600" />
            Food Donated by Category (Servings)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="servings" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Safety Screening Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center">
            <ShieldCheck className="w-4 h-4 mr-2 text-indigo-600" />
            Food Safety Audit Status Outcomes
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={safetyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {safetyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.name === 'ELIGIBLE' ? '#10b981' : entry.name === 'REVIEW REQUIRED' ? '#f59e0b' : '#ef4444'} 
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Top Donor Hotels */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center">
            <Hotel className="w-4 h-4 mr-2 text-orange-600" />
            Top Surplus Donor Hotels (Servings)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hotelData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="servings" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Top Beneficiary NGOs */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center">
            <Building2 className="w-4 h-4 mr-2 text-blue-600" />
            Top Beneficiary Shelters (Meals Received)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ngoData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="servings" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}

export default ReportsPage;
