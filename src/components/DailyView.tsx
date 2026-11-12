import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Sparkles,
  Trash2,
  CheckCircle,
  Clock,
  HandCoins,
} from 'lucide-react';
import { SimpleMoneyEntry, SupportedCurrency } from '../types';
import { formatMoney } from '../services/currency';

interface DailyViewProps {
  entries: SimpleMoneyEntry[];
  activeCurrency: SupportedCurrency;
  onOpenAddModal: (initialType?: 'money_in' | 'expense' | 'lent' | 'borrowed' | 'returned') => void;
  onDeleteEntry: (id: string) => void;
}

export const DailyView: React.FC<DailyViewProps> = ({
  entries,
  activeCurrency,
  onOpenAddModal,
  onDeleteEntry,
}) => {
  const [selectedDate, setSelectedDate] = useState(() => {
    // If we have entries, default to latest entry's date or today
    if (entries.length > 0) {
      const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
      return sorted[0].date;
    }
    return new Date().toISOString().split('T')[0];
  });

  const [viewYearMonth, setViewYearMonth] = useState(() => selectedDate.substring(0, 7));

  const [yearStr, monthStr] = viewYearMonth.split('-');
  const currentYear = parseInt(yearStr, 10);
  const currentMonth = parseInt(monthStr, 10) - 1; // 0-indexed

  // Calendar dates generation
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const handlePrevMonth = () => {
    const prevDate = new Date(currentYear, currentMonth - 1, 1);
    const key = prevDate.toISOString().substring(0, 7);
    setViewYearMonth(key);
  };

  const handleNextMonth = () => {
    const nextDate = new Date(currentYear, currentMonth + 1, 1);
    const key = nextDate.toISOString().substring(0, 7);
    setViewYearMonth(key);
  };

  // Group entries by date
  const entriesByDate = entries.reduce((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  }, {} as Record<string, SimpleMoneyEntry[]>);

  // Selected day items
  const selectedDayEntries = entriesByDate[selectedDate] || [];

  // Loans with return date on selected day
  const loansDueToday = entries.filter(
    (e) => e.type === 'lent' && !e.isCleared && e.returnDate === selectedDate
  );

  // Extra spending on selected day
  const extraExpensesToday = selectedDayEntries.filter((e) => e.type === 'expense' && e.isExtra);
  const totalExtraToday = extraExpensesToday.reduce((sum, e) => sum + e.amount, 0);

  // Total spent on selected day
  const totalSpentToday = selectedDayEntries
    .filter((e) => e.type === 'expense' || e.type === 'lent')
    .reduce((sum, e) => sum + e.amount, 0);

  const formattedMonthLabel = new Date(currentYear, currentMonth, 1).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 py-2">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Daily Ledger</h1>
          <p className="text-xs text-neutral-400">Self-filling calendar &amp; day-by-day spending</p>
        </div>

        <button
          onClick={() => onOpenAddModal('expense')}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-98 transition self-start sm:self-auto"
        >
          + Add Entry
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Grid (Left / Top 7 cols) */}
        <div className="lg:col-span-7 rounded-3xl border border-neutral-800 bg-neutral-900/90 p-5 shadow-sm">
          {/* Calendar header with navigation */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-emerald-400" />
              <span>{formattedMonthLabel}</span>
            </h2>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Blank leading days */}
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
              <div key={`blank-${idx}`} className="h-11 sm:h-12 rounded-xl bg-neutral-950/20" />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dayStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
              const dateKey = `${viewYearMonth}-${dayStr}`;
              const isSelected = selectedDate === dateKey;
              const dayEntries = entriesByDate[dateKey] || [];
              const hasSalary = dayEntries.some((e) => e.type === 'money_in');
              const hasExpense = dayEntries.some((e) => e.type === 'expense');
              const hasLoan = dayEntries.some((e) => e.type === 'lent' || e.type === 'borrowed');
              const hasExtra = dayEntries.some((e) => e.isExtra);

              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDate(dateKey)}
                  className={`relative h-11 sm:h-12 rounded-xl flex flex-col items-center justify-between p-1.5 text-xs transition ${
                    isSelected
                      ? 'bg-emerald-500 text-neutral-950 font-bold shadow-md shadow-emerald-500/25 ring-2 ring-emerald-400'
                      : dayEntries.length > 0
                      ? 'bg-neutral-800/80 text-neutral-200 hover:bg-neutral-700/80 font-semibold'
                      : 'bg-neutral-950/50 text-neutral-400 hover:bg-neutral-800/40'
                  }`}
                >
                  <span className="text-[11px] leading-none">{dayNum}</span>

                  {/* Marker dots */}
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {hasSalary && (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isSelected ? 'bg-neutral-950' : 'bg-emerald-400'
                        }`}
                      />
                    )}
                    {hasExpense && (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isSelected ? 'bg-neutral-950' : 'bg-neutral-400'
                        }`}
                      />
                    )}
                    {hasLoan && (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isSelected ? 'bg-neutral-950' : 'bg-amber-400'
                        }`}
                      />
                    )}
                    {hasExtra && (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isSelected ? 'bg-neutral-950' : 'bg-rose-400'
                        }`}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-3 border-t border-neutral-800/80 text-[10px] text-neutral-400">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Salary / Income</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-neutral-400" />
              <span>Expense</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span>Loan Lent / Borrowed</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-rose-400" />
              <span>Extra Spending</span>
            </div>
          </div>
        </div>

        {/* Selected Day Details Panel (Right / Bottom 5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <h3 className="text-sm font-bold text-white">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </h3>
                <p className="text-[11px] text-neutral-400">Day Breakdown</p>
              </div>

              {totalSpentToday > 0 && (
                <div className="text-right">
                  <span className="text-[10px] text-neutral-400">Spent today</span>
                  <p className="text-sm font-bold font-mono text-neutral-200">
                    {formatMoney(totalSpentToday, activeCurrency)}
                  </p>
                </div>
              )}
            </div>

            {/* Extra spending alert for this day (Section 19 & 30) */}
            {totalExtraToday > 0 && (
              <div className="mt-3 p-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="text-xs font-semibold text-amber-200">
                  Extra today: {formatMoney(totalExtraToday, activeCurrency)}
                </span>
              </div>
            )}

            {/* Loan alarm for this day (Section 19 & 30) */}
            {loansDueToday.map((loan) => (
              <div
                key={loan.id}
                className="mt-3 p-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-semibold text-amber-200">
                    Today: take {formatMoney(loan.amount, activeCurrency)} from {loan.person || 'Friend'}.
                  </span>
                </div>
                <button
                  onClick={() => onOpenAddModal('returned')}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 text-neutral-950 font-bold text-[10px] hover:bg-amber-400 transition"
                >
                  Returned
                </button>
              </div>
            ))}

            {/* Entries List for Selected Day */}
            <div className="mt-4">
              {selectedDayEntries.length === 0 ? (
                /* Empty state strictly per Section 30 ("Nothing on this day") */
                <div className="py-8 text-center">
                  <p className="text-xs text-neutral-400 font-medium">Nothing on this day</p>
                  <button
                    onClick={() => onOpenAddModal('expense')}
                    className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    + Add entry for this day
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-neutral-800">
                  {selectedDayEntries.map((item) => {
                    const isPositive = item.type === 'money_in' || item.type === 'borrowed' || item.type === 'returned';
                    return (
                      <div key={item.id} className="py-3 flex items-center justify-between gap-2 group">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                              item.type === 'money_in'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : item.type === 'expense'
                                ? 'bg-neutral-800 text-neutral-300'
                                : 'bg-amber-500/10 text-amber-400'
                            }`}
                          >
                            {isPositive ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                          </div>
                          <div className="truncate">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-semibold text-neutral-200 truncate">{item.whatFor}</p>
                              {item.isExtra && (
                                <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300">
                                  Extra
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-neutral-500">
                              {item.paymentMethod ? `via ${item.paymentMethod}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-xs font-bold font-mono ${
                              isPositive ? 'text-emerald-400' : 'text-neutral-200'
                            }`}
                          >
                            {isPositive ? '+' : ''}
                            {formatMoney(item.amount, activeCurrency)}
                          </span>
                          <button
                            onClick={() => onDeleteEntry(item.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-rose-400 transition"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
