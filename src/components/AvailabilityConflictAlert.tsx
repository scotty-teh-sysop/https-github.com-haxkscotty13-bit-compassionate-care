import React from 'react';
import { 
  AlertTriangle, Clock, CheckCircle2, Info, 
  ArrowRight, Calendar, Sparkles, User, ShieldAlert 
} from 'lucide-react';
import { 
  AvailabilityConflictReport, 
  SuggestedAlternativeSlot, 
  ScheduleBlock 
} from '../utils/conflictDetector';

interface AvailabilityConflictAlertProps {
  report: AvailabilityConflictReport;
  companionName: string;
  onSelectAlternative: (alt: SuggestedAlternativeSlot) => void;
  allowConflictOverride?: boolean;
  onToggleOverride?: (override: boolean) => void;
  overrideActive?: boolean;
}

export const AvailabilityConflictAlert: React.FC<AvailabilityConflictAlertProps> = ({
  report,
  companionName,
  onSelectAlternative,
  allowConflictOverride = true,
  onToggleOverride,
  overrideActive = false,
}) => {
  // If no conflict and schedule is clear
  if (!report.hasConflict || report.severity === 'clear') {
    return (
      <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200/80 flex items-center justify-between text-xs transition-all duration-200">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-emerald-600 text-white rounded-xl shadow-xs">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-emerald-950 flex items-center space-x-1.5">
              <span>Availability Verified</span>
              <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-semibold px-2 py-0.5 rounded-full">
                Conflict-Free
              </span>
            </p>
            <p className="text-[11px] text-emerald-800/90 mt-0.5">
              {companionName} has no overlapping appointments scheduled during this window.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isDirectOverlap = report.conflictType === 'direct_overlap';
  const isTightBuffer = report.conflictType === 'tight_buffer';

  return (
    <div 
      className={`rounded-2xl border p-4 space-y-3.5 transition-all animate-in fade-in duration-200 ${
        isDirectOverlap 
          ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-500/20 text-rose-950' 
          : isTightBuffer
          ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-500/20 text-amber-950'
          : 'bg-blue-50/90 border-blue-200 text-blue-950'
      }`}
      id="availability-conflict-alert"
    >
      {/* Header Banner */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div 
            className={`p-2 rounded-xl text-white shrink-0 mt-0.5 shadow-xs ${
              isDirectOverlap 
                ? 'bg-rose-600' 
                : isTightBuffer 
                ? 'bg-amber-600' 
                : 'bg-blue-600'
            }`}
          >
            {isDirectOverlap ? (
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            ) : isTightBuffer ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <Info className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h4 className="text-xs font-black uppercase tracking-wide">
                {report.headline}
              </h4>
              <span 
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isDirectOverlap 
                    ? 'bg-rose-200 text-rose-900' 
                    : isTightBuffer 
                    ? 'bg-amber-200 text-amber-900' 
                    : 'bg-blue-200 text-blue-900'
                }`}
              >
                {isDirectOverlap ? 'Calendar Conflict' : isTightBuffer ? 'Buffer Warning' : 'Notice'}
              </span>
            </div>
            <p className="text-xs mt-1 leading-relaxed opacity-90">
              {report.explanation}
            </p>
          </div>
        </div>
      </div>

      {/* Conflicting Booking Details Card if available */}
      {report.conflictingBooking && (
        <div className="bg-white/80 rounded-xl p-2.5 border border-black/10 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold text-gray-800">
              Existing Visit: {report.conflictingBooking.startTime} – {report.conflictingBooking.endTime}
            </span>
          </div>
          <span className="text-[11px] text-gray-500">
            For {report.conflictingBooking.seniorName}
          </span>
        </div>
      )}

      {/* Visual Day Schedule Mini-Timeline */}
      {report.companionDaySchedule.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] text-gray-600 font-semibold">
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-gray-400" />
              <span>{companionName}&apos;s Day Schedule</span>
            </span>
            <span className="text-[10px] text-gray-500">8:00 AM – 7:00 PM Window</span>
          </div>

          <div className="bg-white/90 p-2.5 rounded-xl border border-black/10 space-y-2">
            {/* Timeline bar */}
            <div className="relative h-6 bg-gray-100 rounded-lg overflow-hidden flex items-center border border-gray-200">
              {/* Hour marker lines (9am, 12pm, 3pm, 6pm) */}
              <div className="absolute left-[8.3%] h-full w-[1px] bg-gray-200 pointer-events-none" />
              <div className="absolute left-[33.3%] h-full w-[1px] bg-gray-200 pointer-events-none" />
              <div className="absolute left-[58.3%] h-full w-[1px] bg-gray-200 pointer-events-none" />
              <div className="absolute left-[83.3%] h-full w-[1px] bg-gray-200 pointer-events-none" />

              {/* Render Schedule Blocks */}
              {report.companionDaySchedule.map((block) => {
                // Day range: 8 AM (480 min) to 7 PM (1140 min) => total 660 mins
                const dayStart = 480;
                const totalSpan = 660;
                const leftPercent = Math.max(0, Math.min(100, ((block.startMinutes - dayStart) / totalSpan) * 100));
                const widthPercent = Math.max(8, Math.min(100 - leftPercent, ((block.endMinutes - block.startMinutes) / totalSpan) * 100));

                if (block.isRequested) {
                  return (
                    <div
                      key={block.id}
                      style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                      className={`absolute top-0.5 bottom-0.5 rounded-md flex items-center justify-center text-[10px] font-bold text-white z-20 shadow-xs ${
                        block.isConflict 
                          ? 'bg-rose-600 ring-2 ring-rose-300 animate-pulse' 
                          : 'bg-emerald-600'
                      }`}
                      title={`Requested: ${block.startTime} - ${block.endTime}`}
                    >
                      <span className="truncate px-1">Requested</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={block.id}
                    style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                    className="absolute top-0.5 bottom-0.5 bg-slate-700/85 hover:bg-slate-900 rounded-md flex items-center justify-center text-[10px] font-bold text-white z-10 shadow-xs"
                    title={`Existing Booking: ${block.startTime} - ${block.endTime}`}
                  >
                    <span className="truncate px-1">{block.startTime}</span>
                  </div>
                );
              })}
            </div>

            {/* Timeline Legend */}
            <div className="flex items-center justify-between text-[10px] text-gray-500 pt-0.5 px-0.5">
              <span>9 AM</span>
              <span>12 PM (Noon)</span>
              <span>3 PM</span>
              <span>6 PM</span>
            </div>
          </div>
        </div>
      )}

      {/* Suggested Conflict-Free Alternatives */}
      {report.suggestedAlternatives.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-black/10">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-900">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Recommended Conflict-Free Alternative Times:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {report.suggestedAlternatives.map((alt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectAlternative(alt)}
                className="p-2.5 bg-white hover:bg-emerald-50 border border-emerald-300/80 hover:border-emerald-600 rounded-xl text-left transition-colors flex items-center justify-between group shadow-2xs cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-gray-900 group-hover:text-emerald-900 flex items-center space-x-1">
                    <span>{alt.label}</span>
                  </p>
                  <p className="text-[10px] text-gray-500 group-hover:text-emerald-700">
                    {alt.reason}
                  </p>
                </div>
                <div className="p-1 rounded-lg bg-emerald-100/60 group-hover:bg-emerald-600 text-emerald-800 group-hover:text-white transition-colors shrink-0 ml-2">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Override Warning & Checkbox for direct overlap */}
      {isDirectOverlap && allowConflictOverride && onToggleOverride && (
        <div className="pt-2 border-t border-rose-200/80 flex items-center space-x-2.5">
          <input
            type="checkbox"
            id="override-conflict-checkbox"
            checked={overrideActive}
            onChange={(e) => onToggleOverride(e.target.checked)}
            className="w-4 h-4 text-rose-600 border-rose-300 rounded focus:ring-rose-500 cursor-pointer"
          />
          <label 
            htmlFor="override-conflict-checkbox" 
            className="text-xs text-rose-900 font-medium cursor-pointer select-none"
          >
            I acknowledge this time overlaps with another visit. Submit request for companion to review availability.
          </label>
        </div>
      )}
    </div>
  );
};
