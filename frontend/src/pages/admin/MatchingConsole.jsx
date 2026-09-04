import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../api/client';
import ExplainableMatchCard from '../../components/ai/ExplainableMatchCard';
import SafetyScreeningMeter from '../../components/ai/SafetyScreeningMeter';
import StatusBadge from '../../components/common/StatusBadge';
import { 
  Cpu, 
  Hotel, 
  Clock, 
  MapPin, 
  Sliders, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Layers, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export function MatchingConsole() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialDonationId = searchParams.get('donationId');

  const [donations, setDonations] = useState([]);
  const [selectedDonationId, setSelectedDonationId] = useState(initialDonationId || '');
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [allocating, setAllocating] = useState(false);
  const [message, setMessage] = useState('');
  const [allowPartial, setAllowPartial] = useState(true);

  useEffect(() => {
    fetchDonations();
  }, []);

  useEffect(() => {
    if (selectedDonationId) {
      runEvaluation(selectedDonationId);
    }
  }, [selectedDonationId]);

  const fetchDonations = async () => {
    try {
      const res = await api.get('/donations');
      const list = res.data?.donations || [];
      setDonations(list);
      if (!selectedDonationId && list.length > 0) {
        // Default to first eligible donation or #1
        const firstEligible = list.find(d => d.safety_status === 'ELIGIBLE') || list[0];
        setSelectedDonationId(String(firstEligible.id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const runEvaluation = async (donationId) => {
    setLoading(true);
    setMessage('');
    try {
      const res = await api.get(`/matching/evaluate/${donationId}`);
      setEvaluation(res.data?.evaluation);
    } catch (e) {
      setMessage('Evaluation failed: ' + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAllocate = async (manualCandidateId = null, partialServings = null) => {
    if (!selectedDonationId) return;
    setAllocating(true);
    setMessage('');
    try {
      const res = await api.post(`/matching/allocate/${selectedDonationId}`, {
        allowPartial,
        manualCandidateId,
        partialServings
      });
      setMessage(`✅ ${res.data.message || 'Food allocated successfully!'}`);
      runEvaluation(selectedDonationId);
    } catch (e) {
      setMessage('Allocation error: ' + (e.response?.data?.error || e.message));
    } finally {
      setAllocating(false);
    }
  };

  const selectedDonation = donations.find(d => String(d.id) === String(selectedDonationId));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
            <Cpu className="w-4 h-4" />
            <span>AI MATCHING & ALLOCATION ENGINE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">Intelligent Supply Chain Allocator</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Calculates mathematical rankings across Need (30%), Urgency (25%), Compatibility (15%), Distance (10%), and Time Feasibility (20%), gating out infeasible NGOs whose delivery ETA exceeds the safe usable window.
          </p>
        </div>

        <Link
          to="/config"
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center flex-shrink-0"
        >
          <Sliders className="w-4 h-4 mr-1.5 text-teal-400" />
          Tune Priority Weights
        </Link>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center justify-between shadow-xs">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-emerald-600 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Donation Selector & Selected Food Info Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Donation Dropdown & Details */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Select Surplus Food Batch to Match:
            </label>
            <select
              value={selectedDonationId}
              onChange={(e) => {
                setSelectedDonationId(e.target.value);
                setSearchParams({ donationId: e.target.value });
              }}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {donations.map((d) => (
                <option key={d.id} value={d.id}>
                  #{d.id} {d.food_name} ({d.servings} Servings) - {d.hotel_name} [{d.safety_status}]
                </option>
              ))}
            </select>
          </div>

          {selectedDonation && (
            <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Donor Hotel:</span>
                <span className="font-bold text-slate-900">{selectedDonation.hotel_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Servings / Quantity:</span>
                <span className="font-bold text-emerald-600">{selectedDonation.servings} Servings ({selectedDonation.quantity} {selectedDonation.unit})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Category / Veg Tag:</span>
                <span className="font-semibold text-slate-800">{selectedDonation.category} ({selectedDonation.is_veg ? '🌱 Veg' : '🍗 Non-Veg'})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Storage & Temp:</span>
                <span className="font-semibold text-slate-800">{selectedDonation.storage_method} ({selectedDonation.storage_temperature || 25}°C)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Safe Usable Life:</span>
                <span className="font-bold text-indigo-600">{selectedDonation.remaining_window_minutes || 120} mins remaining</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Lifecycle Status:</span>
                <StatusBadge status={selectedDonation.status} />
              </div>
            </div>
          )}

          {/* Allocation Settings */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={allowPartial}
                onChange={(e) => setAllowPartial(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <span>Allow Multi-NGO Partial Split if servings exceed requirement</span>
            </label>

            <button
              onClick={() => handleAllocate()}
              disabled={allocating || loading || selectedDonation?.safety_status === 'NOT ELIGIBLE'}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center cursor-pointer ${
                selectedDonation?.safety_status === 'NOT ELIGIBLE'
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              }`}
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              {allocating ? 'Executing AI Allocation...' : 'Auto-Allocate to Best Feasible Match'}
            </button>
          </div>
        </div>

        {/* Center & Right: Food Safety Audit Meter */}
        <div className="lg:col-span-2">
          {evaluation?.donation ? (
            <div className="space-y-4">
              <SafetyScreeningMeter safetyData={{
                safety_status: evaluation.donation.safety_status,
                safety_reason: evaluation.donation.safety_reason,
                remaining_window_minutes: evaluation.donation.remaining_window_minutes,
                flags: []
              }} />

              {evaluation.donation.safety_status === 'NOT ELIGIBLE' && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl font-medium">
                  ⛔ <strong>Safety Gate Disqualification:</strong> This food donation fails food safety screening criteria and cannot be redistributed.
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
              Loading donation parameters...
            </div>
          )}
        </div>

      </div>

      {/* Evaluated Candidate Rankings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Candidate NGOs Ranked by AI Priority Score ({evaluation?.candidates?.length || 0} Evaluated)
            </h2>
            <p className="text-xs text-slate-500">
              Transparent breakdown of factors, suitability pros/cons, and route feasibility
            </p>
          </div>
          <button
            onClick={() => runEvaluation(selectedDonationId)}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition"
          >
            {loading ? 'Evaluating...' : '↻ Recalculate Scores'}
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Running multi-criteria AI matching algorithms...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {evaluation?.candidates?.map((candidate, idx) => (
              <ExplainableMatchCard
                key={candidate.ngo.id}
                candidate={candidate}
                isTop={idx === 0 && candidate.is_feasible}
                rank={idx + 1}
                onAllocate={(ngoId, servings) => handleAllocate(ngoId, servings)}
                isAllocating={allocating}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default MatchingConsole;
