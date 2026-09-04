import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Utensils, Hotel, Building2, ShieldCheck, Lock, Mail, User, Phone, MapPin, Sparkles, ArrowRight } from 'lucide-react';

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, login, register, quickDemoLogin } = useAuth();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'register' ? 'register' : 'login');
  const [role, setRole] = useState('HOTEL');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [orgName, setOrgName] = useState('');
  const [address, setAddress] = useState('');
  const [defaultPeopleCount, setDefaultPeopleCount] = useState('60');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, redirect to respective dashboard
  useEffect(() => {
    if (user) {
      if (user.role === 'HOTEL') navigate('/hotel/dashboard');
      else if (user.role === 'NGO') navigate('/ngo/dashboard');
      else if (user.role === 'ADMIN') navigate('/admin/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (activeTab === 'login') {
        const u = await login(email, password);
        if (u.role === 'HOTEL') navigate('/hotel/dashboard');
        else if (u.role === 'NGO') navigate('/ngo/dashboard');
        else if (u.role === 'ADMIN') navigate('/admin/dashboard');
      } else {
        const u = await register({
          name,
          email,
          password,
          role,
          phone,
          orgName,
          address,
          defaultPeopleCount
        });
        if (u.role === 'HOTEL') navigate('/hotel/dashboard');
        else if (u.role === 'NGO') navigate('/ngo/dashboard');
        else if (u.role === 'ADMIN') navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async (demoEmail, demoPass = 'hotel123') => {
    setError('');
    setLoading(true);
    try {
      const u = await quickDemoLogin(demoEmail, demoPass);
      if (u.role === 'HOTEL') navigate('/hotel/dashboard');
      else if (u.role === 'NGO') navigate('/ngo/dashboard');
      else if (u.role === 'ADMIN') navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 mb-3">
          <Utensils className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">
          FoodBridge <span className="text-emerald-600">AI</span>
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Smart Food Redistribution & Logistics Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        
        {/* 1-Click Quick Demo Persona Cards */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-4 rounded-2xl border border-slate-800 text-white mb-6 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center text-xs font-bold text-emerald-400">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              <span>1-CLICK DEMO LOGIN (NO TYPING NEEDED)</span>
            </div>
            <span className="text-[10px] text-slate-400">Instant Access</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <button
              onClick={() => handleDemoClick('sunrise@hotel.com', 'hotel123')}
              className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-orange-600/30 border border-slate-700 hover:border-orange-500 text-left transition"
            >
              <div className="font-bold text-orange-400 flex items-center">
                <Hotel className="w-3.5 h-3.5 mr-1" /> Hotel Sunrise
              </div>
              <div className="text-[11px] text-slate-400">Donor Account</div>
            </button>

            <button
              onClick={() => handleDemoClick('hope@ngo.org', 'ngo123')}
              className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-blue-600/30 border border-slate-700 hover:border-blue-500 text-left transition"
            >
              <div className="font-bold text-blue-400 flex items-center">
                <Building2 className="w-3.5 h-3.5 mr-1" /> Hope Foundation
              </div>
              <div className="text-[11px] text-slate-400">120 Kids NGO</div>
            </button>

            <button
              onClick={() => handleDemoClick('admin@foodbridge.org', 'admin123')}
              className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-emerald-600/30 border border-slate-700 hover:border-emerald-500 text-left transition"
            >
              <div className="font-bold text-emerald-400 flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Central Admin
              </div>
              <div className="text-[11px] text-slate-400">Full System Control</div>
            </button>
          </div>
        </div>

        {/* Card Form */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl sm:px-10 border border-slate-200">
          
          {/* Tab Selector */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-3 text-sm font-bold border-b-2 transition ${
                activeTab === 'login'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-3 text-sm font-bold border-b-2 transition ${
                activeTab === 'register'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Register New Organization
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {activeTab === 'register' && (
              <>
                {/* Role Picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Your Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('HOTEL')}
                      className={`p-3 rounded-xl border flex items-center justify-center space-x-2 text-xs font-bold transition ${
                        role === 'HOTEL' 
                          ? 'border-orange-500 bg-orange-50 text-orange-800 ring-2 ring-orange-300/40' 
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Hotel className="w-4 h-4 text-orange-600" />
                      <span>Hotel / Restaurant</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('NGO')}
                      className={`p-3 rounded-xl border flex items-center justify-center space-x-2 text-xs font-bold transition ${
                        role === 'NGO' 
                          ? 'border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-300/40' 
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span>NGO / Shelter</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Organization / Hotel Name</label>
                  <input
                    type="text"
                    required
                    placeholder={role === 'HOTEL' ? 'e.g. Grand Vista Hotel' : 'e.g. Hope Seva Trust'}
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    placeholder="e.g. 45 FC Road, Shivaji Nagar, Pune"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {role === 'NGO' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Average People / Children to Feed</label>
                    <input
                      type="number"
                      min="10"
                      value={defaultPeopleCount}
                      onChange={(e) => setDefaultPeopleCount(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="name@organization.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              {loading ? 'Processing...' : activeTab === 'login' ? 'Sign In to Portal' : 'Create Account'}
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}

export default LoginPage;
