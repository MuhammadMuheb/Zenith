import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Lock,
  Layers,
  Plus,
} from 'lucide-react';
import { SimpleMoneyEntry, MonthBook, SupportedCurrency } from '../types';
import { formatMoney } from '../services/currency';
import { calculateMonthTotals, formatMonthKeyLabel } from '../services/monthEngine';

interface MonthlyViewProps {
  currentMonthKey: string;
  selectedMonthKey: string;
  onSelectMonthKey: (key: string) => void;
  entries: SimpleMoneyEntry[];
  monthBooks: MonthBook[];
  activeCurrency: SupportedCurrency;
  onOpenAddModal: (monthKey?: string) => void;
  onWithdrawFromLockedMonth: (monthKey: string, amount: number) => void;
}

export const MonthlyView: React.FC<MonthlyViewProps> = ({
  currentMonthKey,
  selectedMonthKey,
  onSelectMonthKey,
  entries,
  monthBooks,
  activeCurrency,
  onOpenAddModal,
  onWithdrawFromLockedMonth,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Unrestricted month navigation: freely navigate backwards and forwards to any month/year
  const handlePrevMonth = () => {
    const [y, m] = selectedMonthKey.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = String(prevDate.getMonth() + 1).padStart(2, '0');
    onSelectMonthKey(`${prevYear}-${prevMonth}`);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonthKey.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    const nextYear = nextDate.getFullYear();
    const nextMonth = String(nextDate.getMonth() + 1).padStart(2, '0');
    onSelectMonthKey(`${nextYear}-${nextMonth}`);
  };

  const monthEntries = entries.filter((e) => e.monthKey === selectedMonthKey);
  const hasData = monthEntries.length > 0;

  // Month book (if any)
  const book = monthBooks.find((b) => b.monthKey === selectedMonthKey);
  const isLocked = book?.isLocked || false;
  const lockedSavedAmount = book?.lockedSavedAmount ?? 0;

  // Totals for this month (clean zero if no entries)
  const { cameIn, spent, left } = calculateMonthTotals(selectedMonthKey, entries);

  // Group expenses by category
  const expenseEntries = monthEntries.filter((e) => e.type === 'expense' || e.type === 'lent');
  const groupedExpenses = expenseEntries.reduce((acc, entry) => {
    const key = entry.whatFor || 'Other';
    if (!acc[key]) {
      acc[key] = {
        category: key,
        total: 0,
        items: [],
      };
    }
    acc[key].total += entry.amount;
    acc[key].items.push(entry);
    return acc;
  }, {} as Record<string, { category: string; total: number; items: SimpleMoneyEntry[] }>);

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0 || amt > lockedSavedAmount) return;
    onWithdrawFromLockedMonth(selectedMonthKey, amt);
    setShowWithdrawModal(false);
    setWithdrawAmount('');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 py-2">
      {/* Year & Month Browser Bar with smooth 2-way navigation */}
      <div className="flex items-center justify-between p-4 rounded-3xl border border-neutral-800 bg-neutral-900/90 shadow-sm">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800 transition active:scale-95"
          title="Previous Month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {formatMonthKeyLabel(selectedMonthKey)}
            </h1>
            {isLocked && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-neutral-800 text-neutral-300 font-medium">
                <Lock className="h-3 w-3 text-neutral-400" />
                Locked
              </span>
            )}
          </div>
          <p className="text-[11px] text-neutral-400">Monthly Expense Book</p>
        </div>

        <button
          onClick={handleNextMonth}
          className="p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800 transition active:scale-95"
          title="Next Month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Month Summary Cards - Clean 0 if nothing added yet */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4">
          <span className="text-[11px] font-semibold text-neutral-400">Came in</span>
          <p className="text-xl font-bold text-emerald-400 mt-1">
            {formatMoney(cameIn, activeCurrency)}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4">
          <span className="text-[11px] font-semibold text-neutral-400">Spent</span>
          <p className="text-xl font-bold text-neutral-100 mt-1">
            {formatMoney(spent, activeCurrency)}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4">
          <span className="text-[11px] font-semibold text-neutral-400">
            {isLocked ? 'Locked into Savings' : 'Left'}
          </span>
          <p className="text-xl font-bold text-white mt-1">
            {formatMoney(isLocked ? lockedSavedAmount : left, activeCurrency)}
          </p>
        </div>
      </div>

      {/* Locked Notification Banner if month was locked */}
      {isLocked && lockedSavedAmount > 0 && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-300">
                {formatMonthKeyLabel(selectedMonthKey).split(' ')[0]} is done. {formatMoney(lockedSavedAmount, activeCurrency)} moved to Savings.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowWithdrawModal(true)}
            className="px-3.5 py-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 font-semibold text-xs hover:bg-rose-500/20 transition self-end sm:self-auto"
          >
            Withdraw from Savings
          </button>
        </div>
      )}

      {/* When no data exists for this month */}
      {!hasData ? (
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-800 text-neutral-400 mb-3">
            <Layers className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-white">No entries for this month</h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto mb-4">
            Everything is currently zero. Tap below to log income or an expense for {formatMonthKeyLabel(selectedMonthKey)}.
          </p>
          <button
            onClick={() => onOpenAddModal(selectedMonthKey)}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 transition inline-flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Add Entry for this Month</span>
          </button>
        </div>
      ) : (
        /* Grouped Expenses List by what they were for */
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/70 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">Expenses by Category</h2>
            <span className="text-xs text-neutral-400">Tap a group to reveal entries</span>
          </div>

          <div className="space-y-2">
            {Object.values(groupedExpenses).map((group) => {
              const isExpanded = !!expandedCategories[group.category];
              return (
                <div
                  key={group.category}
                  className="rounded-2xl border border-neutral-800/80 bg-neutral-950/40 overflow-hidden"
                >
                  <button
                    onClick={() => toggleCategory(group.category)}
                    className="w-full p-4 flex items-center justify-between hover:bg-neutral-800/30 transition text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-800 text-neutral-300">
                        <Layers className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-200">{group.category}</p>
                        <p className="text-[10px] text-neutral-400">{group.items.length} entries</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold font-mono text-white">
                        {formatMoney(group.total, activeCurrency)}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-neutral-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-neutral-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded item details */}
                  {isExpanded && (
                    <div className="px-4 pb-3 pt-1 border-t border-neutral-800/60 divide-y divide-neutral-800/50">
                      {group.items.map((item) => (
                        <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-300 font-medium">{item.whatFor}</span>
                              {item.isExtra && (
                                <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300">Extra</span>
                              )}
                            </div>
                            <p className="text-[10px] text-neutral-500">
                              {item.date} {item.paymentMethod ? `• via ${item.paymentMethod}` : ''}
                            </p>
                          </div>
                          <span className="font-mono text-neutral-200 font-semibold">
                            {formatMoney(item.amount, activeCurrency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-sm rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Withdraw from Locked Savings</h3>
            <p className="text-xs text-neutral-400 mb-4">
              Taking money out of {formatMonthKeyLabel(selectedMonthKey)} adds to your <strong>Still to save</strong> carryover target.
            </p>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Amount</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={lockedSavedAmount}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder={`Max ${lockedSavedAmount}`}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-800 bg-neutral-800 text-neutral-300 text-xs font-semibold hover:bg-neutral-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-semibold transition"
                >
                  Withdraw
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
