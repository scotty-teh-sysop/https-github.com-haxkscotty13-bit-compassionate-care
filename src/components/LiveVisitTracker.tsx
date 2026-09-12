import React, { useState, useEffect } from 'react';
import { Booking, UserRole } from '../types';
import { 
  Clock, MapPin, ShieldCheck, PhoneCall, AlertTriangle, 
  Camera, CheckCircle2, Heart, Sparkles, MessageSquare, Info,
  Navigation, ShieldAlert, ArrowRight
} from 'lucide-react';
import { formatElapsedSeconds } from '../utils/formatters';
import { EmergencyModal } from './EmergencyModal';
import { AudioMemoryPlayer } from './AudioMemoryPlayer';

interface LiveVisitTrackerProps {
  booking: Booking;
  userRole: UserRole;
  onInitiateCheckout: (booking: Booking) => void;
  onSimulateEmergency: () => void;
}

export const LiveVisitTracker: React.FC<LiveVisitTrackerProps> = ({
  booking,
  userRole,
  onInitiateCheckout,
  onSimulateEmergency,
}) => {
  const [elapsed, setElapsed] = useState(booking.visitTracking?.elapsedSeconds || 3420);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [quickNoteSent, setQuickNoteSent] = useState(false);
  const [noteText, setNoteText] = useState('');

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const totalDurationSeconds = booking.durationHours * 3600;
  const progressPercent = Math.min(100, Math.round((elapsed / totalDurationSeconds) * 100));

  const handleSendQuickNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setQuickNoteSent(true);
    setNoteText('');
    setTimeout(() => setQuickNoteSent(false), 3000);
  };

  return (
    <div className="space-y-4" id="live-visit-tracker-root">
      {/* Active Pulse Header */}
      <div className="bg-gradient-to-br from-emerald-800 via-teal-800 to-emerald-900 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-300"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                Live Visit In Progress
              </span>
            </div>

            {/* Geofence Verified Badge */}
            <div className="flex items-center space-x-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-bold text-emerald-100 border border-white/20">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>GPS Geofence Verified</span>
            </div>
          </div>

          {/* Senior & Companion Faces */}
          <div className="flex items-center justify-between py-2 border-y border-white/10">
            <div className="flex items-center space-x-3">
              <img
                src={booking.seniorAvatar}
                alt={booking.seniorName}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-400"
              />
              <div>
                <p className="text-xs text-emerald-200">Senior Loved One</p>
                <h3 className="text-base font-bold text-white">{booking.seniorName}</h3>
                <p className="text-xs text-emerald-100 flex items-center space-x-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-emerald-300" />
                  <span className="truncate max-w-[160px] sm:max-w-[200px]">{booking.address}</span>
                </p>
              </div>
            </div>

            <div className="text-right flex items-center space-x-3">
              <div className="hidden sm:block">
                <p className="text-xs text-emerald-200">Vetted Companion</p>
                <h4 className="text-sm font-bold text-white">{booking.companionName}</h4>
                <p className="text-xs text-emerald-100">Checked in at {booking.visitTracking?.checkInTime || '2:01 PM'}</p>
              </div>
              <img
                src={booking.companionAvatar}
                alt={booking.companionName}
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/60"
              />
            </div>
          </div>

          {/* Live Elapsed Time Clock */}
          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-500/20 rounded-xl">
                <Clock className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <p className="text-xs text-emerald-200">Elapsed Visit Time</p>
                <p className="text-2xl font-black font-mono tracking-tight text-white">
                  {formatElapsedSeconds(elapsed)}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs text-emerald-200">Planned Duration</p>
              <p className="text-sm font-bold text-white">{booking.durationHours} Hours Total</p>
              <div className="w-24 bg-white/20 rounded-full h-1.5 mt-1.5 overflow-hidden">
                <div
                  className="bg-emerald-300 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Safety & Action Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Emergency Assistance Button */}
        <button
          onClick={() => setShowEmergencyModal(true)}
          className="p-3.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-2xl text-red-800 flex items-center space-x-3 transition-colors shadow-2xs"
          id="trigger-emergency-button"
        >
          <div className="p-2 bg-red-600 text-white rounded-xl">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div className="text-left flex-1">
            <p className="text-xs font-bold text-red-900 uppercase tracking-wide">Emergency Assistance</p>
            <p className="text-xs text-red-700">911 & Family speed dial with GPS</p>
          </div>
        </button>

        {/* Companion Checkout & Post-Visit Summary Trigger */}
        {userRole === 'companion' ? (
          <button
            onClick={() => onInitiateCheckout(booking)}
            className="p-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl flex items-center space-x-3 shadow-md transition-transform active:scale-98"
            id="checkout-and-summary-btn"
          >
            <div className="p-2 bg-white/20 rounded-xl">
              <Camera className="w-5 h-5" />
            </div>
            <div className="text-left flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-200">End Visit</p>
              <p className="text-xs font-bold text-white flex items-center space-x-1">
                <span>Submit Post-Visit Report</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </p>
            </div>
          </button>
        ) : (
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center space-x-3 text-emerald-900">
            <div className="p-2 bg-emerald-600 text-white rounded-xl">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Peace of Mind Guarantee</p>
              <p className="text-xs text-emerald-700">You'll receive photos & mood update at checkout.</p>
            </div>
          </div>
        )}
      </div>

      {/* Senior Comfort Care Card (For Companion & Family) */}
      <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-bold text-gray-900">Senior Care Notes & Comfort Guide</h4>
          </div>
          <span className="text-[11px] bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
            Confidential
          </span>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <p className="font-bold text-gray-700 mb-1">Comfort Topics Eleanor Loves</p>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg font-medium">
                🌹 Heirloom English Roses
              </span>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg font-medium">
                📻 1950s San Francisco Radio
              </span>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg font-medium">
                🍋 Lemon Shortbread Baking
              </span>
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
            <p className="font-bold text-amber-900 flex items-center space-x-1 mb-0.5">
              <Info className="w-3.5 h-3.5 text-amber-700" />
              <span>Topics to Avoid</span>
            </p>
            <p className="text-amber-800 text-[11px]">
              Avoid asking about recent hospital visits or talking about tense news/politics. Keep discussions light, nostalgic, and warm.
            </p>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
            <p className="font-bold text-gray-800 mb-0.5">Special Care & Routine Note</p>
            <p className="text-gray-600 text-[11px]">
              {booking.careNotes || 'Loves hot chamomile tea with honey at 3:00 PM.'}
            </p>
          </div>
        </div>
      </div>

      {/* Favorite Era Music & Memory Starters */}
      <AudioMemoryPlayer 
        seniorName={booking.seniorName} 
        defaultEra="1950s" 
        companionName={booking.companionName} 
      />

      {/* Quick Messaging / Check-In Ping */}
      <div className="bg-white rounded-3xl p-4 border border-gray-200 shadow-xs">
        <form onSubmit={handleSendQuickNote} className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-700 flex items-center space-x-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>{userRole === 'companion' ? 'Quick Update to Family' : 'Quick Message to Maya'}</span>
            </label>
            {quickNoteSent && (
              <span className="text-[11px] font-bold text-emerald-600 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Message Delivered</span>
              </span>
            )}
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={userRole === 'companion' ? 'e.g., "Eleanor is having a wonderful time potting the roses!"' : 'e.g., "Thank you Maya! Let us know if she needs anything."'}
              className="flex-1 p-2.5 rounded-xl border border-gray-200 text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-emerald-600"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Send
            </button>
          </div>
        </form>
      </div>

      {/* Emergency Modal */}
      {showEmergencyModal && (
        <EmergencyModal
          booking={booking}
          onClose={() => setShowEmergencyModal(false)}
          onSimulateEmergencySent={onSimulateEmergency}
        />
      )}
    </div>
  );
};
