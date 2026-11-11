import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, ShieldCheck, LogOut, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatDateDisplay } from '../utils/date';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [totalReadings, setTotalReadings] = useState(0);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.get('/readings?limit=1');
        if (res.success && res.data?.pagination) {
          setTotalReadings(res.data.pagination.totalRecords);
        }
      } catch (err) {
        console.error('Failed to load profile stats:', err);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="max-w-3xl space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          User Profile
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Account details and monitoring summary
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b border-slate-100">
          <div className="w-20 h-20 rounded-2xl bg-brand-600 text-white flex items-center justify-center text-3xl font-extrabold shadow-md shadow-brand-500/20">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div className="text-center sm:text-left flex-1">
            <h3 className="text-xl font-bold text-slate-900">{user?.name}</h3>
            <p className="text-sm text-slate-500 font-medium mt-0.5">{user?.email}</p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/70 rounded-full text-xs font-semibold mt-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Patient Account</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all flex items-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8">
          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50/70 border border-slate-100">
            <div className="w-10 h-10 rounded-lg bg-white text-slate-600 flex items-center justify-center shadow-sm">
              <User className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Full Name
              </p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                {user?.name || '—'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50/70 border border-slate-100">
            <div className="w-10 h-10 rounded-lg bg-white text-slate-600 flex items-center justify-center shadow-sm">
              <Mail className="w-5 h-5 text-medblue-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Email Address
              </p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                {user?.email || '—'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50/70 border border-slate-100">
            <div className="w-10 h-10 rounded-lg bg-white text-slate-600 flex items-center justify-center shadow-sm">
              <Calendar className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Account Created
              </p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                {user?.created_at ? formatDateDisplay(user.created_at.split('T')[0]) : 'Recent'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50/70 border border-slate-100">
            <div className="w-10 h-10 rounded-lg bg-white text-slate-600 flex items-center justify-center shadow-sm">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Readings
              </p>
              <p className="text-sm font-black text-slate-900 mt-0.5">
                {totalReadings} recorded
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
