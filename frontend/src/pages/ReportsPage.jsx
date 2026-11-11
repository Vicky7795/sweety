import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Layers,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  FileText,
  CalendarRange,
  ChevronRight
} from 'lucide-react';
import api from '../services/api';
import { getTodayString, formatDateDisplay, getGlucoseBadge } from '../utils/date';
import Toast from '../components/Toast';

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'daily';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedDate, setSelectedDate] = useState(getTodayString());

  const [dailyData, setDailyData] = useState(null);
  const [mtdData, setMtdData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const [dailyRes, mtdRes, monthlyRes] = await Promise.all([
        api.get(`/reports/daily?date=${selectedDate}`),
        api.get(`/reports/month-to-date?date=${selectedDate}`),
        api.get(`/reports/monthly?date=${selectedDate}`),
      ]);

      if (dailyRes.success) setDailyData(dailyRes.data);
      if (mtdRes.success) setMtdData(mtdRes.data);
      if (monthlyRes.success) setMonthlyData(monthlyRes.data);
    } catch (err) {
      setToast({ message: err.message || 'Failed to fetch reports', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const renderStatsCards = (data, rangeLabel) => {
    const hasReadings = data && data.totalReadings > 0;

    return (
      <div className="space-y-6">
        {/* Date Range Subtitle */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100/70 py-2 px-3.5 rounded-xl self-start inline-flex">
          <CalendarRange className="w-4 h-4 text-brand-600" />
          <span>Active Period: <strong className="text-slate-800">{rangeLabel}</strong></span>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Total Readings */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Readings
              </span>
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900">
              {loading ? '-' : data?.totalReadings ?? 0}
            </p>
            <p className="text-xs text-slate-400 mt-1">Number of records in period</p>
          </div>

          {/* Highest Reading */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Highest Reading
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900">
              {loading ? '-' : hasReadings ? `${data.highestReading}` : '—'}
              {hasReadings && (
                <span className="text-xs font-semibold text-slate-400 ml-1">mg/dl</span>
              )}
            </p>
            <p className="text-xs text-slate-400 mt-1">Maximum glucose level</p>
          </div>

          {/* Lowest Reading */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Lowest Reading
              </span>
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900">
              {loading ? '-' : hasReadings ? `${data.lowestReading}` : '—'}
              {hasReadings && (
                <span className="text-xs font-semibold text-slate-400 ml-1">mg/dl</span>
              )}
            </p>
            <p className="text-xs text-slate-400 mt-1">Minimum glucose level</p>
          </div>

          {/* Average Reading */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Average Reading
              </span>
              <div className="w-8 h-8 rounded-lg bg-medblue-50 text-medblue-600 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900">
              {loading ? '-' : hasReadings ? `${data.averageReading}` : '—'}
              {hasReadings && (
                <span className="text-xs font-semibold text-slate-400 ml-1">mg/dl</span>
              )}
            </p>
            <p className="text-xs text-slate-400 mt-1">Rounded to 1 decimal place</p>
          </div>
        </div>

        {!hasReadings && !loading && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <Activity className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              No readings in this reporting period
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              There are no glucose measurements logged for this date range.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* Header & Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Health Reports & Analytics
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Statistical breakdown of your glucose readings across three standard periods
          </p>
        </div>

        {/* Global Reference Date Selector */}
        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-brand-600" />
          <span className="text-xs font-bold text-slate-700">Reference Date:</span>
          <input
            type="date"
            max={getTodayString()}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => handleTabChange('daily')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'daily'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Report A: Daily</span>
        </button>

        <button
          onClick={() => handleTabChange('month-to-date')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'month-to-date'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarRange className="w-4 h-4" />
          <span>Report B: Month-to-Date</span>
        </button>

        <button
          onClick={() => handleTabChange('monthly')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'monthly'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Report C: Previous Month</span>
        </button>
      </div>

      {/* Tab 1: Daily Report */}
      {activeTab === 'daily' && (
        <div className="space-y-6 animate-in fade-in">
          {renderStatsCards(
            dailyData,
            `Selected Date: ${formatDateDisplay(selectedDate)} (${selectedDate})`
          )}

          {/* Individual Readings for the selected date */}
          {dailyData && dailyData.readings && dailyData.readings.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-900">
                  Daily Reading Records for {formatDateDisplay(selectedDate)}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed readings and timing for each slot
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {dailyData.readings.map((reading) => {
                  const badge = getGlucoseBadge(reading.time_slot, reading.glucose_value);
                  return (
                    <div
                      key={reading.id}
                      className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {reading.time_slot}
                          </p>
                          <p className="text-xs text-slate-400">
                            Reading ID #{reading.id}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-base font-black text-slate-900">
                          {reading.glucose_value}{' '}
                          <span className="text-xs font-normal text-slate-400">mg/dl</span>
                        </p>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border mt-0.5 ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Month-to-Date Report */}
      {activeTab === 'month-to-date' && (
        <div className="space-y-6 animate-in fade-in">
          {renderStatsCards(
            mtdData,
            mtdData?.dateRange
              ? `${formatDateDisplay(mtdData.dateRange.startDate)} – ${formatDateDisplay(mtdData.dateRange.endDate)}`
              : 'Current Month to Date'
          )}
        </div>
      )}

      {/* Tab 3: Monthly (Previous Calendar Month) Report */}
      {activeTab === 'monthly' && (
        <div className="space-y-6 animate-in fade-in">
          {renderStatsCards(
            monthlyData,
            monthlyData?.dateRange
              ? `${formatDateDisplay(monthlyData.dateRange.startDate)} – ${formatDateDisplay(monthlyData.dateRange.endDate)} (${monthlyData.previousMonth?.daysInMonth || 30} days)`
              : 'Entire Previous Month'
          )}
        </div>
      )}
    </div>
  );
}
