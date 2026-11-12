import React from 'react';
import {
  Home,
  CalendarDays,
  Calendar,
  PiggyBank,
  StickyNote,
  BadgePercent,
  Settings as SettingsIcon,
  Plus,
  Menu,
  X,
  ShieldCheck,
  LogOut,
  Lock,
} from 'lucide-react';
import { UserProfile } from '../types';

export type TabKey = 'home' | 'monthly' | 'daily' | 'savings' | 'notes' | 'salary' | 'settings';

interface NavigationProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  labelLanguage: 'en' | 'roman_urdu';
  onOpenAddModal: () => void;
  currentUser?: UserProfile;
  onLockVault: () => void;
  onLogout: () => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export const TAB_LABELS: Record<'en' | 'roman_urdu', Record<TabKey, string>> = {
  en: {
    home: 'Home',
    monthly: 'Monthly',
    daily: 'Daily',
    savings: 'Savings',
    notes: 'Notes',
    salary: 'Salary',
    settings: 'Settings',
  },
  roman_urdu: {
    home: 'Shuru',
    monthly: 'Mahina',
    daily: 'Roz',
    savings: 'Bachat',
    notes: 'Notes',
    salary: 'Salary',
    settings: 'Settings',
  },
};

export const DesktopSidebar: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  labelLanguage,
  onOpenAddModal,
  currentUser,
  onLockVault,
}) => {
  const labels = TAB_LABELS[labelLanguage];

  const tabs: Array<{ key: TabKey; icon: React.ElementType }> = [
    { key: 'home', icon: Home },
    { key: 'monthly', icon: CalendarDays },
    { key: 'daily', icon: Calendar },
    { key: 'savings', icon: PiggyBank },
    { key: 'notes', icon: StickyNote },
    { key: 'salary', icon: BadgePercent },
    { key: 'settings', icon: SettingsIcon },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-neutral-800 bg-neutral-900/90 h-screen sticky top-0 shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-neutral-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white leading-tight">Zenith</h1>
            <p className="text-[11px] text-neutral-400">Simple Money App</p>
          </div>
        </div>

        <button
          onClick={onLockVault}
          title="Lock App"
          className="p-2 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
        >
          <Lock className="h-4 w-4" />
        </button>
      </div>

      {/* Primary Add Button (Home & Sidebar) */}
      <div className="p-4">
        <button
          onClick={onOpenAddModal}
          className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/15 transition active:scale-98"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Add</span>
        </button>
      </div>

      {/* 7 Clean Navigation Tabs with Names ONLY (No badges, no money counters) */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {tabs.map(({ key, icon: Icon }) => {
          const isActive = currentTab === key;
          return (
            <button
              key={key}
              onClick={() => onSelectTab(key)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? 'bg-neutral-800 text-emerald-400 border border-neutral-700/60 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-neutral-400'}`} />
              <span>{labels[key]}</span>
            </button>
          );
        })}
      </nav>

      {/* User profile dock at bottom */}
      {currentUser && (
        <div className="p-4 border-t border-neutral-800/80 bg-neutral-950/40">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <p className="text-xs font-semibold text-neutral-200 truncate">{currentUser.name}</p>
              <p className="text-[10px] text-neutral-500 truncate">{currentUser.email}</p>
            </div>
            <button
              onClick={() => onSelectTab('settings')}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
              title="Settings"
            >
              <SettingsIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

export const MobileHeader: React.FC<NavigationProps> = ({
  currentTab,
  labelLanguage,
  currentUser,
  onLockVault,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) => {
  const labels = TAB_LABELS[labelLanguage];

  return (
    <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-900/95 backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-bold text-sm text-white">{labels[currentTab]}</h1>
          <p className="text-[10px] text-neutral-400">Zenith</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onLockVault}
          className="p-2 rounded-xl text-neutral-400 hover:text-white"
          title="Lock"
        >
          <Lock className="h-4 w-4" />
        </button>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-xl text-neutral-400 hover:text-white"
          title="Menu"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );
};

export const MobileBottomBar: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  labelLanguage,
  onOpenAddModal,
}) => {
  const labels = TAB_LABELS[labelLanguage];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-900/95 border-t border-neutral-800 px-3 py-1.5 backdrop-blur-lg flex items-center justify-around">
      {/* 1. Home */}
      <button
        onClick={() => onSelectTab('home')}
        className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition ${
          currentTab === 'home' ? 'text-emerald-400' : 'text-neutral-400'
        }`}
      >
        <Home className="h-5 w-5 mb-0.5" />
        <span>{labels.home}</span>
      </button>

      {/* 2. Daily */}
      <button
        onClick={() => onSelectTab('daily')}
        className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition ${
          currentTab === 'daily' ? 'text-emerald-400' : 'text-neutral-400'
        }`}
      >
        <Calendar className="h-5 w-5 mb-0.5" />
        <span>{labels.daily}</span>
      </button>

      {/* 3. CENTER (+) ADD BUTTON */}
      <button
        onClick={onOpenAddModal}
        className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-neutral-950 shadow-lg shadow-emerald-500/30 active:scale-95 transition"
        title="Add Entry"
      >
        <Plus className="h-6 w-6 stroke-[3]" />
      </button>

      {/* 4. Monthly */}
      <button
        onClick={() => onSelectTab('monthly')}
        className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition ${
          currentTab === 'monthly' ? 'text-emerald-400' : 'text-neutral-400'
        }`}
      >
        <CalendarDays className="h-5 w-5 mb-0.5" />
        <span>{labels.monthly}</span>
      </button>

      {/* 5. Savings */}
      <button
        onClick={() => onSelectTab('savings')}
        className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition ${
          currentTab === 'savings' ? 'text-emerald-400' : 'text-neutral-400'
        }`}
      >
        <PiggyBank className="h-5 w-5 mb-0.5" />
        <span>{labels.savings}</span>
      </button>
    </nav>
  );
};

export const MobileDrawer: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  labelLanguage,
  currentUser,
  onLogout,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) => {
  if (!isMobileMenuOpen) return null;
  const labels = TAB_LABELS[labelLanguage];

  const drawerTabs: Array<{ key: TabKey; icon: React.ElementType }> = [
    { key: 'notes', icon: StickyNote },
    { key: 'salary', icon: BadgePercent },
    { key: 'settings', icon: SettingsIcon },
  ];

  return (
    <div className="md:hidden fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-md flex flex-col justify-start">
      <div className="bg-neutral-900 border-b border-neutral-800 p-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <span className="font-bold text-white text-sm">Zenith Menu</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="py-3 space-y-1">
          {drawerTabs.map(({ key, icon: Icon }) => (
            <button
              key={key}
              onClick={() => {
                onSelectTab(key);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition ${
                currentTab === key
                  ? 'bg-neutral-800 text-emerald-400'
                  : 'text-neutral-300 hover:bg-neutral-800/40'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{labels[key]}</span>
            </button>
          ))}
        </div>

        {currentUser && (
          <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
            <div className="text-xs">
              <p className="font-semibold text-neutral-200">{currentUser.name}</p>
              <p className="text-[10px] text-neutral-500">{currentUser.email}</p>
            </div>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onLogout();
              }}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log out</span>
            </button>
          </div>
        )}
      </div>
      <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
    </div>
  );
};
