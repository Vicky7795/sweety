import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Activity, AlertCircle } from 'lucide-react';
import { TIME_SLOTS, getTodayString } from '../utils/date';

export default function ReadingModal({ isOpen, onClose, onSave, initialData = null }) {
  const [readingDate, setReadingDate] = useState(getTodayString());
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);
  const [glucoseValue, setGlucoseValue] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setReadingDate(initialData.reading_date || getTodayString());
      setTimeSlot(initialData.time_slot || TIME_SLOTS[0]);
      setGlucoseValue(String(initialData.glucose_value || ''));
    } else {
      setReadingDate(getTodayString());
      setTimeSlot(TIME_SLOTS[0]);
      setGlucoseValue('');
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    // RULE 1: Value is required
    if (glucoseValue === undefined || glucoseValue === null || String(glucoseValue).trim() === '') {
      setError('Please enter a glucose value.');
      return false;
    }

    // RULE 2: Value must be a whole number between 40 and 600
    const strVal = String(glucoseValue).trim();
    const num = Number(strVal);
    const isWhole = Number.isInteger(num) && !strVal.includes('.');

    if (isNaN(num) || !isWhole || num < 40 || num > 600) {
      setError('Value must be between 40 and 600 mg/dl.');
      return false;
    }

    // RULE 5: Date cannot be in the future
    const today = getTodayString();
    if (readingDate > today) {
      setError('Date cannot be in the future.');
      return false;
    }

    if (!timeSlot || !TIME_SLOTS.includes(timeSlot)) {
      setError('Please select a valid time slot.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        reading_date: readingDate,
        time_slot: timeSlot,
        glucose_value: parseInt(glucoseValue, 10),
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save glucose reading.');
    } finally {
      setSubmitting(false);
    }
  };

  const isEditing = !!initialData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isEditing ? 'Edit Glucose Reading' : 'Add Glucose Reading'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your blood glucose level and timing
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Reading Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Reading Date
            </label>
            <div className="relative">
              <input
                type="date"
                max={getTodayString()}
                value={readingDate}
                onChange={(e) => setReadingDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                required
              />
            </div>
          </div>

          {/* Time Slot Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Time Slot
            </label>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            >
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>

          {/* Glucose Value Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Glucose Value (mg/dl)
            </label>
            <div className="relative">
              <input
                type="number"
                step="1"
                placeholder="e.g. 110"
                value={glucoseValue}
                onChange={(e) => setGlucoseValue(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                mg/dl
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              Must be a whole number between 40 and 600 mg/dl.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-sm shadow-brand-500/30 transition-all disabled:opacity-60 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? 'Update Reading' : 'Save Reading'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
