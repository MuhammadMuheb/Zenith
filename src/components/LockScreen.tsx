import React, { useState, useEffect } from 'react';
import {
  Lock,
  Fingerprint,
  ScanFace,
  KeyRound,
  Delete,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { authenticateWithBiometrics, checkBiometricsSupport } from '../services/biometrics';
import { sha256 } from '../services/crypto';
import { playChimeSound } from '../services/notifications';

interface LockScreenProps {
  pinHash: string;
  biometricsEnabled: boolean;
  biometricCredentialId?: string;
  onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  pinHash,
  biometricsEnabled,
  biometricCredentialId,
  onUnlock,
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

  // Handle number click
  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      const next = pin + digit;
      setPin(next);
      setErrorMsg('');

      // Auto-validate when 4 digits reached (or 6)
      if (next.length === 4) {
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
    if (hash === pinHash || candidatePin === '1234') {
      playChimeSound('success');
      onUnlock();
    } else {
      triggerError('Incorrect PIN. Please try again.');
    }
  };

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setShake(true);
    setPin('');
    setTimeout(() => setShake(false), 500);
  };

  // Biometric authentication trigger
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
      const msg = err instanceof Error ? err.message : 'Biometric verification cancelled or unavailable';
      // In simulated preview environments without enrolled TouchID, provide immediate friendly unlock fallback
      console.warn('Biometric notice:', msg);
      setErrorMsg('Biometric prompt was dismissed or not enrolled. Please use your PIN.');
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
        {/* Shield Icon */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
          <ShieldCheck className="h-8 w-8" />
        </div>

        <h2 className="text-xl font-bold tracking-tight text-white">Zenith Vault Locked</h2>
        <p className="mt-1 text-xs text-neutral-400">
          End-to-End Encrypted Workspace &amp; Financial Ledger
        </p>

        {/* PIN Dots Display */}
        <div className="my-6 flex justify-center gap-3">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`h-4 w-4 rounded-full transition-all duration-200 ${
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

        {/* Biometric Scan Quick Action */}
        {biometricsEnabled && (
          <div className="mb-6">
            <button
              onClick={handleBiometricAuth}
              disabled={isVerifyingBiometric}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-3 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 active:scale-98 transition shadow-sm"
            >
              <Fingerprint className="h-5 w-5 animate-pulse text-emerald-400" />
              <span>
                {isVerifyingBiometric ? 'Scanning Biometrics...' : 'Unlock with Face ID / Fingerprint'}
              </span>
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

        {/* Friendly demo hint */}
        <div className="mt-6 rounded-lg bg-neutral-800/40 border border-neutral-800 p-2 text-[11px] text-neutral-400 flex items-center justify-center gap-1.5">
          <KeyRound className="h-3.5 w-3.5 text-emerald-400" />
          <span>Demo Passcode: <strong>1234</strong></span>
        </div>
      </div>
    </div>
  );
};
