const db = require('../config/db');
const {
  formatDateString,
  getTodayString,
  getMonthToDateRange,
  getPreviousMonthRange,
  roundToOneDecimal
} = require('../utils/dateUtils');

function calculateStats(readings) {
  if (!readings || readings.length === 0) {
    return {
      totalReadings: 0,
      highestReading: null,
      lowestReading: null,
      averageReading: null
    };
  }

  const values = readings.map(r => r.glucose_value);
  const highest = Math.max(...values);
  const lowest = Math.min(...values);
  const sum = values.reduce((acc, val) => acc + val, 0);
  const avg = roundToOneDecimal(sum / values.length);

  return {
    totalReadings: readings.length,
    highestReading: highest,
    lowestReading: lowest,
    averageReading: avg
  };
}

async function getDailyReport(userId, dateStr) {
  const targetDate = formatDateString(dateStr) || getTodayString();
  const result = await db.query(
    'SELECT * FROM readings WHERE user_id = $1 AND reading_date = $2 ORDER BY id ASC',
    [userId, targetDate]
  );

  const readings = result.rows.map(r => ({
    ...r,
    reading_date: formatDateString(r.reading_date)
  }));

  const stats = calculateStats(readings);

  return {
    reportType: 'DAILY',
    date: targetDate,
    dateRange: {
      startDate: targetDate,
      endDate: targetDate
    },
    ...stats,
    readings
  };
}

async function getMonthToDateReport(userId, dateStr) {
  const targetDate = formatDateString(dateStr) || getTodayString();
  const range = getMonthToDateRange(targetDate);

  const result = await db.query(
    'SELECT * FROM readings WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3 ORDER BY reading_date ASC, id ASC',
    [userId, range.startDate, range.endDate]
  );

  const readings = result.rows.map(r => ({
    ...r,
    reading_date: formatDateString(r.reading_date)
  }));

  const stats = calculateStats(readings);

  return {
    reportType: 'MONTH_TO_DATE',
    targetDate,
    dateRange: range,
    ...stats,
    readings
  };
}

async function getMonthlyReport(userId, dateStr) {
  const targetDate = formatDateString(dateStr) || getTodayString();
  const range = getPreviousMonthRange(targetDate);

  const result = await db.query(
    'SELECT * FROM readings WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3 ORDER BY reading_date ASC, id ASC',
    [userId, range.startDate, range.endDate]
  );

  const readings = result.rows.map(r => ({
    ...r,
    reading_date: formatDateString(r.reading_date)
  }));

  const stats = calculateStats(readings);

  return {
    reportType: 'MONTHLY_PREVIOUS_MONTH',
    targetDate,
    previousMonth: {
      year: range.year,
      month: range.month,
      daysInMonth: range.daysInMonth
    },
    dateRange: {
      startDate: range.startDate,
      endDate: range.endDate
    },
    ...stats,
    readings
  };
}

module.exports = {
  getDailyReport,
  getMonthToDateReport,
  getMonthlyReport
};
