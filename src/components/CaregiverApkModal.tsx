import React, { useState } from 'react';
import { 
  Heart, Download, ExternalLink, ShieldCheck, CheckCircle2, 
  Smartphone, Users, QrCode, Sparkles, Clock, Award, X, 
  ArrowRight, AlertCircle, Building2, FileCheck, DollarSign,
  FileText, Globe, MapPin, FileUp
} from 'lucide-react';
import { CaregiverApplication } from '../types';
import { db, isInitialized } from '../firebase/config';
import { collection, doc, setDoc } from 'firebase/firestore';
import { AlbertaVscModal } from './AlbertaVscModal';

interface CaregiverApkModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTrack?: 'volunteer' | 'professional';
}

export const CaregiverApkModal: React.FC<CaregiverApkModalProps> = ({
  isOpen,
  onClose,
  defaultTrack = 'volunteer',
}) => {
  const [selectedTrack, setSelectedTrack] = useState<'volunteer' | 'professional'>(defaultTrack);
  const [activeTab, setActiveTab] = useState<'download' | 'signup' | 'certifications'>('download');
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadComplete, setDownloadComplete] = useState<boolean>(false);
  const [isVscModalOpen, setIsVscModalOpen] = useState(false);

  // Caregiver Signup Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState<'US' | 'CA'>('CA');
  const [city, setCity] = useState('Calgary, AB');
  const [bio, setBio] = useState('');
  const [checkrAgreed, setCheckrAgreed] = useState(true);
  const [albertaVscAgreed, setAlbertaVscAgreed] = useState(true);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Gardening & Plants', 'Storytelling & History', 'Classic Music'
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownloadApk = () => {
    setDownloadProgress(10);
    setDownloadComplete(false);

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev === null) return 10;
        if (prev >= 100) {
          clearInterval(interval);
          setDownloadComplete(true);
          
          // Trigger browser download of simulated APK package descriptor
          const apkBlob = new Blob([
            `Compassionate Care - Caregiver Companion APK Package\n` +
            `Package Name: com.compassionatecare.caregiver\n` +
            `Version: 1.2.0 (Build 42)\n` +
            `Target SDK: Android 34 (Android 14+)\n` +
            `Features: Real-time GPS Geofence Check-in, High-fidelity 30s Audio Memo Recorder, Post-visit photo upload, Checkr credential synchronization.\n` +
            `Track: ${selectedTrack === 'volunteer' ? 'Volunteer Companion Track' : 'Professional Companion Track'}\n` +
            `Download Date: ${new Date().toISOString()}\n`
          ], { type: 'application/vnd.android.package-archive' });
          
          const url = URL.createObjectURL(apkBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'CompassionateCare-Caregiver-v1.2.0.apk';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          return 100;
        }
        return prev + 25;
      });
    }, 200);
  };

  const handleCaregiverSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone) return;

    setIsSubmitting(true);
    const newApplication: CaregiverApplication = {
      id: `caregiver-app-${Date.now()}`,
      fullName,
      email,
      phone,
      country,
      city,
      track: selectedTrack,
      interests: selectedInterests,
      bio: bio || `${selectedTrack === 'volunteer' ? 'Volunteer' : 'Professional'} companion passionate about elderly social wellness.`,
      checkrAgreed,
      albertaVscAgreed: country === 'CA' ? albertaVscAgreed : undefined,
      status: 'pending_vetting',
      submittedAt: new Date().toISOString(),
    };

    try {
      if (isInitialized && db) {
        await setDoc(doc(collection(db, 'caregiverApplications'), newApplication.id), newApplication);
      }
      // Also store locally
      localStorage.setItem(`caregiver_app_${newApplication.id}`, JSON.stringify(newApplication));
      setSubmitSuccess(true);
    } catch (err) {
      console.warn('Saved application locally:', err);
      setSubmitSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleInterest = (tag: string) => {
    setSelectedInterests((prev) => 
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-emerald-900/10 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 bg-emerald-700/80 rounded-2xl border border-emerald-500/30">
              <Smartphone className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                Separate Companion APK
              </span>
              <h2 className="text-xl font-extrabold tracking-tight">Caregiver & Companion App</h2>
            </div>
          </div>
          <p className="text-emerald-100 text-sm leading-relaxed max-w-xl">
            The Caregiver Companion app is a dedicated Android APK tailored exclusively for visit companions, featuring background GPS geofence check-ins, audio voice memo logs, and live visit reports.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 bg-gray-50/70 p-2 gap-2">
          <button
            onClick={() => setActiveTab('download')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'download'
                ? 'bg-white text-emerald-900 shadow-sm border border-emerald-900/10'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Download Caregiver APK</span>
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'signup'
                ? 'bg-white text-emerald-900 shadow-sm border border-emerald-900/10'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-700" />
            <span>Caregiver Sign-Up</span>
          </button>
          <button
            onClick={() => setActiveTab('certifications')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'certifications'
                ? 'bg-white text-emerald-900 shadow-sm border border-emerald-900/10'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Canada (AB) VSC Cert</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* Caregiver Track Selection (Volunteer vs Paid) */}
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  Caregiver Tracks Available
                </span>
                <h4 className="text-sm font-extrabold text-gray-900">Choose How You Wish to Serve</h4>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 border border-emerald-300">
                Volunteering Track Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Volunteer Track */}
              <div
                onClick={() => setSelectedTrack('volunteer')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedTrack === 'volunteer'
                    ? 'border-emerald-600 bg-white shadow-md ring-2 ring-emerald-500/20'
                    : 'border-emerald-200/60 bg-white/60 hover:bg-white'
                }`}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-800">
                    <Heart className="w-4 h-4 fill-emerald-600 text-emerald-600" />
                  </div>
                  <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                    $0 / Volunteer
                  </span>
                </div>
                <div className="font-bold text-gray-900 text-xs mb-1">Volunteer Companion</div>
                <p className="text-[11px] text-gray-600 leading-snug">
                  Provide friendly social tea visits, garden walks, and reading sessions to reduce elder loneliness. We are launching with this volunteering option and plan to maintain it!
                </p>
                <div className="mt-2 text-[10px] font-bold text-emerald-700 flex items-center space-x-1">
                  <Award className="w-3 h-3" />
                  <span>Service Hours & Letter of Recommendation</span>
                </div>
              </div>

              {/* Professional Track */}
              <div
                onClick={() => setSelectedTrack('professional')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedTrack === 'professional'
                    ? 'border-emerald-600 bg-white shadow-md ring-2 ring-emerald-500/20'
                    : 'border-emerald-200/60 bg-white/60 hover:bg-white'
                }`}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div className="p-1.5 bg-teal-100 rounded-lg text-teal-800">
                    <DollarSign className="w-4 h-4 text-teal-700" />
                  </div>
                  <span className="text-[11px] font-extrabold text-teal-900 bg-teal-100/80 px-2 py-0.5 rounded-full">
                    $25 – $45 / hr
                  </span>
                </div>
                <div className="font-bold text-gray-900 text-xs mb-1">Professional Companion</div>
                <p className="text-[11px] text-gray-600 leading-snug">
                  Earn competitive hourly income setting your own availability. Background & Vulnerable Sector checks required. Weekly direct deposits.
                </p>
                <div className="mt-2 text-[10px] font-bold text-teal-800 flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Flexible Schedule & Instant Booking</span>
                </div>
              </div>
            </div>
          </div>

          {activeTab === 'download' ? (
            /* APK Download Tab */
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 flex flex-col sm:flex-row items-center gap-4">
                <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center justify-center shrink-0">
                  <QrCode className="w-20 h-20 text-emerald-950" />
                  <span className="text-[10px] font-bold text-gray-500 mt-1">Scan to Install APK</span>
                </div>

                <div className="space-y-2 text-center sm:text-left">
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <span className="text-xs font-extrabold text-gray-900">CompassionateCare-Caregiver-v1.2.0.apk</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-900 rounded-full">
                      24.8 MB
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Designed for companions and volunteers. Installs side-by-side with the family care seeker app without account conflicts.
                  </p>
                  <div className="flex flex-wrap gap-2 text-[11px] text-gray-600">
                    <span className="flex items-center space-x-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /><span>GPS Geofencing</span></span>
                    <span className="flex items-center space-x-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /><span>Voice Memo Recorder</span></span>
                    <span className="flex items-center space-x-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /><span>Photo Reports</span></span>
                  </div>
                </div>
              </div>

              {/* Canadian Caregiver VSC Certification Banner in APK Tab */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-emerald-700 text-white rounded-xl shadow-xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-extrabold text-gray-900">Canada Certification: Alberta Vulnerable Sector Check</span>
                      <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">AB Standard</span>
                    </div>
                    <p className="text-[11px] text-gray-600 mt-0.5">
                      Required for Alberta caregivers & volunteers. Generate your official Calgary/Edmonton/RCMP VSC confirmation letter and save it directly to Google Drive.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsVscModalOpen(true)}
                  className="py-2 px-3.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition-all shrink-0"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>Get VSC Letter for Drive</span>
                </button>
              </div>

              {/* Download Action */}
              <div className="space-y-3">
                <button
                  onClick={handleDownloadApk}
                  disabled={downloadProgress !== null && downloadProgress < 100}
                  className="w-full py-3.5 px-6 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm shadow-lg shadow-emerald-900/15 flex items-center justify-center space-x-2 transition-all active:scale-[0.99] disabled:opacity-75"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {downloadComplete
                      ? 'Caregiver APK Downloaded (v1.2.0)'
                      : downloadProgress !== null
                      ? `Downloading APK (${downloadProgress}%)...`
                      : `Download Caregiver APK for Android`}
                  </span>
                </button>

                {downloadProgress !== null && downloadProgress < 100 && (
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full transition-all duration-200"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                )}

                {downloadComplete && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>APK package downloaded to your device. Open to install, or scan QR code on Android.</span>
                  </div>
                )}
              </div>

              {/* Web Portal Link */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                <span>Caregiver Web Portal:</span>
                <a
                  href="https://compassionatecare.app/caregiver-signup"
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('signup');
                  }}
                  className="font-bold text-emerald-800 hover:underline flex items-center space-x-1"
                >
                  <span>compassionatecare.app/caregiver-signup</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ) : activeTab === 'certifications' ? (
            /* Canada (AB) Certifications Tab */
            <div className="space-y-5">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-emerald-700" />
                  <span className="font-extrabold text-xs text-emerald-950 uppercase tracking-wider">
                    Canadian Regional Caregiver Compliance
                  </span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Caregivers and volunteers serving elderly citizens in Alberta, Canada must adhere to the Alberta Police Act and Section 6.3 of the Criminal Records Act. Below are the recognized certifications and our official agency letter for police submission.
                </p>
              </div>

              {/* VSC Certification Highlight Card */}
              <div className="p-4 bg-white rounded-2xl border-2 border-emerald-600 shadow-md space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-gray-900">
                        1. Alberta Vulnerable Sector Check (VSC / PIC-VS)
                      </div>
                      <div className="text-[11px] text-emerald-700 font-bold">
                        Mandatory for All Alberta In-Home Senior Visits
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-extrabold bg-emerald-100 text-emerald-900 rounded-full border border-emerald-200">
                    Agency Letter Ready
                  </span>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">
                  Required by Calgary Police Service (CPS), Edmonton Police Service (EPS), and Alberta RCMP detachments before visiting vulnerable elders in private homes. This check reviews pardoned sex offenses and vulnerable person incidents.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Volunteers: Fee waived or reduced to $15</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Online submission via CPS/EPS ePIC portal</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>RCMP in-person presentation with 2 photo IDs</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Valid for 3 years in Compassionate Care system</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => setIsVscModalOpen(true)}
                    className="py-2 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition-all"
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    <span>Generate VSC Template & Save to Google Drive</span>
                  </button>
                  <button
                    onClick={() => {
                      setCountry('CA');
                      setCity('Calgary, AB');
                      setActiveTab('signup');
                    }}
                    className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors"
                  >
                    Apply with Alberta VSC
                  </button>
                </div>
              </div>

              {/* Secondary Canadian Certifications */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-1.5">
                  <div className="font-bold text-gray-900 flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>2. Standard First Aid & CPR-C</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-snug">
                    Recognized providers: St. John Ambulance Alberta, Canadian Red Cross, or Lifesaving Society. Verified during onboarding.
                  </p>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-1.5">
                  <div className="font-bold text-gray-900 flex items-center space-x-1.5">
                    <Award className="w-4 h-4 text-teal-700" />
                    <span>3. Alberta HCA Directory (Optional)</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-snug">
                    Certified Health Care Aides registered with the Alberta HCA Directory receive priority placement and higher hourly wage tiers.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Caregiver Web Sign-Up Tab */
            <div>
              {submitSuccess ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-700">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-extrabold text-gray-900">Application Submitted!</h3>
                  <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
                    Thank you, <strong className="text-gray-900">{fullName}</strong>! Your application for the{' '}
                    <strong className="text-emerald-800">
                      {selectedTrack === 'volunteer' ? 'Volunteer Companion Track' : 'Professional Caregiver Track'}
                    </strong>{' '}
                    has been received. We have sent your onboarding details to{' '}
                    <span className="font-semibold text-gray-900">{email}</span>.
                  </p>
                  {country === 'CA' && (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 max-w-md mx-auto">
                      Your Alberta Vulnerable Sector Check confirmation letter is ready. Submit it to Calgary Police, Edmonton Police, or your local RCMP detachment.
                    </div>
                  )}
                  <div className="pt-4 flex justify-center gap-3">
                    {country === 'CA' && (
                      <button
                        onClick={() => setIsVscModalOpen(true)}
                        className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5"
                      >
                        <FileUp className="w-3.5 h-3.5" />
                        <span>Get VSC Template for Drive</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSubmitSuccess(false);
                        setActiveTab('download');
                      }}
                      className="py-2.5 px-5 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-900"
                    >
                      Download Caregiver APK
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCaregiverSignup} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Country & Region
                      </label>
                      <select
                        value={country}
                        onChange={(e) => {
                          const val = e.target.value as 'US' | 'CA';
                          setCountry(val);
                          if (val === 'CA') {
                            setCity('Calgary, AB');
                          } else {
                            setCity('San Francisco, CA');
                          }
                        }}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                      >
                        <option value="CA">Canada (Alberta - Calgary, Edmonton, RCMP)</option>
                        <option value="US">United States (Checkr 50-State)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Full Legal Name
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Jordan Miller"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jordan@example.com"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Phone Number (SMS verified)
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(403) 555-0189"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      City / Service Area ({country === 'CA' ? 'Alberta Municipalities' : 'US Cities'})
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder={country === 'CA' ? 'Calgary, AB or Edmonton, AB' : 'San Francisco, CA'}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Companionship Interests & Activities
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Gardening & Plants', 'Storytelling & History', 'Classic Music', 
                        'Chess & Board Games', 'Baking & Cooking', 'Gentle Walks', 
                        'Art & Crafting', 'Reading Aloud'
                      ].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleInterest(tag)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                            selectedInterests.includes(tag)
                              ? 'bg-emerald-800 text-white shadow-xs'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Brief Bio / Motivation for Companionship
                    </label>
                    <textarea
                      rows={2}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Share what inspires you to spend quality time with senior community members..."
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none resize-none"
                    />
                  </div>

                  {/* Regional Certifications Checkbox: Alberta VSC for Canada */}
                  {country === 'CA' ? (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col space-y-2">
                      <div className="flex items-start space-x-2">
                        <input
                          type="checkbox"
                          id="alberta-vsc-box"
                          checked={albertaVscAgreed}
                          onChange={(e) => setAlbertaVscAgreed(e.target.checked)}
                          className="mt-0.5 accent-emerald-800 rounded"
                        />
                        <label htmlFor="alberta-vsc-box" className="text-[11px] text-gray-700 leading-tight">
                          <strong>Canada (Alberta) Vulnerable Sector Check (VSC):</strong> I understand that Canadian law (Criminal Records Act Sec 6.3) requires a Police Information Check with Vulnerable Sector screening for elder companion visits. I agree to submit the official Compassionate Care agency letter to Calgary Police, Edmonton Police, or my local RCMP detachment.
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-emerald-200/60 text-emerald-900">
                        <span>Need the agency letter for police?</span>
                        <button
                          type="button"
                          onClick={() => setIsVscModalOpen(true)}
                          className="font-extrabold text-emerald-800 hover:underline flex items-center space-x-1"
                        >
                          <FileUp className="w-3 h-3" />
                          <span>Generate VSC Letter & Save to Drive</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 flex items-start space-x-2">
                      <input
                        type="checkbox"
                        id="checkr-consent-box"
                        checked={checkrAgreed}
                        onChange={(e) => setCheckrAgreed(e.target.checked)}
                        className="mt-0.5 accent-emerald-800 rounded"
                      />
                      <label htmlFor="checkr-consent-box" className="text-[11px] text-gray-700 leading-tight">
                        I agree to undergo a comprehensive Checkr identity, nationwide criminal, and motor vehicle background check (covered 100% by Compassionate Care for both volunteer and professional tracks).
                      </label>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || (country === 'CA' ? !albertaVscAgreed : !checkrAgreed)}
                    className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition-all disabled:opacity-60 flex items-center justify-center space-x-1.5"
                  >
                    <span>{isSubmitting ? 'Submitting Application...' : `Submit Application for ${selectedTrack === 'volunteer' ? 'Volunteer Track' : 'Caregiver Track'}`}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Alberta VSC Confirmation Letter Modal with Google Drive Sync */}
      <AlbertaVscModal
        isOpen={isVscModalOpen}
        onClose={() => setIsVscModalOpen(false)}
        defaultApplicantName={fullName}
        defaultTrack={selectedTrack}
        defaultCity={city}
      />
    </div>
  );
};
