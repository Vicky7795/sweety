import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  Calendar,
  ArrowRight,
  Edit2,
  Trash2,
  Clock,
  Sparkles
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getTodayString, formatDateDisplay, getGlucoseBadge } from '../utils/date';
import ReadingModal from '../components/ReadingModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import Toast from '../components/Toast';
import GlucoseChart from '../components/GlucoseChart';

export default function DashboardPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [todayReport, setTodayReport] = useState(null);
  const [allMonthReadings, setAllMonthReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingReading, setEditingReading] = useState(null);
  const [deletingReading, setDeletingReading] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch daily report for selected date
      const dailyRes = await api.get(`/reports/daily?date=${selectedDate}`);
      if (dailyRes.success) {
        setTodayReport(dailyRes.data);
      }

      // Fetch month-to-date readings for chart
      const mtdRes = await api.get(`/reports/month-to-date?date=${selectedDate}`);
      if (mtdRes.success) {
        setAllMonthReadings(mtdRes.data.readings || []);
      }
    } catch (err) {
      setToast({ message: err.message || 'Failed to load dashboard data', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleSaveReading = async (data) => {
    if (editingReading) {
      await api.put(`/readings/${editingReading.id}`, data);
      setToast({ message: 'Glucose reading updated successfully!', type: 'success' });
    } else {
      await api.post('/readings', data);
      setToast({ message: 'Glucose reading added successfully!', type: 'success' });
    }
    fetchDashboardData();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingReading) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/readings/${deletingReading.id}`);
      setToast({ message: 'Glucose reading deleted successfully!', type: 'success' });
      setDeletingReading(null);
      fetchDashboardData();
    } catch (err) {
      setToast({ message: err.message || 'Failed to delete reading', type: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const isToday = selectedDate === getTodayString();
  const readings = todayReport?.readings || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* A. Welcome Section & Quick Action */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Hello, {user?.name || 'User'}!
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Track your glucose levels and stay informed about your health.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingReading(null);
              setIsAddModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-sm shadow-brand-500/30 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Glucose Reading</span>
          </button>
        </div>
      </div>

      {/* B. Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Readings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {isToday ? "Today's Readings" : 'Total Readings'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">
            {loading ? '-' : todayReport?.totalReadings ?? 0}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Max 4 readings per day
          </p>
        </div>

        {/* Highest Reading */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Highest Glucose
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">
            {loading ? '-' : todayReport?.highestReading !== null ? `${todayReport.highestReading}` : '—'}
            {todayReport?.highestReading !== null && (
              <span className="text-xs font-semibold text-slate-400 ml-1">mg/dl</span>
            )}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Peak blood sugar
          </p>
        </div>

        {/* Lowest Reading */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Lowest Glucose
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">
            {loading ? '-' : todayReport?.lowestReading !== null ? `${todayReport.lowestReading}` : '—'}
            {todayReport?.lowestReading !== null && (
              <span className="text-xs font-semibold text-slate-400 ml-1">mg/dl</span>
            )}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Baseline blood sugar
          </p>
        </div>

        {/* Average Reading */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Average Glucose
            </span>
            <div className="w-8 h-8 rounded-lg bg-medblue-50 text-medblue-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">
            {loading ? '-' : todayReport?.averageReading !== null ? `${todayReport.averageReading}` : '—'}
            {todayReport?.averageReading !== null && (
              <span className="text-xs font-semibold text-slate-400 ml-1">mg/dl</span>
            )}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Rounded to 1 decimal place
          </p>
        </div>
      </div>

      {/* Main Grid: Readings & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* C. Readings for Selected Date (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isToday ? "Today's Readings" : `Readings for ${formatDateDisplay(selectedDate)}`}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Up to 4 time slots per day
              </p>
            </div>

            {/* Date Selector */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                max={getTodayString()}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div className="p-6 flex-1 flex flex-col">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-600 rounded-full animate-spin" />
                <p className="text-xs font-medium">Loading readings...</p>
              </div>
            ) : readings.length === 0 ? (
              /* F. Empty State */
              <div className="flex-1 py-12 flex flex-col items-center justify-center text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                  <Activity className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  No glucose readings recorded yet.
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  No glucose readings recorded yet. Add your first reading to get started.
                </p>
                <button
                  onClick={() => {
                    setEditingReading(null);
                    setIsAddModalOpen(true);
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Reading</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {readings.map((reading) => {
                  const badge = getGlucoseBadge(reading.time_slot, reading.glucose_value);
                  return (
                    <div
                      key={reading.id}
                      className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/50 px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                          <Clock className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {reading.time_slot}
                          </p>
                          <p className="text-xs text-slate-400">
                            Recorded on {reading.reading_date}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-base font-extrabold text-slate-900 leading-tight">
                            {reading.glucose_value}{' '}
                            <span className="text-xs font-normal text-slate-400">mg/dl</span>
                          </p>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border mt-0.5 ${badge.bg}`}
                          >
                            {badge.label}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 border-l border-slate-100 pl-3">
                          <button
                            onClick={() => {
                              setEditingReading(reading);
                              setIsAddModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                            title="Edit reading"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingReading(reading)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete reading"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Reports Navigation & Chart Summary */}
        <div className="space-y-6">
          {/* E. Reports Navigation Card */}
          <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-6 text-white shadow-sm shadow-brand-500/20">
            <h3 className="text-base font-bold">Health Reports</h3>
            <p className="text-xs text-brand-100 mt-1 leading-relaxed">
              Explore your comprehensive Daily, Month-to-Date, and Monthly analytical reports.
            </p>
            <div className="mt-5 space-y-2">
              <Link
                to="/reports?tab=daily"
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all"
              >
                <span>Daily Report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/reports?tab=month-to-date"
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all"
              >
                <span>Month-to-Date Report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/reports?tab=monthly"
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all"
              >
                <span>Previous Month Report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Quick Clinical Guidelines Reference */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Standard Clinical Targets
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/60 text-emerald-800 border border-emerald-100">
                <span className="font-semibold">Fasting Target</span>
                <span className="font-bold">70 – 99 mg/dl</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50/60 text-blue-800 border border-blue-100">
                <span className="font-semibold">Post-Meal Target</span>
                <span className="font-bold">&lt; 140 mg/dl</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50/60 text-rose-800 border border-rose-100">
                <span className="font-semibold">High / Alert</span>
                <span className="font-bold">&gt; 180 mg/dl</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bonus 2: Glucose Trend Chart */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Monthly Glucose Trend</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Fluctuations across your recorded time slots this month
            </p>
          </div>
          <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200/60">
            {allMonthReadings.length} readings
          </span>
        </div>
        <GlucoseChart readings={allMonthReadings} />
      </div>

      {/* Add / Edit Modal */}
      <ReadingModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingReading(null);
        }}
        onSave={handleSaveReading}
        initialData={editingReading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingReading}
        onClose={() => setDeletingReading(null)}
        onConfirm={handleDeleteConfirm}
        reading={deletingReading}
        loading={deleteLoading}
      />
    </div>
  );
}
