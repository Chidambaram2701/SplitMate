// Settlement & Partial Payment Modal Component
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, CheckCircle2, DollarSign, Calculator, AlertTriangle } from 'lucide-react';

interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: {
    id: string;
    description?: string;
    original_amount: number;
    remaining_amount: number;
    creditor_name?: string;
    debtor_name?: string;
    isIOwe: boolean;
  } | null;
  onSuccess: () => void;
}

export function SettlementModal({ isOpen, onClose, debt, onSuccess }: SettlementModalProps) {
  const [paymentMode, setPaymentMode] = useState<'full' | 'partial'>('full');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (debt) {
      setPaymentMode('full');
      setCustomAmount('');
      setError(null);
    }
  }, [debt]);

  if (!isOpen || !debt) return null;

  const remaining = Number(debt.remaining_amount) || 0;
  const original = Number(debt.original_amount) || remaining;

  // Calculate payment & remaining values
  const payAmount = paymentMode === 'full' ? remaining : (parseFloat(customAmount) || 0);
  const newRemaining = Math.max(0, parseFloat((remaining - payAmount).toFixed(2)));
  const willBeSettled = newRemaining === 0;

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (payAmount <= 0) {
      setError('Please enter a valid payment amount greater than ₹0.');
      setLoading(false);
      return;
    }

    if (payAmount > remaining) {
      setError(`Payment amount cannot exceed the remaining balance of ₹${remaining}.`);
      setLoading(false);
      return;
    }

    try {
      const nextStatus = willBeSettled ? 'settled' : 'partial';

      // 1. Update debt record
      const { error: debtUpdateError } = await supabase
        .from('debts')
        .update({
          remaining_amount: newRemaining,
          status: nextStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', debt.id);

      if (debtUpdateError) {
        throw new Error(debtUpdateError.message || 'Failed to update debt balance.');
      }

      // 2. Try inserting payment log into payments table
      try {
        await supabase.from('payments').insert({
          debt_id: debt.id,
          amount: payAmount,
          payment_method: 'other',
          payment_date: new Date().toISOString(),
        });
      } catch (pErr) {
        console.warn('Payment logging warning:', pErr);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Settlement error:', err);
      setError(err.message || 'Failed to record payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const partnerName = debt.isIOwe ? (debt.creditor_name || 'Roommate') : (debt.debtor_name || 'Roommate');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-5 sm:p-7 z-10 text-black space-y-5 my-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b-4 border-black pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#F5E600] border-2 border-black">
              <Calculator size={20} className="text-black" />
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold uppercase text-black tracking-tight">
              Settle / Record Payment
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 border-2 border-black bg-white hover:bg-gray-100 text-black font-extrabold cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Debt Info Summary Box */}
        <div className="border-2 border-black bg-[#F4F1EA] p-4 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs sm:text-sm font-extrabold uppercase text-black">
                {debt.isIOwe ? (
                  <>You Owe <span className="text-red-700 underline">{partnerName}</span></>
                ) : (
                  <><span className="underline">{partnerName}</span> Owes You</>
                )}
              </div>
              <div className="text-[11px] font-bold uppercase text-gray-700 mt-0.5">
                Reason: {debt.description || 'Expense share'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase font-bold text-gray-600">Current Balance</div>
              <div className="font-mono font-extrabold text-xl sm:text-2xl text-black">
                ₹{remaining}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border-2 border-red-600 p-3 text-red-800 font-extrabold uppercase text-xs">
            {error}
          </div>
        )}

        {/* Payment Type Selection */}
        <form onSubmit={handleConfirmPayment} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-extrabold uppercase text-black">
              Select Settlement Mode
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMode('full')}
                className={`p-3 border-2 text-center transition-all cursor-pointer ${
                  paymentMode === 'full'
                    ? 'border-black bg-[#F5E600] font-extrabold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                    : 'border-black bg-white font-bold hover:bg-gray-100'
                }`}
              >
                <div className="text-xs uppercase">Full Payment</div>
                <div className="font-mono text-sm font-black mt-0.5">₹{remaining}</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('partial')}
                className={`p-3 border-2 text-center transition-all cursor-pointer ${
                  paymentMode === 'partial'
                    ? 'border-black bg-[#F5E600] font-extrabold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                    : 'border-black bg-white font-bold hover:bg-gray-100'
                }`}
              >
                <div className="text-xs uppercase">Partial Payment</div>
                <div className="text-[10px] font-bold text-gray-700 mt-0.5">Custom Amount</div>
              </button>
            </div>
          </div>

          {/* Custom Partial Amount Input */}
          {paymentMode === 'partial' && (
            <div className="space-y-2 bg-yellow-50 p-4 border-2 border-black">
              <Label htmlFor="customAmount" required className="text-xs font-extrabold uppercase">
                Enter Partial Amount Paid (₹)
              </Label>
              <Input
                id="customAmount"
                type="number"
                min="1"
                max={remaining}
                step="any"
                inputMode="decimal"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder={`e.g. ${Math.round(remaining / 2)}`}
                required
                disabled={loading}
                autoFocus
                className="bg-white touch-target font-mono text-base font-bold"
              />
            </div>
          )}

          {/* Payment Preview Calculation */}
          {payAmount > 0 && (
            <div className="border-2 border-black bg-black text-white p-4 space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center text-gray-300">
                <span>Amount Paying Now:</span>
                <span className="font-bold text-white text-sm">₹{payAmount}</span>
              </div>
              <div className="flex justify-between items-center border-t border-white/20 pt-2">
                <span>New Remaining Balance:</span>
                <span className={`font-bold text-sm ${willBeSettled ? 'text-green-400' : 'text-[#F5E600]'}`}>
                  ₹{newRemaining} {willBeSettled ? '(FULLY SETTLED)' : '(PARTIAL)'}
                </span>
              </div>
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="submit"
              variant="brutalAccent"
              fullWidth
              disabled={loading || payAmount <= 0 || payAmount > remaining}
              className="py-3 touch-target order-1"
            >
              {loading
                ? 'Recording Payment...'
                : willBeSettled
                ? `Confirm Full Settlement (₹${payAmount})`
                : `Record Partial Payment (₹${payAmount})`}
            </Button>
            <Button
              type="button"
              variant="brutal"
              onClick={onClose}
              disabled={loading}
              className="touch-target order-2 sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
