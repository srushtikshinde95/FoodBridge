import React from 'react';

export function StatusBadge({ status, type = 'status' }) {
  if (!status) return null;

  const s = String(status).toUpperCase();

  // 1. Safety Screening Badges
  if (type === 'safety' || ['ELIGIBLE', 'REVIEW REQUIRED', 'NOT ELIGIBLE', 'PENDING'].includes(s)) {
    if (s === 'ELIGIBLE') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span className="w-2 h-2 mr-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          🟢 ELIGIBLE
        </span>
      );
    }
    if (s === 'REVIEW REQUIRED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
          <span className="w-2 h-2 mr-1.5 bg-amber-500 rounded-full"></span>
          🟡 REVIEW REQUIRED
        </span>
      );
    }
    if (s === 'NOT ELIGIBLE') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
          <span className="w-2 h-2 mr-1.5 bg-rose-500 rounded-full"></span>
          🔴 NOT ELIGIBLE
        </span>
      );
    }
  }

  // 2. Urgency Badges
  if (type === 'urgency' || ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(s)) {
    if (s === 'CRITICAL') {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white animate-pulse">🚨 CRITICAL</span>;
    }
    if (s === 'HIGH') {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-300">⚡ HIGH</span>;
    }
    if (s === 'MEDIUM') {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">MEDIUM</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">LOW</span>;
  }

  // 3. Donation & Delivery Lifecycle Badges
  const config = {
    'SUBMITTED': { bg: 'bg-slate-100 text-slate-800 border-slate-300', text: 'Submitted' },
    'SAFETY_PASSED': { bg: 'bg-teal-100 text-teal-800 border-teal-300', text: 'Safety Passed' },
    'MATCHING': { bg: 'bg-indigo-100 text-indigo-800 border-indigo-300', text: 'AI Matching' },
    'ASSIGNED': { bg: 'bg-blue-100 text-blue-800 border-blue-300', text: 'NGO Assigned' },
    'PARTIALLY_ASSIGNED': { bg: 'bg-purple-100 text-purple-800 border-purple-300', text: 'Partially Split' },
    'PICKUP_READY': { bg: 'bg-amber-100 text-amber-800 border-amber-300', text: 'Pickup Ready' },
    'IN_TRANSIT': { bg: 'bg-cyan-100 text-cyan-800 border-cyan-300', text: 'In Transit 🚚' },
    'DELIVERED': { bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', text: 'Delivered ✓' },
    'COMPLETED': { bg: 'bg-emerald-200 text-emerald-900 border-emerald-400', text: 'Completed ✓' },
    'REJECTED': { bg: 'bg-rose-100 text-rose-800 border-rose-300', text: 'Rejected ✗' },
    'EXPIRED': { bg: 'bg-slate-200 text-slate-700 border-slate-400', text: 'Expired ⏱️' },
    'FAILED': { bg: 'bg-rose-100 text-rose-800 border-rose-300', text: 'Failed' }
  };

  const item = config[s] || { bg: 'bg-slate-100 text-slate-700 border-slate-300', text: status };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${item.bg}`}>
      {item.text}
    </span>
  );
}

export default StatusBadge;
