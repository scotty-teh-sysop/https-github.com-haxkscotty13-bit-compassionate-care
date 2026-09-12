import React, { useState } from 'react';
import { SeniorProfile } from '../types';
import { 
  Heart, Plus, User, MapPin, Sparkles, Phone, 
  Check, X, Edit3, ShieldAlert, HeartHandshake, Smile, Radio
} from 'lucide-react';
import { AVAILABLE_INTEREST_TAGS } from '../data/mockData';

interface SeniorProfileManagerProps {
  seniors: SeniorProfile[];
  activeSeniorId: string;
  onSelectActiveSenior: (id: string) => void;
  onAddNewSenior: (newSenior: SeniorProfile) => void;
  onOpenSoundscapes?: (senior: SeniorProfile) => void;
}

export const SeniorProfileManager: React.FC<SeniorProfileManagerProps> = ({
  seniors,
  activeSeniorId,
  onSelectActiveSenior,
  onAddNewSenior,
  onOpenSoundscapes,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState(80);
  const [relation, setRelation] = useState('Mother');
  const [address, setAddress] = useState('2140 Hyde St, San Francisco, CA');
  const [interests, setInterests] = useState<string[]>(['Gardening', 'Classical Music']);
  const [routinePreferences, setRoutinePreferences] = useState('Enjoys afternoon tea at 3:00 PM; loves sitting near window sunlight.');
  const [specialNeeds, setSpecialNeeds] = useState('Uses a walking cane for balance; non-medical social visits only.');
  const [comfortTopics, setComfortTopics] = useState('Favorite classical composers, 1960s travel, rose gardening');
  const [topicsToAvoid, setTopicsToAvoid] = useState('Recent hospitalizations or politics');
  const [favoriteEra, setFavoriteEra] = useState<'1940s' | '1950s' | '1960s' | '1970s'>('1950s');
  const [emergencyName, setEmergencyName] = useState('Sarah Vance');
  const [emergencyPhone, setEmergencyPhone] = useState('(415) 555-0192');

  const handleToggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newSenior: SeniorProfile = {
      id: `senior-${Date.now()}`,
      familyUserId: 'user-family-1',
      name: name.trim(),
      age: Number(age),
      avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
      relation: relation,
      address: address,
      coordinates: {
        lat: 37.7800 + (Math.random() - 0.5) * 0.03,
        lng: -122.4300 + (Math.random() - 0.5) * 0.03,
      },
      interests: interests,
      routinePreferences: routinePreferences,
      specialNeeds: specialNeeds,
      comfortTopics: comfortTopics.split(',').map(s => s.trim()).filter(Boolean),
      topicsToAvoid: topicsToAvoid.split(',').map(s => s.trim()).filter(Boolean),
      favoriteEra: favoriteEra,
      emergencyContactName: emergencyName,
      emergencyContactPhone: emergencyPhone,
      emergencyContactRelation: `${relation}'s Guardian`,
    };

    onAddNewSenior(newSenior);
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6" id="senior-profile-manager">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Loved Ones (Seniors)</h2>
          <p className="text-xs text-gray-500">Manage care profiles, interests, routines, and emergency contacts</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-full shadow-xs flex items-center space-x-1.5 transition-transform active:scale-95"
          id="add-senior-btn"
        >
          <Plus className="w-4 h-4" />
          <span>Add Senior Profile</span>
        </button>
      </div>

      {/* Senior Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {seniors.map((senior) => {
          const isActive = senior.id === activeSeniorId;
          return (
            <div
              key={senior.id}
              onClick={() => onSelectActiveSenior(senior.id)}
              className={`p-5 rounded-3xl border transition-all cursor-pointer bg-white relative ${
                isActive
                  ? 'border-emerald-600 ring-2 ring-emerald-600/30 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 shadow-xs'
              }`}
            >
              {isActive && (
                <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300 flex items-center space-x-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Active Profile</span>
                </div>
              )}

              <div className="flex items-start space-x-3.5 mb-4">
                <img
                  src={senior.avatar}
                  alt={senior.name}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-600/20"
                />
                <div>
                  <h3 className="text-base font-bold text-gray-900">{senior.name}</h3>
                  <p className="text-xs text-gray-500">{senior.age} years old &bull; {senior.relation}</p>
                  <p className="text-xs text-gray-600 flex items-center space-x-1 mt-1">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span className="truncate max-w-[200px]">{senior.address}</span>
                  </p>
                </div>
              </div>

              {/* Interests */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-bold text-gray-700 block mb-1">Passions & Interests:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {senior.interests.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 rounded-md text-[11px] font-medium border border-emerald-100"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                  <p className="font-semibold text-gray-800">Routine & Needs:</p>
                  <p className="text-gray-600 text-[11px] leading-relaxed">{senior.routinePreferences}</p>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-amber-50/70 rounded-xl border border-amber-200/60 text-xs">
                  <span className="font-semibold text-amber-900 flex items-center space-x-1">
                    <span>📻 Nostalgic Era:</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                      {senior.favoriteEra || '1950s'}
                    </span>
                    {onOpenSoundscapes && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenSoundscapes(senior);
                        }}
                        className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-[11px] font-bold flex items-center space-x-1 shadow-xs transition-colors cursor-pointer"
                        title="Open Nostalgic Soundscape & Reminiscence studio"
                      >
                        <Radio className="w-3 h-3" />
                        <span>Soundscapes</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                  <span>Emergency: {senior.emergencyContactName}</span>
                  <span className="font-mono text-emerald-800 font-bold">{senior.emergencyContactPhone}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Senior Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]">
            <div className="bg-emerald-800 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Create Senior Loved One Profile</h3>
                <p className="text-xs text-emerald-200">Helps companions connect meaningfully</p>
              </div>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-1 rounded-full hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Margaret Vance"
                    required
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Relationship</label>
                  <input
                    type="text"
                    value={relation}
                    onChange={(e) => setRelation(e.target.value)}
                    placeholder="e.g., Mother, Aunt"
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Residence Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street, San Francisco, CA"
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Interests Tag Selector */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Interests & Hobbies</label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_INTEREST_TAGS.filter(t => t !== 'All').map((tag) => {
                    const isSel = interests.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleInterest(tag)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          isSel
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Routine & Daily Preferences</label>
                <textarea
                  rows={2}
                  value={routinePreferences}
                  onChange={(e) => setRoutinePreferences(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Comfort Topics (What brings joy?)</label>
                <input
                  type="text"
                  value={comfortTopics}
                  onChange={(e) => setComfortTopics(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Topics to Avoid</label>
                <input
                  type="text"
                  value={topicsToAvoid}
                  onChange={(e) => setTopicsToAvoid(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Favorite Nostalgic & Musical Era</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { era: '1940s', label: '1940s Big Band & Swing' },
                    { era: '1950s', label: '1950s Golden Crooners' },
                    { era: '1960s', label: '1960s Motown & Folk' },
                    { era: '1970s', label: '1970s Classic Acoustic' },
                  ].map((item) => (
                    <button
                      key={item.era}
                      type="button"
                      onClick={() => setFavoriteEra(item.era as any)}
                      className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-colors ${
                        favoriteEra === item.era
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-1 ring-emerald-600'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Emergency Contact Name</label>
                  <input
                    type="text"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Emergency Phone</label>
                  <input
                    type="text"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-full shadow-md"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
