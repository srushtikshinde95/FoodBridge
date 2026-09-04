import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import { 
  Cpu, 
  Hotel, 
  Building2, 
  ShieldCheck, 
  Truck, 
  HeartHandshake, 
  BarChart3, 
  Sliders, 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

export function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [mRes, pRes] = await Promise.all([
        api.get('/admin/metrics'),
        api.get('/admin/supply-chain')
      ]);
      setMetrics(mRes.data?.metrics);
      setPipeline(pRes.data?.pipeline);
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        Loading AI Logistics Command Center...
      </div>
    );
  }

  const stages = [
    { key: 'step1_registered_surplus', title: '1. Registered Surplus', icon: Hotel, color: 'text-orange-600 bg-orange-50 border-orange-200' },
    { key: 'step2_safety_screening', title: '2. Safety Screening', icon: ShieldCheck, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { key: 'step3_ai_matching', title: '3. AI Priority Matching', icon: Cpu, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { key: 'step4_active_logistics', title: '4. Optimized Transit', icon: Truck, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { key: 'step5_delivered_meals', title: '5. Delivered & Fed', icon: HeartHandshake, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Executive Command Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
            <Cpu className="w-4 h-4" />
            <span>AI Logistics Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">FoodBridge AI Command Console</h1>
          <p className="text-xs text-slate-300 mt-1">
            Real-time supply chain monitoring, automated safety verification, multi-factor matching, and dispatch optimization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/matching"
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-md shadow-emerald-500/20 transition flex items-center"
          >
            <Cpu className="w-4 h-4 mr-1.5" />
            Launch AI Matcher
          </Link>
          <Link
            to="/map"
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center"
          >
            <MapPin className="w-4 h-4 mr-1.5 text-rose-400" />
            City Map
          </Link>
        </div>
      </div>

      {/* High-Level Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">Meals Rescued</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
            {(metrics?.meals_rescued || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Portions delivered</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">People Served</div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-600 mt-1">
            {(metrics?.people_served || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Shelter beneficiaries</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">Waste Avoided</div>
          <div className="text-2xl sm:text-3xl font-black text-teal-600 mt-1">
            {(metrics?.food_saved_kg || 0).toLocaleString()} kg
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Zero food waste</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">Safety Pass Rate</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
            {metrics?.safety_pass_rate || 95}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{metrics?.safety_passed_count || 0} batches passed</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">Active Logistics</div>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 mt-1">
            {metrics?.active_deliveries || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Vehicles on road</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">Avg Delivery ETA</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-800 mt-1">
            {metrics?.avg_delivery_time_mins || 18}m
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">~{metrics?.avg_delivery_distance_km || 4.5} km avg distance</div>
        </div>

      </div>

      {/* 5-Stage Visual Supply Chain Flow */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Live Supply Chain Pipeline Stages</h2>
            <p className="text-xs text-slate-500">Real-time status of food donations progressing through the middle-layer pipeline</p>
          </div>
          <Link to="/matching" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
            View All Matching Candidates ➔
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {stages.map((st) => {
            const Icon = st.icon;
            const dataStage = pipeline ? pipeline[st.key] : null;
            const count = dataStage?.count || 0;
            const items = dataStage?.items || [];

            return (
              <div key={st.key} className={`p-4 rounded-2xl border ${st.color} flex flex-col justify-between`}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-5 h-5" />
                    <span className="text-xl font-black">{count}</span>
                  </div>
                  <h3 className="font-bold text-xs text-slate-900">{st.title}</h3>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 space-y-1.5">
                  {items.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="bg-white/90 p-2 rounded-lg text-[11px] text-slate-700 shadow-2xs">
                      <div className="font-semibold truncate">{item.food_name || `Donation #${item.id}`}</div>
                      <div className="text-[10px] text-slate-500 flex justify-between">
                        <span>{item.hotel_name || item.ngo_name}</span>
                        <span>{item.servings || item.allocated_servings} serv.</span>
                      </div>
                    </div>
                  ))}
                  {count > 2 && (
                    <div className="text-[10px] text-center text-slate-500 font-medium">
                      +{count - 2} more active
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <Link
          to="/matching"
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition group"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 mb-1">AI Matching Console</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Inspect the mathematical score calculation across all 8 NGOs, evaluate partial splits, and test food-life gating.
          </p>
        </Link>

        <Link
          to="/deliveries"
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition group"
        >
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <Truck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 mb-1">Delivery Dispatch Tracker</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Monitor real-time pickup ready, in-transit, and delivered vehicle batches with driver contacts and road route waypoints.
          </p>
        </Link>

        <Link
          to="/config"
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition group"
        >
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <Sliders className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 mb-1">AI Weights & Safety Tuner</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Tune Need, Urgency, Compatibility, Distance, and Time Feasibility weights with dynamic live recalculation.
          </p>
        </Link>

      </div>

    </div>
  );
}

export default AdminDashboard;
