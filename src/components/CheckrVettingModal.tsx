import React from 'react';
import { ShieldCheck, UserCheck, HeartPulse, Award, FileText, X, CheckCircle2 } from 'lucide-react';
import { Companion } from '../types';

interface CheckrVettingModalProps {
  companion: Companion;
  onClose: () => void;
}

export const CheckrVettingModal: React.FC<CheckrVettingModalProps> = ({ companion, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 animate-in fade-in zoom-in-95 duration-200"
        id="checkr-vetting-modal"
      >
        {/* Header with M3 Emerald Tint */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-md">
              <ShieldCheck className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Trust & Safety Verification</h3>
              <p className="text-xs text-emerald-100">Powered by Checkr & ID.me Integration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors text-white/80 hover:text-white"
            id="close-checkr-modal"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Companion Brief Header */}
        <div className="px-6 py-4 bg-emerald-50/60 border-b border-emerald-100 flex items-center space-x-4">
          <img
            src={companion.avatar}
            alt={companion.name}
            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-600/30"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-bold text-gray-900 text-base">{companion.name}</h4>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                Fully Cleared
              </span>
            </div>
            <p className="text-xs text-gray-600">Report ID: <code className="font-mono text-emerald-800 font-semibold">{companion.vetting.checkrReportId}</code></p>
            <p className="text-xs text-gray-500">Last Verified: {companion.vetting.backgroundCheckDate}</p>
          </div>
        </div>

        {/* Checkr Verification Breakdown */}
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Automated Background Check Results</h5>
            
            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 flex items-start space-x-3.5">
              <UserCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">Government ID & SSN Trace</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">PASS</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Biometric facial match against RealID driver's license.</p>
              </div>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 flex items-start space-x-3.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">National & County Criminal Records</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">CLEAR</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">7-year comprehensive federal, state, and county search.</p>
              </div>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 flex items-start space-x-3.5">
              <FileText className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">Elder Care & Vulnerable Adult Registry</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">CLEAR</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Cross-referenced with Dept of Social Services registry.</p>
              </div>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 flex items-start space-x-3.5">
              <HeartPulse className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">CPR & First Aid Certification</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">VERIFIED</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">American Red Cross Adult & Senior CPR certified.</p>
              </div>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 flex items-start space-x-3.5">
              <Award className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">Senior Social Care Training</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">COMPLETED</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Compassionate Care 10-hour non-medical companion curriculum.</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900">
            <p className="font-semibold mb-1">Non-Medical Visit Guarantee</p>
            Companions provide social companionship, conversational therapy, light activities, and presence. They do not administer medications or perform clinical medical tasks.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm rounded-full transition-colors shadow-sm"
            id="acknowledge-checkr-report"
          >
            Understood & Verified
          </button>
        </div>
      </div>
    </div>
  );
};
