import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Fingerprint,
  Delete,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { authenticateWithBiometrics, checkBiometricsSupport } from '../services/biometrics';
import { sha256 } from '../services/crypto';
import { playChimeSound } from '../services/notifications';

interface LockScreenProps {
  pinHash: string;
  biometricsEnabled: boolean;
  biometricCredentialId?: string;
  userName?: string;
  onUnlock: () => void;
  onLogout?: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  pinHash,
  biometricsEnabled,
  biometricCredentialId,
  userName = 'User',
  onUnlock,
  onLogout,
}) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifyingBiometric, setIsVerifyingBiometric] = useState(false);
  const [hasBiometricSensor, setHasBiometricSensor] = useState(true);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    checkBiometricsSupport().then((res) => {
      setHasBiometricSensor(res.isAvailable);
    });
  }, []);

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      const next = pin + digit;
      setPin(next);
      setErrorMsg('');

      if (next.length >= 4) {
        verifyPin(next);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  const verifyPin = async (candidatePin: string) => {
    const hash = await sha256(candidatePin);
    if (hash === pinHash) {
      playChimeSound('success');
      onUnlock();
    } else if (candidatePin.length === 6) {
      triggerError('Incorrect PIN. Please try again.');
    }
  };

  const handleManualSubmit = () => {
    verifyPin(pin);
  };

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setShake(true);
    setPin('');
    setTimeout(() => setShake(false), 500);
  };

  const handleBiometricAuth = async () => {
    setIsVerifyingBiometric(true);
    setErrorMsg('');
    try {
      const success = await authenticateWithBiometrics(biometricCredentialId);
      if (success) {
        playChimeSound('success');
        onUnlock();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Biometric verification cancelled';
      console.warn('Biometric notice:', msg);
      setErrorMsg('Biometric check was cancelled. Enter your personal PIN.');
    } finally {
      setIsVerifyingBiometric(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/95 backdrop-blur-xl p-4">
      <div
        className={`w-full max-w-sm rounded-3xl border border-neutral-800 bg-neutral-900/90 p-6 sm:p-8 text-center shadow-2xl transition-all ${
          shake ? 'animate-shake translate-x-1' : ''
        }`}
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
          <ShieldCheck className="h-8 w-8" />
        </div>

        <h2 className="text-xl font-bold tracking-tight text-white">Zenith Locked</h2>
        <p className="mt-1 text-xs text-neutral-400">
          Enter PIN to unlock {userName}&apos;s money workspace
        </p>

        {/* PIN Dots */}
        <div className="my-6 flex justify-center gap-3">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`h-3.5 w-3.5 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'scale-110 bg-emerald-400 shadow-md shadow-emerald-400/40'
                    : 'border-2 border-neutral-600 bg-neutral-800'
                }`}
              />
            );
          })}
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-center justify-center gap-1.5 text-xs text-rose-400 animate-in fade-in">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {biometricsEnabled && hasBiometricSensor && (
          <div className="mb-5">
            <button
              onClick={handleBiometricAuth}
              disabled={isVerifyingBiometric}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 active:scale-98 transition shadow-sm"
            >
              <Fingerprint className="h-4 w-4 animate-pulse text-emerald-400" />
              <span>{isVerifyingBiometric ? 'Verifying...' : 'Face ID / Fingerprint'}</span>
            </button>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              className="flex h-12 w-full items-center justify-center rounded-xl border border-neutral-800 bg-neutral-800/80 text-lg font-semibold text-neutral-100 hover:bg-neutral-700/80 active:scale-95 transition"
            >
              {digit}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="flex h-12 w-full items-center justify-center rounded-xl border border-neutral-800 bg-neutral-800/40 text-xs font-medium text-neutral-400 hover:bg-neutral-700/60 transition"
          >
            Clear
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="flex h-12 w-full items-center justify-center rounded-xl border border-neutral-800 bg-neutral-800/80 text-lg font-semibold text-neutral-100 hover:bg-neutral-700/80 active:scale-95 transition"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="flex h-12 w-full items-center justify-center rounded-xl border border-neutral-800 bg-neutral-800/40 text-neutral-300 hover:bg-neutral-700/60 active:scale-95 transition"
            title="Delete"
          >
            <Delete className="h-4 w-4" />
          </button>
        </div>

        {onLogout && (
          <div className="mt-6 border-t border-neutral-800 pt-3">
            <button
              onClick={onLogout}
              className="text-xs text-neutral-400 hover:text-neutral-200 transition"
            >
              Log out of account
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
