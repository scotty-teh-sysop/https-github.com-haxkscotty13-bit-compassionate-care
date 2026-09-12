import React, { useState } from 'react';
import { 
  X, Clock, CheckCircle2, ShieldCheck, Heart, User, MapPin, 
  Phone, Send, Sparkles, AlertCircle, Bell, MessageSquare, ChevronRight, Lock
} from 'lucide-react';
import { Booking, SeniorProfile, Companion } from '../types';
import { formatCurrency } from '../utils/formatters';

interface PreVisitCheckInModalProps {
  booking: Booking;
  senior?: SeniorProfile;
  companion?: Companion;
  onClose: () => void;
  onConfirmCheckIn: (bookingId: string, details: { hostName: string; instructions: string }) => void;
}

export const PreVisitCheckInModal: React.FC<PreVisitCheckInModalProps> = ({
  booking,
  senior,
  companion,
  onClose,
  onConfirmCheckIn,
}) => {
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(
    booking.familyCheckIn?.checkedIn ?? false
  );
  const [checkedInAt, setCheckedInAt] = useState<string>(
    booking.familyCheckIn?.checkedInAt || ''
  );
  const [hostName, setHostName] = useState<string>(
    booking.familyCheckIn?.hostName || 'Sarah Vance (Daughter)'
  );
  const [accessInstructions, setAccessInstructions] = useState<string>(
    booking.familyCheckIn?.doorOrAccessInstructions || 'Gate code is #4192. Please ring the front doorbell upon arrival.'
  );
  const [instructionsSent, setInstructionsSent] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'check_in' | 'details' | 'care_notes'>('check_in');

  const handleCheckIn = () => {
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setIsCheckedIn(true);
    setCheckedInAt(timeString);
    onConfirmCheckIn(booking.id, {
      hostName,
      instructions: accessInstructions,
    });
  };

  const handleSendInstructions = (e: React.FormEvent) => {
    e.preventDefault();
    setInstructionsSent(true);
    setTimeout(() => setInstructionsSent(false), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden"
        id="pre-visit-checkin-modal"
      >
        {/* Header with FCM 1-Hour Reminder Badge */}
        <div className="bg-linear-to-r from-emerald-800 to-teal-900 text-white p-5 sm:p-6 shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
            id="close-previsit-modal-btn"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-2 mb-2">
            <span className="px-2.5 py-1 bg-amber-400/25 border border-amber-300/40 text-amber-200 text-[11px] font-bold rounded-full flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>1-Hour Pre-Visit Window Active</span>
            </span>
            <span className="px-2 py-0.5 bg-white/15 text-white/90 text-[10px] font-semibold rounded-md">
              FCM Push Reminder
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Upcoming Visit: {booking.companionName} & {booking.seniorName}
          </h2>
          <p className="text-emerald-100/90 text-xs sm:text-sm mt-1">
            Scheduled for {booking.scheduledDate} &bull; {booking.startTime} – {booking.endTime} ({booking.durationHours} hrs)
          </p>

          {/* Navigation sub-tabs */}
          <div className="flex space-x-2 mt-4 pt-3 border-t border-white/15 text-xs font-bold">
            <button
              onClick={() => setActiveTab('check_in')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'check_in'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              1. Family Host Check-In
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'details'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              2. Visit & Companion Details
            </button>
            <button
              onClick={() => setActiveTab('care_notes')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'care_notes'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              3. Care & Comfort Notes
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* TAB 1: FAMILY HOST CHECK-IN */}
          {activeTab === 'check_in' && (
            <div className="space-y-4">
              {/* Check-In Status Card */}
              <div className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                isCheckedIn 
                  ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-400/30' 
                  : 'bg-amber-50/80 border-amber-300/80'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start space-x-3.5">
                    <div className={`p-2.5 rounded-2xl shrink-0 mt-0.5 ${
                      isCheckedIn ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      {isCheckedIn ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-base text-gray-900">
                          {isCheckedIn ? 'Family Host Check-In Confirmed' : 'Action Needed: Family Host Check-In'}
                        </h3>
                        <span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wider ${
                          isCheckedIn ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                        }`}>
                          {isCheckedIn ? 'Ready' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        {isCheckedIn 
                          ? `Confirmed by ${hostName} at ${checkedInAt || 'just now'}. ${booking.companionName} has been notified that someone is home and ${booking.seniorName} is ready for companionship.`
                          : `Please confirm that someone is at home to greet ${booking.companionName} and that ${booking.seniorName} is awake and prepared for the visit.`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckIn}
                    disabled={isCheckedIn}
                    className={`px-5 py-3 rounded-2xl font-bold text-xs shrink-0 flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer ${
                      isCheckedIn
                        ? 'bg-emerald-200 text-emerald-800 cursor-default opacity-90'
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white hover:shadow-md'
                    }`}
                    id="confirm-host-checkin-btn"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isCheckedIn ? `Checked In (${checkedInAt || 'Done'})` : 'Check In as Host Now'}</span>
                  </button>
                </div>
              </div>

              {/* Host Verification Checklist */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2.5">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Pre-Arrival Host Checklist
                </h4>
                <div className="space-y-2 text-xs text-gray-700">
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      defaultChecked 
                      className="rounded-md text-emerald-600 focus:ring-emerald-500 w-4 h-4" 
                    />
                    <span>{booking.seniorName} is informed of {booking.companionName}'s arrival at {booking.startTime}</span>
                  </label>
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      defaultChecked 
                      className="rounded-md text-emerald-600 focus:ring-emerald-500 w-4 h-4" 
                    />
                    <span>Comfortable seating and beverages (water/tea) are accessible</span>
                  </label>
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      defaultChecked 
                      className="rounded-md text-emerald-600 focus:ring-emerald-500 w-4 h-4" 
                    />
                    <span>Emergency contacts and routine preferences are confirmed</span>
                  </label>
                </div>
              </div>

              {/* Door Access & Instructions to Companion */}
              <div className="bg-white p-4.5 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-emerald-700" />
                    <h4 className="text-xs font-bold text-gray-900">Door Code & Arrival Access Notes</h4>
                  </div>
                  <span className="text-[11px] text-gray-500">Sent to companion app</span>
                </div>

                <form onSubmit={handleSendInstructions} className="space-y-2.5">
                  <textarea
                    value={accessInstructions}
                    onChange={(e) => setAccessInstructions(e.target.value)}
                    rows={2}
                    className="w-full text-xs p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden text-gray-800"
                    placeholder="e.g. Gate code is #4192, ring front bell or phone upon arrival..."
                  />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-emerald-700 font-semibold">
                      {instructionsSent && '✓ Instructions transmitted to companion successfully!'}
                    </span>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 cursor-pointer transition-colors"
                    >
                      <Send className="w-3 h-3" />
                      <span>Update Notes</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* GPS Geofencing Protection Banner */}
              <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-200/70 flex items-start space-x-3">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-900 leading-relaxed">
                  <strong className="font-bold">Automated Geofence Tracking:</strong> When {booking.companionName} arrives within 100 meters of {booking.address}, our GPS system will automatically verify check-in and notify your phone via FCM push notification.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: VISIT & COMPANION DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Companion Card */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  <img
                    src={booking.companionAvatar}
                    alt={booking.companionName}
                    className="w-13 h-13 rounded-2xl object-cover ring-2 ring-emerald-600/30"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-sm text-gray-900">{booking.companionName}</h4>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center space-x-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Checkr Cleared</span>
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Social Companion &bull; Rate: {formatCurrency(booking.companionHourlyRate)}/hr</p>
                    <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">CPR Certified &bull; ID Verified</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <a
                    href="tel:4155550192"
                    className="p-2.5 bg-white hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 rounded-xl border border-gray-200 transition-colors flex items-center space-x-1 text-xs font-bold"
                    title="Call companion"
                  >
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span className="hidden sm:inline">Call</span>
                  </a>
                </div>
              </div>

              {/* Loved One Profile Card */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex items-center space-x-3.5">
                <img
                  src={booking.seniorAvatar}
                  alt={booking.seniorName}
                  className="w-13 h-13 rounded-2xl object-cover ring-2 ring-slate-300"
                />
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-gray-900">{booking.seniorName}</h4>
                  <p className="text-xs text-gray-500 flex items-center space-x-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{booking.address}</span>
                  </p>
                  {senior && (
                    <p className="text-[11px] text-gray-600 mt-1">
                      Age {senior.age} &bull; {senior.relation} &bull; Emergency Contact: {senior.emergencyContactName} ({senior.emergencyContactPhone})
                    </p>
                  )}
                </div>
              </div>

              {/* Planned Activities */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-2">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Planned Activities for this 2-Hour Visit
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {booking.selectedInterests?.map((interest, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-full text-xs font-semibold"
                    >
                      {interest}
                    </span>
                  ))}
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                    Hydration & Gentle Movement
                  </span>
                </div>
              </div>

              {/* Escrow Payment Info */}
              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-gray-900">Total Authorized: {formatCurrency(booking.totalCost)}</p>
                  <p className="text-[11px] text-gray-500">Held in 256-bit Stripe Escrow &bull; Released post-visit GPS checkout</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                  Pre-Auth Confirmed
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: CARE & COMFORT NOTES */}
          {activeTab === 'care_notes' && (
            <div className="space-y-4">
              {/* Family Care Notes */}
              <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 space-y-1.5">
                <div className="flex items-center space-x-1.5 text-amber-900 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Family Notes for Companion</span>
                </div>
                <p className="text-xs text-gray-800 leading-relaxed italic">
                  "{booking.careNotes || 'Looking for a relaxing afternoon with good conversation, light garden strolling, and nostalgic music.'}"
                </p>
              </div>

              {/* Senior Comfort Preferences */}
              {senior && (
                <div className="space-y-3">
                  <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
                    <h5 className="text-xs font-bold text-gray-900 flex items-center space-x-1.5">
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      <span>Comfort & Conversation Starters</span>
                    </h5>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {senior.comfortTopics?.map((topic, idx) => (
                        <span key={idx} className="px-2.5 py-0.5 bg-white border border-gray-200 text-gray-800 text-[11px] rounded-lg">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
                    <h5 className="text-xs font-bold text-gray-900 flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>Favorite Music & Memory Era</span>
                    </h5>
                    <p className="text-xs text-gray-700">
                      Favorite Decade: <strong>{senior.favoriteEra || '1950s'}</strong> (Big Band, Nat King Cole, & Smooth Upright Bass)
                    </p>
                  </div>

                  <div className="p-3.5 bg-rose-50/50 rounded-2xl border border-rose-200/70 space-y-1">
                    <h5 className="text-xs font-bold text-rose-900">
                      Topics to Avoid (Sensitive)
                    </h5>
                    <p className="text-xs text-rose-800">
                      {senior.topicsToAvoid?.join(', ') || 'No topics listed.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Bell className="w-4 h-4 text-emerald-600" />
            <span>FCM Token Synchronized &bull; GPS Geofencing Active</span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl border border-gray-300 transition-colors cursor-pointer"
            >
              Close
            </button>
            {!isCheckedIn && (
              <button
                onClick={handleCheckIn}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Check-In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
