import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { HeartHandshake, AlertTriangle, Clock, Users, ArrowRight, ShieldCheck } from 'lucide-react';

export function RequestFoodPage() {
  const navigate = useNavigate();

  const now = new Date();
  const defaultRequiredBy = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16);

  const [formData, setFormData] = useState({
    servings_required: '120',
    food_categories: ['Rice', 'Dal', 'Vegetables'],
    urgency: 'HIGH',
    required_by: defaultRequiredBy,
    dietary_restrictions: 'Veg Only',
    notes: 'Dinner meal for 120 residential children shelter.'
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    'Rice',
    'Roti/Bread',
    'Dal',
    'Vegetables',
    'Curry',
    'Fruits',
    'Desserts',
    'Bakery items',
    'Packaged food',
    'Other'
  ];

  const urgencies = [
    { level: 'CRITICAL', label: '🚨 Critical Urgency', desc: 'Emergency relief / Homeless shelters without immediate food supply' },
    { level: 'HIGH', label: '⚡ High Urgency', desc: 'Fixed dinner/lunch schedule for orphanage children' },
    { level: 'MEDIUM', label: '🔹 Medium Urgency', desc: 'Regular scheduled community kitchen supply' },
    { level: 'LOW', label: '🔸 Low Urgency', desc: 'Flexible dry grocery or snack requirement' },
  ];

  const handleCategoryToggle = (cat) => {
    setFormData(prev => {
      const exists = prev.food_categories.includes(cat);
      if (exists) {
        return { ...prev, food_categories: prev.food_categories.filter(c => c !== cat) };
      } else {
        return { ...prev, food_categories: [...prev.food_categories, cat] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await api.post('/ngos/requirements', {
        ...formData,
        servings_required: Number(formData.servings_required)
      });
      navigate('/ngo/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to submit requirement');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold uppercase tracking-wider mb-2">
          <HeartHandshake className="w-3.5 h-3.5" />
          <span>BENEFICIARY DEMAND REGISTRATION</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          Post Food Requirement
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Specify your shelter's meal needs, dietary preferences, and urgency level for AI matching prioritization.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        
        {/* Number of Servings & Required By */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Number of People / Servings Required
            </label>
            <input
              type="number"
              required
              min="10"
              value={formData.servings_required}
              onChange={(e) => setFormData(prev => ({ ...prev, servings_required: e.target.value }))}
              placeholder="e.g. 120"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Food Required By (Deadline Time)
            </label>
            <input
              type="datetime-local"
              required
              value={formData.required_by}
              onChange={(e) => setFormData(prev => ({ ...prev, required_by: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* Food Categories Checkboxes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            Select Required Food Categories (Multiple)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {categories.map((cat) => {
              const isChecked = formData.food_categories.includes(cat);
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => handleCategoryToggle(cat)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition ${
                    isChecked
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-300/40'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {isChecked ? '✓ ' : '+ '} {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Urgency Level Cards */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            Urgency Level (Directly Influences AI Priority Score)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {urgencies.map((u) => {
              const isSelected = formData.urgency === u.level;
              return (
                <div
                  key={u.level}
                  onClick={() => setFormData(prev => ({ ...prev, urgency: u.level }))}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-500 ring-2 ring-indigo-400/30'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900">{u.label}</div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{u.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dietary Restrictions & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Dietary Restrictions
            </label>
            <select
              value={formData.dietary_restrictions}
              onChange={(e) => setFormData(prev => ({ ...prev, dietary_restrictions: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="Veg Only">🌱 Strict Vegetarian Only</option>
              <option value="Any">Any Edible Preparation (Veg or Non-Veg)</option>
              <option value="Halal">Halal Verified</option>
              <option value="Low Spice">Low Spice / Soft Food for Elders</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Additional Delivery & Handover Notes
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="e.g. Ring main bell at Gate 1"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 rounded-2xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25 transition flex items-center cursor-pointer"
          >
            {submitting ? 'Registering...' : 'Register Food Requirement'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>

      </form>

    </div>
  );
}

export default RequestFoodPage;
