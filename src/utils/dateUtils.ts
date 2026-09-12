export const APP_REFERENCE_DATE = new Date(2026, 8, 11); // September 11, 2026

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface CalendarDay {
  date: Date;
  dateKey: string; // 'YYYY-MM-DD'
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
}

/**
 * Normalizes any string representation of a booking date into a Date object.
 */
export function parseBookingDate(scheduledDate: string, scheduledIso?: string): Date | null {
  if (scheduledIso) {
    const parts = scheduledIso.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month, day);
      }
    }
  }

  const raw = scheduledDate.trim().toLowerCase();
  
  if (raw === 'today' || raw.startsWith('today')) {
    return new Date(APP_REFERENCE_DATE.getFullYear(), APP_REFERENCE_DATE.getMonth(), APP_REFERENCE_DATE.getDate());
  }
  if (raw === 'tomorrow' || raw.startsWith('tomorrow')) {
    const d = new Date(APP_REFERENCE_DATE);
    d.setDate(d.getDate() + 1);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  if (raw === 'yesterday' || raw.startsWith('yesterday')) {
    const d = new Date(APP_REFERENCE_DATE);
    d.setDate(d.getDate() - 1);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  const monthMap: Record<string, number> = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11
  };

  const match = raw.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|september|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?/i);
  if (match) {
    const monthKey = match[1].toLowerCase();
    const month = monthMap[monthKey] ?? 8;
    const day = parseInt(match[2], 10);
    const year = match[3] ? parseInt(match[3], 10) : 2026;
    return new Date(year, month, day);
  }

  const parsed = Date.parse(scheduledDate);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  return null;
}

/**
 * Returns 'YYYY-MM-DD' key for date grouping.
 */
export function getDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Checks if two dates represent the same calendar day.
 */
export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Generates the full 35 or 42 grid cells for a given month and year.
 */
export function getCalendarGrid(year: number, month: number): CalendarDay[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
  const totalDaysInMonth = lastDayOfMonth.getDate();

  const days: CalendarDay[] = [];

  // Previous month padding days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const prevDate = new Date(year, month - 1, prevMonthLastDay - i);
    days.push({
      date: prevDate,
      dateKey: getDateKey(prevDate),
      dayNumber: prevDate.getDate(),
      isCurrentMonth: false,
      isToday: isSameDay(prevDate, APP_REFERENCE_DATE),
      isPast: prevDate < APP_REFERENCE_DATE && !isSameDay(prevDate, APP_REFERENCE_DATE)
    });
  }

  // Current month days
  for (let i = 1; i <= totalDaysInMonth; i++) {
    const currentDate = new Date(year, month, i);
    days.push({
      date: currentDate,
      dateKey: getDateKey(currentDate),
      dayNumber: i,
      isCurrentMonth: true,
      isToday: isSameDay(currentDate, APP_REFERENCE_DATE),
      isPast: currentDate < APP_REFERENCE_DATE && !isSameDay(currentDate, APP_REFERENCE_DATE)
    });
  }

  // Next month padding days to round up to full weeks (35 or 42 cells)
  const remainingCells = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    const nextDate = new Date(year, month + 1, i);
    days.push({
      date: nextDate,
      dateKey: getDateKey(nextDate),
      dayNumber: i,
      isCurrentMonth: false,
      isToday: isSameDay(nextDate, APP_REFERENCE_DATE),
      isPast: nextDate < APP_REFERENCE_DATE && !isSameDay(nextDate, APP_REFERENCE_DATE)
    });
  }

  return days;
}

/**
 * Format a Date for header display: e.g. "Friday, September 11, 2026"
 */
export function formatFullDate(date: Date): string {
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
  const monthName = MONTH_NAMES[date.getMonth()];
  return `${dayName}, ${monthName} ${date.getDate()}, ${date.getFullYear()}`;
}

/**
 * Parses time string like "2:00 PM", "10:30 AM", "14:00" into minutes from midnight (0 - 1439).
 */
export function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const match = timeStr.trim().match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = match[3]?.toLowerCase();

  if (meridiem === 'pm' && hours < 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

/**
 * Formats minutes from midnight into a clean 12-hour time string like "2:00 PM".
 */
export function formatMinutesToTime(totalMinutes: number): string {
  const normalized = Math.max(0, Math.min(1439, totalMinutes));
  const hours24 = Math.floor(normalized / 60) % 24;
  const mins = normalized % 60;
  const meridiem = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const minStr = mins < 10 ? `0${mins}` : mins;
  return `${hours12}:${minStr} ${meridiem}`;
}
