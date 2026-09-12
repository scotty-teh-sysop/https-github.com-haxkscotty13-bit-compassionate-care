import React from 'react';
import { Companion, SeniorProfile } from '../types';
import { Star, ShieldCheck, MapPin, Calendar, Heart, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface CompanionCardProps {
  companion: Companion;
  activeSenior: SeniorProfile;
  onSelect: (companion: Companion) => void;
  onBook: (companion: Companion) => void;
}

export const CompanionCard: React.FC<CompanionCardProps> = ({
  companion,
  activeSenior,
  onSelect,
  onBook,
}) => {
  const sharedInterests = companion.interests.filter(i => activeSenior.interests.includes(i));

  return (
    <div
      className="bg-white rounded-3xl p-4 sm:p-5 border border-emerald-950/5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4"
      id={`companion-card-${companion.id}`}
    >
      <div className="flex items-start space-x-3.5">
        <div className="relative shrink-0">
          <img
            src={companion.avatar}
            alt={companion.name}
            className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover ring-2 ring-emerald-600/20"
          />
          {companion.vetting.checkrCleared && (
            <div
              className="absolute -bottom-1 -right-1 p-1 bg-emerald-600 text-white rounded-full ring-2 ring-white shadow-xs"
              title="Checkr Background Checked & ID Verified"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-base sm:text-lg truncate">{companion.name}</h3>
              <p className="text-xs text-gray-500 font-medium truncate">{companion.title}</p>
            </div>
            <div className="text-right shrink-0 ml-2">
              {companion.isVolunteer || companion.hourlyRate === 0 ? (
                <span className="inline-block px-2.5 py-1 text-xs font-black text-emerald-800 bg-emerald-100 rounded-full border border-emerald-300">
                  Free Volunteer
                </span>
              ) : (
                <p className="text-base sm:text-lg font-black text-emerald-800">
                  {formatCurrency(companion.hourlyRate)}
                  <span className="text-xs font-normal text-gray-500">/hr</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3 mt-1.5 text-xs text-gray-500">
            <span className="flex items-center font-semibold text-gray-800">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 inline mr-1" />
              {companion.rating} <span className="text-gray-400 font-normal ml-0.5">({companion.reviewCount})</span>
            </span>
            <span>&bull;</span>
            <span className="flex items-center text-gray-600">
              <MapPin className="w-3 h-3 mr-0.5 text-gray-400" />
              {companion.distanceMiles} mi away
            </span>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
        {companion.bio}
      </p>

      {/* Shared Interests Chips */}
      {sharedInterests.length > 0 && (
        <div className="pt-1">
          <p className="text-[11px] font-bold text-emerald-800 flex items-center space-x-1 mb-1.5">
            <Heart className="w-3 h-3 fill-emerald-600 text-emerald-700" />
            <span>Shared with {activeSenior.name.split(' ')[0]}:</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {sharedInterests.slice(0, 3).map((item) => (
              <span
                key={item}
                className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200/60 rounded-md text-[11px] font-semibold"
              >
                {item}
              </span>
            ))}
            {sharedInterests.length > 3 && (
              <span className="px-1.5 py-0.5 text-[11px] text-gray-500 font-medium">
                +{sharedInterests.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-2 border-t border-gray-100 flex items-center justify-between space-x-2">
        <button
          onClick={() => onSelect(companion)}
          className="px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          id={`view-profile-${companion.id}`}
        >
          View Profile
        </button>

        <button
          onClick={() => onBook(companion)}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-full shadow-xs flex items-center space-x-1.5 transition-transform active:scale-95"
          id={`book-companion-${companion.id}`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Book Visit</span>
        </button>
      </div>
    </div>
  );
};
