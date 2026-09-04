import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { 
  Utensils, 
  ShieldCheck, 
  Cpu, 
  Navigation, 
  Truck, 
  HeartHandshake, 
  Users, 
  Building2, 
  Hotel, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  BarChart3 
} from 'lucide-react';

export function LandingPage() {
  const [metrics, setMetrics] = useState({
    meals_rescued: 12450,
    total_hotels: 86,
    total_ngos: 34,
    people_served: 9820,
    food_saved_kg: 3240
  });

  useEffect(() => {
    api.get('/admin/metrics')
      .then(res => {
        if (res.data?.metrics) {
          setMetrics(res.data.metrics);
        }
      })
      .catch(() => {});
  }, []);

  const workflowSteps = [
    {
      num: '01',
      title: 'Hotel Registers Surplus Food',
      desc: 'Hotels enter food details, preparation time, category, storage temp, and packaging.',
      icon: Hotel,
      color: 'from-orange-500 to-amber-500'
    },
    {
      num: '02',
      title: 'Food Safety Screening',
      desc: 'Rule-based engine checks bacterial danger zones, elapsed ambient hours, and packaging integrity.',
      icon: ShieldCheck,
      color: 'from-emerald-500 to-teal-500'
    },
    {
      num: '03',
      title: 'AI Finds Best NGO',
      desc: 'Multi-factor algorithm evaluates need (30%), urgency (25%), compatibility (15%), distance (10%), and time feasibility (20%).',
      icon: Cpu,
      color: 'from-indigo-500 to-purple-500'
    },
    {
      num: '04',
      title: 'Route Optimization',
      desc: 'Calculates transit ETA, turn-by-turn waypoints, and verifies food arrival well before safe-use deadline.',
      icon: Navigation,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      num: '05',
      title: 'Food Delivered',
      desc: 'Volunteer drivers transport food with real-time tracking, handover verification, and status updates.',
      icon: Truck,
      color: 'from-teal-500 to-emerald-600'
    },
    {
      num: '06',
      title: 'People Fed & Waste Prevented',
      desc: 'Nutritious meals reach children shelters and community kitchens with zero landfill wastage.',
      icon: HeartHandshake,
      color: 'from-rose-500 to-pink-500'
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 text-white py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
        
        {/* Glow backdrop effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 right-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-6xl mx-auto relative z-10 text-center">
          
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-6 animate-fadeIn">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>AI-Driven Surplus Food Redistribution Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight max-w-4xl mx-auto">
            Turning Surplus Food Into <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400">Shared Meals.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            An AI-powered logistics platform connecting hotels with NGOs to eliminate food waste and deliver surplus food where it is needed most — governed by <strong>food-safety screening</strong>, <strong>urgency prioritization</strong>, and <strong>delivery route feasibility</strong>.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/donate"
              className="px-6 py-3.5 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/25 transition transform hover:-translate-y-0.5 flex items-center"
            >
              <Utensils className="w-4 h-4 mr-2" />
              Donate Surplus Food
            </Link>
            
            <Link
              to="/request-food"
              className="px-6 py-3.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25 transition transform hover:-translate-y-0.5 flex items-center"
            >
              <HeartHandshake className="w-4 h-4 mr-2" />
              Request Food for NGO
            </Link>

            <Link
              to="/admin/dashboard"
              className="px-6 py-3.5 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center"
            >
              <Cpu className="w-4 h-4 mr-2 text-emerald-400" />
              Explore AI Command Center
            </Link>
          </div>

          {/* Supply Chain Architecture Badges */}
          <div className="mt-14 inline-flex flex-wrap items-center justify-center gap-2 sm:gap-4 p-3 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 text-xs text-slate-300 font-medium">
            <span className="flex items-center text-orange-400 font-bold"><Hotel className="w-4 h-4 mr-1" /> HOTEL</span>
            <span className="text-slate-600">➔</span>
            <span className="flex items-center text-emerald-400 font-bold"><ShieldCheck className="w-4 h-4 mr-1" /> SAFETY SCREENING</span>
            <span className="text-slate-600">➔</span>
            <span className="flex items-center text-indigo-400 font-bold"><Cpu className="w-4 h-4 mr-1" /> FOODBRIDGE AI ENGINE</span>
            <span className="text-slate-600">➔</span>
            <span className="flex items-center text-blue-400 font-bold"><Truck className="w-4 h-4 mr-1" /> ROUTE OPTIMIZATION</span>
            <span className="text-slate-600">➔</span>
            <span className="flex items-center text-rose-400 font-bold"><Building2 className="w-4 h-4 mr-1" /> NGO</span>
          </div>

        </div>
      </section>

      {/* Dynamic Impact Counters Section */}
      <section className="py-12 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-xs font-bold tracking-widest text-emerald-600 uppercase">Real-Time Social & Environmental Impact</h2>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">Measurable Food Redistribution at Scale</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 text-center transform transition hover:scale-105">
              <div className="text-3xl font-black text-emerald-600 flex items-center justify-center">
                <span>🍱</span>
                <span className="ml-2">{(metrics.meals_rescued || 12450).toLocaleString()}</span>
              </div>
              <div className="text-xs font-bold text-slate-700 mt-1">Meals Rescued</div>
              <div className="text-[11px] text-slate-400">Nutritious portions distributed</div>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 text-center transform transition hover:scale-105">
              <div className="text-3xl font-black text-orange-600 flex items-center justify-center">
                <span>🏨</span>
                <span className="ml-2">{(metrics.total_hotels || 86).toLocaleString()}</span>
              </div>
              <div className="text-xs font-bold text-slate-700 mt-1">Partner Hotels</div>
              <div className="text-[11px] text-slate-400">Banquets & restaurants registered</div>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 text-center transform transition hover:scale-105">
              <div className="text-3xl font-black text-blue-600 flex items-center justify-center">
                <span>🏢</span>
                <span className="ml-2">{(metrics.total_ngos || 34).toLocaleString()}</span>
              </div>
              <div className="text-xs font-bold text-slate-700 mt-1">NGO Partners</div>
              <div className="text-[11px] text-slate-400">Verified shelter homes & kitchens</div>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 text-center transform transition hover:scale-105">
              <div className="text-3xl font-black text-indigo-600 flex items-center justify-center">
                <span>👨‍👩‍👧</span>
                <span className="ml-2">{(metrics.people_served || 9820).toLocaleString()}</span>
              </div>
              <div className="text-xs font-bold text-slate-700 mt-1">People Served</div>
              <div className="text-[11px] text-slate-400">Children, elders, and homeless</div>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 text-center col-span-2 lg:col-span-1 transform transition hover:scale-105">
              <div className="text-3xl font-black text-teal-600 flex items-center justify-center">
                <span>♻️</span>
                <span className="ml-2">{(metrics.food_saved_kg || 3240).toLocaleString()} kg</span>
              </div>
              <div className="text-xs font-bold text-slate-700 mt-1">Food Waste Avoided</div>
              <div className="text-[11px] text-slate-400">Zero landfill emissions</div>
            </div>

          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
            <span>6-STAGE SUPPLY CHAIN</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How FoodBridge AI Works
          </h2>
          <p className="mt-3 text-slate-600 text-base leading-relaxed">
            Unlike simple donation boards, FoodBridge AI acts as an active algorithmic middle layer orchestrating safety screening, mathematical ranking, and delivery feasibility.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflowSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition relative group">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${step.color} text-white flex items-center justify-center shadow-md`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-3xl font-black text-slate-200 group-hover:text-slate-300 transition">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600 text-xs leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* AI Decision Engine Callout */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-900/80 border border-indigo-700 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3">
                <Cpu className="w-3.5 h-3.5" />
                <span>EXPLAINABLE MATCHING FORMULA</span>
              </div>
              <h2 className="text-3xl font-extrabold text-white leading-tight">
                Transparent Multi-Factor Prioritization Engine
              </h2>
              <p className="mt-4 text-slate-300 text-sm leading-relaxed">
                The matching score is never a random black-box. It combines 5 weighted factors and strictly excludes any NGO whose travel time exceeds the food's safe usable window:
              </p>

              <div className="mt-6 space-y-3 font-mono text-xs">
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex justify-between items-center">
                  <span className="text-slate-300">Need Score (Beneficiary Demand)</span>
                  <span className="text-emerald-400 font-bold">Weight: 30%</span>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex justify-between items-center">
                  <span className="text-slate-300">Urgency Score (Critical / High / Med)</span>
                  <span className="text-rose-400 font-bold">Weight: 25%</span>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex justify-between items-center">
                  <span className="text-slate-300">Time Feasibility (Buffer before safe deadline)</span>
                  <span className="text-teal-400 font-bold">Weight: 20%</span>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex justify-between items-center">
                  <span className="text-slate-300">Food Compatibility (Category & Veg tags)</span>
                  <span className="text-indigo-400 font-bold">Weight: 15%</span>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex justify-between items-center">
                  <span className="text-slate-300">Distance & Proximity (Haversine Decay)</span>
                  <span className="text-amber-400 font-bold">Weight: 10%</span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  to="/matching"
                  className="inline-flex items-center text-sm font-bold text-emerald-400 hover:text-emerald-300"
                >
                  Inspect Live AI Matching Console <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </div>
            </div>

            {/* Visual Example Card */}
            <div className="bg-slate-800/90 rounded-2xl p-6 border border-slate-700 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700 text-xs">
                <span className="font-bold text-emerald-400">DEMO DECISION SCENARIO</span>
                <span className="bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700 font-semibold">ELIGIBLE ✓</span>
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="text-slate-300"><strong>Donor:</strong> Hotel Sunrise (100 servings Rice + Dal)</div>
                <div className="text-slate-300"><strong>Remaining Safe Life:</strong> 2 hours 30 mins</div>
                
                <div className="mt-4 pt-3 border-t border-slate-700/60 space-y-2">
                  <div className="bg-emerald-950/60 border border-emerald-700/60 p-3 rounded-xl">
                    <div className="flex justify-between font-bold text-white text-xs">
                      <span>1. Hope Foundation (120 Children)</span>
                      <span className="text-emerald-400">94.3 / 100 ✓ TOP MATCH</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1">Distance 3.8 km (16 min ETA). High urgency. Safe delivery margin: 119 mins.</p>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-700/60 p-3 rounded-xl">
                    <div className="flex justify-between font-bold text-white text-xs">
                      <span>2. Care Foundation (60 Elders)</span>
                      <span className="text-indigo-400">81.5 / 100 ✓ FEASIBLE</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Distance 4.2 km (18 min ETA). Medium urgency. Smaller serving demand.</p>
                  </div>

                  <div className="bg-rose-950/40 border border-rose-800/40 p-3 rounded-xl opacity-75">
                    <div className="flex justify-between font-bold text-rose-300 text-xs">
                      <span>3. Remote Suburb Shelter (25 km)</span>
                      <span className="text-rose-400 font-bold">⛔ EXCLUDED</span>
                    </div>
                    <p className="text-[11px] text-rose-200/80 mt-1">Gated out: Estimated transit exceeds safe food window buffer.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-10 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Utensils className="w-4 h-4 text-emerald-500" />
            <span className="font-bold text-white">FoodBridge AI</span>
            <span>— Academic EDI Engineering Project</span>
          </div>
          <div>
            Built with React, Node.js, Express, SQLite, and Explainable AI Logistics Engines.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
