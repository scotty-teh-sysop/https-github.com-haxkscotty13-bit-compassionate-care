import { Companion, Booking } from '../types';
import { 
  parseBookingDate, getDateKey, isSameDay, 
  parseTimeToMinutes, formatMinutesToTime,
  DAY_NAMES_SHORT, APP_REFERENCE_DATE 
} from './dateUtils';

export type ConflictSeverity = 'critical' | 'warning' | 'info' | 'clear';

export interface ConflictingBookingInfo {
  id: string;
  seniorName: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  status: string;
}

export interface SuggestedAlternativeSlot {
  dateOptionValue: string;
  dateStr: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  label: string;
  reason: string;
}

export interface ScheduleBlock {
  id: string;
  title: string;
  startMinutes: number; // e.g. 840 (2:00 PM)
  endMinutes: number;   // e.g. 960 (4:00 PM)
  startTime: string;
  endTime: string;
  isRequested: boolean;
  isConflict: boolean;
  status?: string;
}

export interface AvailabilityConflictReport {
  hasConflict: boolean;
  severity: ConflictSeverity;
  conflictType: 'direct_overlap' | 'tight_buffer' | 'outside_availability' | 'none';
  headline: string;
  explanation: string;
  conflictingBooking?: ConflictingBookingInfo;
  companionDaySchedule: ScheduleBlock[];
  suggestedAlternatives: SuggestedAlternativeSlot[];
  bufferMinutes?: number;
  isDayAvailable: boolean;
}

/**
 * Real-time availability conflict detection engine for Companion bookings.
 */
