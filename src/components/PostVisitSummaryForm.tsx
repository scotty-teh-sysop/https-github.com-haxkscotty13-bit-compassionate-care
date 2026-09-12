import React, { useState } from 'react';
import { Booking, PostVisitSummary, VoiceMemo } from '../types';
import { 
  Camera, CheckCircle2, Heart, Sparkles, Plus, 
  X, Image as ImageIcon, Smile, Coffee, Check, Send, Mic
} from 'lucide-react';
import { VoiceMemoRecorder } from './VoiceMemoRecorder';

interface PostVisitSummaryFormProps {
  booking: Booking;
  onCancel: () => void;
  onSubmitSummary: (bookingId: string, summary: PostVisitSummary) => void;
}

const PRESET_SAMPLE_PHOTOS = [
  'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=600&q=80', // Plant potting
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80', // Tea & laughter
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80', // Friendly conversation
];

const MOOD_OPTIONS: Array<PostVisitSummary['moodRating']> = [
  'Joyful',
  'Calm',
  'Engaged',
  'Thoughtful',
  'Restful',
  'Tired',
];

const DEFAULT_ACTIVITIES = [
  'Pruned & tended porch flowerpots',
  'Steeped hot peppermint tea with honey',
  'Reminisced about Eleanor’s travel stories',
  'Completed 15-min gentle courtyard stroll',
  'Listened to 1950s radio music',
  'Read chapter 4 of favorite book',
  'Shared afternoon oatmeal biscuits',
];

