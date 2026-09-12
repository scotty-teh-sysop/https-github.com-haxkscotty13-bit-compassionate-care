import React, { useState } from 'react';
import { PhoneCall, AlertTriangle, X, ShieldAlert, MapPin, Check, HeartCrack } from 'lucide-react';
import { Booking } from '../types';

interface EmergencyModalProps {
  booking: Booking;
  onClose: () => void;
  onSimulateEmergencySent?: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  booking,
  onClose,
  onSimulateEmergencySent,
}) => {
  const [alertSent, setAlertSent] = useState(false);

  const handleDispatchFamilyAlert = () => {
    setAlertSent(true);
    if (onSimulateEmergencySent) {
      onSimulateEmergencySent();
    }
    setTimeout(() => {
      setAlertSent(false);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-red-200 animate-in fade-in zoom-in-95 duration-200"
        id="emergency-modal"
      >
        {/* Urgent Red Banner */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/20 rounded-2xl animate-pulse">
              <ShieldAlert className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-snug">Emergency Assistance</h3>
              <p className="text-xs text-red-100">Live Active Visit Safety Protocol</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors text-white/80 hover:text-white"
            id="close-emergency-modal"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Location Dispatch Summary */}
        <div className="p-4 bg-red-50/70 border-b border-red-100">
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-900 uppercase tracking-wide">Current Senior Residence</p>
              <p className="text-sm font-semibold text-gray-900">{booking.address}</p>
              <p className="text-xs text-gray-600 mt-0.5">
                Senior: <strong className="text-gray-900">{booking.seniorName}</strong> &bull; Companion On-Site: <strong className="text-gray-900">{booking.companionName}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {alertSent && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-3 text-emerald-900 animate-in fade-in">
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-sm">Emergency Alert Broadcasted!</p>
                <p className="text-xs text-emerald-700">SMS & high-priority push delivered to family contacts.</p>
              </div>
            </div>
          )}

          {/* Primary 911 Dial */}
          <div className="p-4 bg-red-600 text-white rounded-2xl shadow-md flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold uppercase tracking-wider text-red-200">Life-Threatening Emergency</span>
              <h4 className="text-xl font-black tracking-tight">Call 911 Dispatch</h4>
              <p className="text-xs text-red-100">Provide senior's address displayed above</p>
            </div>
            <a
              href="tel:911"
              className="px-5 py-2.5 bg-white text-red-600 font-bold text-sm rounded-full shadow-md hover:bg-red-50 flex items-center space-x-2 transition-transform active:scale-95"
              id="call-911-button"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call 911</span>
            </a>
          </div>

          {/* Family Contact Direct Speed Dial */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Primary Family Contact</p>
                <p className="text-sm font-bold text-gray-900">Sarah Vance (Daughter)</p>
                <p className="text-xs text-gray-600">(415) 555-0192 &bull; Authorized Guardian</p>
              </div>
              <a
                href="tel:4155550192"
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs rounded-full flex items-center space-x-1.5 shadow-sm"
                id="call-family-button"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call Sarah</span>
              </a>
            </div>

            <button
              onClick={handleDispatchFamilyAlert}
              disabled={alertSent}
              className="w-full py-2.5 px-4 rounded-xl border border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 font-medium text-xs flex items-center justify-center space-x-2 transition-colors"
              id="broadcast-silent-alert-button"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>{alertSent ? 'Broadcast Alert Sent!' : 'Send Urgent Alert Ping to All Family Members'}</span>
            </button>
          </div>

          {/* Senior Primary Care / Clinic */}
          <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Primary Geriatric Clinic</p>
              <p className="text-sm font-semibold text-gray-900">UCSF Memory & Senior Care</p>
              <p className="text-xs text-gray-600">Nurse Triage: (415) 353-2000</p>
            </div>
            <a
              href="tel:4153532000"
              className="px-3.5 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium text-xs rounded-full flex items-center space-x-1 transition-colors"
              id="call-clinic-button"
            >
              <PhoneCall className="w-3 h-3" />
              <span>Call Clinic</span>
            </a>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-gray-100 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium text-xs rounded-full transition-colors"
            id="dismiss-emergency-modal"
          >
            Close Safety Panel
          </button>
        </div>
      </div>
    </div>
  );
};
