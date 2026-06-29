// Pure display formatters — numbers, durations, dates. No side effects.

export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTH_ABBR = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** Thousands separators, e.g. 12345 -> "12,345". */
export function formatNumber(n) {
  return Number(n).toLocaleString('en-US');
}

/**
 * Humanize a millisecond duration:
 *   <1 min -> "under a minute"; seconds; "X min"; "X h Y min"; "X days Y h".
 */
export function formatDuration(ms) {
  const total = Math.max(0, Math.round(Number(ms)));
  const sec = Math.floor(total / 1000);
  if (sec < 60) {
    if (sec < 1) return 'under a minute';
    // Sub-minute but >=1s reads as seconds (e.g. "45 sec").
    return `${sec} sec`;
  }
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min`;
  const hours = Math.floor(min / 60);
  const remMin = min % 60;
  if (hours < 24) {
    return remMin > 0 ? `${hours} h ${remMin} min` : `${hours} h`;
  }
  const days = Math.floor(hours / 24);
  const remH = hours % 24;
  return remH > 0 ? `${days} days ${remH} h` : `${days} days`;
}

/** "12 Mar 2024". */
export function formatDate(d) {
  const date = d instanceof Date ? d : new Date(d);
  const day = date.getDate();
  const mon = MONTH_ABBR[date.getMonth()];
  return `${day} ${mon} ${date.getFullYear()}`;
}

/** "12 Mar 2024 – 28 Jun 2024" (en dash). */
export function formatDateRange(a, b) {
  return `${formatDate(a)} – ${formatDate(b)}`;
}

/** 1 -> "1st", 2 -> "2nd", 11 -> "11th", 21 -> "21st". */
export function ordinal(n) {
  const num = Number(n);
  const abs = Math.abs(num) % 100;
  const last = abs % 10;
  let suffix = 'th';
  if (abs < 11 || abs > 13) {
    if (last === 1) suffix = 'st';
    else if (last === 2) suffix = 'nd';
    else if (last === 3) suffix = 'rd';
  }
  return `${num}${suffix}`;
}
