import React, { useState, useMemo } from 'react';
import {
  PiggyBank,
  TrendingUp,
  Target,
  Sparkles,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  Percent,
  RefreshCw,
  Coins,
  DollarSign,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SavingsGoal, SupportedCurrency } from '../types';
import {
  DEFAULT_CURRENCIES,
  convertFromUSD,
  convertToUSD,
  formatCurrencyValue,
} from '../services/currency';
import { playChimeSound } from '../services/notifications';

interface SavingsCalculatorViewProps {
  savingsGoals: SavingsGoal[];
  onAddSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => void;
  onUpdateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  onDeleteSavingsGoal: (id: string) => void;
  activeCurrency: SupportedCurrency;
  currencyRates: Record<SupportedCurrency, number>;
  onSyncGoalToBudget: (goal: SavingsGoal) => void;
  monthlySavingsAllocatedInBudget: number;
}

export const SavingsCalculatorView: React.FC<SavingsCalculatorViewProps> = ({
  savingsGoals,
  onAddSavingsGoal,
  onUpdateSavingsGoal,
  onDeleteSavingsGoal,
  activeCurrency,
  currencyRates,
  onSyncGoalToBudget,
  monthlySavingsAllocatedInBudget,
}) => {
  // Calculator Modes: 'goal' = target amount -> monthly deposit needed, 'compound' = monthly deposit -> total future wealth
  const [calcMode, setCalcMode] = useState<'goal' | 'compound'>('goal');

  // Input states (stored in active currency for user convenience, converted to USD for model)
  const currentRate = currencyRates[activeCurrency] || 1.0;
  const currencyInfo = DEFAULT_CURRENCIES[activeCurrency];

  // Mode 1: Target Goal Calculator inputs
  const [targetGoalAmount, setTargetGoalAmount] = useState<number>(() =>
    Math.round(25000 * currentRate)
  );
  const [initialSavings, setInitialSavings] = useState<number>(() =>
    Math.round(5000 * currentRate)
  );
  const [targetMonths, setTargetMonths] = useState<number>(24);
  const [annualRateAPY, setAnnualRateAPY] = useState<number>(8.5);

  // Mode 2: Compound Growth inputs
  const [startingPrincipal, setStartingPrincipal] = useState<number>(() =>
    Math.round(10000 * currentRate)
  );
  const [monthlyContribution, setMonthlyContribution] = useState<number>(() =>
    Math.round(500 * currentRate)
  );
  const [growthYears, setGrowthYears] = useState<number>(5);
  const [compoundAPY, setCompoundAPY] = useState<number>(10.0);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTargetAmount, setNewTargetAmount] = useState<number>(10000);
  const [newCurrentAmount, setNewCurrentAmount] = useState<number>(1000);
  const [newMonthlyDeposit, setNewMonthlyDeposit] = useState<number>(400);
  const [newTargetDate, setNewTargetDate] = useState('2027-12-31');
  const [newCategory, setNewCategory] = useState<SavingsGoal['category']>('Emergency Fund');
  const [newApy, setNewApy] = useState<number>(7.5);
  const [newNotes, setNewNotes] = useState('');

  // Math Calculations for Mode 1: Goal Target
  const goalCalculation = useMemo(() => {
    const monthlyRate = annualRateAPY / 100 / 12;
    const n = Math.max(1, targetMonths);
    const futureTarget = Math.max(0, targetGoalAmount);
    const principal = Math.max(0, initialSavings);

    // FV of initial deposit
    const futureValueOfPrincipal = principal * Math.pow(1 + monthlyRate, n);
    const shortfall = Math.max(0, futureTarget - futureValueOfPrincipal);

    let requiredMonthly = 0;
    if (monthlyRate > 0) {
      // PMT formula: shortfall * r / ((1 + r)^n - 1)
      requiredMonthly = (shortfall * monthlyRate) / (Math.pow(1 + monthlyRate, n) - 1);
    } else {
      requiredMonthly = shortfall / n;
    }

    const totalDeposited = principal + requiredMonthly * n;
    const totalInterestEarned = Math.max(0, futureTarget - totalDeposited);

    return {
      requiredMonthly: Math.round(requiredMonthly),
      totalDeposited: Math.round(totalDeposited),
      totalInterestEarned: Math.round(totalInterestEarned),
      futureTarget: Math.round(futureTarget),
    };
  }, [targetGoalAmount, initialSavings, targetMonths, annualRateAPY]);

  // Math Calculations for Mode 2: Compound Wealth Growth
  const compoundCalculation = useMemo(() => {
    const monthlyRate = compoundAPY / 100 / 12;
    const months = Math.max(1, growthYears * 12);
    const principal = Math.max(0, startingPrincipal);
    const pmt = Math.max(0, monthlyContribution);

    // Timeline points for SVG chart (sample yearly)
    const points: Array<{ year: number; balance: number; deposits: number; interest: number }> = [];

    let currentBalance = principal;
    let totalDeposits = principal;

    for (let m = 1; m <= months; m++) {
      currentBalance = (currentBalance + pmt) * (1 + monthlyRate);
      totalDeposits += pmt;

      if (m % 12 === 0 || m === months) {
        points.push({
          year: m / 12,
          balance: Math.round(currentBalance),
          deposits: Math.round(totalDeposits),
          interest: Math.round(Math.max(0, currentBalance - totalDeposits)),
        });
      }
    }

    const finalBalance = Math.round(currentBalance);
    const finalDeposits = Math.round(totalDeposits);
    const finalInterest = Math.round(Math.max(0, finalBalance - finalDeposits));

    return {
      finalBalance,
      finalDeposits,
      finalInterest,
      points,
    };
  }, [startingPrincipal, monthlyContribution, growthYears, compoundAPY]);

  // Preset quick fill
  const applyPreset = (preset: 'emergency' | 'plot' | 'gold' | 'hajj') => {
    if (preset === 'emergency') {
      setTargetGoalAmount(Math.round(15000 * currentRate));
      setInitialSavings(Math.round(3000 * currentRate));
      setTargetMonths(18);
      setAnnualRateAPY(6.0);
    } else if (preset === 'plot') {
      setTargetGoalAmount(Math.round(50000 * currentRate));
      setInitialSavings(Math.round(10000 * currentRate));
      setTargetMonths(36);
      setAnnualRateAPY(10.5);
    } else if (preset === 'gold') {
      setTargetGoalAmount(Math.round(20000 * currentRate));
      setInitialSavings(Math.round(4000 * currentRate));
      setTargetMonths(24);
      setAnnualRateAPY(14.0);
    } else if (preset === 'hajj') {
      setTargetGoalAmount(Math.round(12000 * currentRate));
      setInitialSavings(Math.round(2500 * currentRate));
      setTargetMonths(12);
      setAnnualRateAPY(7.0);
    }
    playChimeSound('success');
  };

  // Convert USD goal amounts to active currency for display
  const totalSavedUSD = savingsGoals.reduce((acc, g) => acc + g.currentAmount, 0);
  const totalTargetUSD = savingsGoals.reduce((acc, g) => acc + g.targetAmount, 0);
  const totalMonthlyCommittedUSD = savingsGoals.reduce((acc, g) => acc + g.monthlyContribution, 0);

  const handleDepositToGoal = (goalId: string, depositAmountUSD: number) => {
    const goal = savingsGoals.find((g) => g.id === goalId);
    if (!goal) return;
    const nextCurrent = goal.currentAmount + depositAmountUSD;
    const isNowCompleted = nextCurrent >= goal.targetAmount;

    onUpdateSavingsGoal(goalId, {
      currentAmount: nextCurrent,
      isCompleted: isNowCompleted,
    });

    if (isNowCompleted) {
      playChimeSound('payday');
      confetti({ particleCount: 100, spread: 60 });
    } else {
      playChimeSound('success');
    }
  };

  const handleCreateGoalSubmit = () => {
    if (!newTitle.trim() || !newTargetAmount) return;

    // Convert input active currency amounts to USD baseline
    const targetUSD = convertToUSD(newTargetAmount, activeCurrency, currencyRates);
    const currentUSD = convertToUSD(newCurrentAmount, activeCurrency, currencyRates);
    const monthlyUSD = convertToUSD(newMonthlyDeposit, activeCurrency, currencyRates);

    onAddSavingsGoal({
      title: newTitle.trim(),
      targetAmount: Math.round(targetUSD),
      currentAmount: Math.round(currentUSD),
      monthlyContribution: Math.round(monthlyUSD),
      targetDate: newTargetDate,
      category: newCategory,
      annualReturnRate: newApy,
      isCompleted: currentUSD >= targetUSD,
      notes: newNotes.trim() || undefined,
    });

    setNewTitle('');
    setShowAddModal(false);
    playChimeSound('success');
  };

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
            <PiggyBank className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white">
                Savings &amp; Wealth Growth Calculator
              </h2>
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
                Live Multi-Currency ({activeCurrency})
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Compound interest forecasting, goal target planner &amp; cross-currency allocation (USD • PKR • EGP)
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 shadow-sm transition"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Savings Goal</span>
        </button>
      </div>

      {/* Cross-Currency Equivalent Ticker Card */}
      <div className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-bold text-neutral-200">
              Active Currency Equivalents:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            {/* USD */}
            <div className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-950/60 px-3 py-1.5">
              <span>🇺🇸</span>
              <span className="text-neutral-400">USD:</span>
              <span className="font-bold text-white">$1.00</span>
            </div>

            {/* PKR */}
            <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
              <span>🇵🇰</span>
              <span className="text-emerald-300">PKR (Pak):</span>
              <span className="font-bold text-emerald-400">
                ₨ {currencyRates.PKR.toFixed(1)}
              </span>
            </div>

            {/* EGP / EGX */}
            <div className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5">
              <span>🇪🇬</span>
              <span className="text-cyan-300">EGP (EGX):</span>
              <span className="font-bold text-cyan-400">
                E£ {currencyRates.EGP.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Overview KPIs */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Total Accumulated Savings */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 shadow-lg">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Total Accumulated Savings
          </span>
          <div className="mt-2 font-mono font-bold text-2xl sm:text-3xl text-emerald-400">
            {formatCurrencyValue(totalSavedUSD, activeCurrency, currencyRates)}
          </div>
          <div className="mt-1 text-[11px] text-neutral-400 font-mono">
            {activeCurrency !== 'USD' && (
              <span>Equivalent: ${Math.round(totalSavedUSD).toLocaleString()} USD</span>
            )}
            {activeCurrency === 'USD' && (
              <span>
                ≈ ₨ {Math.round(totalSavedUSD * currencyRates.PKR).toLocaleString()} PKR • E£ {Math.round(totalSavedUSD * currencyRates.EGP).toLocaleString()} EGP
              </span>
            )}
          </div>
        </div>

        {/* Total Target Portfolio */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 shadow-lg">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Total Goal Target
          </span>
          <div className="mt-2 font-mono font-bold text-2xl sm:text-3xl text-neutral-100">
            {formatCurrencyValue(totalTargetUSD, activeCurrency, currencyRates)}
          </div>
          <div className="mt-1 text-[11px] text-neutral-400">
            Overall Portfolio Progress:{' '}
            <strong className="text-emerald-400 font-mono">
              {totalTargetUSD > 0 ? ((totalSavedUSD / totalTargetUSD) * 100).toFixed(1) : 0}%
            </strong>
          </div>
        </div>

        {/* Monthly Committed Savings */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 shadow-lg">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Monthly Savings Inflow
          </span>
          <div className="mt-2 font-mono font-bold text-2xl sm:text-3xl text-indigo-400">
            {formatCurrencyValue(totalMonthlyCommittedUSD, activeCurrency, currencyRates)} / mo
          </div>
          <div className="mt-1 text-[11px] text-neutral-400">
            Auto-linked with Budget Savings bucket
          </div>
        </div>
      </div>

      {/* CALCULATOR WORKBENCH */}
      <div className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-xl">
        {/* Mode Selector & Quick Presets */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div className="flex items-center rounded-xl border border-neutral-800 bg-neutral-950 p-1">
            <button
              onClick={() => setCalcMode('goal')}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition ${
                calcMode === 'goal'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Target className="h-3.5 w-3.5 text-emerald-400" />
              <span>Goal Target Calculator</span>
            </button>
            <button
              onClick={() => setCalcMode('compound')}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition ${
                calcMode === 'compound'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
              <span>Compound Wealth Growth</span>
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-neutral-400 mr-1 hidden sm:inline">Presets:</span>
            <button
              onClick={() => applyPreset('emergency')}
              className="rounded-lg border border-neutral-800 bg-neutral-800/80 px-2.5 py-1 text-neutral-300 hover:text-white hover:border-neutral-700 transition"
            >
              🛡️ Emergency Fund
            </button>
            <button
              onClick={() => applyPreset('plot')}
              className="rounded-lg border border-neutral-800 bg-neutral-800/80 px-2.5 py-1 text-neutral-300 hover:text-white hover:border-neutral-700 transition"
            >
              🏡 Real Estate Plot
            </button>
            <button
              onClick={() => applyPreset('gold')}
              className="rounded-lg border border-neutral-800 bg-neutral-800/80 px-2.5 py-1 text-neutral-300 hover:text-white hover:border-neutral-700 transition"
            >
              📈 Gold &amp; Stocks
            </button>
            <button
              onClick={() => applyPreset('hajj')}
              className="rounded-lg border border-neutral-800 bg-neutral-800/80 px-2.5 py-1 text-neutral-300 hover:text-white hover:border-neutral-700 transition"
            >
              🕋 Hajj / Umrah
            </button>
          </div>
        </div>

        {/* MODE 1: TARGET GOAL CALCULATOR */}
        {calcMode === 'goal' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Input Parameters */}
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-400" />
                <span>Target Goal Parameters</span>
              </h3>

              <div>
                <label className="text-neutral-400 block mb-1">
                  Target Goal Amount ({currencyInfo.symbol} {activeCurrency})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-mono">
                    {currencyInfo.symbol}
                  </span>
                  <input
                    type="number"
                    value={targetGoalAmount}
                    onChange={(e) => setTargetGoalAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-800/80 py-2.5 pl-9 pr-4 font-mono text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 block mb-1">
                    Initial Deposit ({currencyInfo.symbol})
                  </label>
                  <input
                    type="number"
                    value={initialSavings}
                    onChange={(e) => setInitialSavings(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-800/80 p-2 font-mono text-sm text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">Target Horizon (Months)</label>
                  <input
                    type="number"
                    min="1"
                    max="360"
                    value={targetMonths}
                    onChange={(e) => setTargetMonths(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-800/80 p-2 font-mono text-sm text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-neutral-400 mb-1">
                  <span>Expected Annual Return (APY %)</span>
                  <span className="font-mono text-emerald-400 font-semibold">{annualRateAPY}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="0.5"
                  value={annualRateAPY}
                  onChange={(e) => setAnnualRateAPY(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
                  <span>0% (Cash / Lockbox)</span>
                  <span>5% (USD HYSA)</span>
                  <span>10-15% (National Savings / EGX / Mutual Funds)</span>
                  <span>20%+</span>
                </div>
              </div>
            </div>

            {/* Result Output Card */}
            <div className="flex flex-col justify-between rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-neutral-900 via-neutral-900 to-emerald-950/30 p-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Required Monthly Contribution
                </span>
                <div className="mt-2 font-mono font-extrabold text-3xl sm:text-4xl text-white">
                  {currencyInfo.symbol} {goalCalculation.requiredMonthly.toLocaleString()}
                  <span className="text-sm font-normal text-neutral-400"> / month</span>
                </div>
                <p className="mt-1 text-xs text-neutral-300">
                  Save this every month for {targetMonths} months to reach your goal of{' '}
                  <strong className="text-white">
                    {currencyInfo.symbol} {goalCalculation.futureTarget.toLocaleString()}
                  </strong>
                  .
                </p>

                <div className="mt-6 space-y-2.5 border-t border-neutral-800 pt-4 text-xs">
                  <div className="flex justify-between text-neutral-400">
                    <span>Principal Deposited:</span>
                    <span className="font-mono text-neutral-200">
                      {currencyInfo.symbol} {goalCalculation.totalDeposited.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Compound Interest Earned:</span>
                    <span className="font-mono text-emerald-400 font-semibold">
                      +{currencyInfo.symbol} {goalCalculation.totalInterestEarned.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Interest Share of Goal:</span>
                    <span className="font-mono text-indigo-400">
                      {(
                        (goalCalculation.totalInterestEarned /
                          (goalCalculation.futureTarget || 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Cross currency note */}
              <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 text-xs text-neutral-400 flex items-center justify-between">
                <span>Equivalent in USD:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  ${Math.round(goalCalculation.requiredMonthly / currentRate).toLocaleString()} / mo
                </span>
              </div>
            </div>
          </div>
        )}

        {/* MODE 2: COMPOUND WEALTH GROWTH */}
        {calcMode === 'compound' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Compound Inputs */}
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-400" />
                <span>Compound Growth Parameters</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 block mb-1">
                    Initial Balance ({currencyInfo.symbol})
                  </label>
                  <input
                    type="number"
                    value={startingPrincipal}
                    onChange={(e) =>
                      setStartingPrincipal(Math.max(0, parseFloat(e.target.value) || 0))
                    }
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-800/80 p-2 font-mono text-sm text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">
                    Monthly Contribution ({currencyInfo.symbol})
                  </label>
                  <input
                    type="number"
                    value={monthlyContribution}
                    onChange={(e) =>
                      setMonthlyContribution(Math.max(0, parseFloat(e.target.value) || 0))
                    }
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-800/80 p-2 font-mono text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 block mb-1">Investment Horizon (Years)</label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={growthYears}
                    onChange={(e) => setGrowthYears(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-800/80 p-2 font-mono text-sm text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">Annual APY (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={compoundAPY}
                    onChange={(e) => setCompoundAPY(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-800/80 p-2 font-mono text-sm text-white outline-none"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 text-[11px] text-neutral-400 flex items-start gap-2">
                <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  Compound growth models interest compounding monthly. In high-inflation markets like PKR or EGP, compounding at 12–16% preserves real purchasing power.
                </span>
              </div>
            </div>

            {/* Compound Output & Visual Bar */}
            <div className="flex flex-col justify-between rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-neutral-900 via-neutral-900 to-indigo-950/30 p-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Projected Future Wealth ({growthYears} Years)
                </span>
                <div className="mt-2 font-mono font-extrabold text-3xl sm:text-4xl text-white">
                  {currencyInfo.symbol} {compoundCalculation.finalBalance.toLocaleString()}
                </div>
                <div className="mt-1 text-xs text-neutral-300">
                  Total Deposits: {currencyInfo.symbol}{' '}
                  {compoundCalculation.finalDeposits.toLocaleString()} • Pure Growth:{' '}
                  <strong className="text-emerald-400 font-mono">
                    +{currencyInfo.symbol} {compoundCalculation.finalInterest.toLocaleString()}
                  </strong>
                </div>

                {/* Progress breakdown bar */}
                <div className="mt-6">
                  <div className="h-3 w-full rounded-full bg-neutral-800 overflow-hidden flex">
                    <div
                      style={{
                        width: `${
                          (compoundCalculation.finalDeposits /
                            (compoundCalculation.finalBalance || 1)) *
                          100
                        }%`,
                      }}
                      className="bg-indigo-500"
                      title="Your Deposits"
                    />
                    <div
                      style={{
                        width: `${
                          (compoundCalculation.finalInterest /
                            (compoundCalculation.finalBalance || 1)) *
                          100
                        }%`,
                      }}
                      className="bg-emerald-400"
                      title="Compound Interest"
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] text-neutral-400">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-indigo-500" />
                      <span>Deposits ({((compoundCalculation.finalDeposits / compoundCalculation.finalBalance) * 100).toFixed(0)}%)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      <span>Interest ({((compoundCalculation.finalInterest / compoundCalculation.finalBalance) * 100).toFixed(0)}%)</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Annual Milestone summary */}
              <div className="mt-6 border-t border-neutral-800 pt-3">
                <div className="text-[11px] text-neutral-400 font-medium mb-1.5">
                  Milestone Projections:
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  {compoundCalculation.points.slice(-3).map((pt) => (
                    <div
                      key={pt.year}
                      className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-2 font-mono"
                    >
                      <div className="text-[10px] text-neutral-500">Yr {pt.year}</div>
                      <div className="font-bold text-neutral-200 text-[11px] mt-0.5">
                        {currencyInfo.symbol} {Math.round(pt.balance / 1000)}k
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ACTIVE SAVINGS GOALS PORTFOLIO */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-400" />
              <span>Target Savings Portfolio &amp; Goals</span>
            </h3>
            <p className="text-xs text-neutral-400">
              Track progress, make top-up deposits, and link monthly targets to your Budget
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {savingsGoals.map((goal) => {
            const progressPct = Math.min(
              100,
              (goal.currentAmount / (goal.targetAmount || 1)) * 100
            );
            const remainingUSD = Math.max(0, goal.targetAmount - goal.currentAmount);

            return (
              <div
                key={goal.id}
                className="flex flex-col justify-between rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 shadow-sm hover:border-neutral-700 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-bold text-sm text-neutral-100 flex items-center gap-1.5">
                        <span>{goal.title}</span>
                        {goal.isCompleted && (
                          <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                            Achieved
                          </span>
                        )}
                      </h4>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        Category: {goal.category} • Target Date: {goal.targetDate}
                      </div>
                    </div>
                    <button
                      onClick={() => onDeleteSavingsGoal(goal.id)}
                      className="text-neutral-500 hover:text-rose-400 p-1 text-xs"
                      title="Delete goal"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1 font-mono">
                      <span className="text-emerald-400 font-semibold">
                        {formatCurrencyValue(goal.currentAmount, activeCurrency, currencyRates)}
                      </span>
                      <span className="text-neutral-400">
                        {formatCurrencyValue(goal.targetAmount, activeCurrency, currencyRates)}
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        style={{ width: `${progressPct}%` }}
                        className={`h-full transition-all duration-500 ${
                          goal.isCompleted ? 'bg-emerald-400' : 'bg-emerald-500'
                        }`}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] text-neutral-400">
                      <span>{progressPct.toFixed(1)}% funded</span>
                      <span>
                        Remaining: {formatCurrencyValue(remainingUSD, activeCurrency, currencyRates)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 flex flex-wrap items-center justify-between border-t border-neutral-800/80 pt-3 gap-2">
                  <div className="text-[11px] text-neutral-400 font-mono">
                    Allocated: {formatCurrencyValue(goal.monthlyContribution, activeCurrency, currencyRates)} / mo
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDepositToGoal(goal.id, 250)}
                      className="rounded-lg bg-neutral-800 px-2.5 py-1 text-xs font-medium text-emerald-300 hover:bg-neutral-700 transition"
                      title="Deposit $250 / equivalent to this goal"
                    >
                      + Top Up
                    </button>
                    <button
                      onClick={() => {
                        onSyncGoalToBudget(goal);
                        playChimeSound('success');
                      }}
                      className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition"
                      title="Sync this savings contribution to Monthly Budget"
                    >
                      Link to Budget
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Savings Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-5 shadow-2xl">
            <h3 className="font-bold text-white text-base pb-3 border-b border-neutral-800">
              Create New Savings Goal
            </h3>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Goal Title *</label>
                <input
                  type="text"
                  placeholder="e.g. New Plot Deposit, Gold Reserves, Car Downpayment"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 block mb-1">
                    Target Amount ({currencyInfo.symbol}) *
                  </label>
                  <input
                    type="number"
                    value={newTargetAmount}
                    onChange={(e) => setNewTargetAmount(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">Current Saved ({currencyInfo.symbol})</label>
                  <input
                    type="number"
                    value={newCurrentAmount}
                    onChange={(e) => setNewCurrentAmount(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 block mb-1">Monthly Deposit ({currencyInfo.symbol})</label>
                  <input
                    type="number"
                    value={newMonthlyDeposit}
                    onChange={(e) => setNewMonthlyDeposit(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">Target Date</label>
                  <input
                    type="date"
                    value={newTargetDate}
                    onChange={(e) => setNewTargetDate(e.target.value)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as SavingsGoal['category'])}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none"
                  >
                    <option value="Emergency Fund">Emergency Fund</option>
                    <option value="House & Property">House &amp; Property</option>
                    <option value="Gold & Investment">Gold &amp; Investment</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="Hajj & Travel">Hajj &amp; Travel</option>
                    <option value="Retirement">Retirement</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">Expected APY (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newApy}
                    onChange={(e) => setNewApy(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Notes / Target Details</label>
                <textarea
                  rows={2}
                  placeholder="Details regarding institution, certificate or target..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full resize-none rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-neutral-800 pt-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGoalSubmit}
                className="rounded-lg bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-emerald-400"
              >
                Save Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
