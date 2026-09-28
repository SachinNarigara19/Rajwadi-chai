import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';

interface AgeVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => void;
  minAge?: number;
}

export const AgeVerificationModal: React.FC<AgeVerificationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  minAge = 18,
}) => {
  const [confirmed, setConfirmed] = useState(false);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleProceed = () => {
    if (!confirmed) return;
    onConfirm(notes || 'Cashier verified physical age compliance (18+)');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-rose-300">
        {/* Header */}
        <div className="bg-rose-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-6 h-6 text-amber-300" />
            <h3 className="text-base font-bold">Statutory Age Verification</h3>
          </div>
          <button onClick={onClose} className="text-rose-200 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-900 leading-relaxed">
            <p className="font-bold text-rose-800 uppercase tracking-wide mb-1">
              ⚠️ Legal Compliance Check Required ({minAge}+)
            </p>
            This cart contains age-restricted items (tobacco/cigarette variant). As per law, sales to minors under the age of {minAge} are strictly prohibited.
          </div>

          <div className="space-y-3">
            <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg border border-stone-200 hover:bg-stone-50 transition">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-stone-300 cursor-pointer"
              />
              <span className="text-xs text-stone-700 font-medium leading-tight">
                I hereby verify that the customer is physically confirmed to be {minAge} years of age or older.
              </span>
            </label>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Verification / Audit Note (Optional):
              </label>
              <input
                type="text"
                placeholder="e.g. Verified photo ID / visually over 25"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-stone-50 px-6 py-3.5 border-t border-stone-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800 transition"
          >
            Cancel Sale
          </button>
          <button
            disabled={!confirmed}
            onClick={handleProceed}
            className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white transition ${
              confirmed
                ? 'bg-rose-600 hover:bg-rose-700 shadow-xs'
                : 'bg-stone-300 cursor-not-allowed text-stone-500'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Confirm & Complete Checkout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
