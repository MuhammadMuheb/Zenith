import React from 'react';
import {
  PiggyBank,
  Lock,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Layers,
} from 'lucide-react';
import { SimpleMoneyEntry, MonthBook, SupportedCurrency } from '../types';
import { formatMoney } from '../services/currency';
import { calculateMonthTotals, formatMonthKeyLabel } from '../services/monthEngine';

interface SavingsViewProps {
  currentMonthKey: string;
  entries: SimpleMoneyEntry[];
  monthBooks: MonthBook[];
  activeCurrency: SupportedCurrency;
  onOpenAddModal: () => void;
}

export const SavingsView: React.FC<SavingsViewProps> = ({
  currentMonthKey,
  entries,
  monthBooks,
  activeCurrency,
  onOpenAddModal,
}) => {
  // Total locked savings = sum of lockedSavedAmount across all locked months minus takenBackAmount
  const lockedBooks = monthBooks.filter((b) => b.isLocked);
  const totalLockedSavings = lockedBooks.reduce(
    (sum, b) => sum + Math.max(0, (b.lockedSavedAmount || 0) - (b.takenBackAmount || 0)),
    0
  );

  // Current active month calculations (floating / moves up and down until month ends)
  const currentBook = monthBooks.find((b) => b.monthKey === currentMonthKey);
  const currentMonthTotals = calculateMonthTotals(currentMonthKey, entries);
  const thisMonthSoFar = Math.max(0, currentMonthTotals.left);

  // Still to save and Goal (clean 0 if not set)
  const goal = currentBook?.goal || 0;
  const stillToSave = currentBook?.stillToSaveFromBefore || 0;
  const target = currentBook?.target || goal + stillToSave;
  const stillNeededThisMonth = Math.max(0, target - thisMonthSoFar);

  // Plain list of expenses without minus signs (smaller numbers per Section 5)
  const allExpenses = entries
    .filter((e) => e.type === 'expense' || e.type === 'lent')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 15);

  const hasAnySavings = totalLockedSavings > 0 || thisMonthSoFar > 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 py-2">
      {/* Top Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Savings Vault</h1>
        <p className="text-xs text-neutral-400">Locked reserves &amp; running savings progress</p>
      </div>

      {/* Main Total Locked Savings Banner */}
      <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-2">
          <PiggyBank className="h-4 w-4" />
          <span>TOTAL LOCKED SAVINGS</span>
        </div>
        <div className="text-3xl sm:text-5xl font-black text-white tracking-tight font-mono">
          {formatMoney(totalLockedSavings, activeCurrency)}
        </div>
        <p className="text-xs text-neutral-400 mt-2">
          Secured from previous completed months. Unlocked only if explicitly withdrawn.
        </p>
      </div>

      {/* "Still to save" & Goal breakdown banner (Section 18) */}
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-5">
        <h2 className="text-sm font-bold text-white mb-3">Savings Target Breakdown</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-800">
            <span className="text-[11px] font-semibold text-neutral-400">This Month&apos;s Goal</span>
            <p className="text-lg font-bold text-white mt-1">{formatMoney(goal, activeCurrency)}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-800">
            <span className="text-[11px] font-semibold text-neutral-400">From Last Months (Unmet)</span>
            <p
              className={`text-lg font-bold mt-1 ${
                stillToSave > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {stillToSave > 0 ? formatMoney(stillToSave, activeCurrency) : 'None (0)'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-800">
            <span className="text-[11px] font-semibold text-neutral-400">Still to Save This Month</span>
            <p className="text-lg font-bold text-emerald-400 mt-1">
              {formatMoney(stillNeededThisMonth, activeCurrency)}
            </p>
          </div>
        </div>

        {stillToSave > 0 && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>You still need to save {formatMoney(stillToSave, activeCurrency)} from earlier months.</span>
          </div>
        )}
      </div>

      {/* Month Rows List */}
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-5">
        <h2 className="text-sm font-bold text-white mb-4">Monthly Savings Ledger</h2>

        {!hasAnySavings ? (
          /* Empty state strictly per Section 30 ("Nothing saved yet") */
          <div className="py-8 text-center">
            <p className="text-xs text-neutral-400 font-medium">Nothing saved yet</p>
            <p className="text-[11px] text-neutral-500 mt-1">
              When a month ends, whatever is left over will lock into Savings automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Active "This month so far" floating row per Section 5 */}
            <div className="p-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">This month so far ({formatMonthKeyLabel(currentMonthKey)})</p>
                  <p className="text-[10px] text-neutral-400">Moves in real time until month ends</p>
                </div>
              </div>
              <span className="text-sm font-bold font-mono text-emerald-400">
                {formatMoney(thisMonthSoFar, activeCurrency)}
              </span>
            </div>

            {/* Locked months (e.g. "October: 47,500 locked") */}
            {lockedBooks.map((b) => {
              const amount = Math.max(0, (b.lockedSavedAmount || 0) - (b.takenBackAmount || 0));
              return (
                <div
                  key={b.monthKey}
                  className="p-4 rounded-2xl border border-neutral-800 bg-neutral-950/60 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-800 text-neutral-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-200">
                        {b.monthLabel.split(' ')[0]}: {formatMoney(amount, activeCurrency)} locked
                      </p>
                      <p className="text-[10px] text-neutral-500">
                        Locked on {b.lockedAt ? new Date(b.lockedAt).toLocaleDateString() : 'Month End'}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold font-mono text-neutral-200">
                    {formatMoney(amount, activeCurrency)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Plain list of expenses WITHOUT minus signs (Section 5) */}
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/70 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white">Expense Stream</h2>
            <p className="text-[11px] text-neutral-400">Plain list without minus signs</p>
          </div>
          <span className="text-[11px] text-neutral-500">Recent outflows</span>
        </div>

        {allExpenses.length === 0 ? (
          <p className="text-xs text-neutral-500 py-6 text-center">No expenses recorded yet.</p>
        ) : (
          <div className="divide-y divide-neutral-800/80">
            {allExpenses.map((exp) => (
              <div key={exp.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="text-neutral-300 font-medium">{exp.whatFor}</p>
                  <p className="text-[10px] text-neutral-500">{exp.date}</p>
                </div>
                {/* Clean plain number without minus signs per Section 5 */}
                <span className="font-mono text-neutral-300 font-semibold text-xs">
                  {formatMoney(exp.amount, activeCurrency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
