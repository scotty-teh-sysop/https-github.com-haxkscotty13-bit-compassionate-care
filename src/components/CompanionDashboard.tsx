import React, { useState } from 'react';
import { Booking, Companion } from '../types';
import { 
  ShieldCheck, Calendar, Clock, DollarSign, CheckCircle2, 
  XCircle, Award, UserCheck, Heart, AlertCircle, ArrowRight,
  TrendingUp, Check, Settings, Camera, MapPin, FileText, Globe
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { CheckrVettingModal } from './CheckrVettingModal';
import { AlbertaVscModal } from './AlbertaVscModal';

interface CompanionDashboardProps {
  companion: Companion;
  bookings: Booking[];
  onAcceptBooking: (bookingId: string) => void;
  onDeclineBooking: (bookingId: string) => void;
  onStartVisit: (bookingId: string) => void;
  onInitiateCheckout: (booking: Booking) => void;
  onViewSummary: (booking: Booking) => void;
  onUpdateRate: (newRate: number) => void;
  onUpdateAvailability: (days: string[]) => void;
  onOpenPaymentGateway?: () => void;
  onViewInvoice?: (booking: Booking) => void;
}

export const CompanionDashboard: React.FC<CompanionDashboardProps> = ({
  companion,
  bookings,
  onAcceptBooking,
  onDeclineBooking,
  onStartVisit,
  onInitiateCheckout,
  onViewSummary,
  onUpdateRate,
  onUpdateAvailability,
  onOpenPaymentGateway,
  onViewInvoice,
}) => {
  const [showCheckrModal, setShowCheckrModal] = useState(false);
  const [showVscModal, setShowVscModal] = useState(false);
  const [hourlyRateInput, setHourlyRateInput] = useState(companion.hourlyRate);
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>(companion.availableDays);

  const activeVisit = bookings.find((b) => b.status === 'in_progress');
  const pendingRequests = bookings.filter((b) => b.status === 'requested');
  const upcomingVisits = bookings.filter((b) => b.status === 'accepted');
  const completedVisits = bookings.filter((b) => b.status === 'completed');

  const totalEarnings = completedVisits.reduce((acc, curr) => acc + curr.totalCost, 0);

  const handleSaveRate = () => {
    onUpdateRate(hourlyRateInput);
    setIsEditingRate(false);
  };

  const handleToggleDay = (day: string) => {
    const nextDays = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day];
    setSelectedDays(nextDays);
    onUpdateAvailability(nextDays);
  };

  return (
    <div className="space-y-6" id="companion-dashboard">
      {/* Companion Profile Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 rounded-3xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                src={companion.avatar}
                alt={companion.name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-300"
              />
              <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full text-white ring-2 ring-emerald-900">
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white">{companion.name}</h2>
                <span className="px-2 py-0.5 bg-emerald-500/30 text-emerald-100 rounded-full text-xs font-semibold border border-emerald-400/40">
                  Verified Companion
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5">{companion.title}</p>
              <div className="text-xs text-emerald-200 mt-1 flex flex-wrap items-center gap-2">
                <span>{companion.locationName}</span>
                <span>&bull;</span>
                <button
                  onClick={() => setShowCheckrModal(true)}
                  className="underline hover:text-white font-semibold cursor-pointer"
                >
                  Checkr: Passed
                </button>
                <span>&bull;</span>
                <button
                  onClick={() => setShowVscModal(true)}
                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-100 border border-emerald-400/30 text-[11px] font-semibold transition-colors cursor-pointer"
                  title="Alberta Vulnerable Sector Check (Canada) - Generate Letter for Police"
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-300" />
                  <span>Alberta VSC (Canada)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15">
            <div>
              <p className="text-[10px] uppercase font-bold text-emerald-200">Completed Visits</p>
              <p className="text-lg font-black text-white">{completedVisits.length + 42}</p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <p className="text-[10px] uppercase font-bold text-emerald-200">Total Payouts</p>
              <p className="text-lg font-black text-white">{formatCurrency(totalEarnings + 1260)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stripe Connect & Bank Direct Deposit Hub */}
      <div className="p-4 bg-gradient-to-r from-slate-900 to-teal-950 text-white rounded-3xl shadow-sm border border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xs">Stripe Connect & Payouts</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                Chase (•••• 9812)
              </span>
            </div>
            <p className="text-[11px] text-teal-200 mt-0.5">
              Instant bank transfers, 1099 tax summaries, and rolling escrow releases
            </p>
          </div>
        </div>
        {onOpenPaymentGateway && (
          <button
            onClick={onOpenPaymentGateway}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <span>Manage Payouts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Active Visit Alert Banner if Currently in Progress */}
      {activeVisit && (
        <div className="bg-emerald-900 text-white rounded-3xl p-5 border-2 border-emerald-500/50 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse-subtle">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-emerald-500/30 rounded-2xl">
              <Clock className="w-7 h-7 text-emerald-200 animate-spin-slow" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                ● Live Active Visit In Progress
              </span>
              <h3 className="text-base font-bold text-white">
                Visiting with {activeVisit.seniorName}
              </h3>
              <p className="text-xs text-emerald-100 flex items-center space-x-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                <span>{activeVisit.address}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => onInitiateCheckout(activeVisit)}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-extrabold text-xs rounded-full shadow-md flex items-center justify-center space-x-2 transition-transform active:scale-95"
            id="companion-end-visit-cta"
          >
            <Camera className="w-4 h-4" />
            <span>Complete & Submit Post-Visit Summary</span>
          </button>
        </div>
      )}

      {/* Incoming Booking Requests (Care Seeker Requests) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2">
            <span>Incoming Visit Requests</span>
            {pendingRequests.length > 0 && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                {pendingRequests.length} pending
              </span>
            )}
          </h3>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 text-center text-xs text-gray-500">
            No new visit requests waiting. You're all caught up!
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-3xl p-5 border border-amber-200 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={req.seniorAvatar}
                      alt={req.seniorName}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-amber-400"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{req.seniorName}</h4>
                      <p className="text-xs text-gray-500">
                        {req.scheduledDate} &bull; {req.startTime} ({req.durationHours} hrs)
                      </p>
                      <p className="text-xs text-gray-600 flex items-center space-x-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="truncate max-w-[200px]">{req.address}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-base font-black text-emerald-800">{formatCurrency(req.totalCost)}</p>
                    <span className="text-[10px] text-gray-500">Authorized via Stripe</span>
                  </div>
                </div>

                {req.careNotes && (
                  <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs text-amber-900">
                    <p className="font-semibold mb-0.5">Family Care Note:</p>
                    <p className="italic text-gray-700">"{req.careNotes}"</p>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-2 pt-1 border-t border-gray-100">
                  <button
                    onClick={() => onDeclineBooking(req.id)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-full"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => onAcceptBooking(req.id)}
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-full shadow-xs flex items-center space-x-1.5 transition-transform active:scale-95"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Accept Visit</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hourly Rate & Calendar Availability Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hourly Rate Configuration */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-emerald-700" />
              <span>Hourly Rate Configuration</span>
            </h4>
            {!isEditingRate && (
              <button
                onClick={() => setIsEditingRate(true)}
                className="text-xs text-emerald-700 font-bold hover:underline"
              >
                Change Rate
              </button>
            )}
          </div>

          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Your Current Social Rate</p>
              <p className="text-2xl font-black text-emerald-900">
                {formatCurrency(companion.hourlyRate)}
                <span className="text-xs font-normal text-gray-600">/hr</span>
              </p>
            </div>

            {isEditingRate ? (
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min={20}
                  max={60}
                  value={hourlyRateInput}
                  onChange={(e) => setHourlyRateInput(Number(e.target.value))}
                  className="w-20 p-2 text-center rounded-xl border border-emerald-400 font-bold text-sm bg-white"
                />
                <button
                  onClick={handleSaveRate}
                  className="px-3 py-2 bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Save
                </button>
              </div>
            ) : (
              <span className="text-xs text-emerald-700 font-semibold bg-emerald-100/70 px-2.5 py-1 rounded-full">
                Standard SF Market Rate
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-500">
            Companions average $25-$35/hr. Payouts are directly deposited 24 hours after visit completion.
          </p>
        </div>

        {/* Weekly Calendar Availability Management */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs space-y-3">
          <h4 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <span>Weekly Availability Calendar</span>
          </h4>

          <div>
            <p className="text-xs text-gray-500 mb-2">Toggle days you are open for social companion visits:</p>
            <div className="grid grid-cols-7 gap-1.5">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() => handleToggleDay(day)}
                    className={`py-2 text-center rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="text-[11px] text-gray-500">
            Currently active for: <strong>Morning (9 AM - 12 PM)</strong> & <strong>Afternoon (1 PM - 5 PM)</strong>.
          </p>
        </div>
      </div>

      {/* Safety & Vetting Credentials Box */}
      <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <h4 className="text-sm font-bold text-gray-900">Safety & Vetting Status</h4>
          </div>
          <button
            onClick={() => setShowCheckrModal(true)}
            className="text-xs font-bold text-emerald-700 hover:underline flex items-center space-x-1"
          >
            <span>View Full Checkr Report</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <div>
              <p className="font-bold text-gray-900">ID Verification</p>
              <p className="text-[10px] text-emerald-700 font-semibold">PASSED (RealID)</p>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <div>
              <p className="font-bold text-gray-900">Checkr Criminal</p>
              <p className="text-[10px] text-emerald-700 font-semibold">CLEARED (7-Yr)</p>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center space-x-2">
            <Award className="w-4 h-4 text-emerald-700 shrink-0" />
            <div>
              <p className="font-bold text-gray-900">Elder Abuse Reg.</p>
              <p className="text-[10px] text-emerald-700 font-semibold">CLEARED</p>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center space-x-2">
            <Heart className="w-4 h-4 text-emerald-700 shrink-0" />
            <div>
              <p className="font-bold text-gray-900">CPR / First Aid</p>
              <p className="text-[10px] text-emerald-700 font-semibold">ACTIVE 2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming & Completed Visits */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-gray-900">Upcoming Scheduled Visits</h4>
        {upcomingVisits.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No upcoming visits confirmed yet.</p>
        ) : (
          <div className="space-y-2.5">
            {upcomingVisits.map((vis) => (
              <div
                key={vis.id}
                className="p-4 bg-white rounded-2xl border border-gray-200 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <img src={vis.seniorAvatar} alt={vis.seniorName} className="w-10 h-10 rounded-xl object-cover" />
                  <div>
                    <h5 className="font-bold text-xs text-gray-900">{vis.seniorName}</h5>
                    <p className="text-[11px] text-gray-500">{vis.scheduledDate} &bull; {vis.startTime} ({vis.durationHours} hrs)</p>
                  </div>
                </div>

                <button
                  onClick={() => onStartVisit(vis.id)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-full shadow-xs"
                >
                  Start Visit (GPS Check-In)
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Visits & Earnings History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-gray-900">Visit Payout Ledger & Invoices</h4>
          <span className="text-[11px] text-emerald-700 font-semibold">90% Direct Payout Rate</span>
        </div>

        {completedVisits.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No completed visits in this billing cycle.</p>
        ) : (
          <div className="space-y-2.5">
            {completedVisits.map((vis) => {
              const companionShare = vis.totalCost * 0.9;
              return (
                <div
                  key={vis.id}
                  className="p-4 bg-white rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <img src={vis.seniorAvatar} alt={vis.seniorName} className="w-10 h-10 rounded-xl object-cover" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h5 className="font-bold text-xs text-gray-900">{vis.seniorName}</h5>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                          Transferred
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500">{vis.scheduledDate} &bull; {vis.durationHours} hrs visit</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-xs font-black text-emerald-700">+{formatCurrency(companionShare)}</p>
                      <span className="text-[10px] text-gray-400">Chase •••• 9812</span>
                    </div>

                    {onViewInvoice && (
                      <button
                        onClick={() => onViewInvoice(vis)}
                        className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900 rounded-lg text-xs font-semibold border border-gray-200 transition-colors"
                        title="View Stripe Invoice / Receipt"
                      >
                        Receipt
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCheckrModal && (
        <CheckrVettingModal
          companion={companion}
          onClose={() => setShowCheckrModal(false)}
        />
      )}

      {showVscModal && (
        <AlbertaVscModal
          isOpen={showVscModal}
          onClose={() => setShowVscModal(false)}
          defaultApplicantName={companion.name}
          defaultTrack="professional"
          defaultCity={companion.locationName || 'Calgary, AB'}
        />
      )}
    </div>
  );
};
