export type UserRole = 'care_seeker' | 'companion';

export interface SeniorProfile {
  id: string;
  familyUserId: string;
  name: string;
  age: number;
  avatar: string;
  relation: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  interests: string[];
  routinePreferences: string;
  specialNeeds: string;
  comfortTopics: string[];
  topicsToAvoid: string[];
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  favoriteEra?: '1940s' | '1950s' | '1960s' | '1970s';
  allowsVolunteerVisits?: boolean;
}

export interface CompanionVetting {
  idVerified: boolean;
  checkrCleared: boolean;
  backgroundCheckDate: string;
  cprCertified: boolean;
  referenceChecked: boolean;
  trainingCompleted: boolean;
  checkrReportId: string;
}

export interface CompanionReview {
  id: string;
  authorName: string;
  authorRelation: string;
  date: string;
  rating: number;
  comment: string;
}

export interface Companion {
  id: string;
  name: string;
  title: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  distanceMiles: number;
  bio: string;
  locationName: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  vetting: CompanionVetting;
  interests: string[];
  specializations: string[];
  badges: string[];
  availableDays: string[];
  availableTimeSlots: string[];
  reviews: CompanionReview[];
  isVolunteer?: boolean;
}

export type BookingStatus =
  | 'requested'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface VoiceMemo {
  id: string;
  audioUrl: string;
  durationSeconds: number;
  label?: string;
  recordedAt: string;
  transcriptPreview?: string;
}

export interface PostVisitSummary {
  submittedAt: string;
  photos: string[];
  moodRating: 'Joyful' | 'Calm' | 'Engaged' | 'Thoughtful' | 'Restful' | 'Tired';
  activitiesCompleted: string[];
  notesToFamily: string;
  hydrationSnackNote: string;
  companionSignature: string;
  voiceMemo?: VoiceMemo;
}

export interface VisitTracking {
  checkInTime?: string;
  checkInVerified: boolean;
  checkInMethod?: 'gps_geofence' | 'qr_code';
  checkOutTime?: string;
  checkOutVerified?: boolean;
  elapsedSeconds?: number;
}

export interface FamilyPreVisitCheckIn {
  checkedIn: boolean;
  checkedInAt?: string;
  hostName?: string;
  doorOrAccessInstructions?: string;
  reviewedCareNotes?: boolean;
}

export interface Booking {
  id: string;
  seniorId: string;
  seniorName: string;
  seniorAvatar: string;
  companionId: string;
  companionName: string;
  companionAvatar: string;
  companionHourlyRate: number;
  scheduledDate: string;
  scheduledIso?: string; // e.g. '2026-09-11' for normalized calendar integration
  startTime: string;
  endTime: string;
  durationHours: number;
  isRecurring: boolean;
  recurringFrequency?: 'weekly' | 'biweekly';
  totalCost: number;
  serviceFee: number;
  careNotes: string;
  selectedInterests: string[];
  status: BookingStatus;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  payment: {
    cardLast4: string;
    cardBrand?: string;
    status: 'authorized' | 'paid' | 'refunded';
    transactionId: string;
    chargeId?: string;
    tipAmount?: number;
    authorizedAt?: string;
    capturedAt?: string;
    invoiceNumber?: string;
    escrowStatus?: 'held_in_escrow' | 'released_to_companion' | 'refunded';
  };
  visitTracking?: VisitTracking;
  postVisitSummary?: PostVisitSummary;
  familyCheckIn?: FamilyPreVisitCheckIn;
  fcmReminder1HrSent?: boolean;
  fcmReminder1HrSentAt?: string;
  seekerRating?: {
    rating: number;
    review: string;
    createdAt: string;
  };
}

export interface PaymentMethod {
  id: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'discover' | 'apple_pay' | 'google_pay' | 'fsa_hsa';
  last4: string;
  expiry: string;
  cardholderName: string;
  isDefault: boolean;
  isFsaHsaEligible?: boolean;
}

export interface PaymentTransaction {
  id: string;
  bookingId: string;
  seniorName: string;
  companionName: string;
  amount: number;
  subtotal: number;
  serviceFee: number;
  tipAmount: number;
  cardLast4: string;
  cardBrand: string;
  status: 'authorized_escrow' | 'captured' | 'payout_transferred' | 'refunded';
  paymentIntentId: string;
  chargeId?: string;
  payoutId?: string;
  timestamp: string;
  capturedAt?: string;
  invoiceNumber: string;
  escrowReleaseCondition: string;
}

export interface CompanionPayout {
  id: string;
  companionId: string;
  companionName: string;
  amount: number;
  fee: number;
  netAmount: number;
  destination: string;
  status: 'paid' | 'pending' | 'in_transit';
  date: string;
  arrivalDate: string;
  type: 'instant' | 'standard';
  relatedBookingId?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  type: 'status' | 'checkin' | 'summary' | 'emergency' | 'booking' | 'reminder';
  bookingId?: string;
  data?: {
    action?: 'check_in' | 'review_details';
    bookingId?: string;
    companionName?: string;
    seniorName?: string;
    scheduledTime?: string;
  };
}

export interface FcmTokenInfo {
  token: string;
  status: 'granted' | 'denied' | 'default' | 'simulated';
  registeredAt: string;
  deviceType: string;
}

export interface FcmNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    bookingId?: string;
    action?: 'check_in' | 'review_details';
    url?: string;
    seniorName?: string;
    companionName?: string;
    scheduledTime?: string;
    minutesUntilVisit?: number;
  };
}

export interface FamilyUserAccount {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  relationToSenior: string;
  googleConnected: boolean;
  googlePhotoUrl?: string;
  paymentMethod: {
    type: 'google_wallet' | 'card';
    cardLast4?: string;
    cardBrand?: string;
    billingName?: string;
    isVerified: boolean;
  };
  allowsVolunteerVisits: boolean;
  createdAt: string;
}

export interface CaregiverApplication {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  track: 'volunteer' | 'professional';
  interests: string[];
  bio: string;
  city: string;
  country?: 'US' | 'CA';
  checkrAgreed: boolean;
  albertaVscAgreed?: boolean;
  status: 'pending_vetting' | 'approved';
  submittedAt: string;
}

export interface ReminiscenceStory {
  id: string;
  seniorId?: string;
  seniorName: string;
  date: string;
  era: '1940s' | '1950s' | '1960s' | '1970s';
  category: string;
  prompt: string;
  audioUrl?: string;
  transcript: string;
  emotion?: 'Joyful' | 'Heartwarming' | 'Nostalgic' | 'Reflective';
  companionName?: string;
  durationSeconds?: number;
}

