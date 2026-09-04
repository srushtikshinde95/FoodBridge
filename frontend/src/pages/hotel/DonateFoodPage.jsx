import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import SafetyScreeningMeter from '../../components/ai/SafetyScreeningMeter';
import { Utensils, ShieldCheck, Clock, Thermometer, Package, Sparkles, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';

export function DonateFoodPage() {
  const navigate = useNavigate();

  // Current time defaults
  const now = new Date();
  const prepDefault = new Date(now.getTime() - 60 * 60 * 1000).toISOString().slice(0, 16);
  const safeDefault = new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 16);

  const [formData, setFormData] = useState({
    food_name: 'Paneer Butter Masala & Steamed Rice',
    category: 'Rice',
    quantity: '30',
    unit: 'kg',
    servings: '80',
    preparation_time: prepDefault,
    safe_until: safeDefault,
    storage_method: 'Hot Holding',
    storage_temperature: '68',
    packaging_condition: 'Sealed Containers',
    is_veg: 1,
    allergens: 'Dairy (Paneer)',
    notes: 'Surplus buffet preparation in food-grade steel containers.',
    auto_allocate: true
  });

  const [safetyPreview, setSafetyPreview] = useState(null);
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

  const storageMethods = [
    'Hot Holding',
    'Refrigerated',
    'Ambient/Room Temp',
    'Frozen'
  ];

  const packagingConditions = [
    'Sealed Containers',
    'Food-grade foil wrap',
    'Covered Trays',
    'Open/Loose'
  ];

  // Debounced real-time safety pre-check preview
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.food_name && formData.category && formData.preparation_time && formData.safe_until) {
        api.post('/donations/preview-safety', {
          ...formData,
          servings: Number(formData.servings),
          quantity: Number(formData.quantity),
          storage_temperature: formData.storage_temperature ? Number(formData.storage_temperature) : null
        })
        .then(res => setSafetyPreview(res.data?.safety))
        .catch(() => {});
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [formData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await api.post('/donations', formData);
      const donationId = res.data.donation.id;
      navigate(`/matching?donationId=${donationId}`);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to submit food donation');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
          <Utensils className="w-3.5 h-3.5" />
          <span>SURPLUS FOOD REGISTRATION & SAFETY AUDIT</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          Register Surplus Food Donation
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Enter food details. The rule-based safety engine evaluates safe shelf life in real time before triggering AI NGO matching.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Form (2 cols on lg) */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          
          {/* Section 1: Food Details */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold mr-2">1</span>
              Food Information
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Food Item Name / Description</label>
                <input
                  type="text"
                  required
                  value={formData.food_name}
                  onChange={(e) => handleChange('food_name', e.target.value)}
                  placeholder="e.g. Steamed Basmati Rice & Dal Tadka"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Food Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dietary Classification</label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleChange('is_veg', 1)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                        formData.is_veg === 1 ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      🌱 Vegetarian
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('is_veg', 0)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                        formData.is_veg === 0 ? 'bg-rose-50 border-rose-500 text-rose-800' : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      🍗 Non-Vegetarian
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Servings / Meals</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.servings}
                    onChange={(e) => handleChange('servings', e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Approx Weight (Quantity in kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.quantity}
                    onChange={(e) => handleChange('quantity', e.target.value)}
                    placeholder="e.g. 35"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Time & Safe Window */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 text-xs flex items-center justify-center font-bold mr-2">2</span>
              Preparation Time & Safe-Use Window
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cooking / Preparation Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.preparation_time}
                  onChange={(e) => handleChange('preparation_time', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Safe-Use Deadline</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.safe_until}
                  onChange={(e) => handleChange('safe_until', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Storage & Food Safety Parameters */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center">
              <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-800 text-xs flex items-center justify-center font-bold mr-2">3</span>
              Storage & Packaging Conditions
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Storage Method</label>
                  <select
                    value={formData.storage_method}
                    onChange={(e) => {
                      const method = e.target.value;
                      let defaultTemp = '25';
                      if (method === 'Refrigerated') defaultTemp = '4';
                      if (method === 'Hot Holding') defaultTemp = '68';
                      if (method === 'Frozen') defaultTemp = '-18';
                      setFormData(prev => ({ ...prev, storage_method: method, storage_temperature: defaultTemp }));
                    }}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {storageMethods.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Storage Temperature (°C)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      value={formData.storage_temperature}
                      onChange={(e) => handleChange('storage_temperature', e.target.value)}
                      placeholder="e.g. 4 for chilled, 65 for hot"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">°C</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Packaging Condition</label>
                <select
                  value={formData.packaging_condition}
                  onChange={(e) => handleChange('packaging_condition', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {packagingConditions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Allergens (if any)</label>
                  <input
                    type="text"
                    value={formData.allergens}
                    onChange={(e) => handleChange('allergens', e.target.value)}
                    placeholder="e.g. Nuts, Dairy, Gluten"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Additional Pickup Notes</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder="e.g. Pickup from Service Gate #2"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.auto_allocate}
                onChange={(e) => handleChange('auto_allocate', e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <span>Automatically calculate AI match and assign to best NGO</span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-2xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 transition flex items-center cursor-pointer"
            >
              {submitting ? 'Auditing & Allocating...' : 'Submit Food Donation'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>

        </form>

        {/* Right Column: Real-Time Safety Screening Meter */}
        <div className="space-y-6">
          <div className="sticky top-20 space-y-4">
            
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center">
                <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-600" />
                Live Food Safety Screening
              </h3>

              {safetyPreview ? (
                <SafetyScreeningMeter safetyData={safetyPreview} />
              ) : (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                  Adjust food parameters to see rule-based safety evaluation.
                </div>
              )}
            </div>

            {/* Safety Guidelines Card */}
            <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-md text-xs space-y-2">
              <div className="font-bold text-emerald-400 flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Food Safety Rule Rules
              </div>
              <ul className="space-y-1.5 text-slate-300 text-[11px] list-disc list-inside leading-relaxed">
                <li>Danger zone (5°C to 60°C) accelerates bacterial growth.</li>
                <li>Cooked rice & curries must not exceed 4h in ambient storage.</li>
                <li>Open or loose packaging is rejected to prevent contamination.</li>
                <li>Food must arrive with at least 15 min safety buffer before expiry.</li>
              </ul>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}

export default DonateFoodPage;
