import React, { useState, useMemo } from 'react';
import { Booking, VoiceMemo } from '../types';
import { 
  Heart, Calendar, Clock, MapPin, ShieldCheck, 
  Star, Check, MessageSquare, Coffee, X, Send, Mic
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { VoiceMemoPlayer } from './VoiceMemoPlayer';
import { generateSyntheticVoiceMemo } from '../utils/audioEngine';

interface PostVisitSummaryViewProps {
  booking: Booking;
  onClose: () => void;
  onSubmitRating?: (bookingId: string, rating: number, review: string) => void;
}

export const PostVisitSummaryView: React.FC<PostVisitSummaryViewProps> = ({
  booking,
  onClose,
  onSubmitRating,
}) => {
  const summary = booking.postVisitSummary;
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [userRating, setUserRating] = useState(booking.seekerRating?.rating || 5);
  const [userReview, setUserReview] = useState(booking.seekerRating?.review || '');
  const [reviewSubmitted, setReviewSubmitted] = useState(!!booking.seekerRating);

  // Use recorded voice memo or synthesize a warm visit snippet if not recorded
  const activeVoiceMemo: VoiceMemo = useMemo(() => {
    if (summary?.voiceMemo) {
      return summary.voiceMemo;
    }
    const synth = generateSyntheticVoiceMemo(booking.seniorName, booking.companionName, 22);
    return {
      id: `memo-${booking.id}`,
      audioUrl: synth.audioUrl,
      durationSeconds: 22,
      label: 'Post-visit voice check-in',
      recordedAt: summary?.submittedAt || '4:05 PM',
      transcriptPreview: synth.transcript,
    };
  }, [summary?.voiceMemo, booking.id, booking.seniorName, booking.companionName, summary?.submittedAt]);

  if (!summary) {
    return null;
  }

  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmitRating) {
      onSubmitRating(booking.id, userRating, userReview);
    }
    setReviewSubmitted(true);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs">
        <div
          className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
          id="post-visit-summary-view-modal"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Heart className="w-5 h-5 text-emerald-200 fill-current" />
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg">Senior Social Visit Report</h3>
                <p className="text-xs text-emerald-200">
                  {booking.seniorName} with {booking.companionName} &bull; {booking.scheduledDate}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white/80 hover:text-white"
              id="close-summary-view-modal"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* GPS Verified Visit Card */}
            <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>GPS Geofence Verified Check-In & Check-Out</span>
                </div>
                <p className="text-xs text-gray-600">
                  {booking.visitTracking?.checkInTime || '2:00 PM'} – {booking.visitTracking?.checkOutTime || '4:02 PM'} ({booking.durationHours} hrs total)
                </p>
                <p className="text-[11px] text-gray-500">{booking.address}</p>
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-emerald-700 text-white rounded-full text-xs font-bold shadow-2xs">
                  {summary.moodRating} Mood
                </span>
              </div>
            </div>

            {/* Photo Gallery (Rover Cards style) */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Visit Photos ({summary.photos.length})
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                {summary.photos.map((photoUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedPhoto(photoUrl)}
                    className="relative rounded-2xl overflow-hidden aspect-video border border-gray-200 cursor-pointer group shadow-2xs"
                  >
                    <img
                      src={photoUrl}
                      alt="Visit highlight"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-end p-2">
                      <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs">
                        Click to expand
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 30-Second Voice Memo from Companion */}
            <VoiceMemoPlayer
              voiceMemo={activeVoiceMemo}
              companionName={booking.companionName}
              seniorName={booking.seniorName}
            />

            {/* Companion Narrative Note to Family */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
              <div className="flex items-center space-x-2">
                <img
                  src={booking.companionAvatar}
                  alt={booking.companionName}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <h5 className="text-xs font-bold text-gray-900">{booking.companionName}'s Note to You</h5>
                  <p className="text-[10px] text-gray-500">Certified Senior Companion</p>
                </div>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed italic bg-white p-3 rounded-xl border border-gray-100">
                "{summary.notesToFamily}"
              </p>
            </div>

            {/* Activities Completed */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Activities & Social Engagement
              </h4>
              <div className="space-y-1.5">
                {summary.activitiesCompleted.map((act, i) => (
                  <div key={i} className="flex items-center space-x-2 text-xs text-gray-800">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>{act}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hydration & Nutrition */}
            <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 flex items-start space-x-3 text-xs">
              <Coffee className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-900 block">Hydration & Nutrition Check</span>
                <span className="text-amber-800">{summary.hydrationSnackNote}</span>
              </div>
            </div>

            {/* Family Review & Rating Section */}
            <div className="pt-3 border-t border-gray-200">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Your Rating for {booking.companionName}
              </h4>

              {reviewSubmitted ? (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                  <div className="flex items-center space-x-1 text-amber-500 mb-1">
                    {Array.from({ length: userRating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                    <span className="font-bold text-emerald-900 ml-1">Review Submitted</span>
                  </div>
                  <p className="text-gray-700 italic">"{userReview || 'Excellent and caring companion.'}"</p>
                </div>
              ) : (
                <form onSubmit={handleRatingSubmit} className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-600 font-medium">Rating:</span>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setUserRating(star)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= userRating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    value={userReview}
                    onChange={(e) => setUserReview(e.target.value)}
                    placeholder="Share feedback on how the visit went..."
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />

                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-full shadow-xs flex items-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Family Review</span>
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs rounded-full transition-colors"
            >
              Close Report
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox for full-size photo viewing */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh]">
            <img src={selectedPhoto} alt="Enlarged" className="rounded-2xl max-h-[85vh] object-contain" />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
