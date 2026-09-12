import React, { useState } from 'react';
import { Companion, SeniorProfile } from '../types';
import { 
  X, Star, ShieldCheck, MapPin, Calendar, Clock, CheckCircle2, 
  Sparkles, Heart, Award, ArrowRight 
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { CheckrVettingModal } from './CheckrVettingModal';

interface CompanionDetailModalProps {
  companion: Companion;
  activeSenior: SeniorProfile;
  onClose: () => void;
  onBook: (companion: Companion) => void;
}

export const CompanionDetailModal: React.FC<CompanionDetailModalProps> = ({
  companion,
  activeSenior,
  onClose,
  onBook,
}) => {
  const [showCheckrModal, setShowCheckrModal] = useState(false);

  // Check matching interests with senior
  const sharedInterests = companion.interests.filter(interest => 
    activeSenior.interests.includes(interest)
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
        <div
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
          id="companion-detail-modal"
        >
          {/* Header image & close */}
          <div className="relative h-44 bg-gradient-to-r from-emerald-900 via-teal-800 to-emerald-950 p-6 flex flex-col justify-between text-white">
            <div className="flex items-center justify-between z-10">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-100 border border-white/20 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Non-Medical Social Companion</span>
              </span>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
                id="close-companion-detail"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative z-10 flex items-end justify-between">
              <div>
                <p className="text-xs text-emerald-200">Starting at</p>
                <p className="text-3xl font-extrabold text-white">
                  {formatCurrency(companion.hourlyRate)}
                  <span className="text-sm font-normal text-emerald-100">/hr</span>
                </p>
              </div>
              <div className="flex items-center space-x-1 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-white">
                <Star className="w-4 h-4 fill-amber-300 text-amber-300 inline" />
                <span>{companion.rating}</span>
                <span className="text-emerald-100 font-normal">({companion.reviewCount} reviews)</span>
              </div>
            </div>
          </div>

          {/* Profile Overview Card */}
          <div className="relative px-6 pt-0 pb-4 flex-1 overflow-y-auto space-y-5">
            {/* Avatar overlapping header */}
            <div className="flex items-end justify-between -mt-10 mb-2">
              <div className="relative">
                <img
                  src={companion.avatar}
                  alt={companion.name}
                  className="w-20 h-20 rounded-3xl object-cover ring-4 ring-white shadow-xl"
                />
                <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-600 text-white rounded-full ring-2 ring-white">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>

              {/* Checkr Verification Button */}
              <button
                onClick={() => setShowCheckrModal(true)}
                className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
                id="open-checkr-from-profile"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Checkr Verified</span>
                <span className="text-[10px] bg-emerald-200/80 px-1.5 py-0.2 rounded-sm text-emerald-900">PASS</span>
              </button>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900">{companion.name}</h3>
              <p className="text-sm text-gray-600 font-medium">{companion.title}</p>
              <p className="text-xs text-gray-500 mt-1 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span>{companion.locationName} &bull; {companion.distanceMiles} miles from {activeSenior.name}'s residence</span>
              </p>
            </div>

            {/* Shared Interests Spotlight */}
            {sharedInterests.length > 0 && (
              <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200">
                <div className="flex items-center space-x-1.5 mb-2">
                  <Heart className="w-4 h-4 text-emerald-700 fill-emerald-600" />
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                    {sharedInterests.length} Shared Interests with {activeSenior.name}
                  </h4>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sharedInterests.map((interest) => (
                    <span
                      key={interest}
                      className="px-2.5 py-1 bg-white rounded-full text-xs font-bold text-emerald-800 border border-emerald-300 shadow-2xs"
                    >
                      ✨ {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* About & Bio */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">About {companion.name.split(' ')[0]}</h4>
              <p className="text-sm text-gray-700 leading-relaxed">{companion.bio}</p>
            </div>

            {/* Specializations & Skills */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Companionship Focus</h4>
              <div className="flex flex-wrap gap-1.5">
                {companion.specializations.map((spec) => (
                  <span
                    key={spec}
                    className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
              <div className="flex items-center space-x-2 text-xs font-bold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Typical Availability</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                  const isAvailable = companion.availableDays.includes(day);
                  return (
                    <span
                      key={day}
                      className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                        isAvailable
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-gray-100 text-gray-400 opacity-60'
                      }`}
                    >
                      {day}
                    </span>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-gray-400 inline" />
                <span>Slots: {companion.availableTimeSlots.join(' • ')}</span>
              </p>
            </div>

            {/* Reviews */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Family Testimonials ({companion.reviews.length})
                </h4>
                <div className="flex items-center space-x-1 text-xs font-bold text-gray-700">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 inline" />
                  <span>{companion.rating} out of 5</span>
                </div>
              </div>
              <div className="space-y-3">
                {companion.reviews.map((rev) => (
                  <div key={rev.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-gray-900">{rev.authorName}</p>
                        <p className="text-[11px] text-gray-500">{rev.authorRelation}</p>
                      </div>
                      <div className="flex text-amber-400">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-700 italic">"{rev.comment}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky Booking CTA Footer */}
          <div className="p-4 bg-white border-t border-gray-100 flex items-center justify-between space-x-4">
            <div>
              <p className="text-xs text-gray-500">Hourly rate</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(companion.hourlyRate)}/hr</p>
            </div>

            <button
              onClick={() => onBook(companion)}
              className="flex-1 py-3 px-6 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-full shadow-lg flex items-center justify-center space-x-2 transition-transform active:scale-98"
              id="confirm-start-booking-btn"
            >
              <span>Schedule Visit with {companion.name.split(' ')[0]}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showCheckrModal && (
        <CheckrVettingModal
          companion={companion}
          onClose={() => setShowCheckrModal(false)}
        />
      )}
    </>
  );
};
