import React, { useState, useMemo, useEffect } from 'react';
import { Companion, SeniorProfile, Booking } from '../types';
import { 
  X, Calendar, Clock, CreditCard, ShieldCheck, Heart, 
  CheckCircle2, AlertCircle, Sparkles, RefreshCw, Lock,
  Smartphone, Wallet, DollarSign, Check, Zap
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { 
  parseBookingDate, getDateKey, 
  parseTimeToMinutes, formatMinutesToTime 
} from '../utils/dateUtils';
import { 
  detectCardBrand, formatCardNumber, formatExpiry, 
  createPaymentIntent, getPaymentConfig, STRIPE_TEST_CARDS,
  StripePaymentConfig
} from '../services/paymentService';
import { AvailabilityConflictAlert } from './AvailabilityConflictAlert';
import { 
  detectAvailabilityConflict, 
  SuggestedAlternativeSlot 
} from '../utils/conflictDetector';

interface BookingFlowModalProps {
  companion: Companion;
  seniors: SeniorProfile[];
  activeSenior: SeniorProfile;
  existingBookings?: Booking[];
  onClose: () => void;
  onBookingConfirmed: (newBooking: Booking) => void;
}

export const BookingFlowModal: React.FC<BookingFlowModalProps> = ({
  companion,
  seniors,
  activeSenior,
  existingBookings = [],
  onClose,
  onBookingConfirmed,
}) => {
  const [selectedSeniorId, setSelectedSeniorId] = useState(activeSenior.id);
  const [visitDate, setVisitDate] = useState('Tomorrow, 2:00 PM');
  const [selectedStartTime, setSelectedStartTime] = useState('2:00 PM');
  const [durationHours, setDurationHours] = useState(2);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<'weekly' | 'biweekly'>('weekly');
  const [overrideConflict, setOverrideConflict] = useState(false);
  
  // Care Notes
  const [careNotes, setCareNotes] = useState(
    `${activeSenior.name} loves gentle conversation about gardening and sharing tea around 3:00 PM. Please avoid discussing recent medical visits.`
  );

  // Real-time Availability Conflict Detection Engine
  const conflictReport = useMemo(() => {
    return detectAvailabilityConflict({
      companion,
      scheduledDateStr: visitDate,
      startTimeStr: selectedStartTime,
      durationHours,
      existingBookings,
    });
  }, [companion, visitDate, selectedStartTime, durationHours, existingBookings]);

  // Handle switching to a suggested alternative slot
  const handleSelectAlternative = (alt: SuggestedAlternativeSlot) => {
    setVisitDate(alt.dateOptionValue);
    setSelectedStartTime(alt.startTime);
    setDurationHours(alt.durationHours);
    setOverrideConflict(false);
  };

  // Payment Method Selection
  const [paymentChoice, setPaymentChoice] = useState<'card_saved' | 'apple_pay' | 'google_pay' | 'card_new'>('card_saved');
  const [tipAmount, setTipAmount] = useState<number>(5);
  const [paymentConfig, setPaymentConfig] = useState<StripePaymentConfig | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    getPaymentConfig().then(setPaymentConfig).catch(console.warn);
  }, []);

  // Stripe Card Form State
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('883');
  const [cardZip, setCardZip] = useState('94109');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [confirmedBookingData, setConfirmedBookingData] = useState<Booking | null>(null);

  const selectedSenior = seniors.find(s => s.id === selectedSeniorId) || activeSenior;

  // Costs
  const subtotal = companion.hourlyRate * durationHours;
  const serviceFee = subtotal * 0.1;
  const totalCost = subtotal + serviceFee + tipAmount;

  const cardBrand = detectCardBrand(cardNumber);

  const handleFillTestCard = () => {
    setPaymentChoice('card_new');
    setCardNumber('4242 4242 4242 4242');
    setCardExpiry('12/28');
    setCardCvc('123');
    setCardZip('94109');
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setPaymentError(null);

    const bookingId = `booking-${Date.now()}`;
    const cardLast4 = paymentChoice === 'card_saved' ? '4242' : cardNumber.replace(/\D/g, '').slice(-4) || '4242';

    try {
      // Pre-authorize payment hold via Stripe Gateway
      const paymentRes = await createPaymentIntent({
        amount: subtotal + serviceFee,
        durationHours,
        hourlyRate: companion.hourlyRate,
        serviceFee,
        tipAmount,
        bookingId,
        seniorName: selectedSenior.name,
        companionName: companion.name,
        cardNumber: paymentChoice === 'card_new' ? cardNumber : undefined,
        cardExpiry: paymentChoice === 'card_new' ? cardExpiry : undefined,
        cardCvc: paymentChoice === 'card_new' ? cardCvc : undefined,
        cardZip: paymentChoice === 'card_new' ? cardZip : undefined,
        cardholderName: `${selectedSenior.name} Family Account`,
        cardLast4,
        cardBrand: paymentChoice === 'apple_pay' ? 'Apple Pay' : (paymentChoice === 'google_pay' ? 'Google Pay' : cardBrand),
        paymentMethod: paymentChoice,
      });

      const invoiceNum = `INV-${Date.now().toString().slice(-6)}`;

      const parsedDate = parseBookingDate(visitDate);
      const scheduledIso = parsedDate ? getDateKey(parsedDate) : undefined;

      const newBooking: Booking = {
        id: bookingId,
        seniorId: selectedSenior.id,
        seniorName: selectedSenior.name,
        seniorAvatar: selectedSenior.avatar,
        companionId: companion.id,
        companionName: companion.name,
        companionAvatar: companion.avatar,
        companionHourlyRate: companion.hourlyRate,
        scheduledDate: visitDate,
        scheduledIso: scheduledIso,
        startTime: selectedStartTime,
        endTime: formatMinutesToTime((parseTimeToMinutes(selectedStartTime) ?? 840) + durationHours * 60),
        durationHours: durationHours,
        isRecurring: isRecurring,
        recurringFrequency: isRecurring ? recurringFrequency : undefined,
        totalCost: subtotal + serviceFee,
        serviceFee: serviceFee,
        careNotes: careNotes,
        selectedInterests: selectedSenior.interests.slice(0, 3),
        status: 'requested',
        address: selectedSenior.address,
        coordinates: selectedSenior.coordinates,
        payment: {
          cardLast4: cardLast4,
          cardBrand: paymentChoice === 'apple_pay' ? 'Apple Pay' : (paymentChoice === 'google_pay' ? 'Google Pay' : cardBrand.toUpperCase()),
          status: 'authorized',
          transactionId: paymentRes.paymentIntentId || `pi_3M_${Date.now()}`,
          chargeId: paymentRes.chargeId,
          tipAmount: tipAmount,
          authorizedAt: new Date().toISOString(),
          invoiceNumber: invoiceNum,
          escrowStatus: 'held_in_escrow',
        },
      };

      setConfirmedBookingData(newBooking);
      setIsProcessing(false);
      setPaymentSuccess(true);

      setTimeout(() => {
        onBookingConfirmed(newBooking);
      }, 1500);
    } catch (err: any) {
      console.error('Booking payment error:', err);
      setPaymentError(err.message || 'Payment authorization failed. Please check card details.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs">
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        id="booking-flow-modal"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 px-6 py-4 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base sm:text-lg">Schedule Social Visit</h3>
            <p className="text-xs text-emerald-200">With {companion.name} ({formatCurrency(companion.hourlyRate)}/hr)</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white/80 hover:text-white"
            id="close-booking-modal"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {paymentSuccess ? (
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-2xl font-bold text-gray-900">Pre-Authorization Approved!</h4>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Stripe pre-authorized {formatCurrency(totalCost)} and placed funds safely into escrow. Your card will only be finalized after {companion.name} verifies checkout with GPS.
            </p>
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 max-w-sm mx-auto space-y-1">
              <p className="font-bold">Authorization ID: {confirmedBookingData?.payment.transactionId}</p>
              <p className="text-emerald-700">Official receipt & invoice generated for {selectedSenior.name}.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitBooking} className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Step 1: Select Senior Loved One */}
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2">
                Who is this visit for?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {seniors.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSeniorId(s.id)}
                    className={`p-3 rounded-2xl border text-left flex items-center space-x-3 transition-all ${
                      selectedSeniorId === s.id
                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/30'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img src={s.avatar} alt={s.name} className="w-10 h-10 rounded-full object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-900 truncate">{s.name} ({s.age})</p>
                      <p className="text-[11px] text-gray-500 truncate">{s.relation}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Date, Time & Duration with Availability Conflict Detector */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Visit Date
                  </label>
                  <div className="relative">
                    <select
                      value={visitDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setVisitDate(val);
                        if (val.includes(' at ')) {
                          const parts = val.split(' at ');
                          if (parts[1]) setSelectedStartTime(parts[1]);
                        } else if (val.includes(', 2:00 PM')) {
                          setSelectedStartTime('2:00 PM');
                        }
                      }}
                      className="w-full p-3 pl-9 rounded-xl border border-gray-200 text-xs font-medium text-gray-900 bg-gray-50 focus:bg-white focus:border-emerald-600 focus:outline-none cursor-pointer"
                    >
                      <option value="Tomorrow, 2:00 PM">Tomorrow (Sat, Sept 12)</option>
                      <option value="Thursday, Sept 13 at 10:00 AM">Thursday, Sept 13</option>
                      <option value="Friday, Sept 14 at 1:30 PM">Friday, Sept 14</option>
                      <option value="Saturday, Sept 15 at 11:00 AM">Saturday, Sept 15</option>
                      <option value="Sunday, Sept 16 at 2:00 PM">Sunday, Sept 16</option>
                      <option value="Friday, Sept 18 at 2:00 PM">Friday, Sept 18</option>
                    </select>
                    <Calendar className="w-4 h-4 text-emerald-600 absolute left-3 top-3.5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Duration
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((hrs) => (
                      <button
                        key={hrs}
                        type="button"
                        onClick={() => setDurationHours(hrs)}
                        className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          durationHours === hrs
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {hrs} {hrs === 1 ? 'hr' : 'hrs'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Start Time Quick Selector */}
              <div>
                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center justify-between mb-1.5">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Select Start Time</span>
                  </span>
                  <span className="text-[11px] text-gray-500 font-normal">
                    Ending at {formatMinutesToTime((parseTimeToMinutes(selectedStartTime) ?? 840) + durationHours * 60)}
                  </span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {['10:00 AM', '11:30 AM', '1:00 PM', '2:00 PM', '3:30 PM', '4:30 PM'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedStartTime(t)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                        selectedStartTime === t
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-time Availability Conflict Alert Banner & Day Schedule Timeline */}
              <AvailabilityConflictAlert
                report={conflictReport}
                companionName={companion.name}
                onSelectAlternative={handleSelectAlternative}
                allowConflictOverride={true}
                onToggleOverride={(val) => setOverrideConflict(val)}
                overrideActive={overrideConflict}
              />
            </div>

            {/* Recurring Option */}
            <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-900">Make this a recurring weekly visit</p>
                <p className="text-[11px] text-gray-500">Reserved regular time slot with {companion.name.split(' ')[0]}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Care Note for Companion */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center space-x-1">
                  <span>Care Note for {companion.name.split(' ')[0]}</span>
                  <span className="text-emerald-700 font-normal lowercase">(optional)</span>
                </label>
                <span className="text-[11px] text-gray-500">Visible only to companion</span>
              </div>
              <textarea
                rows={2}
                value={careNotes}
                onChange={(e) => setCareNotes(e.target.value)}
                placeholder="Comfort routines, preferred stories, topics to avoid, or favorite tea..."
                className="w-full p-3 rounded-xl border border-gray-200 text-xs text-gray-800 bg-gray-50 focus:bg-white focus:border-emerald-600 focus:outline-none resize-none"
              />
            </div>

            {/* Step 4: Payment Gateway & Escrow Pre-Authorization */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold text-gray-900">Stripe Payment Gateway</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">ESCROW PROTECTED</span>
                </div>
                <button
                  type="button"
                  onClick={handleFillTestCard}
                  className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                >
                  Fill Demo Card
                </button>
              </div>

              {/* Payment Method Selector */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentChoice('card_saved')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                    paymentChoice === 'card_saved'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-1 ring-emerald-600'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <p className="text-[11px]">Saved Visa</p>
                  <p className="font-mono text-[10px] text-gray-500 font-normal">•••• 4242</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentChoice('apple_pay')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all flex flex-col items-center justify-center ${
                    paymentChoice === 'apple_pay'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-1 ring-emerald-600'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-[11px] flex items-center space-x-1">
                    <Smartphone className="w-3 h-3" />
                    <span>Apple Pay</span>
                  </span>
                  <span className="text-[10px] text-emerald-600 font-normal">Instant</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentChoice('card_new')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                    paymentChoice === 'card_new'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-1 ring-emerald-600'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <p className="text-[11px]">New Card</p>
                  <p className="text-[10px] text-gray-500 font-normal">Credit/HSA</p>
                </button>
              </div>

              {/* Card Inputs if New Card */}
              {paymentChoice === 'card_new' && (
                <div className="space-y-2 animate-in fade-in">
                  {/* Test Cards Quick Presets */}
                  <div className="p-2 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-gray-500 font-bold uppercase flex items-center">
                        <Zap className="w-3 h-3 mr-1 text-amber-600" /> Stripe Test Cards
                      </span>
                      <span className="text-[9px] font-mono text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded font-bold">
                        {paymentConfig?.mode === 'live' ? 'Live Connected' : 'Auto Pre-auth'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {STRIPE_TEST_CARDS.map((tc) => (
                        <button
                          key={tc.id}
                          type="button"
                          onClick={() => {
                            setCardNumber(tc.number);
                            setCardExpiry(tc.exp);
                            setCardCvc(tc.cvc);
                          }}
                          className="text-[10px] px-2 py-1 rounded-lg bg-white hover:bg-emerald-50 hover:text-emerald-800 text-gray-700 font-medium border border-gray-200 text-left transition-colors flex items-center justify-between"
                        >
                          <span className="truncate">{tc.label}</span>
                          <span className="text-[9px] font-mono text-gray-400">•••{tc.number.slice(-4)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="Card Number"
                      maxLength={19}
                      className="w-full p-2.5 pl-3 pr-20 rounded-lg border border-gray-300 text-xs font-mono bg-white focus:outline-none focus:border-emerald-600"
                      required
                    />
                    <div className="absolute right-2 top-2">
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-mono">
                        {cardBrand}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="p-2.5 rounded-lg border border-gray-300 text-xs font-mono bg-white focus:outline-none focus:border-emerald-600 text-center"
                      required
                    />
                    <input
                      type="password"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      placeholder="CVC"
                      maxLength={4}
                      className="p-2.5 rounded-lg border border-gray-300 text-xs font-mono bg-white focus:outline-none focus:border-emerald-600 text-center"
                      required
                    />
                    <input
                      type="text"
                      value={cardZip}
                      onChange={(e) => setCardZip(e.target.value)}
                      placeholder="ZIP"
                      maxLength={5}
                      className="p-2.5 rounded-lg border border-gray-300 text-xs font-mono bg-white focus:outline-none focus:border-emerald-600 text-center"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Tip Selection */}
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-gray-700">Add Companion Appreciation Tip</span>
                  <span className="text-[10px] text-gray-500">100% goes to {companion.name.split(' ')[0]}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 5, 10, 15].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTipAmount(amt)}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                        tipAmount === amt
                          ? 'bg-amber-100 border-amber-400 text-amber-900 ring-1 ring-amber-400'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {amt === 0 ? 'No tip' : `+$${amt}`}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-gray-500 flex items-center space-x-1 pt-1">
                <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Pre-authorization hold only. Funds are only charged upon verified check-out.</span>
              </p>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-1.5 pt-1 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>{formatCurrency(companion.hourlyRate)} × {durationHours} hours</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Compassionate Trust & Safety Guarantee (10%)</span>
                <span>{formatCurrency(serviceFee)}</span>
              </div>
              {tipAmount > 0 && (
                <div className="flex justify-between text-amber-800 font-medium">
                  <span>Companion Appreciation Tip</span>
                  <span>+{formatCurrency(tipAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total Pre-Authorized in Escrow</span>
                <span className="text-emerald-800 font-black">{formatCurrency(totalCost)}</span>
              </div>
            </div>

            {/* Submit Button & Conflict Warning */}
            <div className="pt-2 space-y-2">
              {paymentError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start space-x-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Stripe Authorization Error</p>
                    <p className="text-[11px] text-red-700 mt-0.5">{paymentError}</p>
                  </div>
                </div>
              )}

              {conflictReport.hasConflict && conflictReport.severity === 'critical' && !overrideConflict && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-center text-xs text-rose-800 font-semibold flex items-center justify-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Calendar conflict detected with {companion.name.split(' ')[0]}. Select an alternative time above or acknowledge the override to continue.</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing || (conflictReport.hasConflict && conflictReport.severity === 'critical' && !overrideConflict)}
                className={`w-full py-3.5 px-6 font-bold text-sm rounded-full shadow-lg flex items-center justify-center space-x-2 transition-all active:scale-98 ${
                  conflictReport.hasConflict && conflictReport.severity === 'critical' && !overrideConflict
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                    : 'bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white cursor-pointer'
                }`}
                id="submit-booking-and-pay"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Authorizing Escrow via Stripe...</span>
                  </>
                ) : conflictReport.hasConflict && conflictReport.severity === 'critical' && !overrideConflict ? (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    <span>Resolve Overlap to Authorize ({formatCurrency(totalCost)})</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Authorize & Hold in Escrow ({formatCurrency(totalCost)})</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

