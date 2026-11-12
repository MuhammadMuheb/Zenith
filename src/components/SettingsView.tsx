import React, { useState } from 'react';
import {
  User,
  Shield,
  Fingerprint,
  Languages,
  Bell,
  Coins,
  Palette,
  Trash2,
  LogOut,
  RotateCcw,
} from 'lucide-react';
import { UserProfile, AppSettings, SupportedCurrency, AppThemeMode } from '../types';
import { sha256 } from '../services/crypto';
import { CURRENCY_MAP } from '../services/currency';

interface SettingsViewProps {
  currentUser: UserProfile;
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  onUpdateUserPin: (newPinHash: string) => void;
  onToggleBiometrics: (enabled: boolean) => void;
  onResetAccountData: () => void;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  settings,
  onUpdateSettings,
  onUpdateUserPin,
  onToggleBiometrics,
  onResetAccountData,
  onLogout,
}) => {
  const [showPinChange, setShowPinChange] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess(false);

    if (newPin.length < 4 || newPin.length > 6) {
      setPinError('PIN must be 4 to 6 digits');
      return;
    }
    if (newPin === '1234' || newPin === '0000' || /^(\d)\1+$/.test(newPin)) {
      setPinError('Choose a stronger PIN (do not use 1234, 0000, or repeated digits)');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }

    const hash = await sha256(newPin);
    onUpdateUserPin(hash);
    setPinSuccess(true);
    setNewPin('');
    setConfirmPin('');
    setTimeout(() => {
      setShowPinChange(false);
      setPinSuccess(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 py-2">
      {/* Top Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-xs text-neutral-400">Account security, currency, language, and theme</p>
      </div>

      {/* Account Info Card */}
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">{currentUser.name}</h2>
            <p className="text-xs text-neutral-400">{currentUser.email}</p>
          </div>
        </div>
      </div>

      {/* Security & Authentication Settings */}
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-400" />
          <span>Security &amp; Vault Access</span>
        </h2>

        {/* Change PIN Button / Form */}
        <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-neutral-200">Personal PIN Code</p>
              <p className="text-[11px] text-neutral-400">4-6 digit passcode protecting your books</p>
            </div>
            <button
              onClick={() => setShowPinChange(!showPinChange)}
              className="px-3 py-1.5 rounded-xl border border-neutral-700 bg-neutral-800 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 transition"
            >
              {showPinChange ? 'Cancel' : 'Change PIN'}
            </button>
          </div>

          {showPinChange && (
            <form onSubmit={handleSavePin} className="mt-4 pt-4 border-t border-neutral-800 space-y-3">
              {pinError && <p className="text-xs text-rose-400">{pinError}</p>}
              {pinSuccess && <p className="text-xs text-emerald-400">PIN updated successfully!</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="password"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="New PIN (4-6 digits)"
                  className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
                <input
                  type="password"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Confirm New PIN"
                  className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 transition"
              >
                Save New PIN
              </button>
            </form>
          )}
        </div>

        {/* Biometrics Toggle */}
        <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Fingerprint className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-xs font-semibold text-neutral-200">Face ID / Fingerprint</p>
              <p className="text-[11px] text-neutral-400">Quick unlock via device biometrics</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onToggleBiometrics(!currentUser.biometricsEnabled)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
              currentUser.biometricsEnabled ? 'bg-emerald-500 justify-end' : 'bg-neutral-800 justify-start'
            }`}
          >
            <div className="bg-white w-4 h-4 rounded-full shadow-md" />
          </button>
        </div>
      </div>

      {/* Preferences (Language, Currency, Theme) */}
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Palette className="h-4 w-4 text-emerald-400" />
          <span>App Preferences</span>
        </h2>

        {/* Label Language Toggle (English vs Roman Urdu) */}
        <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Languages className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-xs font-semibold text-neutral-200">Tab Label Language</p>
              <p className="text-[11px] text-neutral-400">
                English (Home, Monthly, Daily) vs Roman Urdu (Shuru, Mahina, Roz, Bachat)
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onUpdateSettings({ labelLanguage: 'en' })}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                settings.labelLanguage === 'en'
                  ? 'bg-emerald-500 text-neutral-950 font-bold'
                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              onClick={() => onUpdateSettings({ labelLanguage: 'roman_urdu' })}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                settings.labelLanguage === 'roman_urdu'
                  ? 'bg-emerald-500 text-neutral-950 font-bold'
                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              Roman Urdu
            </button>
          </div>
        </div>

        {/* Currency Selector */}
        <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Coins className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-xs font-semibold text-neutral-200">Display Currency</p>
              <p className="text-[11px] text-neutral-400">Default currency symbol for entries</p>
            </div>
          </div>

          <select
            value={settings.currency}
            onChange={(e) => onUpdateSettings({ currency: e.target.value as SupportedCurrency })}
            className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-white font-semibold focus:border-emerald-500 focus:outline-none"
          >
            {Object.values(CURRENCY_MAP).map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} - {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>

        {/* Theme Customizer Toggle */}
        <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-neutral-200">Theme Mode</p>
            <p className="text-[11px] text-neutral-400">Cycle between Dark, Light, and Pitch Black OLED</p>
          </div>

          <div className="flex gap-2">
            {(['dark', 'light', 'oled'] as AppThemeMode[]).map((t) => (
              <button
                key={t}
                onClick={() => onUpdateSettings({ theme: t })}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                  settings.theme === t
                    ? 'bg-emerald-500 text-neutral-950 font-bold'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Notification Time */}
        <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-xs font-semibold text-neutral-200">Daily Alarm Time</p>
              <p className="text-[11px] text-neutral-400">Time for daily loan &amp; savings check-ins</p>
            </div>
          </div>

          <input
            type="time"
            value={settings.notificationTime}
            onChange={(e) => onUpdateSettings({ notificationTime: e.target.value })}
            className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Privacy Notice per Section 27 */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 text-center">
        <p className="text-xs text-neutral-400">
          Privacy Note: Your financial data is stored locally and securely on your device.
        </p>
      </div>

      {/* Account Actions: Reset All Data to Zero & Logout */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={onLogout}
          className="w-full sm:w-auto px-4 py-2 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-300 text-xs font-semibold hover:bg-neutral-800 transition flex items-center justify-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          <span>Log Out</span>
        </button>

        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset Everything to Zero (Clear All Data)</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-rose-400">Set all amounts &amp; books to zero?</span>
            <button
              onClick={() => {
                onResetAccountData();
                setShowResetConfirm(false);
              }}
              className="px-3 py-1 rounded-lg bg-rose-500 text-white font-bold text-xs"
            >
              Yes, Set to Zero
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="px-3 py-1 rounded-lg bg-neutral-800 text-neutral-300 text-xs"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
