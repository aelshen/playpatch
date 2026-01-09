/**
 * PIN Entry Modal Component
 */

'use client';

import { useState } from 'react';

interface PinModalProps {
  profile: {
    id: string;
    name: string;
    pin: string | null;
  };
  onVerified: (profileId: string) => void;
  onClose: () => void;
}

export function PinModal({ profile, onVerified, onClose }: PinModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (pin === profile.pin) {
      onVerified(profile.id);
    } else {
      setError('Incorrect PIN');
      setPin('');
    }
  };

  const handlePinChange = (value: string) => {
    if (value.length <= 4 && /^\d*$/.test(value)) {
      setPin(value);
      setError('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-center text-xl font-semibold text-gray-900">
          Enter PIN for {profile.name}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => handlePinChange(e.target.value)}
              autoFocus
              className="block w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-center text-2xl tracking-widest focus:border-blue-500 focus:outline-none"
              placeholder="••••"
            />
            {error && <p className="mt-2 text-center text-sm text-red-600">{error}</p>}
          </div>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pin.length !== 4}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-300"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
