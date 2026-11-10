import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Plus,
  DollarSign,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  ArrowRight,
  Filter,
  Check,
  CalendarDays,
  Receipt,
  Wallet,
  PiggyBank,
  Sparkles,
} from 'lucide-react';
import {
  BudgetItem,
  BudgetBucket,
  ExpenseCategory,
  CategoryAllocation,
  SalaryConfig,
  SupportedCurrency,
} from '../types';
import { exportExpensesToCSV } from '../services/exportService';
import { formatCurrencyValue } from '../services/currency';

interface BudgetViewProps {
  budgetItems: BudgetItem[];
  onAddBudgetItem: (item: Omit<BudgetItem, 'id'>) => void;
  onUpdateBudgetItem: (id: string, updates: Partial<BudgetItem>) => void;
  onDeleteBudgetItem: (id: string) => void;
  categoryLimits: CategoryAllocation[];
  netMonthlyIncome: number;
  searchQuery: string;
  activeCurrency?: SupportedCurrency;
  currencyRates?: Record<SupportedCurrency, number>;
  salaryConfig?: SalaryConfig;
}

const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  Housing: '🏠',
  Utilities: '⚡',
  Groceries: '🛒',
  'Dining & Food': '🍔',
  Transportation: '🚗',
  Healthcare: '🩺',
  Entertainment: '🍿',
  Subscriptions: '📺',
  'Debt & Loans': '💳',
  'Savings & Investments': '📈',
  Shopping: '🛍️',
  'Personal Care': '✨',
  Other: '📦',
};

export interface DailySpendGroup {
  key: string;
  dayLabel: string;
  sortKey: number;
  items: BudgetItem[];
  total: number;
}

