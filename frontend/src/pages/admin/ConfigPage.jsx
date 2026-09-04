import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Sliders, ShieldCheck, Cpu, Save, RefreshCw, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export function ConfigPage() {
  const [configs, setConfigs] = useState([]);
  const [weights, setWeights] = useState({
    weight_need: 0.30,
    weight_urgency: 0.25,
    weight_compatibility: 0.15,
    weight_distance: 0.10,
    weight_time_feasibility: 0.20
  });

  const [safetyParams, setSafetyParams] = useState({
    max_ambient_hours_cooked: 4,
    danger_zone_min_temp: 5,
    danger_zone_max_temp: 60,
    delivery_safety_buffer_mins: 15
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/config');
      const list = res.data?.configs || [];
      setConfigs(list);

      const w = { ...weights };
      const s = { ...safetyParams };

      list.forEach(c => {
        if (w[c.key] !== undefined) w[c.key] = parseFloat(c.value);
        if (s[c.key] !== undefined) s[c.key] = parseFloat(c.value);
      });

      setWeights(w);
      setSafetyParams(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleWeightChange = (key, val) => {
    setWeights(prev => ({ ...prev, [key]: parseFloat(val) }));
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const payload = [
        ...Object.entries(weights).map(([k, v]) => ({ key: k, value: String(v) })),
        ...Object.entries(safetyParams).map(([k, v]) => ({ key: k, value: String(v) }))
      ];

      await api.post('/admin/config', { configs: payload });
      setMessage('✅ Configuration parameters updated successfully!');
      fetchConfigs();
    } catch (e) {
      setMessage('Error saving configuration: ' + (e.response?.data?.error || e.message));
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setWeights({
      weight_need: 0.30,
      weight_urgency: 0.25,
      weight_compatibility: 0.15,
      weight_distance: 0.10,
      weight_time_feasibility: 0.20
    });
    setSafetyParams({
      max_ambient_hours_cooked: 4,
      danger_zone_min_temp: 5,
      danger_zone_max_temp: 60,
      delivery_safety_buffer_mins: 15
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold uppercase tracking-wider mb-1">
            <Sliders className="w-3.5 h-3.5" />
            <span>ALGORITHMIC PARAMETER TUNING</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            System Weights & Safety Criteria
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Adjust multi-factor matching priorities and food-safety thresholds without modifying source code.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-300 transition"
          >
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition flex items-center"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-emerald-600 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Section 1: AI Matching Priority Weights */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-sm text-slate-900 flex items-center">
              <Cpu className="w-4 h-4 mr-2 text-indigo-600" />
              AI Matching Engine Priority Weights
            </h2>
            <p className="text-xs text-slate-500">Configure how much each factor influences the final 0-100 match score</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Total Weight Sum</span>
            <div className={`text-base font-black ${Math.abs(totalWeight - 1.0) < 0.01 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {(totalWeight * 100).toFixed(0)}% {Math.abs(totalWeight - 1.0) >= 0.01 && '⚠️'}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
              <span>Need & Beneficiary Demand Weight:</span>
              <span className="text-indigo-600 font-mono">{(weights.weight_need * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.6"
              step="0.05"
              value={weights.weight_need}
              onChange={(e) => handleWeightChange('weight_need', e.target.value)}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <span className="text-[11px] text-slate-400">Prioritizes NGOs with larger beneficiary headcount and higher serving utilization.</span>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
              <span>Urgency Level Weight:</span>
              <span className="text-rose-600 font-mono">{(weights.weight_urgency * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.6"
              step="0.05"
              value={weights.weight_urgency}
              onChange={(e) => handleWeightChange('weight_urgency', e.target.value)}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
            />
            <span className="text-[11px] text-slate-400">Boosts priority for Critical and High urgency shelters (homeless shelters, fixed meal times).</span>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
              <span>Time Feasibility & Shelf-Life Margin Weight:</span>
              <span className="text-teal-600 font-mono">{(weights.weight_time_feasibility * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.6"
              step="0.05"
              value={weights.weight_time_feasibility}
              onChange={(e) => handleWeightChange('weight_time_feasibility', e.target.value)}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
            <span className="text-[11px] text-slate-400">Rewards routes with generous buffer time between arrival ETA and safe deadline.</span>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
              <span>Food Category & Dietary Match Weight:</span>
              <span className="text-emerald-600 font-mono">{(weights.weight_compatibility * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.6"
              step="0.05"
              value={weights.weight_compatibility}
              onChange={(e) => handleWeightChange('weight_compatibility', e.target.value)}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <span className="text-[11px] text-slate-400">Scores exact food category matching and dietary restrictions (e.g. Vegetarian Only).</span>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
              <span>Distance & Proximity Weight:</span>
              <span className="text-amber-600 font-mono">{(weights.weight_distance * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.6"
              step="0.05"
              value={weights.weight_distance}
              onChange={(e) => handleWeightChange('weight_distance', e.target.value)}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
            <span className="text-[11px] text-slate-400">Proximity decay function giving preference to shorter transit distances.</span>
          </div>

        </div>
      </div>

      {/* Section 2: Food Safety Criteria & Buffer Settings */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100 flex items-center">
          <ShieldCheck className="w-4 h-4 mr-2 text-emerald-600" />
          Rule-Based Food Safety Parameters
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Max Ambient Hours (Cooked Food)</label>
            <input
              type="number"
              value={safetyParams.max_ambient_hours_cooked}
              onChange={(e) => setSafetyParams(prev => ({ ...prev, max_ambient_hours_cooked: Number(e.target.value) }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold"
            />
            <span className="text-[11px] text-slate-400">Cooked rice/dal exceeding this ambient duration is marked NOT ELIGIBLE.</span>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Delivery Safety Buffer (Minutes)</label>
            <input
              type="number"
              value={safetyParams.delivery_safety_buffer_mins}
              onChange={(e) => setSafetyParams(prev => ({ ...prev, delivery_safety_buffer_mins: Number(e.target.value) }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold"
            />
            <span className="text-[11px] text-slate-400">Mandatory buffer window required between delivery ETA and expiry deadline.</span>
          </div>
        </div>
      </div>

    </div>
  );
}

export default ConfigPage;