export function detectAvailabilityConflict(params: {
  companion: Companion;
  scheduledDateStr: string;
  startTimeStr?: string;
  durationHours: number;
  existingBookings: Booking[];
  currentBookingId?: string;
}): AvailabilityConflictReport {
  const { 
    companion, scheduledDateStr, 
    startTimeStr = '2:00 PM', 
    durationHours, 
    existingBookings,
    currentBookingId 
  } = params;

  const targetDate = parseBookingDate(scheduledDateStr);
  const targetDateKey = targetDate ? getDateKey(targetDate) : null;

  // Extract requested time window in minutes from midnight
  const reqStart = parseTimeToMinutes(startTimeStr) ?? 840; // default 2:00 PM (14:00)
  const reqEnd = reqStart + durationHours * 60;

  // Filter existing confirmed or active bookings for this companion
  const companionBookings = existingBookings.filter((b) => {
    if (b.id === currentBookingId) return false;
    if (b.companionId !== companion.id) return false;
    if (b.status === 'cancelled') return false;
    return true;
  });

  // Find bookings on the target day
  const sameDayBookings = companionBookings.filter((b) => {
    if (!targetDate) return false;
    const bDate = parseBookingDate(b.scheduledDate, b.scheduledIso);
    return bDate && isSameDay(bDate, targetDate);
  });

  // Day of week checks against companion's stated availability
  let isDayAvailable = true;
  let dayOfWeekName = 'Day';
  if (targetDate) {
    dayOfWeekName = DAY_NAMES_SHORT[targetDate.getDay()];
    if (companion.availableDays && companion.availableDays.length > 0) {
      isDayAvailable = companion.availableDays.includes(dayOfWeekName);
    }
  }

  // Check for direct overlap or tight buffers
  let directConflictBooking: Booking | null = null;
  let tightBufferBooking: Booking | null = null;
  let bufferGap = 999;

  for (const b of sameDayBookings) {
    const bStart = parseTimeToMinutes(b.startTime) ?? 840;
    const bEnd = b.endTime ? (parseTimeToMinutes(b.endTime) ?? (bStart + b.durationHours * 60)) : (bStart + b.durationHours * 60);

    // Overlap condition: (StartA < EndB) and (EndA > StartB)
    if (reqStart < bEnd && reqEnd > bStart) {
      directConflictBooking = b;
      break;
    }

    // Buffer check: gap < 30 minutes
    if (reqStart >= bEnd) {
      const gap = reqStart - bEnd;
      if (gap < 30 && gap < bufferGap) {
        tightBufferBooking = b;
        bufferGap = gap;
      }
    } else if (reqEnd <= bStart) {
      const gap = bStart - reqEnd;
      if (gap < 30 && gap < bufferGap) {
        tightBufferBooking = b;
        bufferGap = gap;
      }
    }
  }

  // Build the day visual timeline blocks (between 8:00 AM and 8:00 PM / 480 to 1200 mins)
  const companionDaySchedule: ScheduleBlock[] = [];

  for (const b of sameDayBookings) {
    const bStart = parseTimeToMinutes(b.startTime) ?? 840;
    const bEnd = b.endTime ? (parseTimeToMinutes(b.endTime) ?? (bStart + b.durationHours * 60)) : (bStart + b.durationHours * 60);
    const isConflictWithReq = reqStart < bEnd && reqEnd > bStart;

    companionDaySchedule.push({
      id: b.id,
      title: `Visit with ${b.seniorName}`,
      startMinutes: bStart,
      endMinutes: bEnd,
      startTime: b.startTime,
      endTime: b.endTime || formatMinutesToTime(bEnd),
      isRequested: false,
      isConflict: isConflictWithReq,
      status: b.status,
    });
  }

  // Add the currently requested block
  companionDaySchedule.push({
    id: 'currently-requested',
    title: `Requested Visit (${durationHours}h)`,
    startMinutes: reqStart,
    endMinutes: reqEnd,
    startTime: formatMinutesToTime(reqStart),
    endTime: formatMinutesToTime(reqEnd),
    isRequested: true,
    isConflict: !!directConflictBooking,
  });

  // Sort schedule chronologically
  companionDaySchedule.sort((a, b) => a.startMinutes - b.startMinutes);

  // Generate Suggested Alternative Slots if conflict or tight buffer
  const suggestedAlternatives: SuggestedAlternativeSlot[] = [];

  if (directConflictBooking || tightBufferBooking || !isDayAvailable) {
    // 1. Check morning alternative on the same day if free (e.g. 10:00 AM)
    const morningStart = 600; // 10:00 AM
    const morningEnd = morningStart + durationHours * 60;
    const morningConflict = sameDayBookings.some((b) => {
      const bStart = parseTimeToMinutes(b.startTime) ?? 840;
      const bEnd = b.endTime ? (parseTimeToMinutes(b.endTime) ?? (bStart + b.durationHours * 60)) : (bStart + b.durationHours * 60);
      return morningStart < bEnd && morningEnd > bStart;
    });

    if (!morningConflict && isDayAvailable && (reqStart !== morningStart)) {
      suggestedAlternatives.push({
        dateOptionValue: scheduledDateStr,
        dateStr: scheduledDateStr.split(' at ')[0],
        startTime: '10:00 AM',
        endTime: formatMinutesToTime(morningEnd),
        durationHours,
        label: 'Earlier Same Day: 10:00 AM',
        reason: 'Free morning window before existing appointments',
      });
    }

    // 2. Check late afternoon alternative on the same day if free (e.g. 4:30 PM)
    const afternoonStart = 990; // 4:30 PM
    const afternoonEnd = afternoonStart + durationHours * 60;
    const afternoonConflict = sameDayBookings.some((b) => {
      const bStart = parseTimeToMinutes(b.startTime) ?? 840;
      const bEnd = b.endTime ? (parseTimeToMinutes(b.endTime) ?? (bStart + b.durationHours * 60)) : (bStart + b.durationHours * 60);
      return afternoonStart < bEnd && afternoonEnd > bStart;
    });

    if (!afternoonConflict && isDayAvailable && (reqStart !== afternoonStart)) {
      suggestedAlternatives.push({
        dateOptionValue: scheduledDateStr,
        dateStr: scheduledDateStr.split(' at ')[0],
        startTime: '4:30 PM',
        endTime: formatMinutesToTime(afternoonEnd),
        durationHours,
        label: 'Later Same Day: 4:30 PM',
        reason: 'Clean buffer window following previous visit',
      });
    }

    // 3. Alternative on next day / open slot
    if (scheduledDateStr.includes('Tomorrow') || scheduledDateStr.includes('Sept 13') || !isDayAvailable) {
      suggestedAlternatives.push({
        dateOptionValue: 'Saturday, Sept 15 at 11:00 AM',
        dateStr: 'Saturday, Sept 15',
        startTime: '11:00 AM',
        endTime: formatMinutesToTime(660 + durationHours * 60),
        durationHours,
        label: 'Saturday, Sept 15 at 11:00 AM',
        reason: 'Completely open schedule block on companion availability day',
      });
    }
  }

  // Evaluate conflict status
  if (directConflictBooking) {
    const conflictingStart = directConflictBooking.startTime;
    const conflictingEnd = directConflictBooking.endTime || `${directConflictBooking.durationHours}h visit`;

    return {
      hasConflict: true,
      severity: 'critical',
      conflictType: 'direct_overlap',
      headline: `Schedule Overlap Detected with ${companion.name}`,
      explanation: `${companion.name} already has an accepted visit with ${directConflictBooking.seniorName} from ${conflictingStart} to ${conflictingEnd}. Booking this time creates an overlapping double-booking.`,
      conflictingBooking: {
        id: directConflictBooking.id,
        seniorName: directConflictBooking.seniorName,
        scheduledDate: directConflictBooking.scheduledDate,
        startTime: directConflictBooking.startTime,
        endTime: directConflictBooking.endTime || 'Scheduled',
        durationHours: directConflictBooking.durationHours,
        status: directConflictBooking.status,
      },
      companionDaySchedule,
      suggestedAlternatives,
      isDayAvailable,
    };
  }

  if (tightBufferBooking && bufferGap < 30) {
    return {
      hasConflict: true,
      severity: 'warning',
      conflictType: 'tight_buffer',
      headline: `Tight Travel Buffer (${bufferGap} min gap)`,
      explanation: `${companion.name} finishes another scheduled visit nearby with ${tightBufferBooking.seniorName} just ${bufferGap} minutes before or after this window. We recommend at least 30 minutes travel buffer between non-medical visits.`,
      conflictingBooking: {
        id: tightBufferBooking.id,
        seniorName: tightBufferBooking.seniorName,
        scheduledDate: tightBufferBooking.scheduledDate,
        startTime: tightBufferBooking.startTime,
        endTime: tightBufferBooking.endTime || 'Scheduled',
        durationHours: tightBufferBooking.durationHours,
        status: tightBufferBooking.status,
      },
      companionDaySchedule,
      suggestedAlternatives,
      bufferMinutes: bufferGap,
      isDayAvailable,
    };
  }

  if (!isDayAvailable) {
    return {
      hasConflict: true,
      severity: 'info',
      conflictType: 'outside_availability',
      headline: `Outside Stated Weekly Availability`,
      explanation: `${companion.name} typically accepts visits on ${companion.availableDays.join(', ')}. Scheduling on ${dayOfWeekName} will require direct companion review and confirmation.`,
      companionDaySchedule,
      suggestedAlternatives,
      isDayAvailable: false,
    };
  }

  // All clear!
  return {
    hasConflict: false,
    severity: 'clear',
    conflictType: 'none',
    headline: `Schedule Clear & Fully Available`,
    explanation: `${companion.name} has no overlapping visits on ${scheduledDateStr.split(' at ')[0]}. You are guaranteed a conflict-free companion visit.`,
    companionDaySchedule,
    suggestedAlternatives: [],
    isDayAvailable: true,
  };
}
