import React, { useState, useEffect } from 'react';
import { 
  Heart, ShieldCheck, UserCheck, Smartphone, Download, ExternalLink, 
  CheckCircle2, CreditCard, Sparkles, MapPin, Phone, Mail, User, 
  Calendar, AlertCircle, ArrowRight, ArrowLeft, Lock, RefreshCw, 
  Radio, Award, Users, QrCode, Check
} from 'lucide-react';
import { SeniorProfile, FamilyUserAccount } from '../types';
import { CaregiverApkModal } from './CaregiverApkModal';

interface InitialOnboardingViewProps {
  onComplete: (senior: SeniorProfile, account: FamilyUserAccount) => void;
  onSkip?: () => void;
  defaultEmail?: string;
}

export const InitialOnboardingView: React.FC<InitialOnboardingViewProps> = ({
  onComplete,
  onSkip,
  defaultEmail = 'haxkscotty13@gmail.com',
}) => {
  // Current Step: 1: Welcome & Account, 2: Senior Profile, 3: Google Wallet & Billing, 4: Review & Ready
  const [step, setStep] = useState<number>(1);
  const [showCaregiverModal, setShowCaregiverModal] = useState<boolean>(false);

  // --- Step 1: User & Google Account State ---
  const [familyFullName, setFamilyFullName] = useState<string>('Scott Harmon');
  const [familyEmail, setFamilyEmail] = useState<string>(defaultEmail);
  const [familyPhone, setFamilyPhone] = useState<string>('(415) 555-0182');
  const [relationToSenior, setRelationToSenior] = useState<string>('Son');
  const [googleConnected, setGoogleConnected] = useState<boolean>(true);

  // --- Step 2: Senior Loved One Details ---
  const [seniorName, setSeniorName] = useState<string>('Eleanor Vance');
  const [seniorAge, setSeniorAge] = useState<number>(82);
  const [seniorAddress, setSeniorAddress] = useState<string>('2480 Washington St, San Francisco, CA');
  const [seniorRoutine, setSeniorRoutine] = useState<string>(
    'Enjoys morning chamomile tea, tending balcony potted herbs, quiet reminiscing, and 15-minute garden walks.'
  );
  const [specialNeeds, setSpecialNeeds] = useState<string>(
    'Uses a lightweight cane for steady balance. Needs warm, patient social companionship and memory engagement.'
  );
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Gardening & Plants', 'Storytelling & Old SF', 'Tea & Herbals', 'Classic Music'
  ]);
  const [comfortTopics, setComfortTopics] = useState<string>(
    'Victorian architecture, vintage San Francisco bakeries, classical piano, childhood trips to Point Reyes'
  );
  const [topicsToAvoid, setTopicsToAvoid] = useState<string>(
    'Recent hospital stays or stressful current events'
  );
  const [favoriteEra, setFavoriteEra] = useState<'1940s' | '1950s' | '1960s' | '1970s'>('1950s');
  const [emergencyName, setEmergencyName] = useState<string>('David Vance');
  const [emergencyPhone, setEmergencyPhone] = useState<string>('(415) 555-0199');
  const [emergencyRelation, setEmergencyRelation] = useState<string>('Son / Primary Guardian');
  const [allowsVolunteerVisits, setAllowsVolunteerVisits] = useState<boolean>(true);

  // --- Step 3: Google Wallet Detection & Billing State ---
  const [isDetectingWallet, setIsDetectingWallet] = useState<boolean>(true);
  const [googleWalletDetected, setGoogleWalletDetected] = useState<boolean>(false);
  const [paymentChoice, setPaymentChoice] = useState<'google_wallet' | 'card'>('card');
  
  // Card Details (Fallback if Google Wallet not present or chosen)
  const [cardHolder, setCardHolder] = useState<string>('Scott Harmon');
  const [cardNumber, setCardNumber] = useState<string>('4242 •••• •••• 4242');
  const [cardExp, setCardExp] = useState<string>('08/29');
  const [cardCvc, setCardCvc] = useState<string>('882');
  const [cardZip, setCardZip] = useState<string>('94115');
  const [cardBrand, setCardBrand] = useState<string>('Visa');

  // Google Wallet detection check
  useEffect(() => {
    setIsDetectingWallet(true);
    const timer = setTimeout(() => {
      // Check for browser PaymentRequest or Google Pay capability
      const hasPaymentRequest = typeof window !== 'undefined' && 'PaymentRequest' in window;
      const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
      
      // If Android device or PaymentRequest is supported
      if (hasPaymentRequest && isAndroid) {
        setGoogleWalletDetected(true);
        setPaymentChoice('google_wallet');
      } else {
        // Standard browser/desktop/fallback
        setGoogleWalletDetected(false);
        setPaymentChoice('card');
      }
      setIsDetectingWallet(false);
    }, 700);

    return () => clearTimeout(timer);
  }, []);

  const handleToggleInterest = (interest: string) => {
    setSelectedInterests((prev) => 
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleCompleteSetup = () => {
    const newSenior: SeniorProfile = {
      id: `senior-${Date.now()}`,
      familyUserId: `family-usr-${Date.now()}`,
      name: seniorName,
      age: seniorAge,
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      relation: relationToSenior,
      address: seniorAddress,
      coordinates: {
        lat: 37.7915,
        lng: -122.4284,
      },
      interests: selectedInterests,
      routinePreferences: seniorRoutine,
      specialNeeds,
      comfortTopics: comfortTopics.split(',').map((s) => s.trim()).filter(Boolean),
      topicsToAvoid: topicsToAvoid.split(',').map((s) => s.trim()).filter(Boolean),
      emergencyContactName: emergencyName,
      emergencyContactPhone: emergencyPhone,
      emergencyContactRelation: emergencyRelation,
      favoriteEra,
      allowsVolunteerVisits,
    };

    const familyAccount: FamilyUserAccount = {
      id: `account-${Date.now()}`,
      fullName: familyFullName,
      email: familyEmail,
      phone: familyPhone,
      relationToSenior,
      googleConnected,
      googlePhotoUrl: 'https://lh3.googleusercontent.com/a/default-user',
      paymentMethod: {
        type: paymentChoice,
        cardLast4: paymentChoice === 'card' ? cardNumber.slice(-4).replace(/[^0-9]/g, '') || '4242' : undefined,
        cardBrand: paymentChoice === 'card' ? cardBrand : 'Google Wallet',
        billingName: cardHolder,
        isVerified: true,
      },
      allowsVolunteerVisits,
      createdAt: new Date().toISOString(),
    };

    // Store in localStorage that initial onboarding was completed
    localStorage.setItem('compassionate_care_onboarded_v1', 'true');
    localStorage.setItem('compassionate_care_family_account', JSON.stringify(familyAccount));

    onComplete(newSenior, familyAccount);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#f7f9f8] flex flex-col overflow-y-auto font-sans antialiased text-gray-900">
      {/* Top Banner with Caregiver APK Callout */}
      <header className="bg-emerald-900 text-white border-b border-emerald-800/80 px-4 py-3 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="p-1 bg-emerald-700/70 rounded-md">
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
            </span>
            <span className="font-semibold text-emerald-100">
              Senior Companion Matchmaker <span className="text-emerald-300 font-bold">• First Launch Setup</span>
            </span>
          </div>

          {/* Caregiver APK Link */}
          <button
            onClick={() => setShowCaregiverModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 hover:text-white rounded-full border border-emerald-600/60 font-semibold transition-all shadow-xs"
            id="caregiver-apk-banner-button"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-300" />
            <span>Are you a Caregiver / Volunteer?</span>
            <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-full font-bold">
              Separate APK
            </span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-2">
            <span className={step >= 1 ? 'text-emerald-800' : ''}>1. Welcome & Account</span>
            <span className={step >= 2 ? 'text-emerald-800' : ''}>2. Senior Profile</span>
            <span className={step >= 3 ? 'text-emerald-800' : ''}>3. Google Wallet & Billing</span>
            <span className={step >= 4 ? 'text-emerald-800' : ''}>4. Ready to Match</span>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-700 h-full transition-all duration-300 ease-out"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* STEP 1: Welcome & Family Account */}
        {step === 1 && (
          <div className="bg-white rounded-3xl shadow-sm border border-emerald-900/10 p-6 sm:p-8 space-y-6 animate-fadeIn">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 text-xs font-bold mb-3 border border-emerald-200">
                <Heart className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                <span>Welcome to Compassionate Care</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Find a Vetted Companion for Your Senior Loved One
              </h1>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                Connect your Google account and tell us who will be managing visits. In the next step, you will set up your senior’s preferences and comfortable routine.
              </p>
            </div>

            {/* Google Account Connection Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/70 to-teal-50/70 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-gray-200 flex items-center justify-center font-bold text-gray-700 text-sm">
                  G
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-gray-900">Google Account</span>
                    <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-900 text-[10px] font-bold rounded-full flex items-center">
                      <Check className="w-2.5 h-2.5 mr-0.5" /> Connected
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">{familyEmail}</div>
                </div>
              </div>

              <div className="text-[11px] text-emerald-800 font-medium">
                Used for instant booking confirmation & Google Calendar integration
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Your Full Name (Family Contact)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={familyFullName}
                    onChange={(e) => setFamilyFullName(e.target.value)}
                    placeholder="e.g. Scott Harmon"
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Your Mobile Phone (for Live Visit Updates)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={familyPhone}
                    onChange={(e) => setFamilyPhone(e.target.value)}
                    placeholder="(415) 555-0182"
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Your Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={familyEmail}
                    onChange={(e) => setFamilyEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Your Relationship to Senior
                </label>
                <select
                  value={relationToSenior}
                  onChange={(e) => setRelationToSenior(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                >
                  <option value="Son">Son</option>
                  <option value="Daughter">Daughter</option>
                  <option value="Grandchild">Grandchild</option>
                  <option value="Spouse / Partner">Spouse / Partner</option>
                  <option value="Legal Guardian">Legal Guardian</option>
                  <option value="Other Relative">Other Relative</option>
                </select>
              </div>
            </div>

            {/* Caregiver APK Highlight Note */}
            <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 flex items-start space-x-3 text-xs text-amber-900">
              <Smartphone className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Are you looking to work or volunteer as a Companion?</span>
                <p className="text-amber-800 text-[11px] mt-0.5">
                  Companions use our separate <strong>Caregiver APK</strong> with GPS check-in logging and voice memo reports.{' '}
                  <button 
                    type="button" 
                    onClick={() => setShowCaregiverModal(true)}
                    className="text-emerald-900 font-bold underline hover:text-emerald-950 ml-1"
                  >
                    Open Caregiver APK Download & Volunteering Track &rarr;
                  </button>
                </p>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="pt-2 flex items-center justify-between">
              {onSkip ? (
                <button
                  type="button"
                  onClick={onSkip}
                  className="text-xs text-gray-500 hover:text-gray-800 font-semibold"
                >
                  Explore as Guest
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!familyFullName || !familyPhone}
                className="py-3 px-6 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                <span>Continue: Senior Profile</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Senior Loved One Profile */}
        {step === 2 && (
          <div className="bg-white rounded-3xl shadow-sm border border-emerald-900/10 p-6 sm:p-8 space-y-6 animate-fadeIn">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 text-xs font-bold mb-3 border border-emerald-200">
                <Heart className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                <span>Step 2 of 4</span>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                Tell Us About Your Senior Loved One
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                We use this information to match compatible companions, calculate driving ETAs, and prepare personal visit topics.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Senior’s Full Name
                </label>
                <input
                  type="text"
                  required
                  value={seniorName}
                  onChange={(e) => setSeniorName(e.target.value)}
                  placeholder="e.g. Eleanor Vance"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Senior’s Age
                </label>
                <input
                  type="number"
                  required
                  min={55}
                  max={110}
                  value={seniorAge}
                  onChange={(e) => setSeniorAge(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Residence Street Address (San Francisco Area)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={seniorAddress}
                  onChange={(e) => setSeniorAddress(e.target.value)}
                  placeholder="Street Address, City, State, ZIP"
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Used to find companions within your chosen distance radius (1–15 miles) on the interactive map.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Daily Comfort Routine
                </label>
                <textarea
                  rows={2}
                  value={seniorRoutine}
                  onChange={(e) => setSeniorRoutine(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Mobility & Non-Medical Needs
                </label>
                <textarea
                  rows={2}
                  value={specialNeeds}
                  onChange={(e) => setSpecialNeeds(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none resize-none"
                />
              </div>
            </div>

            {/* Interests Chips */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Passions & Social Interests (Click to select)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Gardening & Plants', 'Storytelling & Old SF', 'Tea & Herbals', 
                  'Classic Music', 'Chess & Board Games', 'Baking & Recipes', 
                  'Gentle Walks', 'Bird Watching', 'Art & Watercolors', 'Navy & Military History'
                ].map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => handleToggleInterest(interest)}
                    className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                      selectedInterests.includes(interest)
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            {/* Favorite Music Era */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Favorite Musical & Memory Era
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { era: '1940s', label: '1940s Big Band & Swing' },
                  { era: '1950s', label: '1950s Golden Era & Jazz' },
                  { era: '1960s', label: '1960s Motown & Folk' },
                  { era: '1970s', label: '1970s Classic Rock & Soul' },
                ].map(({ era, label }) => (
                  <button
                    key={era}
                    type="button"
                    onClick={() => setFavoriteEra(era as any)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      favoriteEra === era
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-700'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-extrabold text-xs">{era}</div>
                    <div className="text-[10px] text-gray-500 line-clamp-1">{label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Volunteer Companion Opt-in */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-start space-x-3">
              <input
                type="checkbox"
                id="volunteer-optin"
                checked={allowsVolunteerVisits}
                onChange={(e) => setAllowsVolunteerVisits(e.target.checked)}
                className="mt-1 w-4 h-4 accent-emerald-800 rounded"
              />
              <div>
                <label htmlFor="volunteer-optin" className="text-xs font-extrabold text-gray-900 block cursor-pointer">
                  Open to Volunteer Companion Visits ($0 / hr)
                </label>
                <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                  We offer a volunteer track where vetted nursing/medical students and retirees provide friendly, free social companionship visits. All volunteers pass the same Checkr background check.
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 flex items-center space-x-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!seniorName || !seniorAddress}
                className="py-3 px-6 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                <span>Continue: Payment & Google Wallet</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Google Wallet & Billing Info */}
        {step === 3 && (
          <div className="bg-white rounded-3xl shadow-sm border border-emerald-900/10 p-6 sm:p-8 space-y-6 animate-fadeIn">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 text-xs font-bold mb-3 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Step 3 of 4: Billing Setup</span>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                Billing Method & Google Wallet
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Your payment method is held securely on file. You are only billed after a companion checks out and you review the GPS visit summary.
              </p>
            </div>

            {/* Google Wallet Detection Engine */}
            <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-white shadow-xs border border-gray-200 flex items-center justify-center font-bold text-gray-700 text-xs">
                    G
                  </div>
                  <span className="text-xs font-extrabold text-gray-900">Google Wallet Detection</span>
                </div>

                {isDetectingWallet ? (
                  <span className="text-[11px] text-gray-500 flex items-center space-x-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Scanning device...</span>
                  </span>
                ) : googleWalletDetected ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Google Wallet Detected</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    Google Wallet Not Detected
                  </span>
                )}
              </div>

              {/* Status explanation */}
              {googleWalletDetected ? (
                <div 
                  onClick={() => setPaymentChoice('google_wallet')}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentChoice === 'google_wallet'
                      ? 'border-emerald-600 bg-emerald-50/70'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        checked={paymentChoice === 'google_wallet'} 
                        onChange={() => setPaymentChoice('google_wallet')} 
                        className="accent-emerald-800"
                      />
                      <span className="text-xs font-bold text-gray-900">Use Google Wallet for 1-Tap Checkout</span>
                    </div>
                    <span className="text-[10px] text-emerald-800 font-bold">Fast & Secure</span>
                  </div>
                  <p className="text-[11px] text-gray-600 ml-5 mt-1">
                    Authenticated via {familyEmail}. Automatically uses your Google Pay cards.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs text-amber-900">
                  <p className="text-[11px] leading-relaxed">
                    Google Wallet was not detected on this browser/environment. Please enter your credit/debit card details below for authorized companion bookings.
                  </p>
                </div>
              )}
            </div>

            {/* Credit / Debit Card Form */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900 flex items-center space-x-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-700" />
                  <span>Enter Card Details</span>
                </span>
                <span className="text-[11px] text-gray-500 font-medium">Stripe 256-bit Encrypted</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  required
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder="e.g. Scott Harmon"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Card Number
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4242 •••• •••• 4242"
                    className="w-full pl-9 pr-14 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none font-mono"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] font-bold bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">
                    {cardBrand}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Expires (MM/YY)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={cardExp}
                    onChange={(e) => setCardExp(e.target.value)}
                    placeholder="08/29"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none text-center font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    CVC / CVV
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    placeholder="882"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none text-center font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Billing ZIP
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={cardZip}
                    onChange={(e) => setCardZip(e.target.value)}
                    placeholder="94115"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none text-center font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-start space-x-2 text-[11px] text-emerald-900">
                <Lock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Zero Advance Fees:</strong> We perform a $0 test authorization. Your card will only be charged after the companion arrives, checks in via GPS, and you approve their post-visit summary.
                </span>
              </div>
            </div>

            {/* Navigation */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 flex items-center space-x-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(4)}
                className="py-3 px-6 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2"
              >
                <span>Review & Finish</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Review & Launch */}
        {step === 4 && (
          <div className="bg-white rounded-3xl shadow-sm border border-emerald-900/10 p-6 sm:p-8 space-y-6 animate-fadeIn">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold mb-3 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Ready to Launch</span>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                Setup Complete! Find Companions for {seniorName}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Your family account and senior profile are configured. Click below to view matched companions on the interactive San Francisco map.
              </p>
            </div>

            {/* Profile Summary Card */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs">
                    {seniorName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-gray-900">{seniorName} (Age {seniorAge})</div>
                    <div className="text-[11px] text-gray-500">{seniorAddress}</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Primary Senior
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500 text-[11px] block">Family Contact:</span>
                  <span className="font-bold text-gray-800">{familyFullName} ({relationToSenior})</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[11px] block">Billing / Wallet:</span>
                  <span className="font-bold text-emerald-800">
                    {paymentChoice === 'google_wallet' ? 'Google Wallet (Active)' : `Card ending in ${cardNumber.slice(-4)}`}
                  </span>
                </div>
              </div>

              {allowsVolunteerVisits && (
                <div className="text-[11px] font-medium text-emerald-800 flex items-center space-x-1.5 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Volunteer Companion Visits Enabled ($0 / hr community care option)</span>
                </div>
              )}
            </div>

            {/* Launch Action */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleCompleteSetup}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-sm shadow-lg shadow-emerald-900/15 flex items-center justify-center space-x-2 transition-all active:scale-[0.99]"
                id="finish-onboarding-button"
              >
                <span>Enter Compassionate Care & Discover Companions</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-full py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800"
              >
                &larr; Make Changes to Billing
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Caregiver APK Download & Volunteering Track Modal */}
      <CaregiverApkModal
        isOpen={showCaregiverModal}
        onClose={() => setShowCaregiverModal(false)}
        defaultTrack="volunteer"
      />
    </div>
  );
};
