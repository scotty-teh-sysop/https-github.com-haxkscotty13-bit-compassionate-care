import React, { useState, useEffect, useMemo } from 'react';
import { 
  Companion, SeniorProfile, Booking, AppNotification, UserRole, PostVisitSummary 
} from './types';
import { 
  INITIAL_SENIORS, INITIAL_COMPANIONS, INITIAL_BOOKINGS, 
  INITIAL_NOTIFICATIONS, AVAILABLE_INTEREST_TAGS 
} from './data/mockData';
import { InteractiveMap } from './components/InteractiveMap';
import { getDistanceMiles } from './utils/distanceUtils';
import { CompanionCard } from './components/CompanionCard';
import { CompanionDetailModal } from './components/CompanionDetailModal';
import { BookingFlowModal } from './components/BookingFlowModal';
import { LiveVisitTracker } from './components/LiveVisitTracker';
import { PostVisitSummaryForm } from './components/PostVisitSummaryForm';
import { PostVisitSummaryView } from './components/PostVisitSummaryView';
import { SeniorProfileManager } from './components/SeniorProfileManager';
import { CompanionDashboard } from './components/CompanionDashboard';
import { CheckrVettingModal } from './components/CheckrVettingModal';
import { EmergencyModal } from './components/EmergencyModal';
import { PaymentGatewayModal } from './components/PaymentGatewayModal';
import { InvoiceModal } from './components/InvoiceModal';
import { MonthlyCalendarView } from './components/MonthlyCalendarView';
import { PreVisitCheckInModal } from './components/PreVisitCheckInModal';
import { FcmPushToast } from './components/FcmPushToast';
import { 
  initializeFcm, subscribeToFcmMessages, 
  trigger1HourPreVisitReminder, checkUpcomingBookingsFor1HourReminder,
  getActiveFcmToken
} from './firebase/fcmService';
import { FcmNotificationPayload } from './types';
import { 
  Compass, Map as MapIcon, Calendar, CalendarDays, List, Heart, ShieldCheck, 
  Bell, Smartphone, Monitor, UserCheck, Search, Filter, 
  Sparkles, CheckCircle2, ChevronRight, Clock, Star, PhoneCall,
  SlidersHorizontal, X, ArrowLeft, Disc, Radio, Cloud, Database,
  CreditCard, FileText, Download
} from 'lucide-react';
import { formatCurrency } from './utils/formatters';
import { capturePayment } from './services/paymentService';
import { 
  seedInitialFirestoreData, subscribeSeniors, subscribeBookings, 
  subscribeCompanions, subscribeNotifications, 
  persistBooking, persistSeniorProfile, persistCompanion, persistNotification 
} from './firebase/services';
import { isInitialized as isFirebaseReady } from './firebase/config';
import { AudioMemoryPlayer } from './components/AudioMemoryPlayer';
import { InitialOnboardingView } from './components/InitialOnboardingView';
import { CaregiverApkModal } from './components/CaregiverApkModal';
import { FamilyUserAccount } from './types';
import { 
  PWAHeaderInstallButton, 
  PWAInstallBanner, 
  PWAInstallGuideModal, 
  OfflineIndicator 
} from './components/PWAInstallPrompt';

