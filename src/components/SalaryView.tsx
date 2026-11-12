import React, { useState } from 'react';
import {
  BadgePercent,
  Calendar,
  ChevronDown,
  ChevronUp,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Equal,
  Calculator,
  Sparkles,
} from 'lucide-react';
import { SimpleMoneyEntry, SupportedCurrency, SalaryBreakdownConfig } from '../types';
import { formatMoney } from '../services/currency';
import { formatMonthKeyLabel } from '../services/monthEngine';

interface SalaryViewProps {
  entries: SimpleMoneyEntry[];
  activeCurrency: SupportedCurrency;
  salaryConfig: SalaryBreakdownConfig;
  onUpdateSalaryConfig: (updates: Partial<SalaryBreakdownConfig>) => void;
  onOpenAddSalaryModal: () => void;
}

export const SalaryView: React.FC<SalaryViewProps> = ({
  entries,
  activeCurrency,
  salaryConfig,
  onUpdateSalaryConfig,
  onOpenAddSalaryModal,
}) => {
  const [showCalculator, setShowCalculator] = useState(false);

  // Extract all salary / money_in entries, newest first (Section 21)
  const salaryEntries = entries
    .filter((e) => e.type === 'money_in')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Gross to Net calculator math
  const baseSalary = salaryConfig.baseSalary || 0;
  const taxAmount = (baseSalary * (salaryConfig.taxRatePercent || 0)) / 100;
  const pfAmount = (baseSalary * (salaryConfig.providentFundPercent || 0)) / 100;
  const totalDeductions = taxAmount + pfAmount + (salaryConfig.otherDeductions || 0);
  const totalAdditions = (salaryConfig.medicalAllowance || 0) + (salaryConfig.bonusExpected || 0);
  const projectedNet = baseSalary - totalDeductions + totalAdditions;

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 py-2">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Salary Ledger</h1>
          <p className="text-xs text-neutral-400">Month-by-month salary history (newest first)</p>
        </div>

        <button
          onClick={onOpenAddSalaryModal}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-98 transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>+ Add Salary</span>
        </button>
      </div>

      {/* Month-by-month Salary History Table (Section 21) */}
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-5 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white">Salary History</h2>
          <span className="text-[11px] text-neutral-400">{salaryEntries.length} payouts logged</span>
        </div>

        {salaryEntries.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-xs text-neutral-400 font-medium">No salary entries recorded yet.</p>
            <button
              onClick={onOpenAddSalaryModal}
              className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              + Log your first salary
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-400 uppercase text-[10px] font-bold">
                  <th className="pb-3 pr-4">Month</th>
                  <th className="pb-3 px-4">Date Received</th>
                  <th className="pb-3 px-4">Amount</th>
                  <th className="pb-3 px-4">Payment Method</th>
                  <th className="pb-3 pl-4 text-right">Change vs Prev</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {salaryEntries.map((item, idx) => {
                  // Calculate change compared to chronologically previous payout
                  const nextOlder = salaryEntries[idx + 1];
                  let diff = 0;
                  if (nextOlder) {
                    diff = item.amount - nextOlder.amount;
                  }

                  return (
                    <tr key={item.id} className="hover:bg-neutral-800/30 transition">
                      <td className="py-3.5 pr-4 font-semibold text-white">
                        {formatMonthKeyLabel(item.monthKey)}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-400 font-mono">{item.date}</td>
                      <td className="py-3.5 px-4 font-bold font-mono text-emerald-400">
                        {formatMoney(item.amount, activeCurrency)}
                      </td>
                      <td className="py-3.5 px-4 capitalize text-neutral-300">
                        {item.paymentMethod ? item.paymentMethod.replace('_', ' ') : 'Bank'}
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        {!nextOlder ? (
                          <span className="text-neutral-500 font-mono text-[11px]">Initial</span>
                        ) : diff > 0 ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold font-mono text-[11px]">
                            <ArrowUpRight className="h-3 w-3" />
                            +{formatMoney(diff, activeCurrency)}
                          </span>
                        ) : diff < 0 ? (
                          <span className="inline-flex items-center gap-1 text-rose-400 font-bold font-mono text-[11px]">
                            <ArrowDownRight className="h-3 w-3" />
                            {formatMoney(diff, activeCurrency)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-neutral-400 font-mono text-[11px]">
                            <Equal className="h-3 w-3" />
                            Same
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Gross-to-Net Calculator (Collapsible Tool Docked at Bottom per Section 21) */}
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/70 p-5 shadow-sm">
        <button
          onClick={() => setShowCalculator(!showCalculator)}
          className="w-full flex items-center justify-between text-left hover:opacity-90 transition"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-800 text-neutral-300">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Gross-to-Net Calculator (Optional Tool)</h3>
              <p className="text-[11px] text-neutral-400">Project taxes, allowances, and net monthly take-home</p>
            </div>
          </div>
          {showCalculator ? (
            <ChevronUp className="h-5 w-5 text-neutral-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-neutral-400" />
          )}
        </button>

        {showCalculator && (
          <div className="mt-5 pt-5 border-t border-neutral-800/80 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">Base Salary (Gross)</label>
                <input
                  type="number"
                  value={salaryConfig.baseSalary}
                  onChange={(e) => onUpdateSalaryConfig({ baseSalary: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">Income Tax (%)</label>
                <input
                  type="number"
                  value={salaryConfig.taxRatePercent}
                  onChange={(e) => onUpdateSalaryConfig({ taxRatePercent: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">Provident Fund (%)</label>
                <input
                  type="number"
                  value={salaryConfig.providentFundPercent}
                  onChange={(e) =>
                    onUpdateSalaryConfig({ providentFundPercent: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">Medical Allowance</label>
                <input
                  type="number"
                  value={salaryConfig.medicalAllowance}
                  onChange={(e) =>
                    onUpdateSalaryConfig({ medicalAllowance: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">Other Deductions</label>
                <input
                  type="number"
                  value={salaryConfig.otherDeductions}
                  onChange={(e) =>
                    onUpdateSalaryConfig({ otherDeductions: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">Bonus Expected</label>
                <input
                  type="number"
                  value={salaryConfig.bonusExpected}
                  onChange={(e) => onUpdateSalaryConfig({ bonusExpected: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Calculated Results */}
            <div className="rounded-2xl bg-neutral-950/80 p-4 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] text-neutral-400">Projected Monthly Net Take-Home</span>
                <p className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                  {formatMoney(projectedNet, activeCurrency)}
                </p>
              </div>
              <div className="text-xs text-neutral-400 space-y-1">
                <p>Tax: {formatMoney(taxAmount, activeCurrency)}</p>
                <p>Provident Fund: {formatMoney(pfAmount, activeCurrency)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
