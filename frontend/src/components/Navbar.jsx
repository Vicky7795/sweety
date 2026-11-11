import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, User, LogOut, Activity, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onMobileMenuToggle }) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-sm">
      {/* Left: Mobile menu button & brand for mobile */}
      <div className="flex items-center gap-3 lg:hidden">
        <button
          onClick={onMobileMenuToggle}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-600">
            <Activity className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-900 text-lg">Sweety</span>
        </Link>
      </div>

      {/* Center placeholder / Desktop Breadcrumb */}
      <div className="hidden lg:block text-xs font-semibold uppercase tracking-wider text-slate-600">
        Healthcare Portal • Blood Glucose Management
      </div>

      {/* Right: User Profile & Actions */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-3 p-1.5 sm:px-3 sm:py-2 rounded-xl text-slate-700 hover:bg-slate-100/80 transition-colors focus:outline-none"
        >
          <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-slate-800 leading-none">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-600 leading-none mt-1">{user?.email || ''}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-600 hidden sm:block" />
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setDropdownOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-20 animate-in fade-in zoom-in-95">
              <div className="px-4 py-2 border-b border-slate-100 sm:hidden">
                <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-600 truncate">{user?.email}</p>
              </div>
              <Link
                to="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-700 font-medium"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>My Profile</span>
              </Link>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
