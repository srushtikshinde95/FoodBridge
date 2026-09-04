import React from 'react';
import { ShieldCheck, AlertOctagon, HelpCircle, Thermometer, Clock, PackageCheck, AlertTriangle } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export function SafetyScreeningMeter({ safetyData }) {
  if (!safetyData) return null;

  const { safety_status, safety_reason, remaining_window_minutes, time_since_prep_minutes, flags = [] } = safetyData;

  const hoursRemaining = Math.floor((remaining_window_minutes || 0) / 60);
  const minsRemaining = (remaining_window_minutes || 0) % 60;

  return (
    <div className={`p-4 rounded-2xl border transition-all ${
      safety_status === 'ELIGIBLE' 
        ? 'bg-emerald-50/50 border-emerald-300' 
        : safety_status === 'REVIEW REQUIRED' 
          ? 'bg-amber-50/50 border-amber-300' 
          : 'bg-rose-50/50 border-rose-300'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          {safety_status === 'ELIGIBLE' ? (
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
          ) : safety_status === 'REVIEW REQUIRED' ? (
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md">
              <HelpCircle className="w-5 h-5" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md">
              <AlertOctagon className="w-5 h-5" />
            </div>
          )}
          <div>
            <div className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Food Safety Rule-Based Verification</div>
            <div className="flex items-center space-x-2 mt-0.5">
              <StatusBadge status={safety_status} type="safety" />
            </div>
          </div>
        </div>

        {/* Usable Window Countdown */}
        <div className="text-right">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Remaining Safe Window</div>
          <div className={`text-base font-extrabold ${
            remaining_window_minutes > 60 ? 'text-emerald-700' : remaining_window_minutes > 0 ? 'text-amber-700' : 'text-rose-700'
          }`}>
            {hoursRemaining}h {minsRemaining}m
          </div>
        </div>
      </div>

      {/* Reason text */}
      <div className="mt-3 p-2.5 rounded-xl bg-white/90 border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
        <strong>Evaluation:</strong> {safety_reason}
      </div>

      {/* Safety Criteria Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 text-xs">
        <div className="flex items-center space-x-2 bg-white/70 p-2 rounded-lg border border-slate-100">
          <Clock className="w-4 h-4 text-indigo-500 flex-shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 block">Preparation Time</span>
            <span className="font-semibold text-slate-800">
              {time_since_prep_minutes !== undefined ? `${(time_since_prep_minutes / 60).toFixed(1)}h ago` : 'Verified'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-white/70 p-2 rounded-lg border border-slate-100">
          <Thermometer className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 block">Temperature Control</span>
            <span className="font-semibold text-slate-800">
              {flags.some(f => f.includes('TEMP')) ? 'Danger Zone ⚠️' : 'Safe Range ✓'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-white/70 p-2 rounded-lg border border-slate-100">
          <PackageCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 block">Packaging Integrity</span>
            <span className="font-semibold text-slate-800">
              {flags.includes('UNSEALED_PACKAGING') ? 'Unsealed ✗' : 'Compliant ✓'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SafetyScreeningMeter;
