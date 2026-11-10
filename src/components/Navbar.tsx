import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  Lock,
  Bell,
  Sun,
  Moon,
  Smartphone,
  Monitor,
  CheckCircle2,
  RefreshCw,
  Search,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';
import {
  AppNotification,
  AppThemeMode,
  AccentColor,
  DeviceSyncStatus,
  SupportedCurrency,
} from '../types';
import { playChimeSound } from '../services/notifications';
import { DEFAULT_CURRENCIES } from '../services/currency';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isLocked: boolean;
  onLockVault: () => void;
  onOpenSecurity: () => void;
  notifications: AppNotification[];
  onMarkNotificationAsRead: (id: string) => void;
  onClearAllNotifications: () => void;
  themeMode: AppThemeMode;
  setThemeMode: (mode: AppThemeMode) => void;
  accent: AccentColor;
  setAccent: (accent: AccentColor) => void;
  isMobileFrame: boolean;
  setIsMobileFrame: (val: boolean) => void;
  syncDevices: DeviceSyncStatus[];
  onTriggerSync: () => void;
  isSyncing: boolean;
  activeCurrency: SupportedCurrency;
  setActiveCurrency: (cur: SupportedCurrency) => void;
  currencyRates: Record<SupportedCurrency, number>;
  onUpdateCurrencyRate?: (currency: SupportedCurrency, rate: number) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  searchQuery,
  setSearchQuery,
  isLocked,
  onLockVault,
  onOpenSecurity,
  notifications,
  onMarkNotificationAsRead,
  onClearAllNotifications,
  themeMode,
  setThemeMode,
  accent,
  setAccent,
  isMobileFrame,
  setIsMobileFrame,
  syncDevices,
  onTriggerSync,
  isSyncing,
  activeCurrency,
  setActiveCurrency,
  currencyRates,
  onUpdateCurrencyRate,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSyncMenu, setShowSyncMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleTestChime = () => {
    if (soundEnabled) {
      playChimeSound('payday');
    }
  };

  const accentColorMap: Record<AccentColor, { bg: string; text: string; ring: string }> = {
    emerald: { bg: 'bg-emerald-500', text: 'text-emerald-400', ring: 'ring-emerald-500/50' },
    amber: { bg: 'bg-amber-500', text: 'text-amber-400', ring: 'ring-amber-500/50' },
    indigo: { bg: 'bg-indigo-500', text: 'text-indigo-400', ring: 'ring-indigo-500/50' },
    rose: { bg: 'bg-rose-500', text: 'text-rose-400', ring: 'ring-rose-500/50' },
    cyan: { bg: 'bg-cyan-500', text: 'text-cyan-400', ring: 'ring-cyan-500/50' },
  };

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md transition-colors no-print">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2.5 sm:px-6">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-md shadow-emerald-500/20">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg tracking-tight text-neutral-100">
                Zenith
              </span>
              <span className="hidden sm:inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/30">
                E2EE AES-256
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 hidden sm:block">
              Notes • Calendar • Salary • Budget
            </p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative mx-3 flex-1 max-w-xs sm:max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, bills, calendar, salary..."
            className="w-full rounded-full border border-neutral-700/80 bg-neutral-800/80 py-1.5 pl-9 pr-4 text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-emerald-500 focus:bg-neutral-800 focus:ring-1 focus:ring-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-200"
            >
              ✕
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Live Currency Selector */}
          <div className="relative">
            <button
              onClick={() => setShowCurrencyMenu(!showCurrencyMenu)}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-700/60 bg-neutral-800/80 px-2 py-1.5 text-xs font-semibold text-neutral-200 hover:border-emerald-500/50 hover:bg-neutral-700/60 transition shadow-sm"
              title="Switch Active Currency (USD, PKR, EGP/EGX)"
            >
              <span className="text-sm">{DEFAULT_CURRENCIES[activeCurrency].flag}</span>
              <span className="font-mono text-[11px] font-bold text-emerald-400">
                {activeCurrency}
              </span>
              <span className="text-neutral-400 font-mono text-[10px]">
                {DEFAULT_CURRENCIES[activeCurrency].symbol}
              </span>
            </button>

            {/* Currency Dropdown Menu */}
            {showCurrencyMenu && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-neutral-700 bg-neutral-900 p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                  <span className="text-xs font-bold text-neutral-200">Select Display Currency</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Live Rates</span>
                </div>

                <div className="mt-2 space-y-1">
                  {(Object.keys(DEFAULT_CURRENCIES) as SupportedCurrency[]).map((cur) => {
                    const info = DEFAULT_CURRENCIES[cur];
                    const isSelected = activeCurrency === cur;
                    const rate = currencyRates[cur] || 1.0;

                    return (
                      <button
                        key={cur}
                        onClick={() => {
                          setActiveCurrency(cur);
                          setShowCurrencyMenu(false);
                          playChimeSound('success');
                        }}
                        className={`w-full flex items-center justify-between rounded-xl p-2 text-xs transition ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                            : 'hover:bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{info.flag}</span>
                          <div className="text-left">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-white">{info.code}</span>
                              <span className="text-[11px] text-neutral-400">({info.symbol})</span>
                            </div>
                            <div className="text-[10px] text-neutral-400">{info.name}</div>
                          </div>
                        </div>

                        <div className="text-right font-mono text-[11px]">
                          {cur === 'USD' ? (
                            <span className="text-neutral-400">Baseline</span>
                          ) : (
                            <span className="text-neutral-300">
                              1 $ = {rate.toFixed(1)} {info.symbol}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2.5 rounded-lg bg-neutral-950/80 p-2 text-[10px] text-neutral-400 border border-neutral-800">
                  Toggling currency dynamically recalibrates Salary, Monthly Budget, Savings, and Calendar amounts.
                </div>
              </div>
            )}
          </div>

          {/* Cloud Sync Status Indicator */}
          <div className="relative">
            <button
              onClick={() => setShowSyncMenu(!showSyncMenu)}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-700/60 bg-neutral-800/60 px-2 py-1.5 text-xs text-neutral-300 hover:bg-neutral-700/60 hover:text-white transition"
              title="Cloud & Cross-Platform Sync Status"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`}
              />
              <span className="hidden lg:inline text-[11px] font-medium text-neutral-300">
                Offline Ready
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse hidden sm:inline-block" />
            </button>

            {/* Sync dropdown details */}
            {showSyncMenu && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl border border-neutral-700 bg-neutral-800 p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-700">
                  <span className="text-xs font-semibold text-neutral-200">Sync & Backup</span>
                  <button
                    onClick={onTriggerSync}
                    disabled={isSyncing}
                    className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    Sync Now
                  </button>
                </div>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-neutral-300">
                    <span className="text-neutral-400">Local Storage & Cache</span>
                    <span className="text-emerald-400 font-mono">100% Offline Active</span>
                  </div>
                  <div className="text-[11px] text-neutral-400">Synced Devices:</div>
                  {syncDevices.map((d) => (
                    <div
                      key={d.deviceId}
                      className="flex items-center justify-between rounded-lg bg-neutral-900/60 p-2 text-xs"
                    >
                      <div>
                        <div className="font-medium text-neutral-200 flex items-center gap-1">
                          {d.deviceName}
                          {d.isCurrentDevice && (
                            <span className="text-[9px] bg-neutral-700 text-neutral-300 px-1 rounded">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-neutral-400">{d.lastSynced}</div>
                      </div>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-lg border border-neutral-700/60 bg-neutral-800/60 p-2 text-neutral-300 hover:bg-neutral-700/60 hover:text-white transition"
              title="Notifications & Smart Alerts"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-neutral-700 bg-neutral-800 p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-700">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-neutral-200">
                      Automated Alerts
                    </span>
                    <span className="rounded bg-neutral-700 px-1.5 py-0.2 text-[10px] text-neutral-300">
                      {notifications.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTestChime}
                      className="text-[11px] text-neutral-400 hover:text-neutral-200 flex items-center gap-1"
                      title="Test Audio Chime"
                    >
                      <Volume2 className="h-3 w-3" />
                      Test Bell
                    </button>
                    {notifications.length > 0 && (
                      <button
                        onClick={onClearAllNotifications}
                        className="text-[11px] text-neutral-400 hover:text-neutral-200"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-2 max-h-72 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-neutral-400">
                      No notifications right now.
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          onMarkNotificationAsRead(item.id);
                          if (item.actionTab) setCurrentTab(item.actionTab);
                          setShowNotifications(false);
                        }}
                        className={`cursor-pointer rounded-lg p-2.5 transition text-xs border ${
                          item.read
                            ? 'bg-neutral-900/40 border-neutral-800 text-neutral-400'
                            : 'bg-neutral-900/90 border-neutral-700 text-neutral-200 shadow-sm'
                        } hover:border-emerald-500/50`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-neutral-100">{item.title}</span>
                          <span className="text-[10px] text-neutral-400">
                            {new Date(item.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-300 leading-relaxed">
                          {item.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Device Simulator Toggle (Desktop vs Mobile Frame) */}
          <button
            onClick={() => setIsMobileFrame(!isMobileFrame)}
            className={`rounded-lg border px-2 py-1.5 text-xs transition flex items-center gap-1 ${
              isMobileFrame
                ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                : 'border-neutral-700/60 bg-neutral-800/60 text-neutral-300 hover:text-white'
            }`}
            title="Toggle Mobile Simulator Frame (iOS/Android responsive preview)"
          >
            {isMobileFrame ? (
              <>
                <Smartphone className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-[11px]">Phone View</span>
              </>
            ) : (
              <>
                <Monitor className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-[11px]">Desktop</span>
              </>
            )}
          </button>

          {/* Theme & Accent Customizer */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="rounded-lg border border-neutral-700/60 bg-neutral-800/60 p-2 text-neutral-300 hover:bg-neutral-700/60 hover:text-white transition"
              title="Theme and Color Customization"
            >
              {themeMode === 'light' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-300" />
              )}
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-neutral-700 bg-neutral-800 p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                <div className="text-xs font-semibold text-neutral-200 mb-2">Display Mode</div>
                <div className="grid grid-cols-3 gap-1.5 mb-3 text-xs">
                  <button
                    onClick={() => setThemeMode('dark')}
                    className={`rounded p-1.5 text-center font-medium ${
                      themeMode === 'dark'
                        ? 'bg-neutral-700 text-white'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Dark
                  </button>
                  <button
                    onClick={() => setThemeMode('light')}
                    className={`rounded p-1.5 text-center font-medium ${
                      themeMode === 'light'
                        ? 'bg-neutral-700 text-white'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => setThemeMode('oled')}
                    className={`rounded p-1.5 text-center font-medium ${
                      themeMode === 'oled'
                        ? 'bg-black text-white border border-neutral-700'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    OLED
                  </button>
                </div>

                <div className="text-xs font-semibold text-neutral-200 mb-2">Accent Color</div>
                <div className="flex items-center justify-between gap-1">
                  {(['emerald', 'amber', 'indigo', 'rose', 'cyan'] as AccentColor[]).map((col) => (
                    <button
                      key={col}
                      onClick={() => setAccent(col)}
                      className={`h-6 w-6 rounded-full transition-transform ${
                        accentColorMap[col].bg
                      } ${accent === col ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-neutral-900' : 'opacity-80 hover:opacity-100'}`}
                      title={col}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Lock Vault Button */}
          <button
            onClick={isLocked ? onOpenSecurity : onLockVault}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
              isLocked
                ? 'border-rose-500/50 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
            }`}
            title={isLocked ? 'Vault is Locked' : 'Lock E2EE Vault Now'}
          >
            <Lock className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isLocked ? 'Locked' : 'Lock Vault'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
