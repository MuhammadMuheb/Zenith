import React from 'react';
import {
  FileText,
  Calendar,
  Calculator,
  PieChart,
  ShieldCheck,
  PiggyBank,
  Wallet,
} from 'lucide-react';
import { AccentColor } from '../types';

interface NavigationTabsProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  accent: AccentColor;
  notesCount: number;
  eventsCount: number;
  unpaidBillsCount: number;
  savingsCount?: number;
  walletBalanceBadge?: string;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  currentTab,
  setCurrentTab,
  accent,
  notesCount,
  eventsCount,
  unpaidBillsCount,
  savingsCount,
  walletBalanceBadge = 'Rs. 96k',
}) => {
  const tabs = [
    {
      id: 'account',
      label: 'Financial Ledger & Audit',
      icon: Wallet,
      badge: walletBalanceBadge,
      badgeColor: 'bg-emerald-400',
    },
    {
      id: 'notes',
      label: 'Notes & Keep',
      icon: FileText,
      badge: notesCount,
    },

    {
      id: 'calendar',
      label: 'Calendar Live',
      icon: Calendar,
      badge: eventsCount,
    },
    {
      id: 'salary',
      label: 'Salary & Net Pay',
      icon: Calculator,
    },
    {
      id: 'savings',
      label: 'Savings Calculator',
      icon: PiggyBank,
      badge: savingsCount,
      badgeColor: 'bg-emerald-400',
    },
    {
      id: 'budget',
      label: 'Monthly Budget',
      icon: PieChart,
      badge: unpaidBillsCount > 0 ? unpaidBillsCount : undefined,
      badgeColor: 'bg-amber-500',
    },
    {
      id: 'architecture',
      label: 'Security & Architecture',
      icon: ShieldCheck,
    },
  ];

  const getAccentBorder = (active: boolean) => {
    if (!active) return 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-700';
    switch (accent) {
      case 'amber':
        return 'border-amber-400 text-amber-400 bg-amber-400/5';
      case 'indigo':
        return 'border-indigo-400 text-indigo-400 bg-indigo-400/5';
      case 'rose':
        return 'border-rose-400 text-rose-400 bg-rose-400/5';
      case 'cyan':
        return 'border-cyan-400 text-cyan-400 bg-cyan-400/5';
      case 'emerald':
      default:
        return 'border-emerald-400 text-emerald-400 bg-emerald-400/5';
    }
  };

  return (
    <nav className="border-b border-neutral-800 bg-neutral-900/40 no-print overflow-x-auto scrollbar-none">
      <div className="mx-auto flex max-w-7xl items-center px-2 sm:px-6">
        <div className="flex space-x-1 sm:space-x-2 py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg border-b-2 px-3 py-2 text-xs sm:text-sm font-medium transition ${getAccentBorder(
                  active
                )}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-semibold text-neutral-950 ${
                      tab.badgeColor || 'bg-neutral-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