export default function App() {
  // Global State
  const [userRole, setUserRole] = useState<UserRole>('care_seeker');
  const [deviceMode, setDeviceMode] = useState<'phone' | 'responsive'>('phone');
  
  // Data Collections
  const [seniors, setSeniors] = useState<SeniorProfile[]>(INITIAL_SENIORS);
  const [activeSeniorId, setActiveSeniorId] = useState<string>('senior-1');
  const [companions, setCompanions] = useState<Companion[]>(INITIAL_COMPANIONS);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  // Active Senior
  const activeSenior = seniors.find((s) => s.id === activeSeniorId) || seniors[0];
  const mainCompanion = companions[0]; // Maya Lin

  // Navigation State
  // Care Seeker tabs: 'explore' | 'bookings' | 'seniors' | 'safety'
  // Companion tabs: 'dashboard' | 'active_visit' | 'availability' | 'safety'
  const [careSeekerTab, setCareSeekerTab] = useState<'explore' | 'bookings' | 'seniors' | 'safety'>('explore');
  const [companionTab, setCompanionTab] = useState<'dashboard' | 'active_visit' | 'safety'>('dashboard');

  // Discovery Filters
  const [selectedInterest, setSelectedInterest] = useState<string>('All');
  const [maxRate, setMaxRate] = useState<number>(45);
  const [maxDistance, setMaxDistance] = useState<number>(6);
  const [requireCheckr, setRequireCheckr] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'both' | 'map' | 'list'>('both');

  // Modals & Overlays
  const [selectedCompanionForDetail, setSelectedCompanionForDetail] = useState<Companion | null>(null);
  const [bookingCompanion, setBookingCompanion] = useState<Companion | null>(null);
  const [summaryFormBooking, setSummaryFormBooking] = useState<Booking | null>(null);
  const [summaryViewBooking, setSummaryViewBooking] = useState<Booking | null>(null);
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState<boolean>(false);
  const [inspectCheckrCompanion, setInspectCheckrCompanion] = useState<Companion | null>(null);
  const [emergencyActiveBooking, setEmergencyActiveBooking] = useState<Booking | null>(null);
  const [showEraMusicModal, setShowEraMusicModal] = useState<boolean>(false);
  const [showPaymentGatewayModal, setShowPaymentGatewayModal] = useState<boolean>(false);
  const [showPWAInstallGuide, setShowPWAInstallGuide] = useState<boolean>(false);
  const [selectedBookingForInvoice, setSelectedBookingForInvoice] = useState<Booking | null>(null);
  const [bookingsViewMode, setBookingsViewMode] = useState<'calendar' | 'list'>('calendar');
  const [preVisitCheckInBooking, setPreVisitCheckInBooking] = useState<Booking | null>(null);
  const [fcmToastPayload, setFcmToastPayload] = useState<FcmNotificationPayload | null>(null);
  const [fcmTokenState, setFcmTokenState] = useState<{ token: string | null; status: string }>({
    token: null,
    status: 'initializing',
  });
  const [firebaseStatus, setFirebaseStatus] = useState<'synced' | 'connecting' | 'offline'>(
    isFirebaseReady ? 'synced' : 'offline'
  );

  // First Launch Initial Onboarding State & Caregiver APK Modal
  const [showFirstLaunchOnboarding, setShowFirstLaunchOnboarding] = useState<boolean>(() => {
    try {
      const onboarded = localStorage.getItem('compassionate_care_onboarded_v1');
      return !onboarded;
    } catch {
      return false;
    }
  });
  const [showCaregiverApkModal, setShowCaregiverApkModal] = useState<boolean>(false);

  const handleCompleteInitialOnboarding = async (newSenior: SeniorProfile, familyAccount: FamilyUserAccount) => {
    setSeniors((prev) => [newSenior, ...prev.filter((s) => s.id !== newSenior.id)]);
    setActiveSeniorId(newSenior.id);
    setShowFirstLaunchOnboarding(false);

    try {
      await persistSeniorProfile(newSenior);
      const welcomeNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        title: `Welcome, ${familyAccount.fullName}!`,
        body: `Senior profile for ${newSenior.name} is configured with ${familyAccount.paymentMethod.cardBrand || 'verified payment'}. Explore matching companions within your area on the map.`,
        timestamp: 'Just now',
        read: false,
        type: 'status',
      };
      setNotifications((prev) => [welcomeNotif, ...prev]);
      await persistNotification(welcomeNotif);
    } catch (err) {
      console.warn('Persisted profile locally:', err);
    }
  };

  // Initialize and synchronize with Firebase Firestore in real-time
  useEffect(() => {
    let unsubs: Array<(() => void) | null> = [];

    const initFirebase = async () => {
      try {
        await seedInitialFirestoreData();
        setFirebaseStatus('synced');

        // Subscribe to Seniors
        const unsubSeniors = subscribeSeniors((syncedSeniors) => {
          if (syncedSeniors && syncedSeniors.length > 0) {
            setSeniors(syncedSeniors);
          }
        });
        unsubs.push(unsubSeniors);

        // Subscribe to Companions
        const unsubCompanions = subscribeCompanions((syncedCompanions) => {
          if (syncedCompanions && syncedCompanions.length > 0) {
            setCompanions(syncedCompanions);
          }
        });
        unsubs.push(unsubCompanions);

        // Subscribe to Bookings
        const unsubBookings = subscribeBookings((syncedBookings) => {
          if (syncedBookings && syncedBookings.length > 0) {
            setBookings(syncedBookings);
          }
        });
        unsubs.push(unsubBookings);

        // Subscribe to Notifications
        const unsubNotifs = subscribeNotifications((syncedNotifs) => {
          if (syncedNotifs && syncedNotifs.length > 0) {
            setNotifications(syncedNotifs);
          }
        });
        unsubs.push(unsubNotifs);
      } catch (err) {
        console.warn('Firebase real-time sync operating in resilient mode:', err);
      }
    };

    initFirebase();

    return () => {
      unsubs.forEach((unsub) => {
        if (typeof unsub === 'function') unsub();
      });
    };
  }, []);

  // Initialize FCM Push Notifications and background/foreground message bus
  useEffect(() => {
    initializeFcm().then((res) => {
      setFcmTokenState({ token: res.token, status: res.status });
    });

    const unsubFcm = subscribeToFcmMessages((payload) => {
      setFcmToastPayload(payload);
    });

    return () => {
      unsubFcm();
    };
  }, []);

  // Periodic automatic scanner: checks upcoming visits and alerts 1-hour before arrival
  useEffect(() => {
    const scan = () => {
      checkUpcomingBookingsFor1HourReminder(bookings);
    };
    const initialTimer = setTimeout(scan, 2500);
    const interval = setInterval(scan, 30000);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [bookings]);

  // Handle Family Host Check-In submission from 1-Hour pre-visit modal
  const handleConfirmPreVisitCheckIn = async (
    bookingId: string,
    details: { hostName: string; instructions: string }
  ) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updatedBookings = bookings.map((b) => {
      if (b.id === bookingId) {
        return {
          ...b,
          familyCheckIn: {
            checkedIn: true,
            checkedInAt: timeStr,
            hostName: details.hostName,
            doorOrAccessInstructions: details.instructions,
            reviewedCareNotes: true,
          },
        };
      }
      return b;
    });
    setBookings(updatedBookings);

    const targetBooking = updatedBookings.find((b) => b.id === bookingId);
    if (targetBooking) {
      await persistBooking(targetBooking);
      triggerFCMToast(
        '✓ Family Host Check-In Confirmed',
        `${targetBooking.companionName} has been informed that someone is home and ${targetBooking.seniorName} is ready.`,
        'checkin',
        bookingId
      );
    }
  };

  // Immediate FCM 1-Hour Reminder simulation / test trigger
  const handleTrigger1HourFcmTest = async (specificBooking?: Booking) => {
    const target =
      specificBooking ||
      bookings.find((b) => b.status === 'accepted' || b.status === 'requested') ||
      bookings[0];

    if (!target) return;
    const result = await trigger1HourPreVisitReminder(target, { minutesOffset: 58 });
    if (result.success) {
      setFcmToastPayload(result.payload);
    }
  };

  // Active FCM Toast Banner
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);

  // Push FCM Toast helper
  const triggerFCMToast = (title: string, body: string, type: AppNotification['type'], bookingId?: string) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title,
      body,
      timestamp: 'Just now',
      read: false,
      type,
      bookingId,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    setActiveToast(newNotif);
    setTimeout(() => {
      setActiveToast((curr) => (curr?.id === newNotif.id ? null : curr));
    }, 4500);
  };

  // Dynamic distance calculation relative to active senior coordinates
  const companionsWithDynamicDistance = useMemo(() => {
    return companions.map((comp) => {
      const dist = getDistanceMiles(activeSenior.coordinates, comp.coordinates);
      return {
        ...comp,
        distanceMiles: dist,
      };
    });
  }, [companions, activeSenior.coordinates.lat, activeSenior.coordinates.lng]);

  // Filtered Companions with dynamic distance and nearest-first sorting
  const filteredCompanions = useMemo(() => {
    return companionsWithDynamicDistance
      .filter((comp) => {
        if (comp.hourlyRate > maxRate) return false;
        if (comp.distanceMiles > maxDistance) return false;
        if (requireCheckr && !comp.vetting.checkrCleared) return false;
        if (selectedInterest !== 'All' && !comp.interests.includes(selectedInterest)) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = comp.name.toLowerCase().includes(q);
          const matchBio = comp.bio.toLowerCase().includes(q);
          const matchSpecialization = comp.specializations.some((s) => s.toLowerCase().includes(q));
          if (!matchName && !matchBio && !matchSpecialization) return false;
        }
        return true;
      })
      .sort((a, b) => a.distanceMiles - b.distanceMiles);
  }, [companionsWithDynamicDistance, maxRate, maxDistance, requireCheckr, selectedInterest, searchQuery]);

  // Booking Handlers
  const handleBookingConfirmed = (newBooking: Booking) => {
    setBookings((prev) => [newBooking, ...prev]);
    persistBooking(newBooking);
    setBookingCompanion(null);
    setSelectedCompanionForDetail(null);
    setCareSeekerTab('bookings');

    triggerFCMToast(
      'Booking Request Submitted',
      `Authorized ${formatCurrency(newBooking.totalCost)} for ${newBooking.seniorName} with ${newBooking.companionName}.`,
      'booking',
      newBooking.id
    );
  };

  const handleAcceptBooking = (bookingId: string) => {
    let updatedBooking: Booking | null = null;
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          updatedBooking = { ...b, status: 'accepted' };
          return updatedBooking;
        }
        return b;
      })
    );
    if (updatedBooking) persistBooking(updatedBooking);

    const target = bookings.find((b) => b.id === bookingId);
    triggerFCMToast(
      'Visit Request Accepted',
      `${target?.companionName || 'Companion'} accepted visit with ${target?.seniorName || 'Senior'}.`,
      'status',
      bookingId
    );
  };

  const handleDeclineBooking = (bookingId: string) => {
    let updatedBooking: Booking | null = null;
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          updatedBooking = { ...b, status: 'cancelled' };
          return updatedBooking;
        }
        return b;
      })
    );
    if (updatedBooking) persistBooking(updatedBooking);
  };

  const handleStartVisit = (bookingId: string) => {
    let updatedBooking: Booking | null = null;
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          updatedBooking = {
            ...b,
            status: 'in_progress',
            visitTracking: {
              checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              checkInVerified: true,
              checkInMethod: 'gps_geofence',
              elapsedSeconds: 0,
            },
          };
          return updatedBooking;
        }
        return b;
      })
    );
    if (updatedBooking) persistBooking(updatedBooking);

    const target = bookings.find((b) => b.id === bookingId);
    triggerFCMToast(
      'GPS Geofence Check-In Verified',
      `${target?.companionName} checked in on-site at ${target?.address}.`,
      'checkin',
      bookingId
    );
  };

  const handleCheckoutSubmit = (bookingId: string, summary: PostVisitSummary) => {
    let updatedBooking: Booking | null = null;
    const paymentCapturedAt = new Date().toISOString();

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          updatedBooking = {
            ...b,
            status: 'completed',
            payment: {
              ...b.payment,
              status: 'paid',
              capturedAt: paymentCapturedAt,
              escrowStatus: 'released_to_companion',
              chargeId: b.payment.chargeId || `ch_3M${Date.now().toString(36)}`,
            },
            visitTracking: {
              ...b.visitTracking,
              checkOutTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              checkOutVerified: true,
              checkInVerified: true,
            },
            postVisitSummary: summary,
          };
          return updatedBooking;
        }
        return b;
      })
    );
    if (updatedBooking) {
      persistBooking(updatedBooking);

      // Trigger server-side or simulated payment capture
      if ((updatedBooking as Booking).payment?.transactionId) {
        capturePayment({
          paymentIntentId: (updatedBooking as Booking).payment.transactionId,
          bookingId,
          companionId: (updatedBooking as Booking).companionId,
        }).catch((err) => console.warn('Payment capture background sync:', err));
      }
    }

    const completed = bookings.find((b) => b.id === bookingId);
    setSummaryFormBooking(null);

    triggerFCMToast(
      'Post-Visit Report Published',
      `Maya Lin submitted visit photos and notes for ${completed?.seniorName || 'Eleanor Vance'}.`,
      'summary',
      bookingId
    );

    // Alert for Stripe Escrow Release
    setTimeout(() => {
      triggerFCMToast(
        'Stripe Escrow Funds Released',
        `Pre-authorized funds of ${formatCurrency(completed?.totalCost || 70)} captured. Companion payout scheduled via Stripe Connect.`,
        'status',
        bookingId
      );
    }, 1200);

    // If family user is watching, or when completed, open the view
    if (completed) {
      setSummaryViewBooking({
        ...completed,
        status: 'completed',
        postVisitSummary: summary,
        payment: {
          ...completed.payment,
          status: 'paid',
          capturedAt: paymentCapturedAt,
          escrowStatus: 'released_to_companion',
        },
      });
    }
  };

  const handleRatingSubmit = (bookingId: string, rating: number, review: string) => {
    let updatedBooking: Booking | null = null;
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          updatedBooking = {
            ...b,
            seekerRating: {
              rating,
              review,
              createdAt: 'Today',
            },
          };
          return updatedBooking;
        }
        return b;
      })
    );
    if (updatedBooking) persistBooking(updatedBooking);

    triggerFCMToast(
      'Review & Gratitude Submitted',
      `Thank you! Your 5-star review has been delivered to your companion.`,
      'status',
      bookingId
    );
  };

  const handleUpdateCompanionRate = (newRate: number) => {
    setCompanions((prev) =>
      prev.map((c) => {
        if (c.id === mainCompanion.id) {
          const updated = { ...c, hourlyRate: newRate };
          persistCompanion(updated);
          return updated;
        }
        return c;
      })
    );
    triggerFCMToast(
      'Hourly Rate Updated',
      `Your companionship rate is now set to ${formatCurrency(newRate)}/hr.`,
      'status'
    );
  };

  const handleUpdateAvailability = (days: string[]) => {
    setCompanions((prev) =>
      prev.map((c) => {
        if (c.id === mainCompanion.id) {
          const updated = { ...c, availableDays: days };
          persistCompanion(updated);
          return updated;
        }
        return c;
      })
    );
  };

  const handleAddNewSenior = (newSenior: SeniorProfile) => {
    setSeniors((prev) => [...prev, newSenior]);
    setActiveSeniorId(newSenior.id);
    persistSeniorProfile(newSenior);
    triggerFCMToast(
      'Senior Profile Added',
      `${newSenior.name}'s care profile and preferences have been saved.`,
      'status'
    );
  };

  const inProgressBooking = bookings.find((b) => b.status === 'in_progress');
  const unreadNotifs = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-800 antialiased font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Universal Control Bar (Studio Preview Control Bar) */}
      <header className="bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-white px-4 py-2.5 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-900/30 ring-1 ring-emerald-400/40">
              <Heart className="w-5 h-5 text-white fill-current" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight text-white">Compassionate Care</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Android MVP
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Non-Medical Senior Social Companionship Platform</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Role Switcher */}
            <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center space-x-1 text-xs">
              <button
                onClick={() => setUserRole('care_seeker')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
                  userRole === 'care_seeker'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                id="switch-role-seeker"
              >
                <Heart className="w-3.5 h-3.5" />
                <span>Family (Care Seeker)</span>
              </button>

              <button
                onClick={() => setUserRole('companion')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
                  userRole === 'companion'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                id="switch-role-companion"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Companion (Maya)</span>
              </button>
            </div>

            {/* Firebase Cloud Sync Status */}
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-sky-300">
              <Database className="w-3.5 h-3.5 text-sky-400" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px]">Firestore Synced</span>
            </div>

            {/* Caregiver APK & Volunteering Button */}
            <button
              onClick={() => setShowCaregiverApkModal(true)}
              className="px-2.5 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 rounded-xl border border-teal-500/40 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Caregiver Separate APK & Volunteering Sign-Up"
              id="header-caregiver-apk-btn"
            >
              <Smartphone className="w-3.5 h-3.5 text-teal-300" />
              <span className="hidden sm:inline">Caregiver APK</span>
              <span className="text-[10px] bg-teal-600/80 text-white px-1.5 py-0.2 rounded-full font-bold">
                Volunteer
              </span>
            </button>

            {/* First Launch / Senior Setup Button */}
            <button
              onClick={() => setShowFirstLaunchOnboarding(true)}
              className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl border border-emerald-500/40 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Re-open Initial First-Launch Senior & Billing Setup"
              id="header-senior-setup-btn"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden lg:inline">Senior Setup</span>
            </button>

            {/* Payment Gateway & Escrow Hub */}
            <button
              onClick={() => setShowPaymentGatewayModal(true)}
              className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl border border-emerald-500/40 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Open Stripe Payment Gateway & Escrow Dashboard"
              id="open-payment-gateway-modal-btn"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Payment Gateway</span>
              <span className="sm:hidden">Pay</span>
            </button>

            {/* Favorite Era Soundscape & Reminiscence Studio */}
            <button
              onClick={() => setShowEraMusicModal(true)}
              className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl border border-amber-500/40 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Launch Nostalgic Soundscapes & Reminiscence Sparks"
              id="open-era-music-modal-btn"
            >
              <Disc className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="hidden sm:inline">Soundscapes & Reminiscence</span>
              <span className="sm:hidden">Audio</span>
            </button>

            {/* FCM 1-Hour Reminder Test / Status Trigger */}
            <button
              onClick={() => handleTrigger1HourFcmTest()}
              className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl border border-emerald-500/40 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
              title={`FCM Status: ${fcmTokenState.status}. Click to test 1-hour pre-visit check-in reminder.`}
              id="header-test-fcm-btn"
            >
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Test 1-Hr FCM Push</span>
              <span className="md:hidden">1-Hr FCM</span>
            </button>

            {/* View Mode Toggle (Phone Frame vs Responsive) */}
            <div className="hidden sm:flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setDeviceMode('phone')}
                className={`p-1.5 rounded-lg font-medium transition-colors ${
                  deviceMode === 'phone' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-white'
                }`}
                title="Android Pixel 8 Frame View"
                id="toggle-phone-frame"
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeviceMode('responsive')}
                className={`p-1.5 rounded-lg font-medium transition-colors ${
                  deviceMode === 'responsive' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-white'
                }`}
                title="Full Responsive View"
                id="toggle-responsive-frame"
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>

            {/* Notifications Bell */}
            <button
              onClick={() => setShowNotificationsDrawer(true)}
              className="relative p-2 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 text-slate-300 hover:text-white transition-colors"
              id="open-notifications-btn"
              title="Firebase Cloud Messaging Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                  {unreadNotifs}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Interactive FCM Web Push Notification Toast */}
      {fcmToastPayload && (
        <FcmPushToast
          payload={fcmToastPayload}
          onCheckIn={(bookingId) => {
            const target = bookings.find((b) => b.id === bookingId) || bookings[0];
            if (target) setPreVisitCheckInBooking(target);
          }}
          onReviewDetails={(bookingId) => {
            const target = bookings.find((b) => b.id === bookingId) || bookings[0];
            if (target) setPreVisitCheckInBooking(target);
          }}
          onDismiss={() => setFcmToastPayload(null)}
        />
      )}

      {/* Fallback Standard In-App Toast */}
      {!fcmToastPayload && activeToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="bg-slate-900 text-white rounded-2xl p-3.5 shadow-2xl border border-emerald-500/40 flex items-start space-x-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0 mt-0.5">
              <Bell className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-white truncate">{activeToast.title}</p>
                <span className="text-[10px] text-emerald-400 font-semibold">FCM Push</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">{activeToast.body}</p>
            </div>
            <button
              onClick={() => setActiveToast(null)}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container Wrapper */}
      <main className="py-4 sm:py-8 px-2 sm:px-4 flex justify-center">
        {/* Device Frame or Full Screen */}
        <div
          className={`w-full transition-all duration-300 ${
            deviceMode === 'phone'
              ? 'max-w-[430px] min-h-[860px] bg-white rounded-[44px] shadow-2xl shadow-black/80 ring-12 ring-slate-800/90 overflow-hidden flex flex-col relative border border-slate-700/50'
              : 'max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col min-h-[820px] border border-slate-200'
          }`}
        >
          {/* Android System Status Bar (When in Phone mode) */}
          {deviceMode === 'phone' && (
            <div className="bg-emerald-900 text-emerald-100 px-6 pt-3 pb-2 flex items-center justify-between text-xs font-semibold select-none">
              <span>9:41</span>
              {/* Camera punch hole cutout */}
              <div className="w-3.5 h-3.5 bg-black rounded-full ring-2 ring-emerald-950" />
              <div className="flex items-center space-x-1.5 text-[11px]">
                <span>5G</span>
                <span>100%</span>
              </div>
            </div>
          )}

          {/* Android App TopBar */}
          <div className="bg-emerald-800 text-white px-5 py-3.5 flex items-center justify-between shadow-xs sticky top-0 z-30">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600/60 flex items-center justify-center text-white ring-1 ring-white/30">
                <Heart className="w-4 h-4 fill-current" />
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-tight text-white leading-tight">Compassionate Care</h1>
                <p className="text-[11px] text-emerald-200">
                  {userRole === 'care_seeker' ? `Caring for ${activeSenior.name}` : `Companion: ${mainCompanion.name}`}
                </p>
              </div>
            </div>

            {/* Top Bar Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowCaregiverApkModal(true)}
                className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
                title="Caregiver Separate APK & Volunteering Signup"
                id="phone-topbar-caregiver-btn"
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowPaymentGatewayModal(true)}
                className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
                title="Stripe Payment Gateway & Escrow"
                id="phone-topbar-payment-btn"
              >
                <CreditCard className="w-4 h-4" />
              </button>
              {userRole === 'care_seeker' ? (
                <button
                  onClick={() => setCareSeekerTab('seniors')}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-white/15 hover:bg-white/25 rounded-full text-xs font-semibold text-white transition-colors"
                  title="Switch or manage senior loved one"
                >
                  <img
                    src={activeSenior.avatar}
                    alt={activeSenior.name}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                  <span className="text-[11px] max-w-[80px] truncate">{activeSenior.name.split(' ')[0]}</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowNotificationsDrawer(true)}
                  className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white"
                >
                  <Bell className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Body Content Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-[#fafcfb] space-y-5">
            {/* CARE SEEKER ROLE VIEWS */}
            {userRole === 'care_seeker' && (
              <>
                {/* Active Visit Alert if one is In-Progress */}
                {inProgressBooking && careSeekerTab !== 'bookings' && (
                  <div
                    onClick={() => setCareSeekerTab('bookings')}
                    className="p-4 bg-gradient-to-r from-emerald-800 to-teal-800 rounded-2xl text-white shadow-md flex items-center justify-between cursor-pointer hover:opacity-95 transition-opacity animate-in fade-in"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-300"></span>
                      </span>
                      <div>
                        <p className="text-xs font-bold text-emerald-200 uppercase tracking-wider">Live Visit In Progress</p>
                        <p className="text-sm font-bold text-white">
                          {inProgressBooking.companionName} with {inProgressBooking.seniorName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 text-xs font-bold text-emerald-200">
                      <span>View Live</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                )}

                {/* TAB: EXPLORE / DISCOVERY */}
                {careSeekerTab === 'explore' && (
                  <div className="space-y-4" id="tab-explore">
                    {/* Caregiver APK & Volunteer Companion Signup Callout */}
                    <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200/80 flex items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Smartphone className="w-4 h-4 text-emerald-200" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-bold text-gray-900 truncate">Companion & Volunteer APK</span>
                            <span className="text-[9px] font-extrabold bg-emerald-200/70 text-emerald-900 px-1.5 py-0.2 rounded-md">
                              Separate APK
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-600 truncate">
                            Companions use our dedicated APK with GPS visit check-in & volunteering.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCaregiverApkModal(true)}
                        className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shrink-0 transition-colors shadow-xs"
                        id="explore-get-caregiver-apk-btn"
                      >
                        Caregiver App
                      </button>
                    </div>

                    {/* Search & Location Bar */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search companions by hobby (chess, gardening, music)..."
                        className="w-full p-3 pl-10 pr-10 rounded-2xl border border-gray-200 text-xs text-gray-900 bg-white focus:outline-none focus:border-emerald-600 shadow-2xs"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Filter Chips & View Mode Toggle */}
                    <div className="space-y-2.5">
                      {/* Interest Pill Chips */}
                      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
                        {AVAILABLE_INTEREST_TAGS.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => setSelectedInterest(tag)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                              selectedInterest === tag
                                ? 'bg-emerald-700 text-white shadow-xs'
                                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>

                      {/* Filter Controls Row */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
                        {/* Search Radius with Live Slider and Presets */}
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-600">Search Radius:</span>
                          <div className="flex items-center space-x-2 bg-gray-50 px-2.5 py-1 rounded-xl border border-gray-200">
                            <input
                              type="range"
                              min={1}
                              max={15}
                              step={0.5}
                              value={maxDistance}
                              onChange={(e) => setMaxDistance(Number(e.target.value))}
                              className="w-24 accent-emerald-700 cursor-pointer"
                              id="radius-slider-control"
                            />
                            <span className="font-bold text-emerald-800 min-w-[3.2rem] text-right">
                              {maxDistance} mi
                            </span>
                          </div>

                          {/* Quick Presets */}
                          <div className="hidden sm:flex items-center space-x-1">
                            {[3, 5, 8, 12].map((r) => (
                              <button
                                key={r}
                                onClick={() => setMaxDistance(r)}
                                className={`px-2 py-0.5 rounded-lg font-bold text-[10px] transition-all ${
                                  maxDistance === r
                                    ? 'bg-emerald-800 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {r}m
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Max Rate Slider */}
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-600">Max Rate:</span>
                          <span className="font-bold text-emerald-800">${maxRate}/hr</span>
                          <input
                            type="range"
                            min={20}
                            max={50}
                            step={2}
                            value={maxRate}
                            onChange={(e) => setMaxRate(Number(e.target.value))}
                            className="w-20 accent-emerald-700 cursor-pointer"
                            id="rate-slider-control"
                          />
                        </div>

                        {/* View Switcher: Split vs Map vs List */}
                        <div className="bg-gray-100 p-0.5 rounded-xl flex items-center text-[11px] font-bold border border-gray-200/80 shadow-2xs">
                          <button
                            id="view-btn-split"
                            onClick={() => setViewMode('both')}
                            className={`px-3 py-1 rounded-lg transition-all ${
                              viewMode === 'both'
                                ? 'bg-white text-emerald-800 shadow-xs'
                                : 'text-gray-500 hover:text-gray-900'
                            }`}
                          >
                            Split
                          </button>
                          <button
                            id="view-btn-map"
                            onClick={() => setViewMode('map')}
                            className={`px-3 py-1 rounded-lg transition-all ${
                              viewMode === 'map'
                                ? 'bg-white text-emerald-800 shadow-xs'
                                : 'text-gray-500 hover:text-gray-900'
                            }`}
                          >
                            Map
                          </button>
                          <button
                            id="view-btn-list"
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1 rounded-lg transition-all ${
                              viewMode === 'list'
                                ? 'bg-white text-emerald-800 shadow-xs'
                                : 'text-gray-500 hover:text-gray-900'
                            }`}
                          >
                            List
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* View Layouts: Split View */}
                    {viewMode === 'both' && (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                        {/* Map Column */}
                        <div className="lg:col-span-7 space-y-2 lg:sticky lg:top-24">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-gray-700 flex items-center space-x-1.5">
                              <MapIcon className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Live Location Map</span>
                            </span>
                            <span className="text-[11px] text-gray-500">
                              {filteredCompanions.length} within {maxDistance} mi of {activeSenior.name.split(' ')[0]}
                            </span>
                          </div>

                          <InteractiveMap
                            companions={filteredCompanions}
                            selectedCompanion={selectedCompanionForDetail}
                            activeSenior={activeSenior}
                            maxDistance={maxDistance}
                            onSelectCompanion={(c) => setSelectedCompanionForDetail(c)}
                            onBookCompanion={(c) => setBookingCompanion(c)}
                            onRadiusChange={(r) => setMaxDistance(r)}
                            viewMode="both"
                          />
                        </div>

                        {/* List Column */}
                        <div className="lg:col-span-5 space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <h3 className="font-bold text-gray-900">
                              Available Companions ({filteredCompanions.length})
                            </h3>
                            <div className="flex items-center space-x-1 text-emerald-700 font-semibold text-[11px]">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Checkr Cleared</span>
                            </div>
                          </div>

                          {filteredCompanions.length === 0 ? (
                            <div className="p-8 bg-white rounded-3xl border border-gray-200 text-center space-y-2">
                              <p className="text-sm font-bold text-gray-700">No companions match these filters</p>
                              <p className="text-xs text-gray-500">Try expanding your search radius or rate filter.</p>
                              <button
                                onClick={() => {
                                  setSelectedInterest('All');
                                  setMaxRate(50);
                                  setMaxDistance(10);
                                  setSearchQuery('');
                                }}
                                className="px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-full mt-2"
                              >
                                Reset Filters
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {filteredCompanions.map((comp) => (
                                <CompanionCard
                                  key={comp.id}
                                  companion={comp}
                                  activeSenior={activeSenior}
                                  onSelect={(c) => setSelectedCompanionForDetail(c)}
                                  onBook={(c) => setBookingCompanion(c)}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* View Layouts: Map Only View */}
                    {viewMode === 'map' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-gray-700 flex items-center space-x-1.5">
                            <MapIcon className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Full Map View</span>
                          </span>
                          <span className="text-[11px] text-gray-500 font-medium">
                            Showing {filteredCompanions.length} companions within {maxDistance} miles
                          </span>
                        </div>

                        <InteractiveMap
                          companions={filteredCompanions}
                          selectedCompanion={selectedCompanionForDetail}
                          activeSenior={activeSenior}
                          maxDistance={maxDistance}
                          onSelectCompanion={(c) => setSelectedCompanionForDetail(c)}
                          onBookCompanion={(c) => setBookingCompanion(c)}
                          onRadiusChange={(r) => setMaxDistance(r)}
                          viewMode="map"
                        />
                      </div>
                    )}

                    {/* View Layouts: List Only View */}
                    {viewMode === 'list' && (
                      <div className="space-y-3 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <h3 className="font-bold text-gray-900 text-sm">
                            Available Companions ({filteredCompanions.length})
                          </h3>
                          <div className="flex items-center space-x-1 text-emerald-700 font-semibold text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>All Checkr Cleared</span>
                          </div>
                        </div>

                        {filteredCompanions.length === 0 ? (
                          <div className="p-8 bg-white rounded-3xl border border-gray-200 text-center space-y-2">
                            <p className="text-sm font-bold text-gray-700">No companions match these filters</p>
                            <p className="text-xs text-gray-500">Try broadening your distance radius or hourly rate slider.</p>
                            <button
                              onClick={() => {
                                setSelectedInterest('All');
                                maxDistance < 10 && setMaxDistance(10);
                                setMaxRate(50);
                                setSearchQuery('');
                              }}
                              className="px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-full mt-2"
                            >
                              Reset Filters
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredCompanions.map((comp) => (
                              <CompanionCard
                                key={comp.id}
                                companion={comp}
                                activeSenior={activeSenior}
                                onSelect={(c) => setSelectedCompanionForDetail(c)}
                                onBook={(c) => setBookingCompanion(c)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: MY BOOKINGS / LIVE TRACKING */}
                {careSeekerTab === 'bookings' && (
                  <div className="space-y-5" id="tab-bookings">
                    {/* In-Progress Visit Tracker (Top Priority) */}
                    {inProgressBooking && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Active Visit in Session</span>
                        </h3>
                        <LiveVisitTracker
                          booking={inProgressBooking}
                          userRole={userRole}
                          onInitiateCheckout={(b) => setSummaryFormBooking(b)}
                          onSimulateEmergency={() =>
                            triggerFCMToast('Emergency Protocol Broadcasted', 'All family contacts and emergency responders alerted.', 'emergency')
                          }
                        />
                      </div>
                    )}

                    {/* View Switcher: Monthly Calendar vs Chronological List */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-3xl border border-gray-200 shadow-2xs">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">Visits & Schedules</h3>
                        <p className="text-xs text-gray-500">
                          {bookings.length} total visits recorded ({bookings.filter(b => b.status === 'accepted' || b.status === 'requested').length} upcoming, {bookings.filter(b => b.status === 'completed').length} completed)
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="flex items-center bg-gray-100 p-1 rounded-2xl border border-gray-200 text-xs font-bold">
                          <button
                            onClick={() => setBookingsViewMode('calendar')}
                            className={`px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
                              bookingsViewMode === 'calendar'
                                ? 'bg-white text-emerald-800 shadow-xs font-black'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                            id="view-mode-calendar-btn"
                          >
                            <CalendarDays className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Monthly Calendar</span>
                          </button>

                          <button
                            onClick={() => setBookingsViewMode('list')}
                            className={`px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
                              bookingsViewMode === 'list'
                                ? 'bg-white text-emerald-800 shadow-xs font-black'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                            id="view-mode-list-btn"
                          >
                            <List className="w-3.5 h-3.5" />
                            <span>List View</span>
                          </button>
                        </div>

                        <button
                          onClick={() => setCareSeekerTab('explore')}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer hidden md:flex items-center space-x-1"
                        >
                          <span>+ New Visit</span>
                        </button>
                      </div>
                    </div>

                    {/* CALENDAR VIEW */}
                    {bookingsViewMode === 'calendar' && (
                      <MonthlyCalendarView
                        bookings={bookings}
                        seniors={seniors}
                        activeSeniorId={activeSeniorId}
                        onViewSummary={(b) => setSummaryViewBooking(b)}
                        onViewInvoice={(b) => setSelectedBookingForInvoice(b)}
                        onScheduleVisit={() => setCareSeekerTab('explore')}
                      />
                    )}

                    {/* LIST VIEW */}
                    {bookingsViewMode === 'list' && (
                      <div className="space-y-5">
                        {/* 1-Hour Pre-Visit FCM Reminder System Banner */}
                        <div className="p-4 bg-linear-to-r from-emerald-900/90 to-teal-950 text-white rounded-3xl border border-emerald-700/50 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-2xl shrink-0 mt-0.5">
                              <Clock className="w-5 h-5 text-emerald-400 animate-pulse" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="text-xs font-bold text-white">1-Hour FCM Pre-Visit Push Reminders</h4>
                                <span className="px-2 py-0.5 bg-emerald-500/30 text-emerald-300 text-[10px] font-bold rounded-full">
                                  {fcmTokenState.status === 'granted' ? 'Native Web Push' : 'FCM Active'}
                                </span>
                              </div>
                              <p className="text-xs text-emerald-100/80 mt-0.5 leading-relaxed">
                                Automated alerts remind families to complete host check-in, review care preferences, and verify door codes 1 hour before scheduled companion arrival.
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleTrigger1HourFcmTest()}
                            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 shrink-0 transition-colors shadow-xs cursor-pointer"
                            id="banner-test-fcm-btn"
                          >
                            <Bell className="w-3.5 h-3.5" />
                            <span>Test 1-Hr Push</span>
                          </button>
                        </div>

                        {/* Upcoming Scheduled Visits */}
                        <div className="space-y-3">
                          <h3 className="text-sm font-bold text-gray-900">Upcoming Visits</h3>
                          {bookings.filter((b) => b.status === 'accepted' || b.status === 'requested').length === 0 ? (
                            <div className="p-5 bg-white rounded-2xl border border-gray-200 text-center text-xs text-gray-500">
                              No upcoming visits scheduled right now.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {bookings
                                .filter((b) => b.status === 'accepted' || b.status === 'requested')
                                .map((booking) => (
                                  <div
                                    key={booking.id}
                                    className="p-4 bg-white rounded-3xl border border-gray-200 shadow-2xs space-y-3"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-3">
                                        <img
                                          src={booking.companionAvatar}
                                          alt={booking.companionName}
                                          className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-600/20"
                                        />
                                        <div>
                                          <div className="flex items-center space-x-2">
                                            <h4 className="font-bold text-sm text-gray-900">{booking.companionName}</h4>
                                            <span
                                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                booking.status === 'accepted'
                                                  ? 'bg-emerald-100 text-emerald-800'
                                                  : 'bg-amber-100 text-amber-800'
                                              }`}
                                            >
                                              {booking.status === 'accepted' ? 'Confirmed' : 'Pending Acceptance'}
                                            </span>
                                          </div>
                                          <p className="text-xs text-gray-500 mt-0.5">
                                            For {booking.seniorName} &bull; {booking.scheduledDate} ({booking.startTime} – {booking.endTime})
                                          </p>
                                        </div>
                                      </div>

                                      <div className="text-right">
                                        <p className="text-xs font-black text-gray-900">{formatCurrency(booking.totalCost)}</p>
                                        <span className="text-[10px] text-emerald-700 font-semibold">Stripe Authorized</span>
                                      </div>
                                    </div>

                                    {/* Pre-Visit 1-Hour Status Bar */}
                                    <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                      <div className="flex items-center space-x-2 text-xs">
                                        {booking.familyCheckIn?.checkedIn ? (
                                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold flex items-center space-x-1 text-[11px]">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>Family Host Checked In ({booking.familyCheckIn.checkedInAt})</span>
                                          </span>
                                        ) : (
                                          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-bold flex items-center space-x-1 text-[11px]">
                                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                                            <span>1-Hr Check-In: Ready for Review</span>
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center space-x-2">
                                        <button
                                          onClick={() => handleTrigger1HourFcmTest(booking)}
                                          className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors flex items-center space-x-1 cursor-pointer"
                                          title="Test FCM 1-Hour Reminder for this booking"
                                        >
                                          <Bell className="w-3 h-3 text-emerald-600" />
                                          <span>Test FCM</span>
                                        </button>
                                        <button
                                          onClick={() => setPreVisitCheckInBooking(booking)}
                                          className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
                                        >
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                          <span>{booking.familyCheckIn?.checkedIn ? 'Review Details' : 'Check In Now'}</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>

                        {/* Past Completed Visits with Rover-Style Post-Visit Reports */}
                        <div className="space-y-3">
                          <h3 className="text-sm font-bold text-gray-900">Past Visit Reports & Photos</h3>
                          {bookings.filter((b) => b.status === 'completed').length === 0 ? (
                            <div className="p-5 bg-white rounded-2xl border border-gray-200 text-center text-xs text-gray-500">
                              No completed visits yet.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {bookings
                                .filter((b) => b.status === 'completed')
                                .map((booking) => (
                                  <div
                                    key={booking.id}
                                    className="p-4 bg-white rounded-3xl border border-gray-200 shadow-2xs space-y-3"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-center space-x-3">
                                        <img
                                          src={booking.companionAvatar}
                                          alt={booking.companionName}
                                          className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-600/30"
                                        />
                                        <div>
                                          <h4 className="font-bold text-sm text-gray-900">{booking.companionName}</h4>
                                          <p className="text-xs text-gray-500">
                                            Visited with {booking.seniorName} &bull; {booking.scheduledDate}
                                          </p>
                                          {booking.postVisitSummary && (
                                            <span className="inline-block mt-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                                              {booking.postVisitSummary.moodRating} Mood Reported
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex items-center space-x-2">
                                        <button
                                          onClick={() => setSelectedBookingForInvoice(booking)}
                                          className="px-3 py-1.5 bg-gray-50 hover:bg-emerald-50 hover:text-emerald-800 text-gray-700 font-bold text-xs rounded-full border border-gray-200 transition-colors flex items-center space-x-1 cursor-pointer"
                                          title="View itemized Stripe invoice and receipt"
                                        >
                                          <FileText className="w-3.5 h-3.5" />
                                          <span>Receipt</span>
                                        </button>

                                        <button
                                          onClick={() => setSummaryViewBooking(booking)}
                                          className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full border border-emerald-300 flex items-center space-x-1"
                                        >
                                          <span>View Report</span>
                                          <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Preview Photo Strip */}
                                    {booking.postVisitSummary?.photos && (
                                      <div className="flex space-x-2 overflow-x-auto py-1">
                                        {booking.postVisitSummary.photos.map((p, idx) => (
                                          <img
                                            key={idx}
                                            src={p}
                                            alt="Visit highlight"
                                            className="w-18 h-18 rounded-xl object-cover cursor-pointer hover:opacity-90"
                                            onClick={() => setSummaryViewBooking(booking)}
                                          />
                                        ))}
                                      </div>
                                    )}

                                    {booking.postVisitSummary?.notesToFamily && (
                                      <p className="text-xs text-gray-600 italic line-clamp-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                        "{booking.postVisitSummary.notesToFamily}"
                                      </p>
                                    )}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: SENIOR PROFILE MANAGEMENT */}
                {careSeekerTab === 'seniors' && (
                  <SeniorProfileManager
                    seniors={seniors}
                    activeSeniorId={activeSeniorId}
                    onSelectActiveSenior={(id) => {
                      setActiveSeniorId(id);
                      setCareSeekerTab('explore');
                    }}
                    onAddNewSenior={handleAddNewSenior}
                    onOpenSoundscapes={(senior) => {
                      setActiveSeniorId(senior.id);
                      setShowEraMusicModal(true);
                    }}
                  />
                )}

                {/* TAB: TRUST & SAFETY STANDARDS */}
                {careSeekerTab === 'safety' && (
                  <div className="space-y-4" id="tab-safety">
                    <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5 rounded-3xl space-y-2">
                      <div className="flex items-center space-x-2">
                        <ShieldCheck className="w-6 h-6 text-emerald-200" />
                        <h3 className="font-bold text-base">Compassionate Trust & Safety</h3>
                      </div>
                      <p className="text-xs text-emerald-100 leading-relaxed">
                        Every companion on Compassionate Care passes rigorous multi-point vetting before their first visit.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-4 bg-white rounded-2xl border border-gray-200 space-y-1.5 shadow-2xs">
                        <div className="flex items-center space-x-2 text-emerald-800 font-bold">
                          <UserCheck className="w-4 h-4" />
                          <span>Checkr Comprehensive Backgrounds</span>
                        </div>
                        <p className="text-gray-600">
                          SSN trace, 7-year county, state, and federal criminal check, plus nationwide sex offender registry.
                        </p>
                      </div>

                      <div className="p-4 bg-white rounded-2xl border border-gray-200 space-y-1.5 shadow-2xs">
                        <div className="flex items-center space-x-2 text-emerald-800 font-bold">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Elder Abuse Registry Screening</span>
                        </div>
                        <p className="text-gray-600">
                          Mandatory search against Dept of Social Services vulnerable adult abuse registries.
                        </p>
                      </div>

                      <div className="p-4 bg-white rounded-2xl border border-gray-200 space-y-1.5 shadow-2xs">
                        <div className="flex items-center space-x-2 text-emerald-800 font-bold">
                          <Clock className="w-4 h-4" />
                          <span>GPS Geofenced Verification</span>
                        </div>
                        <p className="text-gray-600">
                          Companions check in within 50 feet of the senior's residence. Families see live timestamp logs.
                        </p>
                      </div>

                      <div className="p-4 bg-white rounded-2xl border border-gray-200 space-y-1.5 shadow-2xs">
                        <div className="flex items-center space-x-2 text-emerald-800 font-bold">
                          <PhoneCall className="w-4 h-4" />
                          <span>In-App Emergency Broadcast</span>
                        </div>
                        <p className="text-gray-600">
                          1-tap speed dial for 911 dispatch, primary family members, and geriatric doctors.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* COMPANION (CAREGIVER) ROLE VIEWS */}
            {userRole === 'companion' && (
              <>
                {companionTab === 'dashboard' && (
                  <CompanionDashboard
                    companion={mainCompanion}
                    bookings={bookings}
                    onAcceptBooking={handleAcceptBooking}
                    onDeclineBooking={handleDeclineBooking}
                    onStartVisit={handleStartVisit}
                    onInitiateCheckout={(b) => setSummaryFormBooking(b)}
                    onViewSummary={(b) => setSummaryViewBooking(b)}
                    onUpdateRate={handleUpdateCompanionRate}
                    onUpdateAvailability={handleUpdateAvailability}
                    onOpenPaymentGateway={() => setShowPaymentGatewayModal(true)}
                    onViewInvoice={(b) => setSelectedBookingForInvoice(b)}
                  />
                )}

                {companionTab === 'active_visit' && (
                  <div className="space-y-4">
                    {inProgressBooking ? (
                      <LiveVisitTracker
                        booking={inProgressBooking}
                        userRole="companion"
                        onInitiateCheckout={(b) => setSummaryFormBooking(b)}
                        onSimulateEmergency={() =>
                          triggerFCMToast('Emergency Broadcast Alert Sent', 'All family contacts notified.', 'emergency')
                        }
                      />
                    ) : (
                      <div className="p-8 bg-white rounded-3xl border border-gray-200 text-center space-y-3">
                        <Clock className="w-10 h-10 text-emerald-600 mx-auto" />
                        <h4 className="font-bold text-sm text-gray-900">No Active Visit Right Now</h4>
                        <p className="text-xs text-gray-500">
                          Check your schedule tab to start an accepted upcoming visit.
                        </p>
                        <button
                          onClick={() => setCompanionTab('dashboard')}
                          className="px-5 py-2 bg-emerald-700 text-white font-bold text-xs rounded-full"
                        >
                          View Schedule
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {companionTab === 'safety' && (
                  <div className="space-y-4">
                    <div className="bg-emerald-800 text-white p-5 rounded-3xl space-y-2">
                      <h3 className="font-bold text-base">Companion Trust & Vetting Status</h3>
                      <p className="text-xs text-emerald-100">
                        Checkr API Integration Verification Report for Maya Lin.
                      </p>
                    </div>

                    <button
                      onClick={() => setInspectCheckrCompanion(mainCompanion)}
                      className="w-full p-4 bg-white rounded-2xl border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center justify-between hover:bg-emerald-50"
                    >
                      <span className="flex items-center space-x-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Inspect Complete Checkr Background Check File</span>
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Android Bottom Navigation Bar (Material 3 style) */}
          <nav className="bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-around shadow-lg z-30 select-none">
            {userRole === 'care_seeker' ? (
              <>
                <button
                  onClick={() => setCareSeekerTab('explore')}
                  className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all ${
                    careSeekerTab === 'explore'
                      ? 'text-emerald-800 font-bold bg-emerald-50'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                  id="nav-tab-explore"
                >
                  <Compass className="w-5 h-5 mb-0.5" />
                  <span className="text-[10px]">Discover</span>
                </button>

                <button
                  onClick={() => setCareSeekerTab('bookings')}
                  className={`flex flex-col items-center py-1 px-3 rounded-2xl relative transition-all ${
                    careSeekerTab === 'bookings'
                      ? 'text-emerald-800 font-bold bg-emerald-50'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                  id="nav-tab-bookings"
                >
                  <Calendar className="w-5 h-5 mb-0.5" />
                  <span className="text-[10px]">Visits</span>
                  {inProgressBooking && (
                    <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                  )}
                </button>

                <button
                  onClick={() => setCareSeekerTab('seniors')}
                  className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all ${
                    careSeekerTab === 'seniors'
                      ? 'text-emerald-800 font-bold bg-emerald-50'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                  id="nav-tab-seniors"
                >
                  <Heart className="w-5 h-5 mb-0.5" />
                  <span className="text-[10px]">Seniors</span>
                </button>

                <button
                  onClick={() => setCareSeekerTab('safety')}
                  className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all ${
                    careSeekerTab === 'safety'
                      ? 'text-emerald-800 font-bold bg-emerald-50'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                  id="nav-tab-safety"
                >
                  <ShieldCheck className="w-5 h-5 mb-0.5" />
                  <span className="text-[10px]">Trust</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setCompanionTab('dashboard')}
                  className={`flex flex-col items-center py-1 px-4 rounded-2xl transition-all ${
                    companionTab === 'dashboard'
                      ? 'text-emerald-800 font-bold bg-emerald-50'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                  id="companion-nav-dashboard"
                >
                  <Calendar className="w-5 h-5 mb-0.5" />
                  <span className="text-[10px]">Schedule</span>
                </button>

                <button
                  onClick={() => setCompanionTab('active_visit')}
                  className={`flex flex-col items-center py-1 px-4 rounded-2xl relative transition-all ${
                    companionTab === 'active_visit'
                      ? 'text-emerald-800 font-bold bg-emerald-50'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                  id="companion-nav-active-visit"
                >
                  <Clock className="w-5 h-5 mb-0.5" />
                  <span className="text-[10px]">Active Visit</span>
                  {inProgressBooking && (
                    <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  )}
                </button>

                <button
                  onClick={() => setCompanionTab('safety')}
                  className={`flex flex-col items-center py-1 px-4 rounded-2xl transition-all ${
                    companionTab === 'safety'
                      ? 'text-emerald-800 font-bold bg-emerald-50'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                  id="companion-nav-safety"
                >
                  <ShieldCheck className="w-5 h-5 mb-0.5" />
                  <span className="text-[10px]">Checkr Vetting</span>
                </button>
              </>
            )}
          </nav>

          {/* Android Bottom Gesture Bar (Phone Frame Only) */}
          {deviceMode === 'phone' && (
            <div className="bg-white py-2 flex justify-center items-center">
              <div className="w-32 h-1 bg-gray-400/80 rounded-full" />
            </div>
          )}
        </div>
      </main>

      {/* MODALS */}
      {/* 1. Companion Profile Detail Modal */}
      {selectedCompanionForDetail && (
        <CompanionDetailModal
          companion={selectedCompanionForDetail}
          activeSenior={activeSenior}
          onClose={() => setSelectedCompanionForDetail(null)}
          onBook={(c) => {
            setSelectedCompanionForDetail(null);
            setBookingCompanion(c);
          }}
        />
      )}

      {/* 2. Booking Scheduling & Stripe Payment Modal */}
      {bookingCompanion && (
        <BookingFlowModal
          companion={bookingCompanion}
          seniors={seniors}
          activeSenior={activeSenior}
          existingBookings={bookings}
          onClose={() => setBookingCompanion(null)}
          onBookingConfirmed={handleBookingConfirmed}
        />
      )}

      {/* 3. Mandatory Post-Visit Summary Form (Checkout) */}
      {summaryFormBooking && (
        <PostVisitSummaryForm
          booking={summaryFormBooking}
          onCancel={() => setSummaryFormBooking(null)}
          onSubmitSummary={handleCheckoutSubmit}
        />
      )}

      {/* 4. Rover-Style Post-Visit Summary Report Card */}
      {summaryViewBooking && (
        <PostVisitSummaryView
          booking={summaryViewBooking}
          onClose={() => setSummaryViewBooking(null)}
          onSubmitRating={handleRatingSubmit}
        />
      )}

      {/* 5. Checkr Vetting Report Modal */}
      {inspectCheckrCompanion && (
        <CheckrVettingModal
          companion={inspectCheckrCompanion}
          onClose={() => setInspectCheckrCompanion(null)}
        />
      )}

      {/* 6. Favorite Era Music & Reminiscence Soundscapes Modal */}
      {showEraMusicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-stone-900 rounded-3xl overflow-hidden shadow-2xl border border-amber-600/40">
            <div className="bg-amber-950 px-5 py-3.5 border-b border-amber-600/30 flex items-center justify-between text-white">
              <div className="flex items-center space-x-2.5">
                <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
                <div>
                  <h4 className="font-extrabold text-sm">Nostalgic Soundscape & Reminiscence Studio</h4>
                  <p className="text-[11px] text-amber-200">Interactive Audio & Story Memories for {activeSenior.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowEraMusicModal(false)}
                className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-5 max-h-[85vh] overflow-y-auto">
              <AudioMemoryPlayer
                seniorName={activeSenior.name}
                defaultEra={(activeSenior.favoriteEra as any) || '1950s'}
                companionName={mainCompanion.name}
                onEraChange={(era) => {
                  const updated = { ...activeSenior, favoriteEra: era };
                  setSeniors((prev) => prev.map((s) => s.id === updated.id ? updated : s));
                  persistSeniorProfile(updated);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 7. Payment Gateway & Escrow Management Modal */}
      {showPaymentGatewayModal && (
        <PaymentGatewayModal
          userRole={userRole}
          bookings={bookings}
          companion={mainCompanion}
          onClose={() => setShowPaymentGatewayModal(false)}
          onViewInvoice={(booking) => {
            setSelectedBookingForInvoice(booking);
          }}
        />
      )}

      {/* 8. Itemized Invoice & Stripe Receipt Modal */}
      {selectedBookingForInvoice && (
        <InvoiceModal
          booking={selectedBookingForInvoice}
          onClose={() => setSelectedBookingForInvoice(null)}
        />
      )}

      {/* 9. Pre-Visit 1-Hour Check-In & Details Review Modal */}
      {preVisitCheckInBooking && (
        <PreVisitCheckInModal
          booking={preVisitCheckInBooking}
          senior={seniors.find((s) => s.id === preVisitCheckInBooking.seniorId)}
          companion={companions.find((c) => c.id === preVisitCheckInBooking.companionId)}
          onClose={() => setPreVisitCheckInBooking(null)}
          onConfirmCheckIn={handleConfirmPreVisitCheckIn}
        />
      )}

      {/* 9. Notifications Drawer */}
      {showNotificationsDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="bg-emerald-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-emerald-200" />
                <h3 className="font-bold text-sm">FCM Activity Stream</h3>
              </div>
              <button
                onClick={() => setShowNotificationsDrawer(false)}
                className="p-1 text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-xs text-gray-900">{n.title}</h5>
                    <span className="text-[10px] text-gray-400">{n.timestamp}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{n.body}</p>

                  {(n.type === 'reminder' || n.bookingId) && (
                    <button
                      onClick={() => {
                        const target = bookings.find((b) => b.id === n.bookingId) || bookings[0];
                        if (target) setPreVisitCheckInBooking(target);
                        setShowNotificationsDrawer(false);
                      }}
                      className="mt-1 w-full py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Open 1-Hour Check-In</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 10. Caregiver Separate APK & Volunteering Signup Modal */}
      <CaregiverApkModal
        isOpen={showCaregiverApkModal}
        onClose={() => setShowCaregiverApkModal(false)}
      />

      {/* 11. First Launch Initial Onboarding View */}
      {showFirstLaunchOnboarding && (
        <InitialOnboardingView
          onComplete={handleCompleteInitialOnboarding}
          onSkip={() => setShowFirstLaunchOnboarding(false)}
        />
      )}
    </div>
  );
}
