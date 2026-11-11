/**
 * Date utility functions for Sweety Blood Glucose Tracker.
 * Strict date formatting to prevent timezone shifts.
 */

// Format any date or string into YYYY-MM-DD
function formatDateString(input) {
  if (!input) return null;
  if (typeof input === 'string') {
    // If it's already YYYY-MM-DD or ISO
    return input.split('T')[0];
  }
  const d = new Date(input);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get today's local date as YYYY-MM-DD
function getTodayString() {
  return formatDateString(new Date());
}

// Check if a date string YYYY-MM-DD is in the future relative to today
function isFutureDate(dateStr) {
  const target = formatDateString(dateStr);
  const today = getTodayString();
  return target > today;
}

// Get Month-to-Date range: 1st of month to selected date
function getMonthToDateRange(dateStr) {
  const target = formatDateString(dateStr) || getTodayString();
  const [year, month] = target.split('-');
  const startDate = `${year}-${month}-01`;
  return {
    startDate,
    endDate: target
  };
}

// Get previous calendar month range relative to selected date
// Properly handles year wrap-around and leap years
function getPreviousMonthRange(dateStr) {
  const target = formatDateString(dateStr) || getTodayString();
  const [yearStr, monthStr] = target.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10); // 1-12

  // Previous month
  let prevMonth = month - 1;
  let prevYear = year;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear = year - 1;
  }

  const prevMonthStr = String(prevMonth).padStart(2, '0');
  const startDate = `${prevYear}-${prevMonthStr}-01`;

  // Number of days in previous month: Day 0 of next month gives last day of prev month
  const lastDayDate = new Date(prevYear, prevMonth, 0);
  const lastDay = String(lastDayDate.getDate()).padStart(2, '0');
  const endDate = `${prevYear}-${prevMonthStr}-${lastDay}`;

  return {
    startDate,
    endDate,
    year: prevYear,
    month: prevMonth,
    daysInMonth: lastDayDate.getDate()
  };
}

// Round average to exactly one decimal place
function roundToOneDecimal(num) {
  if (num === null || num === undefined || isNaN(num)) return 0;
  return Math.round(Number(num) * 10) / 10;
}

module.exports = {
  formatDateString,
  getTodayString,
  isFutureDate,
  getMonthToDateRange,
  getPreviousMonthRange,
  roundToOneDecimal
};
