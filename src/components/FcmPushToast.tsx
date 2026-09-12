import React from 'react';
import { Bell, CheckCircle2, Eye, X, Clock } from 'lucide-react';
import { FcmNotificationPayload } from '../types';

interface FcmPushToastProps {
  payload: FcmNotificationPayload;
  onCheckIn: (bookingId?: string) => void;
  onReviewDetails: (bookingId?: string) => void;
  onDismiss: () => void;
}

export const FcmPushToast: React.FC<FcmPushToastProps> = ({
  payload,
  onCheckIn,
  onReviewDetails,
  onDismiss,
}) => {
  const bookingId = payload.data?.bookingId;

  return (
    <aside 
      aria-label="Push notifications"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[94vw] max-w-md animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto"
    >
      <div 
        className="bg-slate-900/95 backdrop-blur-md text-white rounded-3xl p-4 shadow-2xl border border-emerald-500/40 ring-1 ring-emerald-500/20 space-y-3"
        id="fcm-push-toast"
      >
        {/* Brand & Push Tag Line */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-[10px]">
              CC
            </div>
            <span className="text-[10px] font-black tracking-wider text-emerald-400 uppercase">
              FCM Web Push &bull; 1-Hour Visit Reminder
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-slate-400">Just now</span>
            <button
              onClick={onDismiss}
              className="text-slate-400 hover:text-white p-0.5 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
              title="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex items-start space-x-3">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl shrink-0 mt-0.5">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">
              {payload.title}
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {payload.body}
            </p>
          </div>
        </div>

        {/* Action Buttons for 1-Hour Reminder */}
        <div className="flex items-center space-x-2 pt-1">
          <button
            onClick={() => {
              onCheckIn(bookingId);
              onDismiss();
            }}
            className="flex-1 py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
            id="fcm-toast-checkin-btn"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Check In</span>
          </button>

          <button
            onClick={() => {
              onReviewDetails(bookingId);
              onDismiss();
            }}
            className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            id="fcm-toast-review-btn"
          >
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>Review Details</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
