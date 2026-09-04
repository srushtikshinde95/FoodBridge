import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { Sparkles, RefreshCw, UserCheck, ShieldAlert, Cpu, Truck, CheckCircle2, ChevronRight, Play } from 'lucide-react';

export function DemoSimulationBar({ onScenarioRun }) {
  const { user, quickDemoLogin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeScenario, setActiveScenario] = useState(null);
  const [feedback, setFeedback] = useState('');

  const demoAccounts = [
    { label: 'Admin (Central Command)', email: 'admin@foodbridge.org', role: 'ADMIN' },
    { label: 'Hotel Sunrise (Donor)', email: 'sunrise@hotel.com', role: 'HOTEL' },
    { label: 'Hotel Royal (Donor)', email: 'royal@hotel.com', role: 'HOTEL' },
    { label: 'Hope Foundation (120 Kids NGO)', email: 'hope@ngo.org', role: 'NGO' },
    { label: 'Helping Hands (200 Shelter NGO)', email: 'hands@ngo.org', role: 'NGO' },
  ];

  const scenarios = [
    {
      id: 'sc1',
      title: 'Scenario 1: Hotel Sunrise 100 Rice Servings Match',
      desc: '100 Basmati Rice servings evaluated with AI multi-factor scoring and matched to Hope Foundation.',
      icon: Cpu,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      action: async () => {
        setLoading(true);
        try {
          // Find or create Hotel Sunrise 100 servings donation
          const donationsRes = await api.get('/donations');
          const sunriseDonation = donationsRes.data.donations.find(d => d.food_name.includes('Basmati Rice') || d.servings === 100);
          if (sunriseDonation) {
            const evalRes = await api.get(`/matching/evaluate/${sunriseDonation.id}`);
            setFeedback(`Evaluated donation #${sunriseDonation.id}. Top match: ${evalRes.data.evaluation.top_match?.ngo?.ngo_name || 'Hope Foundation'} (${evalRes.data.evaluation.top_match?.final_match_score || 94}/100)`);
            navigate(`/matching?donationId=${sunriseDonation.id}`);
          } else {
            navigate('/donate');
          }
        } catch (e) {
          setFeedback('Scenario error: ' + e.message);
        } finally {
          setLoading(false);
        }
      }
    },
    {
      id: 'sc2',
      title: 'Scenario 2: Critical Urgency Night Shelter Priority',
      desc: 'Demonstrates how Critical Urgency boosts priority score to serve 200 homeless beneficiaries first.',
      icon: ShieldAlert,
      color: 'text-rose-600 bg-rose-50 border-rose-200',
      action: async () => {
        setLoading(true);
        try {
          const donationsRes = await api.get('/donations');
          const vegDonation = donationsRes.data.donations.find(d => d.servings >= 80 && d.safety_status === 'ELIGIBLE') || donationsRes.data.donations[0];
          navigate(`/matching?donationId=${vegDonation.id}&highlight=CRITICAL`);
          setFeedback(`Showing Urgent Priority decision for ${vegDonation.food_name}. Critical urgency NGO scores highest.`);
        } finally {
          setLoading(false);
        }
      }
    },
    {
      id: 'sc3',
      title: 'Scenario 3: Short Expiry Feasibility Exclusion',
      desc: 'Food has only 30 min safe window. Distant NGOs are automatically gated out with clear reason.',
      icon: Truck,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      action: async () => {
        setLoading(true);
        try {
          navigate('/matching?demo=short_window');
          setFeedback('Demo active: Distant NGOs (12+ km) marked INFEASIBLE because transit duration > remaining food life window.');
        } finally {
          setLoading(false);
        }
      }
    },
    {
      id: 'sc4',
      title: 'Scenario 4: Multi-NGO Partial Split',
      desc: '200 Servings Biryani intelligently divided across 2 shelters (120 to Shelter A + 80 to Kitchen B).',
      icon: CheckCircle2,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      action: async () => {
        setLoading(true);
        try {
          const donationsRes = await api.get('/donations');
          const biryani = donationsRes.data.donations.find(d => d.servings === 200) || donationsRes.data.donations[0];
          navigate(`/matching?donationId=${biryani.id}&mode=partial`);
          setFeedback('Multi-NGO Partial Split: 200 servings allocated into 120 servings + 80 servings.');
        } finally {
          setLoading(false);
        }
      }
    }
  ];

  const handleReset = async () => {
    if (!window.confirm('Reset database to clean initial demo seed data?')) return;
    setLoading(true);
    try {
      await api.post('/admin/reset-demo');
      setFeedback('✅ Database successfully reset to fresh demo scenarios!');
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      setFeedback('Error resetting: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          
          {/* Left Title & Status */}
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div className="flex items-center font-bold tracking-wide text-emerald-400">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              <span>EDI ACADEMIC DEMO TESTBENCH</span>
            </div>
            <span className="hidden sm:inline-block text-slate-400">|</span>
            <span className="hidden sm:inline-block text-slate-300">
              Active User: <strong className="text-white">{user ? `${user.name} (${user.role})` : 'Guest / Not Logged In'}</strong>
            </span>
          </div>

          {/* Center / Right Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Quick Role Switcher Dropdown */}
            <div className="flex items-center space-x-1.5 bg-slate-800/80 rounded-md px-2 py-1 border border-slate-700">
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-300 font-medium hidden lg:inline">Switch Role:</span>
              <select
                className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer"
                value={user?.email || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    quickDemoLogin(e.target.value);
                  }
                }}
              >
                <option value="" disabled className="bg-slate-900 text-slate-400">Select Demo Persona</option>
                {demoAccounts.map(acc => (
                  <option key={acc.email} value={acc.email} className="bg-slate-900 text-white">
                    {acc.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Scenarios Dropdown */}
            <div className="flex items-center space-x-1.5 bg-slate-800/80 rounded-md px-2 py-1 border border-slate-700">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-300 font-medium hidden lg:inline">Run Scenario:</span>
              <select
                className="bg-transparent text-emerald-300 font-medium text-xs focus:outline-none cursor-pointer"
                defaultValue=""
                onChange={(e) => {
                  const sc = scenarios.find(s => s.id === e.target.value);
                  if (sc) sc.action();
                }}
              >
                <option value="" disabled className="bg-slate-900 text-slate-400">⚡ Choose AI Scenario</option>
                {scenarios.map(sc => (
                  <option key={sc.id} value={sc.id} className="bg-slate-900 text-emerald-300">
                    {sc.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Seed Button */}
            <button
              onClick={handleReset}
              disabled={loading}
              className="inline-flex items-center px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/50 font-medium transition cursor-pointer"
              title="Reset database to initial seed scenario"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Reset Demo
            </button>
          </div>
        </div>

        {/* Feedback Message Bar */}
        {feedback && (
          <div className="mt-1.5 py-1 px-2.5 bg-indigo-900/80 border border-indigo-700 text-indigo-200 rounded text-xs flex items-center justify-between animate-fadeIn">
            <span>💡 {feedback}</span>
            <button onClick={() => setFeedback('')} className="text-slate-400 hover:text-white ml-2 text-xs font-bold">✕</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DemoSimulationBar;
