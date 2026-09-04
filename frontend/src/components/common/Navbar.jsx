import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { 
  Utensils, 
  MapPin, 
  Bell, 
  Cpu, 
  Truck, 
  BarChart3, 
  Sliders, 
  PlusCircle, 
  LogOut, 
  User, 
  Layers, 
  ShieldCheck, 
  HeartHandshake,
  CheckCircle2,
  Menu,
  X
} from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (e) {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setUnreadCount(0);
      fetchNotifications();
    } catch (e) {}
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Brand Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-md flex items-center justify-center">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-slate-900">FoodBridge</span>
                <span className="text-xl font-bold tracking-tight text-emerald-600 ml-1">AI</span>
                <span className="block text-[10px] text-slate-400 font-semibold tracking-wider uppercase -mt-1">
                  Intelligent Food Logistics
                </span>
              </div>
            </Link>
          </div>

          {/* Center Navigation Links based on User Role */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                isActive('/') ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Overview
            </Link>

            {/* Hotel Links */}
            {user?.role === 'HOTEL' && (
              <>
                <Link
                  to="/hotel/dashboard"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    isActive('/hotel/dashboard') ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Hotel Dashboard
                </Link>
                <Link
                  to="/donate"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center transition ${
                    isActive('/donate') ? 'bg-emerald-600 text-white font-semibold' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  <PlusCircle className="w-4 h-4 mr-1.5" />
                  Donate Surplus Food
                </Link>
              </>
            )}

            {/* NGO Links */}
            {user?.role === 'NGO' && (
              <>
                <Link
                  to="/ngo/dashboard"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    isActive('/ngo/dashboard') ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  NGO Dashboard
                </Link>
                <Link
                  to="/request-food"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center transition ${
                    isActive('/request-food') ? 'bg-indigo-600 text-white font-semibold' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  <HeartHandshake className="w-4 h-4 mr-1.5" />
                  Post Food Request
                </Link>
              </>
            )}

            {/* Admin / System Operator Links */}
            {user?.role === 'ADMIN' && (
              <>
                <Link
                  to="/admin/dashboard"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    isActive('/admin/dashboard') ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Command Center
                </Link>
                <Link
                  to="/matching"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center transition ${
                    isActive('/matching') ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Cpu className="w-4 h-4 mr-1 text-emerald-600" />
                  AI Matching
                </Link>
                <Link
                  to="/deliveries"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center transition ${
                    isActive('/deliveries') ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Truck className="w-4 h-4 mr-1 text-indigo-600" />
                  Deliveries
                </Link>
                <Link
                  to="/reports"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center transition ${
                    isActive('/reports') ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 mr-1 text-teal-600" />
                  Reports
                </Link>
                <Link
                  to="/config"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center transition ${
                    isActive('/config') ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Sliders className="w-4 h-4 mr-1 text-slate-500" />
                  Weights
                </Link>
              </>
            )}

            {/* City Map link accessible to everyone */}
            <Link
              to="/map"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center transition ${
                isActive('/map') ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <MapPin className="w-4 h-4 mr-1 text-rose-500" />
              Live City Map
            </Link>
          </div>

          {/* Right Side: Notifications & Auth Controls */}
          <div className="hidden md:flex items-center space-x-3">
            
            {user ? (
              <>
                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition relative"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-fadeIn">
                      <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                        <div className="font-bold text-sm text-slate-800 flex items-center">
                          <Bell className="w-4 h-4 mr-1.5 text-emerald-600" />
                          Notifications ({unreadCount} new)
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-emerald-600 hover:text-emerald-800 font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-500">No notifications yet.</div>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} className={`p-3 text-xs hover:bg-slate-50 transition ${!n.is_read ? 'bg-emerald-50/40' : ''}`}>
                              <div className="font-semibold text-slate-900 mb-0.5">{n.title}</div>
                              <div className="text-slate-600 leading-relaxed">{n.message}</div>
                              <div className="text-[10px] text-slate-400 mt-1">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Role Tag & Name */}
                <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-800 truncate max-w-[130px]">{user.name}</div>
                    <div className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">{user.role}</div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/login?tab=register"
                  className="px-4 py-1.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">Overview</Link>
          <Link to="/map" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">City Map</Link>
          
          {user?.role === 'HOTEL' && (
            <>
              <Link to="/hotel/dashboard" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700">Hotel Dashboard</Link>
              <Link to="/donate" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-emerald-700 bg-emerald-50">Donate Food</Link>
            </>
          )}

          {user?.role === 'NGO' && (
            <>
              <Link to="/ngo/dashboard" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700">NGO Dashboard</Link>
              <Link to="/request-food" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-indigo-700 bg-indigo-50">Request Food</Link>
            </>
          )}

          {user?.role === 'ADMIN' && (
            <>
              <Link to="/admin/dashboard" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700">Command Center</Link>
              <Link to="/matching" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700">AI Matching</Link>
              <Link to="/deliveries" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700">Deliveries</Link>
              <Link to="/reports" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700">Reports</Link>
              <Link to="/config" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700">AI Weights</Link>
            </>
          )}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            {user ? (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="text-sm font-semibold text-rose-600"
              >
                Sign Out ({user.name})
              </button>
            ) : (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-emerald-600">
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
