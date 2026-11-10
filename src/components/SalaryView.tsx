import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  PieChart,
  Calendar,
  Sparkles,
  Percent,
  ShieldAlert,
  ArrowUpRight,
  Plus,
  CheckCircle,
  HelpCircle,
  Clock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SalaryConfig, SupportedCurrency } from '../types';
import { calculateSalaryBreakdown, calculatePakistanFBRTax, getPaydaysForMonth } from '../services/salaryMath';
import { playChimeSound } from '../services/notifications';
import { formatCurrencyValue } from '../services/currency';

interface SalaryViewProps {
  salaryConfig: SalaryConfig;
  onUpdateSalaryConfig: (updates: Partial<SalaryConfig>) => void;
  onAddSalaryHistory: (entry: { title: string; date: string; annualEquivalent: number; notes?: string }) => void;
  activeCurrency?: SupportedCurrency;
  currencyRates?: Record<SupportedCurrency, number>;
}

export const SalaryView: React.FC<SalaryViewProps> = ({
  salaryConfig,
  onUpdateSalaryConfig,
  onAddSalaryHistory,
  activeCurrency = 'USD',
  currencyRates = { USD: 1, PKR: 278.5, EGP: 49.3, EUR: 0.92, GBP: 0.79 },
}) => {
  const breakdown = calculateSalaryBreakdown(salaryConfig);

  const [activeTab, setActiveTab] = useState<'calculator' | 'schedule' | 'history'>('calculator');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyTitle, setHistoryTitle] = useState('');
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [historyAmount, setHistoryAmount] = useState<number>(salaryConfig.baseSalary);
  const [historyNotes, setHistoryNotes] = useState('');

  // Celebrate payday confetti trigger
  const handleCelebratePayday = () => {
    playChimeSound('payday');
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#34d399', '#f59e0b', '#6366f1'],
    });
  };

  const handleAddHistorySubmit = () => {
    if (!historyTitle.trim() || !historyAmount) return;
    onAddSalaryHistory({
      title: historyTitle.trim(),
      date: historyDate,
      annualEquivalent: historyAmount,
      notes: historyNotes.trim() || undefined,
    });
    setHistoryTitle('');
    setHistoryNotes('');
    setShowHistoryModal(false);
  };

  // Next payday countdown calculation
  const now = new Date();
  const todayDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const thisMonthPaydays = getPaydaysForMonth(salaryConfig, currentYear, currentMonth);

  const nextPaydayDay = thisMonthPaydays.find((d) => d >= todayDay) || thisMonthPaydays[0];
  const daysUntilNext =
    nextPaydayDay >= todayDay
      ? nextPaydayDay - todayDay
      : daysInCurrentMonth - todayDay + nextPaydayDay;

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-6">
      {/* View Header with KPI Summary */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Salary &amp; Paycheck Calculator</span>
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
                Gross to Net
              </span>
            </h2>
            <p className="text-xs text-neutral-400">
              Tax deductions, retirement withholdings, payday calendar mapping &amp; take-home pay
            </p>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCelebratePayday}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/25 active:scale-95 transition"
            title="Simulate Payday Celebration Chime & Confetti"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>Celebrate Payday!</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Monthly Net Take-Home */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Monthly Take-Home (Net Salary)
          </span>
          <div className="mt-2 font-mono font-bold text-2xl sm:text-3xl text-emerald-400">
            {formatCurrencyValue(breakdown.netMonthly, activeCurrency, currencyRates)}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-neutral-400">
            {activeCurrency !== 'USD' && (
              <span>(${Math.round(breakdown.netMonthly).toLocaleString()} USD) • </span>
            )}
            <span>Take-home:</span>
            <span className="font-semibold text-emerald-400">
              {breakdown.takeHomePercentage.toFixed(1)}%
            </span>
            <span className="mx-1">•</span>
            <span>Tax:</span>
            <span className="font-semibold text-neutral-200">
              {breakdown.effectiveTaxRate.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Per Paycheck Amount */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 shadow-lg relative overflow-hidden">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Estimated Per Paycheck
          </span>
          <div className="mt-2 font-mono font-bold text-2xl sm:text-3xl text-neutral-100">
            {formatCurrencyValue(breakdown.netPaycheck, activeCurrency, currencyRates)}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-neutral-400 capitalize">
            <span>Frequency:</span>
            <span className="font-semibold text-neutral-200">{salaryConfig.payDayFrequency}</span>
            <span className="mx-1">•</span>
            <span>Paydays: {salaryConfig.payDayDate}th {salaryConfig.payDayDateSecondary ? `& ${salaryConfig.payDayDateSecondary}th` : ''}</span>
          </div>
        </div>

        {/* Annual Equivalent Gross */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 shadow-lg relative overflow-hidden">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Annual Gross Comp
          </span>
          <div className="mt-2 font-mono font-bold text-2xl sm:text-3xl text-neutral-100">
            {formatCurrencyValue(breakdown.grossAnnual, activeCurrency, currencyRates)}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-neutral-400">
            <span>Net Annual:</span>
            <span className="font-semibold text-neutral-200">
              {formatCurrencyValue(breakdown.netAnnual, activeCurrency, currencyRates)}
            </span>
          </div>
        </div>

        {/* Next Payday Arrival Countdown */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 shadow-lg relative overflow-hidden">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Next Scheduled Payday
          </span>
          <div className="mt-2 flex items-baseline gap-1 font-mono font-bold text-2xl sm:text-3xl text-amber-400">
            <span>{daysUntilNext === 0 ? 'Today!' : `${daysUntilNext} day${daysUntilNext > 1 ? 's' : ''}`}</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-neutral-400">
            <span>Target day:</span>
            <span className="font-semibold text-neutral-200">
              {salaryConfig.currency} {nextPaydayDay}th of month
            </span>
          </div>
        </div>
      </div>

      {/* Visual Income Distribution Stacked Bar */}
      <div className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
            Gross Income Distribution (Monthly)
          </span>
          <span className="font-mono text-xs text-neutral-400">
            Total Base + Bonus: ${Math.round(breakdown.grossMonthly + breakdown.bonusMonthly + breakdown.overtimeMonthly).toLocaleString()}
          </span>
        </div>

        {/* Multi-segment distribution progress bar */}
        <div className="h-4 w-full rounded-full bg-neutral-800 overflow-hidden flex">
          {/* Net Take-Home */}
          <div
            style={{ width: `${Math.max(2, breakdown.takeHomePercentage)}%` }}
            className="bg-emerald-500 hover:bg-emerald-400 transition"
            title={`Net Take-Home: $${Math.round(breakdown.netMonthly).toLocaleString()} (${breakdown.takeHomePercentage.toFixed(1)}%)`}
          />
          {/* Federal Tax */}
          <div
            style={{
              width: `${(breakdown.federalTaxMonthly / breakdown.grossMonthly) * 100}%`,
            }}
            className="bg-rose-500 hover:bg-rose-400 transition"
            title={`Federal Tax: $${Math.round(breakdown.federalTaxMonthly).toLocaleString()}`}
          />
          {/* State Tax */}
          <div
            style={{
              width: `${(breakdown.stateTaxMonthly / breakdown.grossMonthly) * 100}%`,
            }}
            className="bg-orange-500 hover:bg-orange-400 transition"
            title={`State Tax: $${Math.round(breakdown.stateTaxMonthly).toLocaleString()}`}
          />
          {/* FICA */}
          <div
            style={{
              width: `${(breakdown.ficaTaxMonthly / breakdown.grossMonthly) * 100}%`,
            }}
            className="bg-amber-500 hover:bg-amber-400 transition"
            title={`FICA (SS + Medicare): $${Math.round(breakdown.ficaTaxMonthly).toLocaleString()}`}
          />
          {/* 401(k) */}
          <div
            style={{
              width: `${(breakdown.retirement401kMonthly / breakdown.grossMonthly) * 100}%`,
            }}
            className="bg-indigo-500 hover:bg-indigo-400 transition"
            title={`401(k) Retirement: $${Math.round(breakdown.retirement401kMonthly).toLocaleString()}`}
          />
          {/* Insurance */}
          <div
            style={{
              width: `${(breakdown.healthInsuranceMonthly / breakdown.grossMonthly) * 100}%`,
            }}
            className="bg-purple-500 hover:bg-purple-400 transition"
            title={`Health Insurance: $${Math.round(breakdown.healthInsuranceMonthly).toLocaleString()}`}
          />
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-neutral-400">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>Net Take-Home (${Math.round(breakdown.netMonthly).toLocaleString()})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span>Federal Tax (${Math.round(breakdown.federalTaxMonthly).toLocaleString()})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
            <span>State Tax (${Math.round(breakdown.stateTaxMonthly).toLocaleString()})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span>FICA (${Math.round(breakdown.ficaTaxMonthly).toLocaleString()})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
            <span>401(k) (${Math.round(breakdown.retirement401kMonthly).toLocaleString()})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
            <span>Health &amp; Benefits (${Math.round(breakdown.healthInsuranceMonthly).toLocaleString()})</span>
          </div>
        </div>
      </div>

      {/* Sub Tabs: Calculator Parameters | Payday Schedule | Compensation History */}
      <div className="mb-6 flex border-b border-neutral-800">
        <button
          onClick={() => setActiveTab('calculator')}
          className={`border-b-2 px-4 py-2.5 text-xs font-medium transition ${
            activeTab === 'calculator'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          Calculator Parameters
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`border-b-2 px-4 py-2.5 text-xs font-medium transition ${
            activeTab === 'schedule'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          Payday Schedule &amp; Calendar Link
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`border-b-2 px-4 py-2.5 text-xs font-medium transition ${
            activeTab === 'history'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          Salary History &amp; Raises ({salaryConfig.history.length})
        </button>
      </div>

      {/* TAB 1: CALCULATOR INPUTS */}
      {activeTab === 'calculator' && (
        <div className="space-y-6">
          {/* PAKISTAN FBR INCOME TAX & EOBI SALARIED MODULE (Tax Year 2024 - 2026) */}
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-neutral-900 via-neutral-900 to-emerald-950/20 p-5 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    🇵🇰 Pakistan FBR Salaried Tax Engine
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-neutral-800 text-neutral-300">
                    Income Tax Ordinance &bull; Tax Year 2024-2026
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                  Pakistan Salaried Tax Slabs &amp; Net Take-Home Pay
                </h3>
                <p className="text-xs text-neutral-300 mt-0.5">
                  Official Federal Board of Revenue (FBR) progressive tax brackets with mandatory EOBI employee deductions.
                </p>
              </div>

              {(() => {
                const pakTax = calculatePakistanFBRTax(salaryConfig.baseSalary);
                return (
                  <div className="text-left lg:text-right shrink-0">
                    <div className="text-xs text-neutral-400">Net Take-Home (Post FBR Tax &amp; EOBI):</div>
                    <div className="text-2xl font-black text-emerald-400 font-mono">
                      Rs. {new Intl.NumberFormat('en-PK').format(pakTax.netMonthlyTakeHome)}
                    </div>
                    <div className="text-[11px] text-neutral-400 font-mono">
                      Monthly FBR Tax: Rs. {pakTax.monthlyTax.toLocaleString()} &bull; EOBI: Rs. {pakTax.eobiMonthly}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Slabs Grid Breakdown */}
            {(() => {
              const pakTax = calculatePakistanFBRTax(salaryConfig.baseSalary);
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 text-xs">
                  <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800">
                    <span className="text-neutral-400 block text-[11px] uppercase font-mono">Annual Gross Salary</span>
                    <span className="text-sm font-bold text-white font-mono">
                      Rs. {new Intl.NumberFormat('en-PK').format(pakTax.annualGross)}
                    </span>
                    <span className="block text-[10px] text-neutral-500 font-mono mt-0.5">
                      ({(pakTax.annualGross / 100000).toFixed(2)} Lakhs PKR)
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800">
                    <span className="text-neutral-400 block text-[11px] uppercase font-mono">FBR Tax Bracket</span>
                    <span className="text-xs font-bold text-amber-300">
                      {pakTax.taxBracketPct}% Marginal Rate
                    </span>
                    <span className="block text-[10px] text-neutral-400 mt-0.5 truncate" title={pakTax.slabDescription}>
                      {pakTax.slabDescription}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800">
                    <span className="text-neutral-400 block text-[11px] uppercase font-mono">Monthly Deductions</span>
                    <div className="font-mono text-xs font-semibold text-rose-400">
                      -Rs. {new Intl.NumberFormat('en-PK').format(pakTax.monthlyTax + pakTax.eobiMonthly)}
                    </div>
                    <span className="block text-[10px] text-neutral-500 font-mono mt-0.5">
                      Tax: Rs. {pakTax.monthlyTax} + EOBI: Rs. {pakTax.eobiMonthly}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800">
                    <span className="text-neutral-400 block text-[11px] uppercase font-mono">Disbursement Channels</span>
                    <span className="text-xs font-bold text-emerald-300">
                      Raast &bull; EasyPaisa &bull; 1Link
                    </span>
                    <span className="block text-[10px] text-neutral-400 mt-0.5">
                      State Bank Instant Settlement
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Base Compensation Settings */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
            <h3 className="text-sm font-bold text-neutral-100 mb-4 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              <span>Base Pay &amp; Earning Period</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Pay Period Mode</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['annually', 'monthly', 'biweekly', 'hourly'] as const).map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => onUpdateSalaryConfig({ payPeriod: period })}
                      className={`rounded-lg py-2 text-center capitalize transition font-medium ${
                        salaryConfig.payPeriod === period
                          ? 'bg-emerald-500 text-neutral-950 font-bold'
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">
                  Base Pay Rate ({salaryConfig.currency})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-mono">
                    {salaryConfig.currency}
                  </span>
                  <input
                    type="number"
                    value={salaryConfig.baseSalary}
                    onChange={(e) =>
                      onUpdateSalaryConfig({ baseSalary: Math.max(0, parseFloat(e.target.value) || 0) })
                    }
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-800/80 py-2 pl-8 pr-4 font-mono text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {salaryConfig.payPeriod === 'hourly' && (
                <div>
                  <label className="text-neutral-400 block mb-1">Hours Per Week</label>
                  <input
                    type="number"
                    value={salaryConfig.hoursPerWeek}
                    onChange={(e) =>
                      onUpdateSalaryConfig({
                        hoursPerWeek: Math.max(1, parseFloat(e.target.value) || 40),
                      })
                    }
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-800/80 p-2 font-mono text-sm text-white outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-neutral-400 block mb-1">Monthly Bonus Avg ($)</label>
                  <input
                    type="number"
                    value={salaryConfig.bonusMonthlyAvg}
                    onChange={(e) =>
                      onUpdateSalaryConfig({
                        bonusMonthlyAvg: Math.max(0, parseFloat(e.target.value) || 0),
                      })
                    }
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-800/80 p-2 font-mono text-sm text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">Overtime Hours / Mo</label>
                  <input
                    type="number"
                    value={salaryConfig.overtimeHoursPerMonth}
                    onChange={(e) =>
                      onUpdateSalaryConfig({
                        overtimeHoursPerMonth: Math.max(0, parseFloat(e.target.value) || 0),
                      })
                    }
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-800/80 p-2 font-mono text-sm text-white outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tax Rates & Benefits Deductions */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
            <h3 className="text-sm font-bold text-neutral-100 mb-4 flex items-center gap-2">
              <Percent className="h-4 w-4 text-rose-400" />
              <span>Tax Brackets &amp; Pre/Post Tax Deductions</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-neutral-400 block mb-1">Federal Tax (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={salaryConfig.federalTaxRate}
                    onChange={(e) =>
                      onUpdateSalaryConfig({
                        federalTaxRate: Math.max(0, parseFloat(e.target.value) || 0),
                      })
                    }
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-800/80 p-2 font-mono text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">State Tax (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={salaryConfig.stateTaxRate}
                    onChange={(e) =>
                      onUpdateSalaryConfig({
                        stateTaxRate: Math.max(0, parseFloat(e.target.value) || 0),
                      })
                    }
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-800/80 p-2 font-mono text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">FICA (%)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={salaryConfig.ficaTaxRate}
                    onChange={(e) =>
                      onUpdateSalaryConfig({
                        ficaTaxRate: Math.max(0, parseFloat(e.target.value) || 0),
                      })
                    }
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-800/80 p-2 font-mono text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="border-t border-neutral-800 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-neutral-400 block mb-1">
                      401(k) Retirement (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={salaryConfig.retirement401kPct}
                      onChange={(e) =>
                        onUpdateSalaryConfig({
                          retirement401kPct: Math.max(0, parseFloat(e.target.value) || 0),
                        })
                      }
                      className="w-full rounded-xl border border-neutral-700 bg-neutral-800/80 p-2 font-mono text-sm text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-400 block mb-1">
                      Health Insurance ($/mo)
                    </label>
                    <input
                      type="number"
                      value={salaryConfig.healthInsuranceMonthly}
                      onChange={(e) =>
                        onUpdateSalaryConfig({
                          healthInsuranceMonthly: Math.max(0, parseFloat(e.target.value) || 0),
                        })
                      }
                      className="w-full rounded-xl border border-neutral-700 bg-neutral-800/80 p-2 font-mono text-sm text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">
                  Other Monthly Deductions ($/mo)
                </label>
                <input
                  type="number"
                  value={salaryConfig.otherDeductionsMonthly}
                  onChange={(e) =>
                    onUpdateSalaryConfig({
                      otherDeductionsMonthly: Math.max(0, parseFloat(e.target.value) || 0),
                    })
                  }
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-800/80 p-2 font-mono text-sm text-white outline-none"
                />
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* TAB 2: PAYDAY SCHEDULE */}
      {activeTab === 'schedule' && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
          <h3 className="text-sm font-bold text-neutral-100 mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-400" />
            <span>Payday Frequency &amp; Calendar Mapping</span>
          </h3>
          <p className="text-xs text-neutral-400 mb-5">
            Configure how frequently you are paid. Zenith automatically schedules deposits onto your Calendar and updates budget rollover triggers.
          </p>

          <div className="max-w-xl space-y-4 text-xs">
            <div>
              <label className="text-neutral-400 block mb-1">Payday Frequency</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'monthly', label: 'Monthly (1/mo)' },
                  { id: 'semi-monthly', label: 'Semi-Monthly (2/mo)' },
                  { id: 'bi-weekly', label: 'Bi-Weekly (Every 2 wks)' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() =>
                      onUpdateSalaryConfig({
                        payDayFrequency: f.id as SalaryConfig['payDayFrequency'],
                      })
                    }
                    className={`rounded-xl p-3 text-center transition ${
                      salaryConfig.payDayFrequency === f.id
                        ? 'border border-emerald-500/50 bg-emerald-500/15 text-emerald-300 font-semibold'
                        : 'border border-neutral-800 bg-neutral-800/60 text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-neutral-400 block mb-1">
                  Primary Payday (Day of month: 1-31)
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={salaryConfig.payDayDate}
                  onChange={(e) =>
                    onUpdateSalaryConfig({
                      payDayDate: Math.min(31, Math.max(1, parseInt(e.target.value) || 1)),
                    })
                  }
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-800/80 p-2 font-mono text-sm text-white outline-none"
                />
              </div>

              {salaryConfig.payDayFrequency === 'semi-monthly' && (
                <div>
                  <label className="text-neutral-400 block mb-1">
                    Secondary Payday (Day of month)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={salaryConfig.payDayDateSecondary || 15}
                    onChange={(e) =>
                      onUpdateSalaryConfig({
                        payDayDateSecondary: Math.min(31, Math.max(1, parseInt(e.target.value) || 15)),
                      })
                    }
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-800/80 p-2 font-mono text-sm text-white outline-none"
                  />
                </div>
              )}
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-neutral-300">
              <div className="flex items-center gap-2 font-semibold text-emerald-400 mb-1">
                <CheckCircle className="h-4 w-4" />
                <span>Calendar Sync Active</span>
              </div>
              <p className="leading-relaxed">
                Paydays for all 12 months are automatically mapped to your Calendar view with direct deposit badges and estimated net amounts (${Math.round(breakdown.netPaycheck).toLocaleString()}).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SALARY HISTORY */}
      {activeTab === 'history' && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span>Compensation Progression &amp; Raise Tracker</span>
              </h3>
              <p className="text-xs text-neutral-400">
                Audit trail of salary adjustments, promotions, and bonuses over time
              </p>
            </div>
            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Log Raise</span>
            </button>
          </div>

          <div className="space-y-3">
            {salaryConfig.history.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 text-xs"
              >
                <div>
                  <div className="font-semibold text-neutral-200 text-sm">{h.title}</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">{h.notes}</div>
                  <div className="text-[10px] text-neutral-500 font-mono mt-1">{h.date}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-base text-emerald-400">
                    ${h.annualEquivalent.toLocaleString()} / yr
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log Raise Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-5 shadow-2xl">
            <h3 className="font-bold text-white text-base pb-3 border-b border-neutral-800">
              Log Salary Adjustment
            </h3>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Title / Reason *</label>
                <input
                  type="text"
                  placeholder="e.g. Q4 Performance Raise, Promotion to Staff Eng"
                  value={historyTitle}
                  onChange={(e) => setHistoryTitle(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 block mb-1">Effective Date *</label>
                  <input
                    type="date"
                    value={historyDate}
                    onChange={(e) => setHistoryDate(e.target.value)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">New Annual Equivalent ($) *</label>
                  <input
                    type="number"
                    value={historyAmount}
                    onChange={(e) => setHistoryAmount(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Notes / Context</label>
                <textarea
                  rows={3}
                  placeholder="Details regarding this adjustment..."
                  value={historyNotes}
                  onChange={(e) => setHistoryNotes(e.target.value)}
                  className="w-full resize-none rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-neutral-800 pt-3">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="rounded-lg px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddHistorySubmit}
                className="rounded-lg bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-emerald-400"
              >
                Save Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