export const PostVisitSummaryForm: React.FC<PostVisitSummaryFormProps> = ({
  booking,
  onCancel,
  onSubmitSummary,
}) => {
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([PRESET_SAMPLE_PHOTOS[0]]);
  const [selectedMood, setSelectedMood] = useState<PostVisitSummary['moodRating']>('Joyful');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([
    'Pruned & tended porch flowerpots',
    'Steeped hot peppermint tea with honey',
    'Reminisced about Eleanor’s travel stories',
  ]);
  const [newActivityInput, setNewActivityInput] = useState('');
  const [notesToFamily, setNotesToFamily] = useState(
    `Eleanor was in fantastic spirits today! We spent the first hour trimming the heirloom roses on the porch, and then enjoyed tea together. She proudly shared stories about growing up in San Francisco.`
  );
  const [hydrationSnackNote, setHydrationSnackNote] = useState(
    'Drank 16oz of water and 1 cup of herbal tea. Ate two lemon cookies at 3:15 PM.'
  );
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [voiceMemo, setVoiceMemo] = useState<VoiceMemo | undefined>(booking.postVisitSummary?.voiceMemo);

  const toggleActivity = (activity: string) => {
    if (selectedActivities.includes(activity)) {
      setSelectedActivities(selectedActivities.filter((a) => a !== activity));
    } else {
      setSelectedActivities([...selectedActivities, activity]);
    }
  };

  const handleAddCustomActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityInput.trim()) return;
    if (!selectedActivities.includes(newActivityInput.trim())) {
      setSelectedActivities([...selectedActivities, newActivityInput.trim()]);
    }
    setNewActivityInput('');
  };

  const handleAddPhoto = (photo: string) => {
    if (!selectedPhotos.includes(photo)) {
      setSelectedPhotos([...selectedPhotos, photo]);
    }
  };

  const handleRemovePhoto = (photo: string) => {
    setSelectedPhotos(selectedPhotos.filter((p) => p !== photo));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const summary: PostVisitSummary = {
      submittedAt: 'Just now',
      photos: selectedPhotos.length > 0 ? selectedPhotos : [PRESET_SAMPLE_PHOTOS[0]],
      moodRating: selectedMood,
      activitiesCompleted: selectedActivities,
      notesToFamily: notesToFamily,
      hydrationSnackNote: hydrationSnackNote,
      companionSignature: `${booking.companionName}, Certified Senior Social Companion`,
      voiceMemo: voiceMemo,
    };

    onSubmitSummary(booking.id, summary);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs">
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        id="post-visit-summary-modal"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <Camera className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Post-Visit Summary Report</h3>
              <p className="text-xs text-emerald-200">Mandatory checkout card for {booking.seniorName}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white/80 hover:text-white"
            id="close-summary-form-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Step 1: Photo Snapshot of the Visit */}
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
              1. Visit Photo Update <span className="text-emerald-700">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Share a photo with the family showing the activity or smile! (Patterned after Rover Cards)
            </p>

            {/* Photo preview gallery */}
            <div className="grid grid-cols-3 gap-2 mb-2.5">
              {selectedPhotos.map((url, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden aspect-square border border-gray-200 shadow-2xs">
                  <img src={url} alt="Visit moment" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(url)}
                    className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-black"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setShowAddPhoto(!showAddPhoto)}
                className="rounded-xl border-2 border-dashed border-emerald-300 hover:border-emerald-600 bg-emerald-50/50 flex flex-col items-center justify-center p-2 text-emerald-800 transition-colors"
              >
                <Plus className="w-5 h-5 mb-1 text-emerald-600" />
                <span className="text-[11px] font-bold">Add Photo</span>
              </button>
            </div>

            {/* Quick Preset Selector */}
            <div className="flex items-center space-x-2 overflow-x-auto py-1">
              <span className="text-[11px] font-bold text-gray-500 shrink-0">Sample Snapshots:</span>
              {PRESET_SAMPLE_PHOTOS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddPhoto(url)}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[11px] font-medium shrink-0 flex items-center space-x-1"
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>Photo #{idx + 1}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Mood Rating */}
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
              2. How was {booking.seniorName.split(' ')[0]}'s mood today? <span className="text-emerald-700">*</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {MOOD_OPTIONS.map((mood) => (
                <button
                  key={mood}
                  type="button"
                  onClick={() => setSelectedMood(mood)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                    selectedMood === mood
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Activities Completed */}
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
              3. Activities Completed During Visit
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {DEFAULT_ACTIVITIES.map((act) => {
                const isChecked = selectedActivities.includes(act);
                return (
                  <button
                    key={act}
                    type="button"
                    onClick={() => toggleActivity(act)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center space-x-1.5 transition-all ${
                      isChecked
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 text-emerald-700" />}
                    <span>{act}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 4: Personal Note to Family */}
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
              4. Note to Family (What did you talk about?) <span className="text-emerald-700">*</span>
            </label>
            <textarea
              rows={3}
              value={notesToFamily}
              onChange={(e) => setNotesToFamily(e.target.value)}
              required
              className="w-full p-3 rounded-xl border border-gray-200 text-xs text-gray-800 bg-gray-50 focus:bg-white focus:border-emerald-600 focus:outline-none resize-none"
            />
          </div>

          {/* Step 5: 30-Second Voice Memo for Family */}
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
              5. 30-Second Voice Memo for Family
            </label>
            <VoiceMemoRecorder
              seniorName={booking.seniorName}
              companionName={booking.companionName}
              onSaveVoiceMemo={(memo) => setVoiceMemo(memo)}
              existingVoiceMemo={voiceMemo}
            />
          </div>

          {/* Step 6: Hydration & Snack confirmation */}
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
              6. Hydration & Snack Check
            </label>
            <input
              type="text"
              value={hydrationSnackNote}
              onChange={(e) => setHydrationSnackNote(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-200 text-xs text-gray-800 bg-gray-50 focus:bg-white focus:border-emerald-600 focus:outline-none"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-full"
            >
              Back to Active Visit
            </button>

            <button
              type="submit"
              className="py-3 px-6 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-full shadow-lg flex items-center space-x-2 transition-transform active:scale-98"
              id="confirm-submit-summary-btn"
            >
              <Send className="w-4 h-4" />
              <span>Sign Off & Send Summary to Family</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
