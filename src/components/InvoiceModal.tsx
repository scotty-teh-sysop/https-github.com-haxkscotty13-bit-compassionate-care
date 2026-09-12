import React from 'react';
import { Booking } from '../types';
import { 
  X, Printer, CheckCircle2, ShieldCheck, Heart, 
  CreditCard, Calendar, Clock, MapPin, Download, Copy, Check 
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface InvoiceModalProps {
  booking: Booking;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ booking, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  const subtotal = booking.companionHourlyRate * booking.durationHours;
  const serviceFee = booking.serviceFee || subtotal * 0.1;
  const tipAmount = booking.payment.tipAmount || 0;
  const totalPaid = booking.totalCost + tipAmount;
  const invoiceNumber = booking.payment.invoiceNumber || `INV-${booking.id.replace(/\D/g, '').slice(-6) || '849201'}`;
  const transactionId = booking.payment.transactionId || `pi_3M${booking.id}`;
  const paymentDate = booking.payment.capturedAt 
    ? new Date(booking.payment.capturedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'September 12, 2026';

  const handleCopySummary = () => {
    const text = `Compassionate Care Receipt #${invoiceNumber}\nDate: ${paymentDate}\nLoved One: ${booking.seniorName}\nCompanion: ${booking.companionName}\nTotal Paid: ${formatCurrency(totalPaid)}\nStripe Transaction ID: ${transactionId}`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col max-h-[92vh]"
        id="invoice-modal"
      >
        {/* Top Action Bar */}
        <div className="bg-slate-900 px-6 py-3.5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-xs tracking-wide">Official Stripe Receipt & Invoice</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopySummary}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white/90 flex items-center space-x-1 transition-colors"
              title="Copy Summary"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-[11px] hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white/90 flex items-center space-x-1 transition-colors"
              title="Print Receipt"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-gray-800 font-sans" id="printable-receipt">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-gray-200 pb-5">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-7 h-7 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  <Heart className="w-4 h-4 fill-emerald-100" />
                </div>
                <span className="font-extrabold text-base tracking-tight text-gray-900">Compassionate Care</span>
              </div>
              <p className="text-[11px] text-gray-500">Non-Medical Senior Social Companionship</p>
              <p className="text-[11px] text-gray-400">San Francisco, CA • EIN: 94-3829104</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3 h-3" />
                <span>PAID IN FULL</span>
              </span>
              <p className="text-xs font-mono font-bold text-gray-800 mt-1.5">{invoiceNumber}</p>
              <p className="text-[11px] text-gray-500">{paymentDate}</p>
            </div>
          </div>

          {/* Billed To / Visit Details */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="font-bold text-gray-500 uppercase tracking-wider text-[10px] mb-1">Billed To (Family Seeker)</p>
              <p className="font-bold text-gray-900">{booking.seniorName}'s Family</p>
              <p className="text-gray-600 text-[11px]">{booking.address}</p>
              <p className="text-gray-500 text-[11px] mt-1">Care Recipient: <span className="font-semibold text-gray-800">{booking.seniorName}</span></p>
            </div>
            <div>
              <p className="font-bold text-gray-500 uppercase tracking-wider text-[10px] mb-1">Assigned Companion</p>
              <p className="font-bold text-gray-900">{booking.companionName}</p>
              <div className="flex items-center space-x-1 text-[11px] text-emerald-700 font-semibold mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Checkr Background Cleared</span>
              </div>
              <p className="text-gray-500 text-[11px] mt-1">
                Scheduled: {booking.scheduledDate} ({booking.startTime} - {booking.endTime})
              </p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 grid grid-cols-12 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
              <div className="col-span-7">Description</div>
              <div className="col-span-2 text-center">Rate</div>
              <div className="col-span-3 text-right">Amount</div>
            </div>
            <div className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-12 items-center">
                <div className="col-span-7">
                  <p className="font-bold text-gray-900">Non-Medical Social Companionship</p>
                  <p className="text-[11px] text-gray-500">
                    {booking.durationHours} hrs visit with {booking.companionName.split(' ')[0]}
                  </p>
                </div>
                <div className="col-span-2 text-center text-gray-600 font-mono">
                  {formatCurrency(booking.companionHourlyRate)}/hr
                </div>
                <div className="col-span-3 text-right font-bold text-gray-900 font-mono">
                  {formatCurrency(subtotal)}
                </div>
              </div>

              <div className="grid grid-cols-12 items-center text-gray-600">
                <div className="col-span-7">
                  <p className="font-medium">Compassionate Trust & Safety Guarantee</p>
                  <p className="text-[10px] text-gray-400">
                    GPS Geofencing, $1M General Liability Policy, & 24/7 Care Support
                  </p>
                </div>
                <div className="col-span-2 text-center text-gray-500 font-mono">10%</div>
                <div className="col-span-3 text-right font-bold text-gray-800 font-mono">
                  {formatCurrency(serviceFee)}
                </div>
              </div>

              {tipAmount > 0 && (
                <div className="grid grid-cols-12 items-center text-gray-600">
                  <div className="col-span-7">
                    <p className="font-medium text-amber-900">Companion Appreciation Tip</p>
                    <p className="text-[10px] text-amber-700">100% directly transferred to {booking.companionName.split(' ')[0]}</p>
                  </div>
                  <div className="col-span-2 text-center text-amber-700 font-mono">Direct</div>
                  <div className="col-span-3 text-right font-bold text-amber-800 font-mono">
                    {formatCurrency(tipAmount)}
                  </div>
                </div>
              )}
            </div>

            {/* Total Row */}
            <div className="bg-emerald-50/70 border-t border-emerald-100 px-4 py-3 flex justify-between items-center text-xs">
              <span className="font-extrabold text-emerald-950 uppercase tracking-wide">Total Charged</span>
              <span className="font-black text-emerald-900 text-base font-mono">
                {formatCurrency(totalPaid)}
              </span>
            </div>
          </div>

          {/* Payment Method & Security Card */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Payment Processor:</span>
              <span className="font-semibold text-gray-800 flex items-center space-x-1">
                <span>Stripe Payments US</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-1.5 py-0.2 rounded-sm">256-BIT SSL</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Card Charged:</span>
              <span className="font-mono font-bold text-gray-900">Visa ending in •••• {booking.payment.cardLast4 || '4242'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Stripe Transaction ID:</span>
              <span className="font-mono text-[11px] text-emerald-800 select-all font-bold">{transactionId}</span>
            </div>
          </div>

          {/* Respite Care / Tax notice */}
          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/70 text-[11px] text-amber-900 leading-relaxed">
            <p className="font-bold mb-0.5">IRS & Healthcare Spending (FSA/HSA) Note:</p>
            Non-medical senior respite care and companionship services may be reimbursable under eligible Dependent Care FSAs or Health Savings Accounts when certified for elder assistance. Retain this itemized receipt for tax filing.
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-6 py-3.5 border-t border-gray-200 flex items-center justify-between text-xs">
          <p className="text-gray-500 text-[11px]">Questions? contact billing@compassionatecare.org</p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-900 hover:bg-black text-white font-bold rounded-xl text-xs transition-colors"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
