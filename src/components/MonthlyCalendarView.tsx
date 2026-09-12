import React, { useState, useMemo } from 'react';
import { Booking, SeniorProfile, BookingStatus } from '../types';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, 
  CheckCircle2, Sparkles, Filter, FileText, Heart, 
  ArrowRight, ShieldCheck, Check, Info, Radio
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { 
  APP_REFERENCE_DATE, MONTH_NAMES, DAY_NAMES_SHORT, 
  getCalendarGrid, parseBookingDate, getDateKey, 
  formatFullDate, isSameDay, CalendarDay 
} from '../utils/dateUtils';

interface MonthlyCalendarViewProps {
  bookings: Booking[];
  seniors: SeniorProfile[];
  activeSeniorId?: string;
  onViewSummary?: (booking: Booking) => void;
  onViewInvoice?: (booking: Booking) => void;
  onScheduleVisit?: () => void;
}

export const MonthlyCalendarView: React.FC<MonthlyCalendarViewProps> = ({
  bookings,
  seniors,
  activeSeniorId,
  onViewSummary,
  onViewInvoice,
  onScheduleVisit,
}) => {
  // Calendar Navigation: default to reference date (September 2026)
  const [currentYear, setCurrentYear] = useState<number>(APP_REFERENCE_DATE.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(APP_REFERENCE_DATE.getMonth()); // 8 = September
  const [selectedDateKey, setSelectedDateKey] = useState<string>(getDateKey(APP_REFERENCE_DATE));
  
  // Filters
  const [seniorFilter, setSeniorFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleJumpToToday = () => {
    setCurrentYear(APP_REFERENCE_DATE.getFullYear());
    setCurrentMonth(APP_REFERENCE_DATE.getMonth());
    setSelectedDateKey(getDateKey(APP_REFERENCE_DATE));
  };

  // Map each booking to its normalized date key
  const bookingsWithDate = useMemo(() => {
    return bookings.map(b => {
      const parsed = parseBookingDate(b.scheduledDate, b.scheduledIso);
      const dateKey = parsed ? getDateKey(parsed) : null;
      return {
        booking: b,
        parsedDate: parsed,
        dateKey
      };
    });
  }, [bookings]);

  // Filter bookings according to user selection
  const filteredBookings = useMemo(() => {
    return bookingsWithDate.filter(({ booking }) => {
      if (seniorFilter !== 'all' && booking.seniorId !== seniorFilter) {
        return false;
      }
      if (statusFilter === 'upcoming' && !(booking.status === 'accepted' || booking.status === 'requested')) {
        return false;
      }
      if (statusFilter === 'completed' && booking.status !== 'completed') {
        return false;
      }
      if (statusFilter === 'in_progress' && booking.status !== 'in_progress') {
        return false;
      }
      return true;
    });
  }, [bookingsWithDate, seniorFilter, statusFilter]);

  // Index bookings by dateKey for O(1) lookup
  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    for (const item of filteredBookings) {
      if (item.dateKey) {
        if (!map[item.dateKey]) {
          map[item.dateKey] = [];
        }
        map[item.dateKey].push(item.booking);
      }
    }
    return map;
  }, [filteredBookings]);

  // Get calendar days for the current month
  const calendarGrid = useMemo(() => {
    return getCalendarGrid(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  // Calculate monthly stats for the current view
  const monthStats = useMemo(() => {
    let totalVisits = 0;
    let completedVisits = 0;
    let totalHours = 0;
    let totalSpend = 0;

    for (const { booking, parsedDate } of filteredBookings) {
      if (parsedDate && parsedDate.getFullYear() === currentYear && parsedDate.getMonth() === currentMonth) {
        totalVisits++;
        totalHours += booking.durationHours;
        totalSpend += booking.totalCost;
        if (booking.status === 'completed') {
          completedVisits++;
        }
      }
    }

    return { totalVisits, completedVisits, totalHours, totalSpend };
  }, [filteredBookings, currentYear, currentMonth]);

  // Selected day's bookings
  const selectedDayBookings = useMemo(() => {
    return bookingsByDate[selectedDateKey] || [];
  }, [bookingsByDate, selectedDateKey]);

  // Formatted date string for selected date
  const selectedDateObject = useMemo(() => {
    const parts = selectedDateKey.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    return APP_REFERENCE_DATE;
  }, [selectedDateKey]);

  // Helper for status badge styling
  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'in_progress':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            <span>Active Now</span>
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            <Check className="w-3 h-3 text-emerald-700" />
            <span>Confirmed</span>
          </span>
        );
      case 'requested':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3 text-amber-700" />
            <span>Pending</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            <CheckCircle2 className="w-3 h-3 text-slate-500" />
            <span>Completed</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4" id="monthly-calendar-view">
      {/* 1. Header with Month Title, Jump Controls, and Stats */}
      <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </h3>
                {currentMonth === APP_REFERENCE_DATE.getMonth() && currentYear === APP_REFERENCE_DATE.getFullYear() && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Current Month
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Visual companion schedule and visit history for your loved ones
              </p>
            </div>
          </div>

          {/* Month Navigation Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleJumpToToday}
              className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="Jump to Today (Sept 11, 2026)"
              id="calendar-today-btn"
            >
              Today
            </button>
            <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200 p-0.5">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-white hover:text-emerald-800 text-gray-600 rounded-lg transition-colors cursor-pointer"
                title="Previous Month"
                id="calendar-prev-month-btn"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-white hover:text-emerald-800 text-gray-600 rounded-lg transition-colors cursor-pointer"
                title="Next Month"
                id="calendar-next-month-btn"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters & Monthly Summary Ribbon */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-gray-100">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1.5 bg-gray-50 rounded-xl px-2.5 py-1.5 border border-gray-200 text-xs">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-500 font-medium">Loved One:</span>
              <select
                value={seniorFilter}
                onChange={(e) => setSeniorFilter(e.target.value)}
                className="bg-transparent font-bold text-gray-800 focus:outline-none cursor-pointer"
                id="calendar-senior-filter"
              >
                <option value="all">All Loved Ones</option>
                {seniors.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-1 bg-gray-50 rounded-xl p-1 border border-gray-200 text-xs font-semibold">
              {[
                { id: 'all', label: 'All' },
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'completed', label: 'Completed' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Month Stats Chips */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 font-bold rounded-lg border border-emerald-100">
              {monthStats.totalVisits} {monthStats.totalVisits === 1 ? 'Visit' : 'Visits'} this Month
            </span>
            <span className="px-2.5 py-1 bg-teal-50 text-teal-800 font-bold rounded-lg border border-teal-100">
              {monthStats.totalHours} hrs Companion Care
            </span>
          </div>
        </div>
      </div>

      {/* 2. Visual Calendar Grid */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xs overflow-hidden">
        {/* Day-of-week header row */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/70 text-center text-[11px] font-bold text-gray-500 py-2.5 uppercase tracking-wider">
          {DAY_NAMES_SHORT.map((day, idx) => (
            <div key={day} className={idx === 0 || idx === 6 ? 'text-gray-400' : ''}>
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
          {calendarGrid.map((dayCell) => {
            const dayVisits = bookingsByDate[dayCell.dateKey] || [];
            const isSelected = selectedDateKey === dayCell.dateKey;
            const hasVisits = dayVisits.length > 0;

            const hasActive = dayVisits.some(v => v.status === 'in_progress');
            const hasCompleted = dayVisits.some(v => v.status === 'completed');
            const hasConfirmed = dayVisits.some(v => v.status === 'accepted');
            const hasPending = dayVisits.some(v => v.status === 'requested');

            return (
              <div
                key={dayCell.dateKey}
                onClick={() => setSelectedDateKey(dayCell.dateKey)}
                className={`min-h-[85px] sm:min-h-[105px] p-1.5 sm:p-2 flex flex-col justify-between transition-all cursor-pointer relative group ${
                  !dayCell.isCurrentMonth
                    ? 'bg-gray-50/40 text-gray-400'
                    : 'bg-white hover:bg-emerald-50/20'
                } ${
                  isSelected
                    ? 'ring-2 ring-emerald-600 bg-emerald-50/30 z-10'
                    : ''
                }`}
                id={`calendar-day-${dayCell.dateKey}`}
              >
                {/* Date Header: number + today indicator */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                      dayCell.isToday
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : isSelected
                        ? 'bg-emerald-100 text-emerald-900'
                        : dayCell.isCurrentMonth
                        ? 'text-gray-900'
                        : 'text-gray-400'
                    }`}
                  >
                    {dayCell.dayNumber}
                  </span>

                  {dayCell.isToday && (
                    <span className="hidden sm:inline text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                      Today
                    </span>
                  )}
                </div>

                {/* Visit Badges / Indicators */}
                <div className="mt-1 space-y-1 overflow-hidden">
                  {dayVisits.slice(0, 2).map((visit) => {
                    let badgeBg = 'bg-gray-100 text-gray-700 border-gray-200';
                    if (visit.status === 'in_progress') {
                      badgeBg = 'bg-emerald-600 text-white border-emerald-700 font-bold';
                    } else if (visit.status === 'accepted') {
                      badgeBg = 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold';
                    } else if (visit.status === 'completed') {
                      badgeBg = 'bg-slate-100 text-slate-700 border-slate-200';
                    } else if (visit.status === 'requested') {
                      badgeBg = 'bg-amber-50 text-amber-800 border-amber-200';
                    }

                    return (
                      <div
                        key={visit.id}
                        className={`text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-lg border truncate flex items-center space-x-1 ${badgeBg}`}
                        title={`${visit.companionName} with ${visit.seniorName} (${visit.startTime}) - ${visit.status}`}
                      >
                        {visit.status === 'in_progress' ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
                        ) : visit.status === 'completed' ? (
                          <CheckCircle2 className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                        ) : (
                          <Clock className="w-2.5 h-2.5 shrink-0 opacity-70" />
                        )}
                        <span className="truncate hidden sm:inline">{visit.companionName.split(' ')[0]}: {visit.startTime}</span>
                        <span className="truncate sm:hidden">{visit.startTime}</span>
                      </div>
                    );
                  })}

                  {dayVisits.length > 2 && (
                    <div className="text-[9px] font-bold text-emerald-800 text-right pr-1">
                      +{dayVisits.length - 2} more
                    </div>
                  )}
                </div>

                {/* Dot markers on mobile if no badges show or for extra density */}
                {hasVisits && (
                  <div className="flex items-center space-x-1 mt-1 sm:hidden">
                    {hasActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />}
                    {hasConfirmed && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                    {hasPending && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                    {hasCompleted && <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Calendar Footer: Status Legend */}
        <div className="p-3 bg-gray-50/70 border-t border-gray-100 flex flex-wrap items-center justify-between text-[11px] text-gray-500 gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-gray-700">Status Legend:</span>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>In Progress (Live GPS)</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Confirmed Upcoming</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Pending Acceptance</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Completed & Verified</span>
            </div>
          </div>

          <span className="text-[10px] text-gray-400">Click any date to inspect details</span>
        </div>
      </div>

      {/* 3. Selected Date Detailed Inspection Drawer / Panel */}
      <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-2xs space-y-4" id="calendar-day-inspection">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-bold text-gray-900">
                {formatFullDate(selectedDateObject)}
              </h4>
              {isSameDay(selectedDateObject, APP_REFERENCE_DATE) && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Today
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {selectedDayBookings.length === 0
                ? 'No visits scheduled for this date'
                : `${selectedDayBookings.length} ${selectedDayBookings.length === 1 ? 'visit' : 'visits'} scheduled`}
            </p>
          </div>

          {onScheduleVisit && (
            <button
              onClick={onScheduleVisit}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
              id="schedule-visit-from-calendar-btn"
            >
              <span>Book Companion</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Selected Day Visits Content */}
        {selectedDayBookings.length === 0 ? (
          <div className="p-6 text-center bg-gray-50/60 rounded-2xl border border-dashed border-gray-200 space-y-2">
            <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-gray-600">
              No companion visits scheduled for {formatFullDate(selectedDateObject)}.
            </p>
            <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
              Reserve quality companionship for gardening, gentle walks, art history, chess, or music reminiscence.
            </p>
            {onScheduleVisit && (
              <div className="pt-1">
                <button
                  onClick={onScheduleVisit}
                  className="px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-gray-200 hover:border-emerald-300 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  Schedule a Visit for This Date
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDayBookings.map((visit) => {
              const isLive = visit.status === 'in_progress';
              const isCompleted = visit.status === 'completed';

              return (
                <div
                  key={visit.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isLive
                      ? 'bg-gradient-to-r from-emerald-900 to-teal-950 text-white border-emerald-600 shadow-md'
                      : 'bg-white border-gray-200 shadow-2xs text-gray-900'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Companion & Senior Avatar Details */}
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <img
                          src={visit.companionAvatar}
                          alt={visit.companionName}
                          className={`w-12 h-12 rounded-2xl object-cover ring-2 ${
                            isLive ? 'ring-emerald-400' : 'ring-emerald-600/30'
                          }`}
                        />
                        {isLive && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-emerald-950 animate-pulse" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <h5 className={`font-bold text-sm ${isLive ? 'text-white' : 'text-gray-900'}`}>
                            {visit.companionName}
                          </h5>
                          {getStatusBadge(visit.status)}
                          {visit.isRecurring && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              isLive ? 'bg-emerald-800 text-emerald-200' : 'bg-teal-50 text-teal-800'
                            }`}>
                              Recurring
                            </span>
                          )}
                        </div>

                        <p className={`text-xs mt-0.5 ${isLive ? 'text-emerald-200' : 'text-gray-500'}`}>
                          Companion with <span className="font-semibold">{visit.seniorName}</span> &bull; {visit.startTime} - {visit.endTime} ({visit.durationHours} hrs)
                        </p>

                        <p className={`text-[11px] mt-1 line-clamp-1 ${isLive ? 'text-emerald-100/90' : 'text-gray-600'}`}>
                          {visit.careNotes}
                        </p>
                      </div>
                    </div>

                    {/* Actions & Cost */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 sm:border-0">
                      <div className="text-left sm:text-right">
                        <p className={`text-xs font-black ${isLive ? 'text-emerald-300' : 'text-gray-900'}`}>
                          {formatCurrency(visit.totalCost)}
                        </p>
                        <span className={`text-[10px] ${isLive ? 'text-emerald-200' : 'text-emerald-700 font-semibold'}`}>
                          {isCompleted ? 'Escrow Released' : 'Stripe Authorized'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        {isCompleted && onViewInvoice && (
                          <button
                            onClick={() => onViewInvoice(visit)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors flex items-center space-x-1 cursor-pointer"
                            title="View Stripe Invoice"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Receipt</span>
                          </button>
                        )}

                        {isCompleted && onViewSummary && (
                          <button
                            onClick={() => onViewSummary(visit)}
                            className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors flex items-center space-x-1 cursor-pointer"
                          >
                            <span>Visit Report</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        {isLive && (
                          <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500 text-white shadow-xs animate-pulse">
                            GPS Active Now
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Photo Strip if Completed */}
                  {isCompleted && visit.postVisitSummary?.photos && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center space-x-2 overflow-x-auto">
                      {visit.postVisitSummary.photos.map((photoUrl, pIdx) => (
                        <img
                          key={pIdx}
                          src={photoUrl}
                          alt="Visit memory"
                          className="w-14 h-14 rounded-xl object-cover ring-1 ring-gray-200 cursor-pointer hover:opacity-90"
                          onClick={() => onViewSummary && onViewSummary(visit)}
                        />
                      ))}
                      {visit.postVisitSummary.moodRating && (
                        <div className="px-3 py-2 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-100 flex items-center space-x-1 shrink-0">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Mood: {visit.postVisitSummary.moodRating}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
