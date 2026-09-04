import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Clock, MapPin, Users, Zap, ShieldCheck, ChevronRight } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export function ExplainableMatchCard({ candidate, onAllocate, isAllocating = false, isTop = false, rank = 1 }) {
  const { ngo, requirement, scores, weights, final_match_score, is_feasible, recommendation, reasons } = candidate;

  const scoreBars = [
    { label: 'Need & Beneficiary Demand', score: scores.need_score, weight: (weights.weight_need * 100).toFixed(0) + '%', color: 'bg-indigo-500' },
    { label: 'Urgency Priority', score: scores.urgency_score, weight: (weights.weight_urgency * 100).toFixed(0) + '%', color: 'bg-rose-500' },
    { label: 'Food Compatibility', score: scores.compatibility_score, weight: (weights.weight_compatibility * 100).toFixed(0) + '%', color: 'bg-emerald-500' },
    { label: 'Distance & Proximity', score: scores.distance_score, weight: (weights.weight_distance * 100).toFixed(0) + '%', color: 'bg-amber-500' },
    { label: 'Time Feasibility & Shelf-Life', score: scores.time_feasibility_score, weight: (weights.weight_time_feasibility * 100).toFixed(0) + '%', color: 'bg-teal-500' },
  ];

  return (
    <div className={`rounded-2xl border transition-all ${
      isTop 
        ? 'bg-gradient-to-br from-white to-emerald-50/50 border-emerald-300 shadow-lg ring-2 ring-emerald-400/30' 
        : is_feasible 
          ? 'bg-white border-slate-200 shadow-sm hover:border-slate-300' 
          : 'bg-slate-50/80 border-rose-200 opacity-80'
    } p-5`}>
      
      {/* Top Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
              isTop ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              #{rank}
            </span>
            <h3 className="font-bold text-base text-slate-900">{ngo.ngo_name}</h3>
            {isTop && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                ⭐ TOP RECOMMENDATION
              </span>
            )}
            {!is_feasible && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                ⛔ INFEASIBLE / GATED
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center">
            <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
            {ngo.address}
          </p>
        </div>

        {/* Match Score Badge */}
        <div className="text-right">
          <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">AI Match Score</div>
          <div className={`text-2xl font-black ${
            final_match_score >= 80 ? 'text-emerald-600' : final_match_score >= 60 ? 'text-indigo-600' : 'text-slate-400'
          }`}>
            {final_match_score} <span className="text-xs font-medium text-slate-400">/ 100</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
        <div>
          <div className="text-slate-400 font-medium">Beneficiaries</div>
          <div className="font-bold text-slate-800 flex items-center mt-0.5">
            <Users className="w-3.5 h-3.5 mr-1 text-indigo-500" />
            {scores.requested_servings} People
          </div>
        </div>
        <div>
          <div className="text-slate-400 font-medium">Urgency Level</div>
          <div className="mt-0.5">
            <StatusBadge status={requirement?.urgency || 'MEDIUM'} type="urgency" />
          </div>
        </div>
        <div>
          <div className="text-slate-400 font-medium">Distance</div>
          <div className="font-bold text-slate-800 flex items-center mt-0.5">
            <MapPin className="w-3.5 h-3.5 mr-1 text-amber-500" />
            {scores.distance_km} km
          </div>
        </div>
        <div>
          <div className="text-slate-400 font-medium">Delivery ETA</div>
          <div className="font-bold text-slate-800 flex items-center mt-0.5">
            <Clock className="w-3.5 h-3.5 mr-1 text-teal-500" />
            ~{scores.estimated_duration_mins} mins
          </div>
        </div>
      </div>

      {/* 5 Mathematical Factor Score Bars */}
      <div className="space-y-2 my-3">
        <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
          <span>Explainable Factor Breakdown</span>
          <span className="text-[10px] text-slate-400 lowercase font-normal">Score (Weight)</span>
        </div>

        {scoreBars.map((bar, idx) => (
          <div key={idx} className="text-xs">
            <div className="flex justify-between text-slate-700 font-medium mb-0.5 text-[11px]">
              <span>{bar.label} <span className="text-slate-400">({bar.weight})</span></span>
              <span className="font-bold">{bar.score} / 100</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full ${bar.color}`}
                style={{ width: `${Math.max(4, bar.score)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Explainable Decision Summary */}
      <div className="mt-3 pt-3 border-t border-slate-100">
        <div className="text-xs font-bold text-slate-800 mb-1.5 flex items-center">
          <ShieldCheck className="w-4 h-4 mr-1 text-emerald-600" />
          AI Decision Reasoning:
        </div>

        <p className="text-xs text-slate-600 leading-relaxed mb-2 bg-white p-2 rounded-lg border border-slate-100">
          {reasons.summary}
        </p>

        {/* Pros / Strengths */}
        {reasons.pros.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {reasons.pros.map((p, i) => (
              <span key={i} className="inline-flex items-center text-[11px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle className="w-3 h-3 mr-1 text-emerald-600 flex-shrink-0" />
                {p}
              </span>
            ))}
          </div>
        )}

        {/* Cons / Exclusion Flags */}
        {reasons.cons.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {reasons.cons.map((c, i) => (
              <span key={i} className="inline-flex items-center text-[11px] font-medium bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md border border-rose-200">
                <XCircle className="w-3 h-3 mr-1 text-rose-600 flex-shrink-0" />
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Button */}
      {is_feasible && onAllocate && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Available: <strong>{scores.requested_servings} Servings</strong>
          </div>
          <button
            onClick={() => onAllocate(ngo.id, scores.requested_servings)}
            disabled={isAllocating}
            className={`px-4 py-1.5 rounded-xl font-bold text-xs shadow-sm flex items-center transition cursor-pointer ${
              isTop 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isAllocating ? 'Allocating...' : `Allocate to ${ngo.ngo_name}`}
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      )}
    </div>
  );
}

export default ExplainableMatchCard;
