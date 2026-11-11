export const TIME_SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner'
];

export function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const d = new Date(year, parseInt(month, 10) - 1, day);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function getGlucoseBadge(slot, value) {
  const isFasting = slot.includes('fasting');
  if (isFasting) {
    if (value < 70) return { label: 'Low', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (value <= 99) return { label: 'Normal', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (value <= 125) return { label: 'Elevated', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: 'High', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
  } else {
    if (value < 70) return { label: 'Low', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (value < 140) return { label: 'Normal', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (value < 200) return { label: 'Elevated', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: 'High', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
  }
}