export const BudgetView: React.FC<BudgetViewProps> = ({
  budgetItems,
  onAddBudgetItem,
  onUpdateBudgetItem,
  onDeleteBudgetItem,
  categoryLimits,
  netMonthlyIncome,
  searchQuery,
  activeCurrency = 'USD',
  currencyRates = { USD: 1, PKR: 278.5, EGP: 49.3, EUR: 0.92, GBP: 0.79 },
  salaryConfig,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterBucket, setFilterBucket] = useState<BudgetBucket | 'all'>('all');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [showRecurringOnly, setShowRecurringOnly] = useState(false);
  const [activeBudgetTab, setActiveBudgetTab] = useState<'audit' | 'timeline' | 'recurring'>('audit');

  // Day-by-Day Chronological Spend Ledger
  const dailySpendTimeline: DailySpendGroup[] = useMemo(() => {
    const map: Record<string, DailySpendGroup> = {};

    budgetItems.forEach((b) => {
      let key = b.date;
      let dayLabel = b.date;
      const dayNum = parseInt(b.date.split('-')[2] || '1', 10);
      let sortKey = dayNum;

      if (b.isRecurring && b.dueDate) {
        key = `rec-day-${b.dueDate}`;
        dayLabel = `Day ${b.dueDate} of Month (Recurring Bill)`;
        sortKey = b.dueDate;
      }

      if (!map[key]) {
        map[key] = { key, dayLabel, sortKey, items: [], total: 0 };
      }
      map[key].items.push(b);
      map[key].total += b.amount;
    });

    return Object.values(map).sort((a, b) => a.sortKey - b.sortKey);
  }, [budgetItems]);

  // New item form
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number>(50);
  const [category, setCategory] = useState<ExpenseCategory>('Groceries');
  const [bucket, setBucket] = useState<BudgetBucket>('need');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [dueDate, setDueDate] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<BudgetItem['paymentMethod']>('Credit Card');
  const [notes, setNotes] = useState('');

  // Calculations
  const totalSpent = budgetItems.reduce((acc, curr) => acc + curr.amount, 0);
  const totalNeeds = budgetItems
    .filter((b) => b.bucket === 'need')
    .reduce((acc, curr) => acc + curr.amount, 0);
  const totalWants = budgetItems
    .filter((b) => b.bucket === 'want')
    .reduce((acc, curr) => acc + curr.amount, 0);
  const totalSavings = budgetItems
    .filter((b) => b.bucket === 'savings')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const remainingBudget = Math.max(0, netMonthlyIncome - totalSpent);
  const savingsRate = netMonthlyIncome > 0 ? (totalSavings / netMonthlyIncome) * 100 : 0;

  // 50/30/20 Targets based on Net Income
  const targetNeeds = netMonthlyIncome * 0.5;
  const targetWants = netMonthlyIncome * 0.3;
  const targetSavings = netMonthlyIncome * 0.2;

  // Recurring bills
  const recurringBills = budgetItems.filter((b) => b.isRecurring);

  // Filtered transactions
  const filteredItems = budgetItems.filter((item) => {
    if (showRecurringOnly && !item.isRecurring) return false;
    if (filterBucket !== 'all' && item.bucket !== filterBucket) return false;
    if (activeCategoryFilter !== 'all' && item.category !== activeCategoryFilter) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.notes && item.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCreateExpense = () => {
    if (!title.trim() || !amount) return;

    onAddBudgetItem({
      title: title.trim(),
      amount,
      category,
      bucket,
      date,
      isRecurring,
      dueDate: isRecurring ? dueDate : undefined,
      isPaid: false,
      paymentMethod,
      notes: notes.trim() || undefined,
    });

    setTitle('');
    setAmount(50);
    setNotes('');
    setShowAddModal(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <PieChart className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Monthly Budget &amp; Expense Planner</span>
            </h2>
            <p className="text-xs text-neutral-400">
              50/30/20 Rule Analysis, recurring bills scheduler &amp; real-time cash flow
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportExpensesToCSV(budgetItems)}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800/80 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white transition"
            title="Download CSV for Excel / Google Sheets"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 shadow-sm transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* DIRECT CASH FLOW AUDIT BANNER: SALARY • EXPENSES • SAVINGS */}
      <div className="mb-8 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-neutral-900 via-neutral-900 to-emerald-950/20 p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-neutral-800">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-400" />
              <span>Cash Flow Audit: Salary • Daily Spend • Savings</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Comprehensive breakdown of salary income, day-by-day expenditures, and net monthly savings
            </p>
          </div>


          {/* Sub-view switcher */}
          <div className="flex items-center rounded-xl border border-neutral-800 bg-neutral-950 p-1 text-xs">
            <button
              onClick={() => setActiveBudgetTab('audit')}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                activeBudgetTab === 'audit'
                  ? 'bg-neutral-800 text-white font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Overview Audit
            </button>
            <button
              onClick={() => setActiveBudgetTab('timeline')}
              className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 ${
                activeBudgetTab === 'timeline'
                  ? 'bg-neutral-800 text-emerald-300 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5 text-emerald-400" />
              <span>Daily Spend Timeline</span>
            </button>
          </div>
        </div>

        {/* 3 Core Answer Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Monthly Salary Income */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
            <div className="text-xs text-neutral-400 font-medium flex items-center gap-1.5 mb-1">
              <Wallet className="h-4 w-4 text-emerald-400" />
              <span>1. Net Salary Income</span>
            </div>
            <div className="font-mono font-bold text-xl sm:text-2xl text-emerald-400">
              {formatCurrencyValue(netMonthlyIncome, activeCurrency, currencyRates)}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              Per Paycheck: ~{formatCurrencyValue(netMonthlyIncome / 2, activeCurrency, currencyRates)} (1st &amp; 15th deposit)
            </div>
          </div>

          {/* 2. Total Expenditure */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
            <div className="text-xs text-neutral-400 font-medium flex items-center gap-1.5 mb-1">
              <Receipt className="h-4 w-4 text-rose-400" />
              <span>2. Total Expenditures</span>
            </div>
            <div className="font-mono font-bold text-xl sm:text-2xl text-rose-400">
              {formatCurrencyValue(totalSpent, activeCurrency, currencyRates)}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              Across {budgetItems.length} transactions in {dailySpendTimeline.length} calendar days
            </div>
          </div>

          {/* 3. Total Savings */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
            <div className="text-xs text-neutral-400 font-medium flex items-center gap-1.5 mb-1">
              <PiggyBank className="h-4 w-4 text-indigo-400" />
              <span>3. Total Savings Retained</span>
            </div>
            <div className="font-mono font-bold text-xl sm:text-2xl text-indigo-400">
              {formatCurrencyValue(totalSavings, activeCurrency, currencyRates)}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              Savings Rate: <strong className="text-emerald-400 font-mono">{savingsRate.toFixed(1)}%</strong> of salary
            </div>
          </div>
        </div>
      </div>

      {/* VIEW A: DAILY SPEND TIMELINE */}
      {activeBudgetTab === 'timeline' && (
        <div className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-xl animate-in fade-in">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-emerald-400" />
                <span>Daily Expense Timeline: Date, Item &amp; Spend Breakdown</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Chronological day-by-day record of every transaction, recurring bill &amp; expenditure
              </p>
            </div>
            <span className="font-mono text-xs text-neutral-300">
              Total Outflows: {formatCurrencyValue(totalSpent, activeCurrency, currencyRates)}
            </span>
          </div>


          <div className="space-y-4">
            {dailySpendTimeline.map((group: DailySpendGroup) => (
              <div
                key={group.key}
                className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4"
              >
                {/* Date Header & Day Total */}
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-neutral-800/80">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold border border-emerald-500/30">
                      {group.sortKey}
                    </span>
                    <span className="font-semibold text-sm text-neutral-200">
                      {group.dayLabel}
                    </span>
                  </div>
                  <div className="font-mono text-xs font-bold text-rose-400">
                    Day Total: {formatCurrencyValue(group.total, activeCurrency, currencyRates)}
                  </div>
                </div>

                {/* Items on that day */}
                <div className="space-y-2">
                  {group.items.map((item: BudgetItem) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg bg-neutral-900/60 p-2.5 text-xs border border-neutral-800/60 hover:border-neutral-700 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-base">{CATEGORY_ICONS[item.category] || '💸'}</span>
                        <div>
                          <div className="font-semibold text-neutral-100 flex items-center gap-2">
                            <span>{item.title}</span>
                            {item.isRecurring && (
                              <span className="rounded bg-amber-500/10 px-1.5 py-0.2 text-[9px] font-semibold text-amber-400 border border-amber-500/20">
                                Recurring
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-400 mt-0.5">
                            Category: {item.category} • Method: {item.paymentMethod} • Bucket: {item.bucket.toUpperCase()}
                            {item.notes && <span className="italic ml-1">({item.notes})</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-sm text-neutral-200">
                          {formatCurrencyValue(item.amount, activeCurrency, currencyRates)}
                        </span>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-medium border ${
                            item.isPaid
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {item.isPaid ? 'Paid' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards: Net Income, Total Spent, Remaining, Savings Rate */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Net Monthly Income */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 shadow-lg">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Net Monthly Income
          </span>
          <div className="mt-2 font-mono font-bold text-2xl sm:text-3xl text-emerald-400">
            {formatCurrencyValue(netMonthlyIncome, activeCurrency, currencyRates)}
          </div>
          <div className="mt-1 text-[11px] text-neutral-400">
            Auto-synced with Net Salary calculator
          </div>
        </div>

        {/* Total Expenses Spent */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 shadow-lg">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Total Spent This Month
          </span>
          <div className="mt-2 font-mono font-bold text-2xl sm:text-3xl text-rose-400">
            {formatCurrencyValue(totalSpent, activeCurrency, currencyRates)}
          </div>
          <div className="mt-1 text-[11px] text-neutral-400">
            {((totalSpent / (netMonthlyIncome || 1)) * 100).toFixed(1)}% of net income
          </div>
        </div>

        {/* Remaining Unallocated Cash */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 shadow-lg">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Remaining Cash Cushion
          </span>
          <div className="mt-2 font-mono font-bold text-2xl sm:text-3xl text-neutral-100">
            {formatCurrencyValue(remainingBudget, activeCurrency, currencyRates)}
          </div>
          <div className="mt-1 text-[11px] text-neutral-400">
            Available for additional savings or buffer
          </div>
        </div>

        {/* Savings Rate */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 shadow-lg">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Monthly Savings
          </span>
          <div className="mt-2 font-mono font-bold text-2xl sm:text-3xl text-indigo-400">
            {formatCurrencyValue(totalSavings, activeCurrency, currencyRates)}
          </div>
          <div className="mt-1 text-[11px] text-neutral-400 font-mono">
            {savingsRate.toFixed(1)}% savings rate achieved
          </div>
        </div>

      </div>

      {/* 50 / 30 / 20 Budget Rule Breakdown */}
      <div className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-100">
              50 / 30 / 20 Budget Health Score
            </h3>
            <p className="text-xs text-neutral-400">
              Target: 50% Needs, 30% Wants, 20% Savings &amp; Debt Paydown
            </p>
          </div>
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
            Health: Optimal
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Needs */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-neutral-200">Needs (Target 50%)</span>
              <span className="font-mono text-emerald-400">
                ${Math.round(totalNeeds).toLocaleString()} / ${Math.round(targetNeeds).toLocaleString()}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
              <div
                style={{
                  width: `${Math.min(100, (totalNeeds / (targetNeeds || 1)) * 100)}%`,
                }}
                className={`h-full ${
                  totalNeeds > targetNeeds ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
              />
            </div>
            <div className="mt-2 text-[10px] text-neutral-400">
              Housing, Groceries, Utilities, Transit, Healthcare
            </div>
          </div>

          {/* Wants */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-neutral-200">Wants (Target 30%)</span>
              <span className="font-mono text-amber-400">
                ${Math.round(totalWants).toLocaleString()} / ${Math.round(targetWants).toLocaleString()}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
              <div
                style={{
                  width: `${Math.min(100, (totalWants / (targetWants || 1)) * 100)}%`,
                }}
                className={`h-full ${
                  totalWants > targetWants ? 'bg-rose-500' : 'bg-amber-500'
                }`}
              />
            </div>
            <div className="mt-2 text-[10px] text-neutral-400">
              Dining, Entertainment, Shopping, Streaming Subscriptions
            </div>
          </div>

          {/* Savings */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-neutral-200">Savings &amp; Debt (Target 20%)</span>
              <span className="font-mono text-indigo-400">
                ${Math.round(totalSavings).toLocaleString()} / ${Math.round(targetSavings).toLocaleString()}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
              <div
                style={{
                  width: `${Math.min(100, (totalSavings / (targetSavings || 1)) * 100)}%`,
                }}
                className="h-full bg-indigo-500"
              />
            </div>
            <div className="mt-2 text-[10px] text-neutral-400">
              Index funds, emergency fund reserves &amp; extra loan principal
            </div>
          </div>
        </div>
      </div>

      {/* Recurring Bills & Subscriptions Manager */}
      <div className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-amber-400" />
              <span>Recurring Bills &amp; Subscriptions</span>
            </h3>
            <p className="text-xs text-neutral-400">
              Auto-tracked for smart due date notifications and calendar sync
            </p>
          </div>
          <span className="text-xs font-mono text-neutral-300">
            Total Recurring: ${recurringBills.reduce((acc, c) => acc + c.amount, 0).toLocaleString()} / mo
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recurringBills.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950/60 p-3.5 text-xs"
            >
              <div>
                <div className="font-semibold text-neutral-100 flex items-center gap-1.5">
                  <span>{CATEGORY_ICONS[b.category] || '💳'}</span>
                  <span>{b.title}</span>
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  Due: Day {b.dueDate || 1} • {b.paymentMethod}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-sm text-neutral-200">
                  ${b.amount}
                </span>
                <button
                  onClick={() => onUpdateBudgetItem(b.id, { isPaid: !b.isPaid })}
                  className={`rounded-lg px-2 py-1 text-[11px] font-medium transition ${
                    b.isPaid
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                  }`}
                >
                  {b.isPaid ? 'Paid' : 'Mark Paid'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions Ledger */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg">
        {/* Ledger Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-800 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-neutral-100">
              Transactions &amp; Expense Log
            </h3>
            <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400 font-mono">
              {filteredItems.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Bucket */}
            <div className="flex rounded-lg border border-neutral-800 bg-neutral-900 p-0.5 text-xs">
              {(['all', 'need', 'want', 'savings'] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => setFilterBucket(b)}
                  className={`rounded px-2.5 py-1 capitalize transition ${
                    filterBucket === b
                      ? 'bg-neutral-800 text-white font-medium'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>

            {/* Recurring toggle */}
            <button
              onClick={() => setShowRecurringOnly(!showRecurringOnly)}
              className={`rounded-lg border px-2.5 py-1 text-xs transition ${
                showRecurringOnly
                  ? 'border-amber-500/50 bg-amber-500/20 text-amber-300 font-medium'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              Recurring Only
            </button>
          </div>
        </div>

        {/* Transactions Table / List */}
        <div className="space-y-2">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              No transactions match your current filter.
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-3 text-xs hover:border-neutral-700 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{CATEGORY_ICONS[item.category] || '💸'}</span>
                  <div>
                    <div className="font-semibold text-neutral-100 flex items-center gap-2">
                      <span>{item.title}</span>
                      {item.isRecurring && (
                        <span className="rounded bg-amber-500/10 px-1.5 py-0.2 text-[9px] font-semibold text-amber-400 border border-amber-500/20">
                          Recurring
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-neutral-400 flex items-center gap-2 mt-0.5">
                      <span>{item.category}</span>
                      <span>•</span>
                      <span className="capitalize">{item.bucket}</span>
                      <span>•</span>
                      <span>{item.date}</span>
                      {item.paymentMethod && <span>• {item.paymentMethod}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sm text-neutral-100">
                    ${item.amount.toLocaleString()}
                  </span>
                  <button
                    onClick={() => onDeleteBudgetItem(item.id)}
                    className="text-neutral-500 hover:text-rose-400 p-1"
                    title="Delete record"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="font-bold text-white text-base">Add New Expense / Bill</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Expense Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Trader Joe's Groceries, Netflix, Electric Bill"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 block mb-1">Amount ($) *</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">Date *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none"
                  >
                    {Object.keys(CATEGORY_ICONS).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">50/30/20 Bucket</label>
                  <select
                    value={bucket}
                    onChange={(e) => setBucket(e.target.value as BudgetBucket)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none"
                  >
                    <option value="need">Need (Essentials)</option>
                    <option value="want">Want (Lifestyle)</option>
                    <option value="savings">Savings / Debt</option>
                  </select>
                </div>
              </div>

              {/* Recurring Bill Checkbox */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="rounded border-neutral-700 bg-neutral-800 text-amber-500"
                  />
                  <span className="font-semibold text-neutral-200">
                    Recurring Monthly Bill / Subscription
                  </span>
                </label>
                {isRecurring && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <span className="text-neutral-400">Day of month due:</span>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={dueDate}
                      onChange={(e) =>
                        setDueDate(Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))
                      }
                      className="w-16 rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-white text-center"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as BudgetItem['paymentMethod'])}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none"
                >
                  <option value="Cash">Cash (PKR)</option>
                  <option value="Raast">Raast ID (State Bank Instant)</option>
                  <option value="EasyPaisa">EasyPaisa</option>
                  <option value="JazzCash">JazzCash</option>
                  <option value="Nayapay">Nayapay</option>
                  <option value="Sadapay">Sadapay</option>
                  <option value="Bank Transfer">Bank Transfer (1Link / HBL / Meezan / MCB)</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Auto-Pay">Auto-Pay</option>
                </select>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Notes / Tags</label>
                <input
                  type="text"
                  placeholder="Optional memo..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none"
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
                onClick={handleCreateExpense}
                className="rounded-lg bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-emerald-400"
              >
                Save Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
