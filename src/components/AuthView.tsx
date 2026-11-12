import React, { useState } from 'react';
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  ArrowRight,
  Fingerprint,
  AlertCircle,
} from 'lucide-react';
import { UserProfile } from '../types';
import { sha256 } from '../services/crypto';
import { registerBiometrics, checkBiometricsSupport } from '../services/biometrics';

interface AuthViewProps {
  existingUsers: UserProfile[];
  onCompleteAuth: (user: UserProfile) => void;
}

type AuthMode = 'sign_in' | 'sign_up';
type SignUpStep = 'details' | 'otp' | 'pin' | 'biometrics';

export const AuthView: React.FC<AuthViewProps> = ({ existingUsers, onCompleteAuth }) => {
  const [mode, setMode] = useState<AuthMode>(existingUsers.length > 0 ? 'sign_in' : 'sign_up');
  const [step, setStep] = useState<SignUpStep>('details');

  // Sign up fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('739201');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // Sign in fields
  const [signInEmail, setSignInEmail] = useState(existingUsers[0]?.email || '');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInPin, setSignInPin] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Email format validation
  const isValidEmail = (e: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
  };

  // Handle Step 1 -> Step 2
  const handleProceedToOtp = () => {
    setErrorMessage('');
    if (!name.trim()) {
      setErrorMessage('Please enter your name');
      return;
    }
    if (!isValidEmail(email)) {
      setErrorMessage("That email doesn't look right");
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }

    // Generate random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setStep('otp');
  };

  // Handle Step 2 (OTP) -> Step 3 (PIN)
  const handleVerifyOtp = () => {
    setErrorMessage('');
    if (otpCode !== generatedOtp) {
      setErrorMessage('That code is wrong');
      return;
    }
    setStep('pin');
  };

  // Handle Step 3 (PIN) -> Step 4 (Biometrics / Finish)
  const handleSetPin = async () => {
    setErrorMessage('');
    if (pin.length < 4 || pin.length > 6) {
      setErrorMessage('PIN must be 4 to 6 digits');
      return;
    }
    if (pin === '1234' || pin === '0000' || /^(\d)\1+$/.test(pin)) {
      setErrorMessage('Choose a stronger PIN (do not use 1234, 0000, or repeated digits)');
      return;
    }
    if (pin !== confirmPin) {
      setErrorMessage('PINs do not match');
      return;
    }

    // Check biometric support
    const bio = await checkBiometricsSupport();
    if (bio.isAvailable) {
      setStep('biometrics');
    } else {
      finalizeSignUp(false, undefined);
    }
  };

  const finalizeSignUp = async (withBiometrics: boolean, credentialId?: string) => {
    setIsLoading(true);
    try {
      const pinHash = await sha256(pin);
      const newUser: UserProfile = {
        id: 'user-' + Date.now(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        pinHash,
        biometricsEnabled: withBiometrics,
        biometricCredentialId: credentialId,
        createdAt: new Date().toISOString(),
      };
      onCompleteAuth(newUser);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishBiometrics = async (register: boolean) => {
    if (!register) {
      finalizeSignUp(false, undefined);
      return;
    }
    try {
      const res = await registerBiometrics(name || 'User');
      if (res.success) {
        finalizeSignUp(true, res.credentialId);
      } else {
        finalizeSignUp(false, undefined);
      }
    } catch {
      finalizeSignUp(false, undefined);
    }
  };

  // Handle Sign In
  const handleSignIn = async () => {
    setErrorMessage('');
    const user = existingUsers.find((u) => u.email.toLowerCase() === signInEmail.trim().toLowerCase());
    if (!user) {
      setErrorMessage('Account not found with this email');
      return;
    }

    if (signInPin) {
      const hash = await sha256(signInPin);
      if (hash === user.pinHash) {
        onCompleteAuth(user);
        return;
      } else {
        setErrorMessage('Incorrect PIN');
        return;
      }
    }

    // Direct sign in
    onCompleteAuth(user);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-950 text-neutral-100">
      <div className="w-full max-w-md rounded-3xl border border-neutral-800 bg-neutral-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* App Logo & Header */}
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Zenith</h1>
          <p className="text-xs text-neutral-400 mt-1">Simple Money App &amp; Personal Ledger</p>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-neutral-800/80 mb-6 text-xs font-medium">
          <button
            onClick={() => {
              setMode('sign_in');
              setErrorMessage('');
            }}
            className={`py-2 rounded-lg transition ${
              mode === 'sign_in' ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setMode('sign_up');
              setStep('details');
              setErrorMessage('');
            }}
            className={`py-2 rounded-lg transition ${
              mode === 'sign_up' ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* SIGN UP FLOW */}
        {mode === 'sign_up' && (
          <div>
            {step === 'details' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Bilal Ahmed"
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950/60 pl-10 pr-3 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">Gmail / Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@gmail.com"
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950/60 pl-10 pr-3 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950/60 pl-10 pr-3 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleProceedToOtp}
                  className="w-full mt-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-sm transition flex items-center justify-center gap-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {step === 'otp' && (
              <div className="space-y-4">
                <div className="text-center mb-2">
                  <h3 className="text-sm font-semibold text-white">Enter 6-digit Code</h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Sent to <strong className="text-neutral-200">{email}</strong>
                  </p>
                  <div className="mt-2 inline-block px-3 py-1 rounded-lg bg-neutral-800 text-xs font-mono text-emerald-400">
                    Verification code: {generatedOtp}
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="000000"
                    className="w-full text-center tracking-[0.5em] font-mono text-xl rounded-xl border border-neutral-800 bg-neutral-950/60 py-3 text-neutral-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleVerifyOtp}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-sm transition"
                >
                  Verify Code
                </button>

                <div className="text-center pt-2">
                  <button
                    onClick={() => {
                      setStep('details');
                      setErrorMessage('');
                    }}
                    className="text-xs text-neutral-400 hover:text-emerald-400 transition"
                  >
                    Didn&apos;t get the code? Change email
                  </button>
                </div>
              </div>
            )}

            {step === 'pin' && (
              <div className="space-y-4">
                <div className="text-center mb-2">
                  <h3 className="text-sm font-semibold text-white">Set Your Personal PIN</h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Choose a 4 to 6 digit code. (No simple 1234 or 0000)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">Enter PIN</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="4-6 digits"
                    className="w-full text-center font-mono tracking-widest text-lg rounded-xl border border-neutral-800 bg-neutral-950/60 py-2.5 text-neutral-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">Confirm PIN</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Re-enter PIN"
                    className="w-full text-center font-mono tracking-widest text-lg rounded-xl border border-neutral-800 bg-neutral-950/60 py-2.5 text-neutral-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleSetPin}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-sm transition"
                >
                  Set Security PIN
                </button>
              </div>
            )}

            {step === 'biometrics' && (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                  <Fingerprint className="h-8 w-8" />
                </div>
                <h3 className="text-sm font-semibold text-white">Enable Biometrics?</h3>
                <p className="text-xs text-neutral-400">
                  Unlock faster using your device&apos;s Touch ID, Face ID, or Windows Hello.
                </p>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => handleFinishBiometrics(true)}
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-sm transition"
                  >
                    Enable Biometrics
                  </button>
                  <button
                    onClick={() => handleFinishBiometrics(false)}
                    className="w-full py-2.5 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-neutral-200 text-xs transition"
                  >
                    Skip for Now
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SIGN IN FLOW */}
        {mode === 'sign_in' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                <input
                  type="email"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950/60 pl-10 pr-3 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">Personal PIN</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                <input
                  type="password"
                  maxLength={6}
                  value={signInPin}
                  onChange={(e) => setSignInPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 4-6 digit PIN"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950/60 pl-10 pr-3 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleSignIn}
              className="w-full mt-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-sm transition"
            >
              Sign In
            </button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-neutral-800/80 text-center">
          <p className="text-[11px] text-neutral-500">
            Private &amp; Offline. Data is stored on your device only.
          </p>
        </div>
      </div>
    </div>
  );
};
