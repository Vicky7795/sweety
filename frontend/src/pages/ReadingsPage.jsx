import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Activity,
  Layers
} from 'lucide-react';
import api from '../services/api';
import { formatDateDisplay, getGlucoseBadge, getTodayString } from '../utils/date';
import ReadingModal from '../components/ReadingModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import Toast from '../components/Toast';

export default function ReadingsPage() {
  const [readings, setReadings] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 1
  });
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReading, setEditingReading] = useState(null);
  const [deletingReading, setDeletingReading] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchReadings = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      let url = `/readings?page=${page}&limit=${pagination.limit}`;
      if (dateFilter) {
        url += `&date=${dateFilter}`;
      }
      const res = await api.get(url);
      if (res.success && res.data) {
        setReadings(res.data.readings || []);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setToast({ message: err.message || 'Failed to load readings.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [dateFilter, pagination.limit]);

  useEffect(() => {
    fetchReadings(1);
  }, [fetchReadings]);

  const handleSaveReading = async (data) => {
    if (editingReading) {
      await api.put(`/readings/${editingReading.id}`, data);
      setToast({ message: 'Glucose reading updated successfully!', type: 'success' });
    } else {
      await api.post('/readings', data);
      setToast({ message: 'Glucose reading created successfully!', type: 'success' });
    }
    fetchReadings(pagination.currentPage);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingReading) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/readings/${deletingReading.id}`);
      setToast({ message: 'Glucose reading deleted successfully!', type: 'success' });
      setDeletingReading(null);
      fetchReadings(pagination.currentPage);
    } catch (err) {
      setToast({ message: err.message || 'Failed to delete reading.', type: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            My Glucose Readings
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Log and review your complete blood glucose history
          </p>
        </div>

        <button
          onClick={() => {
            setEditingReading(null);
            setIsModalOpen(true);
          }}
          className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-sm shadow-brand-500/30 transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Glucose Reading</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-600">Filter by Date:</span>
          </div>
          <input
            type="date"
            max={getTodayString()}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 text-xs font-semibold flex items-center gap-1"
              title="Reset date filter"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        <span className="text-xs font-semibold text-slate-400">
          Showing {readings.length} of {pagination.totalRecords} total records
        </span>
      </div>

      {/* Readings Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-600 rounded-full animate-spin" />
            <p className="text-xs font-medium">Loading readings...</p>
          </div>
        ) : readings.length === 0 ? (
          /* Empty State */
          <div className="py-20 flex flex-col items-center justify-center text-center px-4">
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
                setIsModalOpen(true);
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Glucose Reading</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4 sm:px-6">Date</th>
                  <th className="py-3 px-4 sm:px-6">Time Slot</th>
                  <th className="py-3 px-4 sm:px-6">Glucose Value</th>
                  <th className="py-3 px-4 sm:px-6">Clinical Status</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {readings.map((reading) => {
                  const badge = getGlucoseBadge(reading.time_slot, reading.glucose_value);
                  return (
                    <tr
                      key={reading.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-800">
                        {formatDateDisplay(reading.reading_date)}
                        <span className="block text-[11px] text-slate-400 font-normal">
                          {reading.reading_date}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-slate-700 font-medium">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{reading.time_slot}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6">
                        <span className="font-extrabold text-slate-900 text-base">
                          {reading.glucose_value}
                        </span>{' '}
                        <span className="text-xs text-slate-400">mg/dl</span>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingReading(reading);
                              setIsModalOpen(true);
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Toolbar */}
        {!loading && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <p className="text-xs text-slate-500 font-medium">
              Page <span className="font-bold text-slate-800">{pagination.currentPage}</span> of{' '}
              <span className="font-bold text-slate-800">{pagination.totalPages}</span>
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchReadings(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => fetchReadings(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.totalPages}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <ReadingModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
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
