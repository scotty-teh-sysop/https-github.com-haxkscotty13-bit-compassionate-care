import React, { useState, useEffect } from 'react';
import { Booking, PaymentMethod, PaymentTransaction, CompanionPayout } from '../types';
import { 
  X, CreditCard, ShieldCheck, ArrowUpRight, DollarSign, 
  Building2, CheckCircle2, Clock, Plus, Lock, AlertCircle, 
  Wallet, RefreshCw, FileText, Smartphone, ExternalLink, Zap,
  Check, Eye, Sparkles
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { 
  detectCardBrand, 
  formatCardNumber, 
  formatExpiry, 
  processCompanionPayout,
  getPaymentConfig,
  getPaymentIntentStatus,
  cancelEscrowHold,
  capturePayment,
  validateCardNumber,
  STRIPE_TEST_CARDS,
  StripePaymentConfig
} from '../services/paymentService';

interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'care_seeker' | 'companion';
  bookings: Booking[];
  onOpenInvoice: (booking: Booking) => void;
  onShowToast: (title: string, body: string) => void;
}

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  isOpen,
  onClose,
  role,
  bookings,
  onOpenInvoice,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'methods' | 'escrow' | 'payouts'>(
    role === 'companion' ? 'payouts' : 'methods'
  );

  // Saved Payment Methods for Seeker
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: 'pm_1',
      brand: 'visa',
      last4: '4242',
      expiry: '12/28',
      cardholderName: 'Sarah Vance',
      isDefault: true,
      isFsaHsaEligible: false,
    },
    {
      id: 'pm_2',
      brand: 'mastercard',
      last4: '8821',
      expiry: '09/27',
      cardholderName: 'Sarah Vance',
      isDefault: false,
      isFsaHsaEligible: false,
    },
    {
      id: 'pm_3',
      brand: 'fsa_hsa',
      last4: '5519',
      expiry: '04/26',
      cardholderName: 'Sarah Vance (WEX Health HSA)',
      isDefault: false,
      isFsaHsaEligible: true,
    },
  ]);

  // New Card Form State
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardExpiry, setNewCardExpiry] = useState('');
  const [newCardCvc, setNewCardCvc] = useState('');
  const [newCardName, setNewCardName] = useState('');
  const [isFsaCard, setIsFsaCard] = useState(false);

  // Stripe Config & Escrow Verification
  const [paymentConfig, setPaymentConfig] = useState<StripePaymentConfig | null>(null);
  const [verifyingHoldId, setVerifyingHoldId] = useState<string | null>(null);
  const [verifiedHolds, setVerifiedHolds] = useState<Record<string, any>>({});
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    getPaymentConfig().then(setPaymentConfig).catch(console.warn);
  }, []);

  // Companion Payouts State
  const [availableBalance, setAvailableBalance] = useState<number>(165.00);
  const [payoutsHistory, setPayoutsHistory] = useState<CompanionPayout[]>([
    {
      id: 'po_1928301',
      companionId: 'c1',
      companionName: 'Elena Rostova',
      amount: 132.00,
      fee: 0.50,
      netAmount: 131.50,
      destination: 'Chase Bank (•••• 9812)',
      status: 'paid',
      date: 'Sept 8, 2026',
      arrivalDate: 'Delivered',
      type: 'instant',
    },
    {
      id: 'po_1892019',
      companionId: 'c1',
      companionName: 'Elena Rostova',
      amount: 90.00,
      fee: 0.00,
      netAmount: 90.00,
      destination: 'Chase Bank (•••• 9812)',
      status: 'paid',
      date: 'Sept 2, 2026',
      arrivalDate: 'Delivered',
      type: 'standard',
    },
  ]);
  const [isTransferring, setIsTransferring] = useState(false);

  if (!isOpen) return null;

  // Active Escrow holds (bookings with status 'requested' or 'accepted' or 'in_progress')
  const escrowBookings = bookings.filter(
    (b) => b.status === 'requested' || b.status === 'accepted' || b.status === 'in_progress'
  );
  const totalHeldInEscrow = escrowBookings.reduce((sum, b) => sum + (b.totalCost || 0), 0);

  // Completed bookings for receipt table
  const completedBookings = bookings.filter((b) => b.status === 'completed');

  // Handle Add Card
  const handleAddNewCard = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = newCardNumber.replace(/\D/g, '');
    if (cleanNum.length < 15) {
      alert('Please enter a valid 16-digit card number.');
      return;
    }
    const detected = detectCardBrand(newCardNumber);
    const brand = isFsaCard ? 'fsa_hsa' : (detected === 'generic' ? 'visa' : detected);

    const newMethod: PaymentMethod = {
      id: `pm_${Date.now()}`,
      brand: brand as any,
      last4: cleanNum.slice(-4),
      expiry: newCardExpiry || '12/28',
      cardholderName: newCardName || 'Family Guardian',
      isDefault: paymentMethods.length === 0,
      isFsaHsaEligible: isFsaCard,
    };

    setPaymentMethods((prev) => [newMethod, ...prev]);
    setShowAddCard(false);
    setNewCardNumber('');
    setNewCardExpiry('');
    setNewCardCvc('');
    setNewCardName('');
    setIsFsaCard(false);

    onShowToast('Payment Method Added', `Ending in •••• ${newMethod.last4} saved via Stripe Vault.`);
  };

  const handleSetDefault = (id: string) => {
    setPaymentMethods((prev) =>
      prev.map((m) => ({ ...m, isDefault: m.id === id }))
    );
    onShowToast('Default Card Updated', 'Visits will now charge this card by default.');
  };

  const handleDeleteMethod = (id: string) => {
    if (paymentMethods.length <= 1) {
      alert('You must keep at least one active payment method.');
      return;
    }
    setPaymentMethods((prev) => prev.filter((m) => m.id !== id));
    onShowToast('Payment Method Removed', 'Card securely deleted from Stripe Vault.');
  };

  // Verify an Escrow Hold via Stripe API
  const handleVerifyEscrowHold = async (paymentIntentId: string) => {
    setVerifyingHoldId(paymentIntentId);
    try {
      const statusRes = await getPaymentIntentStatus(paymentIntentId);
      setVerifiedHolds(prev => ({
        ...prev,
        [paymentIntentId]: statusRes,
      }));
      onShowToast(
        'Stripe Hold Verified',
        `Hold ${paymentIntentId.slice(-8)} is active. Status: ${statusRes.status}.`
      );
    } catch (err: any) {
      onShowToast('Verification Failed', err.message || 'Could not verify hold.');
    } finally {
      setVerifyingHoldId(null);
    }
  };

  // Cancel Escrow Hold
  const handleCancelHold = async (paymentIntentId: string, bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this pre-authorization hold? Funds will be released back to the family card.')) return;
    setActionInProgress(paymentIntentId);
    try {
      const res = await cancelEscrowHold({ paymentIntentId, bookingId });
      setVerifiedHolds(prev => ({
        ...prev,
        [paymentIntentId]: { status: 'canceled', message: res.message },
      }));
      onShowToast('Escrow Hold Canceled', res.message || 'Pre-authorization released safely.');
    } catch (err: any) {
      onShowToast('Cancellation Error', err.message || 'Could not cancel hold.');
    } finally {
      setActionInProgress(null);
    }
  };

  // Simulate GPS Capture
  const handleSimulateCapture = async (b: Booking) => {
    setActionInProgress(b.payment.transactionId);
    try {
      const res = await capturePayment({
        paymentIntentId: b.payment.transactionId,
        bookingId: b.id,
        companionId: b.companionId,
        tip: b.payment.tipAmount || 0,
      });
      setVerifiedHolds(prev => ({
        ...prev,
        [b.payment.transactionId]: { status: 'succeeded', message: 'Funds captured & released to companion.' },
      }));
      setAvailableBalance(prev => prev + (b.totalCost * 0.9));
      onShowToast('Escrow Captured Successfully', `Released ${formatCurrency(b.totalCost * 0.9)} to ${b.companionName}.`);
    } catch (err: any) {
      onShowToast('Capture Error', err.message || 'Could not capture payment.');
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle Companion Instant Payout
  const handleInitiatePayout = async (type: 'instant' | 'standard') => {
    if (availableBalance <= 0) {
      alert('No available earnings to transfer.');
      return;
    }
    setIsTransferring(true);
    const amountToTransfer = availableBalance;

    try {
      const payoutResult = await processCompanionPayout({
        companionId: 'c1',
        companionName: 'Elena Rostova',
        amount: amountToTransfer,
        payoutType: type,
      });

      setPayoutsHistory((prev) => [payoutResult, ...prev]);
      setAvailableBalance(0);
      onShowToast(
        'Stripe Payout Transferred!',
        `${formatCurrency(payoutResult.netAmount)} sent to ${payoutResult.destination} (${payoutResult.arrivalDate}).`
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col max-h-[92vh]"
        id="payment-gateway-modal"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-emerald-950 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base sm:text-lg">Stripe Payment Gateway & Escrow</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/40 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{paymentConfig?.stripeLive ? 'STRIPE LIVE' : 'STRIPE TEST'}</span>
                </span>
              </div>
              <p className="text-xs text-teal-200">
                Encrypted pre-authorizations, automated escrow release, and Stripe Connect payouts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50/80 px-6 pt-2">
          <button
            onClick={() => setActiveTab('methods')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'methods'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Family Billing & Wallet ({paymentMethods.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('escrow')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'escrow'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Escrow Holds ({escrowBookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payouts')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'payouts'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Companion Payouts (Stripe Connect)</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: FAMILY BILLING & SAVED PAYMENT METHODS */}
          {activeTab === 'methods' && (
            <div className="space-y-6">
              {/* Trust Badge Banner */}
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start space-x-3 text-xs text-emerald-900">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Rover-Style Care Escrow Guarantee</p>
                  <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                    When you schedule a visit, an authorization hold is placed on your card. Funds remain safely in escrow and are only captured after your companion completes their visit and submits GPS check-out verification.
                  </p>
                </div>
              </div>

              {/* Saved Cards List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Saved Cards in Stripe Vault</h4>
                  <button
                    onClick={() => setShowAddCard(!showAddCard)}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showAddCard ? 'Cancel' : 'Add New Card'}</span>
                  </button>
                </div>

                {/* Add Card Form */}
                {showAddCard && (
                  <form onSubmit={handleAddNewCard} className="mb-4 p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-xs text-gray-900">Enter Card Details</p>
                      <span className="text-[10px] text-gray-500 font-mono">Stripe Vault Protected</span>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="p-2 bg-white rounded-xl border border-gray-200">
                      <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 flex items-center">
                        <Zap className="w-3 h-3 mr-1 text-amber-500" /> One-Click Stripe Test Cards
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {STRIPE_TEST_CARDS.map(tc => (
                          <button
                            key={tc.id}
                            type="button"
                            onClick={() => {
                              setNewCardNumber(tc.number);
                              setNewCardExpiry(tc.exp);
                              setNewCardCvc(tc.cvc);
                              setNewCardName('Sarah Vance');
                              setIsFsaCard(tc.id === 'fsa_hsa');
                            }}
                            className="p-1.5 text-[10px] text-left rounded-lg bg-gray-50 hover:bg-emerald-50 hover:text-emerald-900 border border-gray-200 transition-colors"
                          >
                            <p className="font-bold truncate">{tc.label.split(' ')[0]}</p>
                            <p className="font-mono text-[9px] text-gray-400">•••• {tc.number.slice(-4)}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        value={newCardName}
                        onChange={(e) => setNewCardName(e.target.value)}
                        placeholder="Sarah Vance"
                        className="w-full p-2 rounded-lg border border-gray-300 text-xs bg-white focus:outline-none focus:border-emerald-600"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Card Number</label>
                        <input
                          type="text"
                          value={newCardNumber}
                          onChange={(e) => setNewCardNumber(formatCardNumber(e.target.value))}
                          placeholder="4242 4242 4242 4242"
                          maxLength={19}
                          className="w-full p-2 rounded-lg border border-gray-300 text-xs font-mono bg-white focus:outline-none focus:border-emerald-600"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">MM/YY</label>
                          <input
                            type="text"
                            value={newCardExpiry}
                            onChange={(e) => setNewCardExpiry(formatExpiry(e.target.value))}
                            placeholder="12/28"
                            maxLength={5}
                            className="w-full p-2 rounded-lg border border-gray-300 text-xs font-mono text-center bg-white focus:outline-none focus:border-emerald-600"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">CVC</label>
                          <input
                            type="password"
                            value={newCardCvc}
                            onChange={(e) => setNewCardCvc(e.target.value)}
                            placeholder="123"
                            maxLength={4}
                            className="w-full p-2 rounded-lg border border-gray-300 text-xs font-mono text-center bg-white focus:outline-none focus:border-emerald-600"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isFsaCard}
                          onChange={(e) => setIsFsaCard(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>This is an FSA / HSA Healthcare Spending Card</span>
                      </label>
                      <button
                        type="submit"
                        className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs"
                      >
                        Save Card Securely
                      </button>
                    </div>
                  </form>
                )}

                {/* Card List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {paymentMethods.map((pm) => (
                    <div
                      key={pm.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        pm.isDefault 
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-xs' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="w-5 h-5 text-gray-700" />
                          <span className="font-mono text-sm font-bold text-gray-900 uppercase">
                            {pm.brand === 'fsa_hsa' ? 'FSA/HSA Card' : pm.brand}
                          </span>
                        </div>
                        {pm.isDefault ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                            DEFAULT
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSetDefault(pm.id)}
                            className="text-[11px] text-gray-500 hover:text-emerald-700 font-medium"
                          >
                            Set Default
                          </button>
                        )}
                      </div>

                      <p className="font-mono text-sm text-gray-700 tracking-wider">•••• •••• •••• {pm.last4}</p>

                      <div className="flex items-center justify-between mt-3 text-xs text-gray-500 pt-2 border-t border-gray-100">
                        <span>Expires {pm.expiry}</span>
                        {paymentMethods.length > 1 && (
                          <button
                            onClick={() => handleDeleteMethod(pm.id)}
                            className="text-[11px] text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Digital Wallets */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Express Checkout Wallets</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="w-4 h-4 text-gray-700" />
                      <span className="text-xs font-bold text-gray-900">Apple Pay</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">Configured</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Wallet className="w-4 h-4 text-gray-700" />
                      <span className="text-xs font-bold text-gray-900">Google Pay</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">Configured</span>
                  </div>
                </div>
              </div>

              {/* Recent Invoices & Receipts */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Completed Visit Receipts</h4>
                {completedBookings.length === 0 ? (
                  <p className="text-xs text-gray-500 p-4 bg-gray-50 rounded-2xl text-center">No completed visits yet.</p>
                ) : (
                  <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden bg-white">
                    {completedBookings.map((b) => (
                      <div key={b.id} className="p-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors text-xs">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-gray-900">Visit with {b.companionName}</span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">PAID</span>
                          </div>
                          <p className="text-[11px] text-gray-500">{b.scheduledDate} • {b.seniorName}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="font-mono font-bold text-gray-900">{formatCurrency(b.totalCost)}</span>
                          <button
                            onClick={() => onOpenInvoice(b)}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg text-[11px] font-bold text-gray-700 flex items-center space-x-1 border border-gray-200"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Invoice</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ESCROW HOLDS */}
          {activeTab === 'escrow' && (
            <div className="space-y-6">
              {/* Escrow Balance Banner */}
              <div className="p-5 bg-gradient-to-br from-emerald-800 to-teal-900 text-white rounded-3xl shadow-lg flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-200 font-bold uppercase tracking-wider">Total Held in Protected Escrow</p>
                  <p className="text-3xl font-extrabold font-mono mt-1">{formatCurrency(totalHeldInEscrow)}</p>
                  <p className="text-xs text-emerald-200/90 mt-1">Across {escrowBookings.length} scheduled / active visits</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-emerald-300" />
                </div>
              </div>

              {/* Escrow Mechanism Explainer */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs space-y-2 text-gray-700 leading-relaxed">
                <p className="font-bold text-gray-900 flex items-center space-x-1.5">
                  <Lock className="w-4 h-4 text-emerald-700" />
                  <span>How Compassionate Care Protects Your Family</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px]">
                  <div className="p-3 bg-white rounded-xl border border-gray-200">
                    <p className="font-bold text-gray-900 mb-1">1. Pre-Authorization</p>
                    Your card is pre-authorized when booking is confirmed. No charge is finalized yet.
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-gray-200">
                    <p className="font-bold text-gray-900 mb-1">2. GPS Check-In/Out</p>
                    Companion arrives and checks in via GPS geofence. The visit timer tracks elapsed time.
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-gray-200">
                    <p className="font-bold text-gray-900 mb-1">3. Automated Release</p>
                    After companion submits report card and photos, funds are released to companion minus 10% safety fee.
                  </div>
                </div>
              </div>

              {/* Active Escrow List */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Visits with Active Escrow Holds</h4>
                {escrowBookings.length === 0 ? (
                  <p className="text-xs text-gray-500 p-4 bg-gray-50 rounded-2xl text-center">No active holds currently.</p>
                ) : (
                  <div className="space-y-3">
                    {escrowBookings.map((b) => {
                      const holdStatus = verifiedHolds[b.payment.transactionId];
                      const isVerifying = verifyingHoldId === b.payment.transactionId;
                      const isActing = actionInProgress === b.payment.transactionId;

                      return (
                        <div key={b.id} className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 text-xs space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-gray-900">{b.seniorName} with {b.companionName}</span>
                              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded uppercase">
                                {holdStatus?.status || b.status}
                              </span>
                            </div>
                            <span className="font-mono font-bold text-emerald-900 text-sm">
                              {formatCurrency(b.totalCost)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-gray-600">
                            <span>Scheduled: {b.scheduledDate} ({b.durationHours} hrs)</span>
                            <span className="font-mono text-gray-500 font-medium">
                              Stripe ID: {b.payment.transactionId}
                            </span>
                          </div>

                          {/* Live Stripe Verification Details */}
                          {holdStatus && (
                            <div className="p-2.5 bg-white rounded-xl border border-emerald-300 text-[11px] space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-500">Live Gateway Status:</span>
                                <span className="font-mono font-bold text-emerald-800 uppercase">
                                  {holdStatus.status}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-500">Authorized Escrow Hold:</span>
                                <span className="font-mono font-bold text-gray-800">
                                  ${(holdStatus.amount || b.totalCost).toFixed(2)} USD
                                </span>
                              </div>
                              <p className="text-emerald-700 text-[10px] italic">
                                {holdStatus.message || 'Escrow hold is protected and awaiting GPS visit conclusion.'}
                              </p>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center justify-end space-x-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleVerifyEscrowHold(b.payment.transactionId)}
                              disabled={isVerifying}
                              className="px-2.5 py-1 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-[11px] flex items-center space-x-1 cursor-pointer"
                            >
                              {isVerifying ? (
                                <RefreshCw className="w-3 h-3 animate-spin text-emerald-700" />
                              ) : (
                                <Eye className="w-3 h-3 text-emerald-700" />
                              )}
                              <span>Verify on Stripe</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSimulateCapture(b)}
                              disabled={isActing || holdStatus?.status === 'succeeded' || holdStatus?.status === 'canceled'}
                              className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-[11px] flex items-center space-x-1 cursor-pointer"
                            >
                              {isActing ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3 h-3" />
                              )}
                              <span>Simulate GPS Capture</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCancelHold(b.payment.transactionId, b.id)}
                              disabled={isActing || holdStatus?.status === 'canceled' || holdStatus?.status === 'succeeded'}
                              className="px-2 py-1 rounded-lg hover:bg-rose-50 text-rose-700 font-bold text-[11px] cursor-pointer"
                            >
                              Release Hold
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: COMPANION PAYOUTS & STRIPE CONNECT */}
          {activeTab === 'payouts' && (
            <div className="space-y-6">
              {/* Earnings & Payout Header */}
              <div className="p-5 bg-gradient-to-br from-slate-900 to-teal-950 text-white rounded-3xl shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xs text-teal-300 font-bold uppercase tracking-wider">Available Balance</span>
                    <h3 className="text-3xl font-black font-mono mt-1">{formatCurrency(availableBalance)}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-gray-300">Direct Deposit Account</span>
                    <p className="text-xs font-bold text-white flex items-center space-x-1 justify-end mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-teal-400" />
                      <span>Chase Checking (•••• 9812)</span>
                    </p>
                  </div>
                </div>

                {/* Instant Transfer Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-white/10">
                  <button
                    onClick={() => handleInitiatePayout('instant')}
                    disabled={isTransferring || availableBalance <= 0}
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer"
                  >
                    {isTransferring ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-emerald-100" />
                        <span>Instant Transfer ($0.50 fee)</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleInitiatePayout('standard')}
                    disabled={isTransferring || availableBalance <= 0}
                    className="py-2.5 px-4 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Free Standard (2 Business Days)</span>
                  </button>
                </div>
              </div>

              {/* Stripe Connect Account Card */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <p className="font-bold text-gray-900">Stripe Express Account Active</p>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <p className="text-[11px] text-gray-500">1099-NEC tax filing & daily payouts enabled</p>
                  </div>
                </div>
                <button
                  onClick={() => onShowToast('Stripe Express Dashboard', 'Opening Stripe Express portal in simulated safe tab.')}
                  className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg font-bold text-[11px] text-gray-700 flex items-center space-x-1"
                >
                  <span>Dashboard</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {/* Payouts History Ledger */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Completed Transfers to Bank</h4>
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden bg-white">
                  {payoutsHistory.map((po) => (
                    <div key={po.id} className="p-4 flex items-center justify-between text-xs hover:bg-gray-50">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-gray-900">{formatCurrency(po.netAmount)}</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                            {po.status.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-gray-500 uppercase">{po.type} transfer</span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {po.date} • Sent to {po.destination} ({po.arrivalDate})
                        </p>
                      </div>
                      <span className="font-mono text-[11px] text-gray-400 select-all font-semibold">
                        {po.id}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-6 py-3 border-t border-gray-200 flex items-center justify-between text-xs">
          <span className="text-gray-500 text-[11px] flex items-center space-x-1">
            <Lock className="w-3 h-3 text-emerald-700" />
            <span>Stripe Connect Marketplace Gateway • End-to-End Escrow Protection</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 hover:bg-black text-white font-bold rounded-xl text-xs transition-colors"
          >
            Close Gateway
          </button>
        </div>
      </div>
    </div>
  );
};
