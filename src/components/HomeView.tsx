import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  AlertTriangle,
  Bell,
  Clock,
  Sparkles,
  Trash2,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { SimpleMoneyEntry, MonthBook, SupportedCurrency } from '../types';
import { formatMoney } from '../services/currency';
import { calculateMonthTotals, formatMonthKeyLabel } from '../services/monthEngine';

interface HomeViewProps {
  currentMonthKey: string;
  entries: SimpleMoneyEntry[];
  monthBooks: MonthBook[];
  activeCurrency: SupportedCurrency;
  onOpenAddModal: (initialType?: 'money_in' | 'expense' | 'lent' | 'borrowed' | 'returned') => void;
  onDeleteEntry: (id: string) => void;
  onAddExtraToGoal?: (amount: number) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  currentMonthKey,
  entries,
  monthBooks,
  activeCurrency,
  onOpenAddModal,
  onDeleteEntry,
  onAddExtraToGoal,
}) => {
  // Current month totals
  const currentMonthEntries = entries.filter((e) => e.monthKey === currentMonthKey);
  const { cameIn, spent, left } = calculateMonthTotals(currentMonthKey, entries);

  // Month book
  const currentBook = monthBooks.find((b) => b.monthKey === currentMonthKey);
  const stillToSave = currentBook?.stillToSaveFromBefore || 0;
  const target = currentBook?.target || 0;

  // Alerts for today
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Loan alarms due today or past due
  const pendingLoansDue = entries.filter(
    (e) =>
      e.type === 'lent' &&
      !e.isCleared &&
      e.returnDate &&
      e.returnDate <= todayStr
  );

  // 2. Extra spending today
  const extraExpensesToday = entries.filter(
    (e) => e.type === 'expense' && e.isExtra && e.date === todayStr
  );
  const totalExtraToday = extraExpensesToday.reduce((sum, e) => sum + e.amount, 0);

  // 3. Money taken from old locked months
  const monthsWithTakenMoney = monthBooks.filter(
    (b) => b.isLocked && (b.takenBackAmount || 0) > 0
  );

  // Last 5 entries
  const last5Entries = [...entries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.id.localeCompare(a.id))
    .slice(0, 5);

  const hasSalaryOrIncome = entries.some((e) => e.type === 'money_in');

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 py-2">
      {/* Header bar with current month title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {formatMonthKeyLabel(currentMonthKey)}
          </h1>
          <p className="text-xs text-neutral-400">This month at a glance</p>
        </div>

        <button
          onClick={() => onOpenAddModal('expense')}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-98 transition self-start sm:self-auto"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Add Entry</span>
        </button>
      </div>

      {/* Empty State: If no salary or income entered yet per Section 30 */}
      {!hasSalaryOrIncome && (
        <div className="rounded-3xl border border-dashed border-emerald-500/40 bg-emerald-500/5 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 mb-3">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Add your first salary</h2>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1 mb-5">
            Start fresh by logging this month&apos;s income and setting your target savings goal.
          </p>
          <button
            onClick={() => onOpenAddModal('money_in')}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 transition shadow-md shadow-emerald-500/20"
          >
            + Add First Salary
          </button>
        </div>
      )}

      {/* Three Prominent Cards: Came In, Spent, Left */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* 1. Came in */}
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-400">Came in</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight">
            {formatMoney(cameIn, activeCurrency)}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Salary &amp; inflows this month</p>
        </div>

        {/* 2. Spent */}
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-400">Spent</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-neutral-100 tracking-tight">
            {formatMoney(spent, activeCurrency)}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Expenses &amp; loans lent</p>
        </div>

        {/* 3. Left */}
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-400">Left</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              left >= 0 ? 'text-white' : 'text-rose-400'
            }`}
          >
            {formatMoney(left, activeCurrency)}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Locks into Savings at month end</p>
        </div>
      </div>

      {/* Still to save banner (Section 18 & 30) */}
      {stillToSave > 0 && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-rose-300">
                You still need to save {formatMoney(stillToSave, activeCurrency)} from earlier months.
              </p>
              <p className="text-[11px] text-rose-400/80 mt-0.5">
                Total savings target for this month: {formatMoney(target, activeCurrency)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Today's Alerts Section (Section 1, 4, 30) */}
      {(pendingLoansDue.length > 0 || totalExtraToday > 0 || monthsWithTakenMoney.length > 0) && (
        <div className="space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Today&apos;s Alerts</h2>

          {/* Loan alarms */}
          {pendingLoansDue.map((loan) => (
            <div
              key={loan.id}
              className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <Bell className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="text-xs font-medium text-amber-200">
                  Today: take {formatMoney(loan.amount, activeCurrency)} from {loan.person || 'Friend'}.
                </span>
              </div>
              <button
                onClick={() => onOpenAddModal('returned')}
                className="px-3 py-1 rounded-lg bg-amber-500 text-neutral-950 font-bold text-[11px] hover:bg-amber-400 transition"
              >
                Mark Returned
              </button>
            </div>
          ))}

          {/* Extra spending today */}
          {totalExtraToday > 0 && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="text-xs font-medium text-amber-200">
                  Extra today: {formatMoney(totalExtraToday, activeCurrency)}. Add it to next month&apos;s goal?
                </span>
              </div>
              {onAddExtraToGoal && (
                <button
                  onClick={() => onAddExtraToGoal(totalExtraToday)}
                  className="px-3 py-1 rounded-lg bg-amber-500 text-neutral-950 font-bold text-[11px] hover:bg-amber-400 transition self-end sm:self-auto"
                >
                  Add to Goal
                </button>
              )}
            </div>
          )}

          {/* Money taken back from old months */}
          {monthsWithTakenMoney.map((b) => (
            <div
              key={b.monthKey}
              className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 flex items-center gap-2.5"
            >
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <span className="text-xs font-medium text-rose-200">
                You took {formatMoney(b.takenBackAmount || 0, activeCurrency)} from {b.monthLabel.split(' ')[0]} savings. Save {formatMoney(b.takenBackAmount || 0, activeCurrency)} back.
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Last 5 Entries Section */}
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/70 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white">Last 5 Entries</h2>
          <span className="text-[11px] text-neutral-400">Total {entries.length} logged</span>
        </div>

        {last5Entries.length === 0 ? (
          <p className="text-xs text-neutral-500 py-6 text-center">No entries yet. Tap + to add.</p>
        ) : (
          <div className="divide-y divide-neutral-800">
            {last5Entries.map((item) => {
              const isPositive = item.type === 'money_in' || item.type === 'borrowed' || item.type === 'returned';
              return (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3 group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        item.type === 'money_in'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : item.type === 'expense'
                          ? 'bg-neutral-800 text-neutral-300'
                          : item.type === 'lent'
                          ? 'bg-amber-500/10 text-amber-400'
                          : item.type === 'borrowed'
                          ? 'bg-sky-500/10 text-sky-400'
                          : 'bg-emerald-500/10 text-emerald-400'
                      }`}
                    >
                      {item.type === 'money_in' || item.type === 'borrowed' || item.type === 'returned' ? (
                        <ArrowDownLeft className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-neutral-200 truncate">{item.whatFor}</p>
                        {item.isExtra && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-medium">
                            Extra
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-400">
                        {item.date} {item.paymentMethod ? `• via ${item.paymentMethod}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
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
                      title="Delete"
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition"
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
  );
};
