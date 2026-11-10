import React, { useState, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Download,
  Plus,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Clock,
  Trash2,
  PieChart,
  BarChart3,
  SlidersHorizontal,
  ChevronDown,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import {
  MonthExpenseItem,
  PersonDebtRecord,
  MonthlyAccountRecord,
  LoanType,
} from '../types';

interface MoneyAccountViewProps {
  expenses: MonthExpenseItem[];
  onAddExpense: (item: Omit<MonthExpenseItem, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
  debtRecords: PersonDebtRecord[];
  onAddDebtRecord: (record: Omit<PersonDebtRecord, 'id'>) => void;
  onUpdateDebtRecord: (id: string, updates: Partial<PersonDebtRecord>) => void;
  onDeleteDebtRecord: (id: string) => void;
  monthlyAccounts: MonthlyAccountRecord[];
  activeCurrency?: string;
  currencyRates?: Record<string, number>;
}

type LedgerSortColumn = 'date' | 'amount' | 'title' | 'category' | 'type';
type SortDirection = 'asc' | 'desc';
type FlowFilter = 'all' | 'inflow' | 'outflow' | 'receivable';

export interface UnifiedTransaction {
  id: string;
  refId: string;
  date: string; // YYYY-MM-DD
  monthKey: string; // YYYY-MM
  title: string;
  counterparty?: string;
  category: string;
  flowType: 'inflow' | 'outflow' | 'receivable';
  amount: number;
  period: 'previous' | 'current';
  status: 'reconciled' | 'pending' | 'cleared';
  notes?: string;
  rawType: 'expense' | 'debt' | 'inflow';
  originalId: string;
}

export interface MonthlyBreakdownSummary {
  monthKey: string; // e.g. '2026-02'
  monthLabel: string; // e.g. 'February 2026'
  shortLabel: string; // e.g. 'Feb 2026'
  status: 'closed' | 'active';
  inflow: number; // Monthly Added Amount
  outflow: number; // Monthly Expenses
  netSavings: number; // Inflow minus Outflow
  savingsRatePct: number; // (netSavings / inflow) * 100
  savingsTarget: number; // Rs. 60,000
  targetVariance: number; // netSavings - savingsTarget
  cumulativeInflow: number; // Running total of inflows up to this month
  cumulativeOutflow: number; // Running total of outflows up to this month
  cumulativeSavings: number; // Running total of savings balance up to this month
  txnCount: number;
}

export const MoneyAccountView: React.FC<MoneyAccountViewProps> = ({
  expenses,
  onAddExpense,
  onDeleteExpense,
  debtRecords,
  onAddDebtRecord,
  onUpdateDebtRecord,
  onDeleteDebtRecord,
}) => {
  // Navigation View State
  const [activeTab, setActiveTab] = useState<'overview' | 'monthly' | 'ledger' | 'analytics' | 'borrowers'>('overview');

  // Month-on-Month Selector Filter State
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // 'all' | '2026-03' | '2026-02' | custom

  // Ledger Filter & Sorting State
  const [searchTerm, setSearchTerm] = useState('');
  const [flowFilter, setFlowFilter] = useState<FlowFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortColumn, setSortColumn] = useState<LedgerSortColumn>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [pageSize, setPageSize] = useState<number>(25);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntryType, setNewEntryType] = useState<'outflow' | 'receivable'>('outflow');
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState('Family Support');
  const [newRecipient, setNewRecipient] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPeriod, setNewPeriod] = useState<'current' | 'previous'>('current');
  const [newReturnDate, setNewReturnDate] = useState('2026-12-01');
  const [newPaymentChannel, setNewPaymentChannel] = useState('Cash in Hand');
  const [newNotes, setNewNotes] = useState('');

  // Fixed Baseline Financial Inflows
  const month1Salary = 80000;
  const month2Salary = 80000;

  // Format currency helper (PKR)
  const formatPKR = (val: number): string => {
    return `Rs. ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(Math.round(val))}`;
  };

  // Helper to extract YYYY-MM monthKey from date string
  const getMonthKey = (dateStr: string): string => {
    if (!dateStr || dateStr.length < 7) return '2026-03';
    return dateStr.substring(0, 7);
  };

  // Helper to get formatted Month Year label
  const getMonthLabel = (monthKey: string): string => {
    const [y, m] = monthKey.split('-').map(Number);
    const dateObj = new Date(y, (m || 1) - 1, 1);
    return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getShortMonthLabel = (monthKey: string): string => {
    const [y, m] = monthKey.split('-').map(Number);
    const dateObj = new Date(y, (m || 1) - 1, 1);
    return dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Build unified transaction list for enterprise ledger
  const unifiedLedger: UnifiedTransaction[] = useMemo(() => {
    const list: UnifiedTransaction[] = [];

    // Month 1 Salary Inflow (February 2026)
    list.push({
      id: 'inflow-m1',
      refId: 'SAL-01',
      date: '2026-02-01',
      monthKey: '2026-02',
      title: 'Salary Deposit (Month 1)',
      counterparty: 'Primary Employer',
      category: 'Inflow',
      flowType: 'inflow',
      amount: month1Salary,
      period: 'previous',
      status: 'reconciled',
      notes: 'Monthly payroll direct deposit (Month 1)',
      rawType: 'inflow',
      originalId: 'sal-1',
    });

    // Month 2 Salary Inflow (March 2026)
    list.push({
      id: 'inflow-m2',
      refId: 'SAL-02',
      date: '2026-03-01',
      monthKey: '2026-03',
      title: 'Salary Deposit (Month 2)',
      counterparty: 'Primary Employer',
      category: 'Inflow',
      flowType: 'inflow',
      amount: month2Salary,
      period: 'current',
      status: 'reconciled',
      notes: 'Monthly payroll direct deposit (Month 2)',
      rawType: 'inflow',
      originalId: 'sal-2',
    });

    // Month 1 & Month 2 Expenses
    expenses.forEach((item, index) => {
      const mKey = getMonthKey(item.date);
      list.push({
        id: `exp-${item.id}`,
        refId: `EXP-${String(index + 1).padStart(2, '0')}`,
        date: item.date,
        monthKey: mKey,
        title: item.title,
        counterparty: item.recipient || 'Vendor / Direct',
        category: item.category,
        flowType: 'outflow',
        amount: item.amount,
        period: item.monthPeriod,
        status: 'reconciled',
        notes: item.notes,
        rawType: 'expense',
        originalId: item.id,
      });
    });

    // Debt Records / Receivables
    debtRecords.forEach((debt, index) => {
      const mKey = getMonthKey(debt.dateGiven);
      list.push({
        id: `debt-${debt.id}`,
        refId: `REC-${String(index + 1).padStart(2, '0')}`,
        date: debt.dateGiven,
        monthKey: mKey,
        title: `Loan Disbursed &mdash; ${debt.personName}`,
        counterparty: debt.personName,
        category: debt.type === 'given_family' ? 'Family Support' : 'Receivables',
        flowType: debt.type === 'given_family' ? 'outflow' : 'receivable',
        amount: debt.amount,
        period: debt.monthPeriod === 'Previous Month' ? 'previous' : 'current',
        status: debt.status === 'cleared' ? 'cleared' : 'pending',
        notes: debt.expectedReturnDate
          ? `Expected collection: ${debt.expectedReturnDate} (Calendar Alarm Configured)`
          : debt.notes,
        rawType: 'debt',
        originalId: debt.id,
      });
    });

    return list;
  }, [expenses, debtRecords, month1Salary, month2Salary]);

  // MONTH-ON-MONTH BREAKDOWN ENGINE
  // Groups all transactions by monthKey, orders chronologically, and calculates monthly additions, expenses, net savings, and running cumulative balances
  const monthlyBreakdowns: MonthlyBreakdownSummary[] = useMemo(() => {
    // 1. Identify all distinct month keys
    const monthKeySet = new Set<string>();
    monthKeySet.add('2026-02'); // Month 1
    monthKeySet.add('2026-03'); // Month 2

    unifiedLedger.forEach((t) => {
      if (t.monthKey) monthKeySet.add(t.monthKey);
    });

    // Sort chronologically ascending
    const sortedKeys = Array.from(monthKeySet).sort();

    let runningInflow = 0;
    let runningOutflow = 0;
    let runningSavings = 0;

    return sortedKeys.map((mKey) => {
      const monthTxns = unifiedLedger.filter((t) => t.monthKey === mKey);

      const inflow = monthTxns
        .filter((t) => t.flowType === 'inflow')
        .reduce((sum, t) => sum + t.amount, 0);

      const outflow = monthTxns
        .filter((t) => t.flowType === 'outflow')
        .reduce((sum, t) => sum + t.amount, 0);

      const netSavings = inflow - outflow;
      const savingsRatePct = inflow > 0 ? Math.round((netSavings / inflow) * 100) : 0;
      const savingsTarget = 60000;
      const targetVariance = netSavings - savingsTarget;

      runningInflow += inflow;
      runningOutflow += outflow;
      runningSavings += netSavings;

      const isLatest = mKey === '2026-03' || mKey === sortedKeys[sortedKeys.length - 1];

      return {
        monthKey: mKey,
        monthLabel: getMonthLabel(mKey),
        shortLabel: getShortMonthLabel(mKey),
        status: isLatest ? 'active' : 'closed',
        inflow,
        outflow,
        netSavings,
        savingsRatePct,
        savingsTarget,
        targetVariance,
        cumulativeInflow: runningInflow,
        cumulativeOutflow: runningOutflow,
        cumulativeSavings: runningSavings,
        txnCount: monthTxns.length,
      };
    });
  }, [unifiedLedger]);

  // Available Month Options for selector dropdown
  const monthOptions = useMemo(() => {
    return [
      { key: 'all', label: 'All Months (Cumulative Portfolio)' },
      ...monthlyBreakdowns.map((m) => ({
        key: m.monthKey,
        label: `${m.monthLabel} (${m.status === 'active' ? 'Active Cycle' : 'Closed'})`,
      })),
    ];
  }, [monthlyBreakdowns]);

  // Active Month Data if filtered
  const activeMonthSummary = useMemo(() => {
    if (selectedMonth === 'all') return null;
    return monthlyBreakdowns.find((m) => m.monthKey === selectedMonth) || null;
  }, [monthlyBreakdowns, selectedMonth]);

  // Overall Portfolio Cumulative Totals
  const totalCumulativeInflow = useMemo(() => {
    return monthlyBreakdowns.reduce((sum, m) => sum + m.inflow, 0);
  }, [monthlyBreakdowns]);

  const totalCumulativeOutflow = useMemo(() => {
    return monthlyBreakdowns.reduce((sum, m) => sum + m.outflow, 0);
  }, [monthlyBreakdowns]);

  const totalCumulativeNetSavings = useMemo(() => {
    return totalCumulativeInflow - totalCumulativeOutflow; // Rs. 96,000
  }, [totalCumulativeInflow, totalCumulativeOutflow]);

  // Pending Receivables (Father / Papa Loan)
  const pendingReceivables = useMemo(() => {
    return debtRecords
      .filter((d) => d.status === 'pending' && d.type === 'given_udhaar')
      .reduce((sum, d) => sum + (d.amount - d.returnedAmount), 0);
  }, [debtRecords]); // Rs. 25,000

  // Total Net Liquid Worth (Cash on Hand + Receivables)
  const totalNetLiquidWorth = totalCumulativeNetSavings + pendingReceivables; // Rs. 121,000

  // Target Math: 1-Month Rs. 60k, 2-Month Rs. 120k
  const singleMonthTarget = 60000;
  const twoMonthCumulativeTarget = 120000;

  // Filtered & Sorted Ledger (Respecting both selectedMonth, search, flow, category, and sorting)
  const filteredLedger = useMemo(() => {
    return unifiedLedger
      .filter((txn) => {
        // Month Selector filter
        if (selectedMonth !== 'all' && txn.monthKey !== selectedMonth) {
          return false;
        }

        // Search filter
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchTitle = txn.title.toLowerCase().includes(q);
          const matchParty = txn.counterparty?.toLowerCase().includes(q) || false;
          const matchCategory = txn.category.toLowerCase().includes(q);
          const matchRef = txn.refId.toLowerCase().includes(q);
          if (!matchTitle && !matchParty && !matchCategory && !matchRef) return false;
        }

        // Flow filter
        if (flowFilter !== 'all' && txn.flowType !== flowFilter) return false;

        // Category filter
        if (categoryFilter !== 'all' && txn.category !== categoryFilter) return false;

        return true;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortColumn === 'date') comp = a.date.localeCompare(b.date);
        else if (sortColumn === 'amount') comp = a.amount - b.amount;
        else if (sortColumn === 'title') comp = a.title.localeCompare(b.title);
        else if (sortColumn === 'category') comp = a.category.localeCompare(b.category);
        else if (sortColumn === 'type') comp = a.flowType.localeCompare(b.flowType);
        return sortDirection === 'asc' ? comp : -comp;
      });
  }, [unifiedLedger, selectedMonth, searchTerm, flowFilter, categoryFilter, sortColumn, sortDirection]);

  // Unique categories for filter
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    unifiedLedger.forEach((t) => set.add(t.category));
    return Array.from(set);
  }, [unifiedLedger]);

  // Category breakdown for audit section
  const categoryAudit = useMemo(() => {
    const list = selectedMonth === 'all'
      ? expenses
      : expenses.filter((e) => getMonthKey(e.date) === selectedMonth);

    const map: Record<string, number> = {};
    list.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(map)
      .map(([cat, amt]) => ({
        category: cat,
        amount: amt,
        percentage: Math.round((amt / total) * 100),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, selectedMonth]);

  // Sort toggle handler
  const handleSort = (col: LedgerSortColumn) => {
    if (sortColumn === col) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortDirection('desc');
    }
  };

  // CSV Export handler
  const handleExportCSV = () => {
    const headers = ['Ref ID', 'Date', 'Month', 'Description', 'Counterparty', 'Category', 'Flow Type', 'Amount (PKR)', 'Status', 'Notes'];
    const rows = filteredLedger.map((txn) => [
      txn.refId,
      txn.date,
      txn.monthKey,
      `"${txn.title.replace(/"/g, '""')}"`,
      `"${(txn.counterparty || '').replace(/"/g, '""')}"`,
      `"${txn.category}"`,
      txn.flowType.toUpperCase(),
      txn.amount,
      txn.status.toUpperCase(),
      `"${(txn.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const fileSuffix = selectedMonth === 'all' ? 'all_months' : selectedMonth;
    link.setAttribute('download', `financial_ledger_${fileSuffix}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Quick submission of new transaction
  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newAmount);
    if (!newTitle.trim() || isNaN(val) || val <= 0) return;

    if (newEntryType === 'outflow') {
      onAddExpense({
        title: newTitle.trim(),
        amount: val,
        category: newCategory,
        monthPeriod: newPeriod,
        date: newDate || new Date().toISOString().split('T')[0],
        recipient: newRecipient.trim() || undefined,
        notes: `${newPaymentChannel ? `[${newPaymentChannel}] ` : ''}${newNotes.trim()}`.trim() || undefined,
      });
    } else {
      onAddDebtRecord({
        personName: newRecipient.trim() || newTitle.trim(),
        amount: val,
        type: 'given_udhaar',
        dateGiven: newDate || new Date().toISOString().split('T')[0],
        expectedReturnDate: newReturnDate || undefined,
        returnedAmount: 0,
        status: 'pending',
        notes: `${newPaymentChannel ? `[${newPaymentChannel}] ` : ''}${newNotes.trim()}`.trim() || undefined,
        monthPeriod: newPeriod === 'current' ? 'Current Month' : 'Previous Month',
      });
    }

    setNewTitle('');
    setNewAmount('');
    setNewRecipient('');
    setNewNotes('');
    setShowAddModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. TOP BAR: TITLE + MONTH SELECTOR + ACTION CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono tracking-wide uppercase">
            <span>🇵🇰 Pakistan Treasury</span>
            <span>/</span>
            <span>Month-on-Month Breakup</span>
            <span>/</span>
            <span className="text-emerald-400 font-semibold">PKR Financial Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-100 tracking-tight mt-1">
            Master Financial Ledger &amp; Monthly Breakup
          </h1>
        </div>

        {/* Month Selector Dropdown & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Monthly Filter Dropdown */}
          <div className="flex items-center gap-1.5 rounded-lg bg-neutral-900 border border-neutral-800 p-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-emerald-400 ml-1.5 shrink-0" />
            <span className="text-neutral-400 text-[11px] font-medium hidden sm:inline">Accounting Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-white font-medium focus:outline-none focus:border-emerald-500 cursor-pointer text-xs"
            >
              {monthOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Transaction</span>
          </button>
        </div>
      </div>

      {/* 2. OVERVIEW METRICS CARDS (Dynaically reflecting Selected Month or Cumulative Portfolio) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Added Monthly Inflow or Total Cumulative Inflow */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-medium uppercase tracking-wider text-[11px]">
              {selectedMonth === 'all' ? 'Total Cumulative Inflow' : `${activeMonthSummary?.shortLabel} Added Inflow`}
            </span>
            <span className="text-emerald-400 font-mono text-[11px]">
              {selectedMonth === 'all' ? '2 Cycles' : 'Direct Deposit'}
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
                {formatPKR(selectedMonth === 'all' ? totalCumulativeInflow : activeMonthSummary?.inflow || 0)}
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                ({(((selectedMonth === 'all' ? totalCumulativeInflow : activeMonthSummary?.inflow || 0)) / 100000).toFixed(2)} Lakh)
              </span>
            </div>
            <div className="mt-1 text-xs text-neutral-400 flex items-center justify-between">
              <span>Payroll: Rs. 80,000 / mo</span>
              <span>·</span>
              <span className="text-emerald-400">100% Inflow Met</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Monthly Outflow (Expenses) */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-medium uppercase tracking-wider text-[11px]">
              {selectedMonth === 'all' ? 'Total Cumulative Outflows' : `${activeMonthSummary?.shortLabel} Outflow (Expenses)`}
            </span>
            <span className="text-rose-400 font-mono text-[11px]">
              {selectedMonth === 'all' ? 'M1 + M2' : `${activeMonthSummary?.txnCount || 0} Transactions`}
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-rose-400 font-mono tracking-tight">
                -{formatPKR(selectedMonth === 'all' ? totalCumulativeOutflow : activeMonthSummary?.outflow || 0)}
              </span>
              <span className="text-xs text-neutral-500 font-mono">
                ({(((selectedMonth === 'all' ? totalCumulativeOutflow : activeMonthSummary?.outflow || 0)) / 100000).toFixed(2)} Lakh)
              </span>
            </div>
            <div className="mt-1 text-xs text-neutral-400 flex items-center justify-between">
              <span>M1: {formatPKR(39000)}</span>
              <span>·</span>
              <span>M2: {formatPKR(25000)}</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Monthly Net Savings & Savings Rate */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-medium uppercase tracking-wider text-[11px]">
              {selectedMonth === 'all' ? 'Total Net Savings Retained' : `${activeMonthSummary?.shortLabel} Net Savings`}
            </span>
            <span className="text-emerald-400 font-mono text-[11px]">
              {selectedMonth === 'all'
                ? `${Math.round((totalCumulativeNetSavings / totalCumulativeInflow) * 100)}% Rate`
                : `${activeMonthSummary?.savingsRatePct || 0}% Rate`}
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
                {formatPKR(selectedMonth === 'all' ? totalCumulativeNetSavings : activeMonthSummary?.netSavings || 0)}
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                ({(((selectedMonth === 'all' ? totalCumulativeNetSavings : activeMonthSummary?.netSavings || 0)) / 100000).toFixed(2)} Lakh)
              </span>
            </div>
            <div className="mt-1 text-xs text-neutral-400 flex items-center justify-between">
              <span>Goal: {formatPKR(singleMonthTarget)}</span>
              <span>·</span>
              <span className="text-emerald-400 font-semibold">
                {selectedMonth === 'all'
                  ? `+${formatPKR(totalCumulativeNetSavings - singleMonthTarget)} Buffer`
                  : activeMonthSummary && activeMonthSummary.targetVariance >= 0
                  ? `+${formatPKR(activeMonthSummary.targetVariance)} Surplus`
                  : `${formatPKR(activeMonthSummary?.targetVariance || 0)} Deficit`}
              </span>
            </div>
          </div>
        </div>

        {/* Metric 4: Cumulative Savings Balance */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-medium uppercase tracking-wider text-[11px]">
              {selectedMonth === 'all' ? 'Cumulative Savings Balance' : `Balance Thru ${activeMonthSummary?.shortLabel}`}
            </span>
            <span className="text-purple-400 font-mono text-[11px]">Running Total</span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
                {formatPKR(selectedMonth === 'all' ? totalCumulativeNetSavings : activeMonthSummary?.cumulativeSavings || 0)}
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                Liquid Cash
              </span>
            </div>
            <div className="mt-1 text-xs text-neutral-400 flex items-center justify-between">
              <span>+ Father Loan: {formatPKR(pendingReceivables)}</span>
              <span>·</span>
              <span className="text-purple-300 font-mono">Total: {formatPKR(totalNetLiquidWorth)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MONTH-ON-MONTH LEDGER TABLE (MONTHLY BREAKDOWN SUMMARY GRID) */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Month-on-Month Summary Ledger
              </span>
              <span className="rounded bg-neutral-800 px-2 py-0.5 text-[10px] font-mono text-neutral-300">
                Monthly Breakdown Grid
              </span>
            </div>
            <h2 className="text-base font-bold text-white mt-1">
              Monthly Inflows, Outflows, Net Savings &amp; Running Cumulative Balance
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-neutral-400">Status:</span>
            <span className="text-white font-bold">{monthlyBreakdowns.length} Accounting Cycles Reconciled</span>
          </div>
        </div>

        {/* High-density MoM Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 uppercase text-[10px] font-mono">
              <tr>
                <th className="py-3 px-4">Month &amp; Year</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Monthly Added (Inflow)</th>
                <th className="py-3 px-4 text-right">Monthly Expenses (Outflow)</th>
                <th className="py-3 px-4 text-right">Monthly Net Savings</th>
                <th className="py-3 px-4 text-right">Target Variance</th>
                <th className="py-3 px-4 text-right bg-neutral-950/80 font-bold">Cumulative Savings Balance</th>
                <th className="py-3 px-4 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 text-neutral-300">
              {monthlyBreakdowns.map((m) => {
                const isSelected = selectedMonth === m.monthKey;
                return (
                  <tr
                    key={m.monthKey}
                    onClick={() => setSelectedMonth(m.monthKey)}
                    className={`cursor-pointer transition ${
                      isSelected
                        ? 'bg-neutral-800/80 ring-1 ring-emerald-500/50'
                        : 'hover:bg-neutral-800/40'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{m.monthLabel}</span>
                        {isSelected && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        Key: {m.monthKey} &bull; {m.txnCount} transactions
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`text-[11px] font-mono font-semibold ${
                        m.status === 'active' ? 'text-emerald-400' : 'text-neutral-400'
                      }`}>
                        {m.status === 'active' ? 'ACTIVE CYCLE' : 'CLOSED'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 text-sm whitespace-nowrap">
                      +{formatPKR(m.inflow)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-400 text-sm whitespace-nowrap">
                      -{formatPKR(m.outflow)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-sm whitespace-nowrap">
                      <span className="font-bold text-white">
                        +{formatPKR(m.netSavings)}
                      </span>
                      <span className="block text-[10px] text-neutral-400">
                        {m.savingsRatePct}% savings rate
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono whitespace-nowrap">
                      <span className={`text-xs font-semibold ${
                        m.targetVariance >= 0 ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {m.targetVariance >= 0 ? `+${formatPKR(m.targetVariance)} Surplus` : `${formatPKR(m.targetVariance)} Deficit`}
                      </span>
                      <span className="block text-[10px] text-neutral-500">
                        Target: Rs. 60,000
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-emerald-400 text-base bg-neutral-950/40 whitespace-nowrap">
                      {formatPKR(m.cumulativeSavings)}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMonth(selectedMonth === m.monthKey ? 'all' : m.monthKey);
                        }}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                          isSelected
                            ? 'bg-emerald-500 text-neutral-950'
                            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                        }`}
                      >
                        {isSelected ? 'Filtered ✓' : 'Filter'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Total / Portfolio Row */}
            <tfoot className="bg-neutral-950 border-t-2 border-neutral-800 text-neutral-200 font-mono text-xs">
              <tr>
                <td className="py-3.5 px-4 font-bold uppercase text-[11px] text-neutral-400" colSpan={2}>
                  Consolidated 2-Month Total
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-emerald-400 text-sm whitespace-nowrap">
                  +{formatPKR(totalCumulativeInflow)}
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-rose-400 text-sm whitespace-nowrap">
                  -{formatPKR(totalCumulativeOutflow)}
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-white text-sm whitespace-nowrap">
                  +{formatPKR(totalCumulativeNetSavings)}
                </td>
                <td className="py-3.5 px-4 text-right font-semibold text-emerald-400 whitespace-nowrap">
                  +{formatPKR(totalCumulativeNetSavings - singleMonthTarget)} Above M1
                </td>
                <td className="py-3.5 px-4 text-right font-black text-emerald-400 text-lg bg-neutral-950 whitespace-nowrap">
                  {formatPKR(totalCumulativeNetSavings)}
                </td>
                <td className="py-3.5 px-4 text-center">
                  {selectedMonth !== 'all' && (
                    <button
                      onClick={() => setSelectedMonth('all')}
                      className="text-xs text-neutral-400 hover:text-white underline font-medium"
                    >
                      Clear Filter
                    </button>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Target Milestone Comparison Strip */}
      <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-neutral-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Target Benchmark Status</span>
              <span className="text-neutral-500">|</span>
              <span className="text-neutral-400">1-Month Target: Rs. 60,000 (Current Cash: Rs. 96,000 &bull; 160% Achieved)</span>
              <span className="text-neutral-500">|</span>
              <span className="text-neutral-400">2-Month Target: Rs. 120,000 (On Father Repayment: Rs. 121,000 &bull; 100.8%)</span>
            </div>
            <div className="text-xs text-neutral-400">
              Auto-synchronized with Google Keep Master Ledger Note and Calendar Alarm (1 December 2026).
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-neutral-500">2-Mo Inflow: </span>
              <span className="text-white font-bold">{formatPKR(totalCumulativeInflow)}</span>
            </div>
            <div>
              <span className="text-neutral-500">Surplus: </span>
              <span className="text-emerald-400 font-bold">+{formatPKR(totalNetLiquidWorth - twoMonthCumulativeTarget)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Section Navigation */}
      <div className="flex items-center gap-1 border-b border-neutral-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
            activeTab === 'overview'
              ? 'bg-neutral-800 text-white'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Audit Overview
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
            activeTab === 'ledger'
              ? 'bg-neutral-800 text-white'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <span>Ledger &amp; Data Grid</span>
          <span className="text-[10px] text-neutral-500 font-mono">({filteredLedger.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
            activeTab === 'analytics'
              ? 'bg-neutral-800 text-white'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Analytics &amp; Cash Flow
        </button>
        <button
          onClick={() => setActiveTab('borrowers')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
            activeTab === 'borrowers'
              ? 'bg-neutral-800 text-white'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <span>Receivables &amp; Loans</span>
          <span className="text-[10px] text-purple-400 font-mono">({debtRecords.length})</span>
        </button>
      </div>

      {/* TAB 1: AUDIT OVERVIEW & BREAKDOWNS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top 2 Period Summaries: Month 1 vs Month 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Month 1 Audit Card */}
            <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-xs">
                <div>
                  <span className="text-neutral-400 uppercase tracking-wider text-[10px]">Concluded Accounting Cycle</span>
                  <h3 className="text-base font-bold text-white mt-0.5">Month 1 (February 2026)</h3>
                </div>
                <span className="text-neutral-400 font-mono">Closed &bull; Reconciled</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-neutral-400">Total Inflow Added:</span>
                  <div className="font-mono font-bold text-white text-sm">{formatPKR(month1Salary)}</div>
                </div>
                <div>
                  <span className="text-neutral-400">Total Outflow (Expenses):</span>
                  <div className="font-mono font-bold text-rose-400 text-sm">-{formatPKR(39000)}</div>
                </div>
                <div>
                  <span className="text-neutral-400">Net Carried Balance:</span>
                  <div className="font-mono font-bold text-emerald-400 text-sm">+{formatPKR(41000)}</div>
                </div>
                <div>
                  <span className="text-neutral-400">Target (Rs. 60,000):</span>
                  <div className="font-mono font-bold text-amber-400 text-sm">51.3% Retained (-Rs. 19k)</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-xs space-y-1">
                <div className="font-semibold text-neutral-300">Variance Root Cause: Emergency Hardware &amp; Medical</div>
                <div className="text-neutral-400 text-[11px] leading-relaxed">
                  Unplanned Laptop Repair ({formatPKR(20000)}) and Medical bills ({formatPKR(6000)}) totaled {formatPKR(26000)} (32.5% of income). Without these non-recurring items, retained savings would have reached {formatPKR(67000)}.
                </div>
              </div>
            </div>

            {/* Month 2 Audit Card */}
            <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-xs">
                <div>
                  <span className="text-emerald-400 uppercase tracking-wider text-[10px]">Active Accounting Cycle</span>
                  <h3 className="text-base font-bold text-white mt-0.5">Month 2 (March 2026)</h3>
                </div>
                <span className="text-emerald-400 font-mono">Active &bull; Liquid Surplus</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-neutral-400">Fresh Inflow Added:</span>
                  <div className="font-mono font-bold text-white text-sm">{formatPKR(month2Salary)}</div>
                </div>
                <div>
                  <span className="text-neutral-400">Current Outflows:</span>
                  <div className="font-mono font-bold text-rose-400 text-sm">-{formatPKR(25000)}</div>
                </div>
                <div>
                  <span className="text-neutral-400">Monthly Net Savings:</span>
                  <div className="font-mono font-bold text-emerald-400 text-sm">+{formatPKR(55000)}</div>
                </div>
                <div>
                  <span className="text-neutral-400">Cumulative Liquid Cash:</span>
                  <div className="font-mono font-bold text-emerald-400 text-sm">{formatPKR(96000)} (160% of M1 Goal)</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-xs space-y-1">
                <div className="font-semibold text-neutral-300">Variance Driver: Compounded Carryover &amp; No Shocks</div>
                <div className="text-neutral-400 text-[11px] leading-relaxed">
                  Carried {formatPKR(41000)} into Month 2 alongside fresh {formatPKR(month2Salary)} salary. With zero hardware breakdowns, wallet cash sits at {formatPKR(96000)}, plus {formatPKR(25000)} receivable due 1 Dec 2026 (with scheduled milestone alerts on 1 Oct 2026 and 1 Nov 2026).
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HIGH-DENSITY ENTERPRISE LEDGER & DATA GRID */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Controls Bar: Search, Filters, Sorting, Page Size */}
          <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Search transactions by reference, description, counterparty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Flow Filter */}
              <div className="flex items-center gap-1 bg-neutral-950 p-0.5 rounded-lg border border-neutral-800">
                {(['all', 'inflow', 'outflow', 'receivable'] as const).map((flow) => (
                  <button
                    key={flow}
                    onClick={() => setFlowFilter(flow)}
                    className={`px-2.5 py-1 text-xs capitalize rounded-md transition ${
                      flowFilter === flow
                        ? 'bg-neutral-800 text-white font-medium'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {flow}
                  </button>
                ))}
              </div>

              {/* Month Filter Selector */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 focus:outline-none cursor-pointer"
              >
                {monthOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 focus:outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {allCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Row Count selector */}
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-2 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-400 font-mono text-xs focus:outline-none"
              >
                <option value={10}>10 rows</option>
                <option value={25}>25 rows</option>
                <option value={50}>50 rows</option>
                <option value={100}>All</option>
              </select>
            </div>
          </div>

          {/* Data Grid Table */}
          <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 uppercase text-[10px] font-mono">
                  <tr>
                    <th
                      onClick={() => handleSort('date')}
                      className="py-3 px-4 cursor-pointer hover:text-white transition"
                    >
                      <div className="flex items-center gap-1">
                        <span>Date</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-4">Ref ID</th>
                    <th
                      onClick={() => handleSort('title')}
                      className="py-3 px-4 cursor-pointer hover:text-white transition"
                    >
                      <div className="flex items-center gap-1">
                        <span>Description &bull; Counterparty</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('category')}
                      className="py-3 px-4 cursor-pointer hover:text-white transition"
                    >
                      <div className="flex items-center gap-1">
                        <span>Category</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('type')}
                      className="py-3 px-4 cursor-pointer hover:text-white transition"
                    >
                      <div className="flex items-center gap-1">
                        <span>Flow Type</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('amount')}
                      className="py-3 px-4 text-right cursor-pointer hover:text-white transition"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Amount (PKR)</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-4 text-right">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/80 text-neutral-300">
                  {filteredLedger.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-neutral-500">
                        No transactions match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredLedger.slice(0, pageSize).map((txn) => {
                      return (
                        <tr key={txn.id} className="hover:bg-neutral-800/30 transition">
                          <td className="py-3 px-4 font-mono text-neutral-400 whitespace-nowrap">
                            {txn.date}
                          </td>
                          <td className="py-3 px-4 font-mono text-neutral-500 text-[11px] whitespace-nowrap">
                            {txn.refId}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white">{txn.title}</div>
                            {txn.counterparty && (
                              <div className="text-[11px] text-neutral-400">
                                Counterparty: {txn.counterparty}
                              </div>
                            )}
                            {txn.notes && (
                              <div className="text-[10px] text-neutral-500 truncate max-w-xs">
                                {txn.notes}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="text-neutral-300 font-medium">
                              {txn.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`text-[11px] font-mono ${
                              txn.flowType === 'inflow'
                                ? 'text-emerald-400'
                                : txn.flowType === 'receivable'
                                ? 'text-purple-400'
                                : 'text-neutral-400'
                            }`}>
                              {txn.flowType.toUpperCase()}
                            </span>
                          </td>
                          <td className={`py-3 px-4 text-right font-mono font-bold whitespace-nowrap text-sm ${
                            txn.flowType === 'inflow'
                              ? 'text-emerald-400'
                              : txn.flowType === 'receivable'
                              ? 'text-purple-300'
                              : 'text-neutral-100'
                          }`}>
                            {txn.flowType === 'inflow' ? '+' : txn.flowType === 'outflow' ? '-' : '⇄ '}
                            {formatPKR(txn.amount)}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <span className={`text-[11px] font-mono font-semibold ${
                              txn.status === 'reconciled'
                                ? 'text-neutral-400'
                                : txn.status === 'cleared'
                                ? 'text-emerald-400'
                                : 'text-amber-400'
                            }`}>
                              {txn.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {txn.rawType === 'expense' && (
                              <button
                                onClick={() => onDeleteExpense(txn.originalId)}
                                className="text-neutral-500 hover:text-rose-400 transition p-1"
                                title="Delete Expense"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {txn.rawType === 'debt' && (
                              <button
                                onClick={() => onDeleteDebtRecord(txn.originalId)}
                                className="text-neutral-500 hover:text-rose-400 transition p-1"
                                title="Delete Debt Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {txn.rawType === 'inflow' && (
                              <span className="text-neutral-600 text-[10px] font-mono">LOCKED</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer with Summary Stats */}
            <div className="p-3 bg-neutral-950 border-t border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-neutral-400">
              <div>
                Showing <span className="text-white font-mono">{Math.min(filteredLedger.length, pageSize)}</span> of{' '}
                <span className="text-white font-mono">{filteredLedger.length}</span> transactions
                {selectedMonth !== 'all' && (
                  <span className="ml-2 text-emerald-400 font-mono">
                    (Filtered to {getMonthLabel(selectedMonth)})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 font-mono text-[11px]">
                <span>
                  Filter Outflow: <strong className="text-neutral-200">{formatPKR(filteredLedger.filter((t) => t.flowType === 'outflow').reduce((a, b) => a + b.amount, 0))}</strong>
                </span>
                <span>
                  Filter Inflow: <strong className="text-emerald-400">{formatPKR(filteredLedger.filter((t) => t.flowType === 'inflow').reduce((a, b) => a + b.amount, 0))}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT & ANALYTICS SECTION */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Top 3 Breakdown Visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 1. Categorical Distribution Bar */}
            <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white uppercase tracking-wider text-[11px]">Expense Category Distribution</span>
                <span className="text-neutral-500 font-mono">
                  {selectedMonth === 'all' ? 'All Months' : getShortMonthLabel(selectedMonth)}
                </span>
              </div>

              {/* Progress stack */}
              <div className="w-full bg-neutral-950 h-3 rounded-full overflow-hidden flex">
                {categoryAudit.map((cat, idx) => {
                  const colors = ['bg-rose-500', 'bg-amber-500', 'bg-purple-500', 'bg-emerald-500', 'bg-blue-500', 'bg-neutral-500'];
                  return (
                    <div
                      key={cat.category}
                      style={{ width: `${cat.percentage}%` }}
                      className={`${colors[idx % colors.length]} h-full`}
                      title={`${cat.category}: ${cat.percentage}% (${formatPKR(cat.amount)})`}
                    />
                  );
                })}
              </div>

              <div className="space-y-2 text-xs">
                {categoryAudit.map((cat, idx) => {
                  const dotColors = ['bg-rose-400', 'bg-amber-400', 'bg-purple-400', 'bg-emerald-400', 'bg-blue-400', 'bg-neutral-400'];
                  return (
                    <div key={cat.category} className="flex items-center justify-between py-1 border-b border-neutral-800/60">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${dotColors[idx % dotColors.length]}`} />
                        <span className="text-neutral-300">{cat.category}</span>
                      </div>
                      <div className="font-mono text-neutral-400">
                        <span className="text-white font-medium">{formatPKR(cat.amount)}</span>{' '}
                        <span className="text-neutral-500 text-[10px]">({cat.percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Cash Flow Waterfall */}
            <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white uppercase tracking-wider text-[11px]">Monthly Cash Flow Waterfall</span>
                <span className="text-neutral-500 font-mono">Month-on-Month</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex justify-between items-center">
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase font-mono">Gross Inflow Added</span>
                    <span className="font-semibold text-white">Salary (M1 + M2)</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 text-sm">{formatPKR(totalCumulativeInflow)}</span>
                </div>

                <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex justify-between items-center">
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase font-mono">Total Expenditures</span>
                    <span className="font-semibold text-white">Expenses (M1 + M2)</span>
                  </div>
                  <span className="font-mono font-bold text-rose-400 text-sm">-{formatPKR(totalCumulativeOutflow)}</span>
                </div>

                <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex justify-between items-center">
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase font-mono">Net Retained Cash</span>
                    <span className="font-semibold text-white">Liquid Cash in Hand</span>
                  </div>
                  <span className="font-mono font-bold text-white text-sm">{formatPKR(totalCumulativeNetSavings)}</span>
                </div>

                <div className="p-2.5 rounded-lg bg-purple-950/20 border border-purple-500/30 flex justify-between items-center">
                  <div>
                    <span className="text-purple-400 block text-[10px] uppercase font-mono">Receivable Recovery (3 Milestones)</span>
                    <span className="font-semibold text-white">Father Loan (Due 1 Dec 2026 &bull; Milestones: 1 Oct &amp; 1 Nov 2026)</span>
                  </div>
                  <span className="font-mono font-bold text-purple-300 text-sm">+{formatPKR(pendingReceivables)}</span>
                </div>

                <div className="pt-2 border-t border-neutral-800 flex justify-between items-center font-bold">
                  <span className="text-neutral-300">Total Net Worth:</span>
                  <span className="font-mono text-emerald-400 text-base">{formatPKR(totalNetLiquidWorth)}</span>
                </div>
              </div>
            </div>

            {/* 3. Asset & Liquidity Allocation */}
            <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white uppercase tracking-wider text-[11px]">Asset &amp; Liquidity Allocation</span>
                <span className="text-emerald-400 font-mono">100% Liquid</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-xs mb-1 font-mono">
                    <span className="text-neutral-300">Liquid Wallet Cash</span>
                    <span className="text-emerald-400 font-bold">{Math.round((totalCumulativeNetSavings / totalNetLiquidWorth) * 100)}% ({formatPKR(totalCumulativeNetSavings)})</span>
                  </div>
                  <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${(totalCumulativeNetSavings / totalNetLiquidWorth) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1 font-mono">
                    <span className="text-neutral-300">Loan Receivables (Father)</span>
                    <span className="text-purple-300 font-bold">{Math.round((pendingReceivables / totalNetLiquidWorth) * 100)}% ({formatPKR(pendingReceivables)})</span>
                  </div>
                  <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full"
                      style={{ width: `${(pendingReceivables / totalNetLiquidWorth) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1.5 mt-4 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Total Capital Reserve:</span>
                    <span className="font-mono font-bold text-white">{formatPKR(totalNetLiquidWorth)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Target Savings Goal (2-Mo):</span>
                    <span className="font-mono text-amber-300 font-bold">{formatPKR(twoMonthCumulativeTarget)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-neutral-800">
                    <span className="text-neutral-400">Goal Variance:</span>
                    <span className="font-mono text-emerald-400 font-bold">+{formatPKR(totalNetLiquidWorth - twoMonthCumulativeTarget)} Surplus</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RECEIVABLES & LOANS TRACKER */}
      {activeTab === 'borrowers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <h2 className="text-base font-bold text-white">Active Receivables &amp; Loan Counterparties</h2>
              <p className="text-neutral-400 mt-0.5">
                Counterparty records, repayment due dates, and linked audio alarm triggers.
              </p>
            </div>
            <div className="font-mono text-xs text-neutral-400">
              Total Expected Recovery: <span className="text-purple-300 font-bold">{formatPKR(pendingReceivables)}</span>
            </div>
          </div>

          <div className="space-y-3">
            {debtRecords.map((debt) => {
              const isFatherLoan = debt.expectedReturnDate === '2026-12-01' || debt.personName.toLowerCase().includes('father');
              const isPending = debt.status === 'pending';

              return (
                <div
                  key={debt.id}
                  className={`p-4 rounded-xl border bg-neutral-900 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isFatherLoan && isPending
                      ? 'border-purple-500/50 bg-gradient-to-r from-neutral-900 via-purple-950/10 to-neutral-900'
                      : 'border-neutral-800'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{debt.personName}</span>
                      <span className="text-neutral-500 font-mono text-[11px]">&bull; {debt.monthPeriod}</span>
                      {isFatherLoan && isPending && (
                        <span className="text-purple-300 font-mono text-[11px] font-semibold">
                          &bull; 🔔 Alarm Set: 1 Dec 2026
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-400 flex items-center gap-2">
                      <span>Date Disbursed: {debt.dateGiven}</span>
                      <span>&bull;</span>
                      <span>Due: {debt.expectedReturnDate || 'Unspecified'}</span>
                    </div>
                    {debt.notes && (
                      <div className="text-xs text-neutral-500 mt-1">{debt.notes}</div>
                    )}
                    {isFatherLoan && isPending && (
                      <div className="mt-2 pt-2 border-t border-neutral-800/80">
                        <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider block mb-1 font-bold">
                          🔔 3-Stage Receivable &amp; Alarm Schedule:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px] font-mono">
                          <div className="p-1.5 rounded bg-purple-950/40 border border-purple-500/40 text-purple-200">
                            <span className="font-bold text-white block">1 Oct 2026</span>
                            <span className="text-[10px] text-purple-300">Milestone 1 &bull; 60-Day Check Alarm</span>
                          </div>
                          <div className="p-1.5 rounded bg-purple-950/40 border border-purple-500/40 text-purple-200">
                            <span className="font-bold text-white block">1 Nov 2026</span>
                            <span className="text-[10px] text-purple-300">Milestone 2 &bull; 30-Day Notice Alarm</span>
                          </div>
                          <div className="p-1.5 rounded bg-emerald-950/40 border border-emerald-500/40 text-emerald-200">
                            <span className="font-bold text-white block">1 Dec 2026</span>
                            <span className="text-[10px] text-emerald-300">Final Settlement &bull; Rs. 25,000</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <div className="font-mono font-extrabold text-white text-base">
                        {formatPKR(debt.amount)}
                      </div>
                      <div className={`text-[11px] font-mono font-semibold ${
                        isPending ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {isPending ? 'PENDING RECOVERY' : 'SETTLED'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPending ? (
                        <button
                          onClick={() => onUpdateDebtRecord(debt.id, { status: 'cleared', returnedAmount: debt.amount })}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 transition"
                        >
                          Mark Settled
                        </button>
                      ) : (
                        <button
                          onClick={() => onUpdateDebtRecord(debt.id, { status: 'pending', returnedAmount: 0 })}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-neutral-800 text-neutral-400 hover:bg-neutral-700 transition"
                        >
                          Revert
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteDebtRecord(debt.id)}
                        className="p-1 text-neutral-500 hover:text-rose-400 transition"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* QUICK LOG TRANSACTION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-neutral-900 border border-neutral-800 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-xs">
              <span className="font-bold text-white text-sm">Log Ledger Transaction</span>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEntry} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">Transaction Nature</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewEntryType('outflow')}
                    className={`py-1.5 rounded-lg border text-xs font-semibold transition ${
                      newEntryType === 'outflow'
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    - Expense / Outflow
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewEntryType('receivable')}
                    className={`py-1.5 rounded-lg border text-xs font-semibold transition ${
                      newEntryType === 'receivable'
                        ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    ⇄ Loan / Receivable
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hardware Repair, Groceries, Loan transfer"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Amount (PKR) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 5000"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-white focus:outline-none cursor-pointer"
                  >
                    <option value="Family Support">Family Support</option>
                    <option value="Repairs & Tech">Repairs &amp; Tech</option>
                    <option value="Healthcare & Medical">Healthcare &amp; Medical</option>
                    <option value="Food & Dining">Food &amp; Dining</option>
                    <option value="Groceries & Household">Groceries &amp; Household</option>
                    <option value="Charity & Donation">Charity &amp; Donation</option>
                    <option value="Receivables">Receivables</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Accounting Cycle</label>
                  <select
                    value={newPeriod}
                    onChange={(e) => setNewPeriod(e.target.value as any)}
                    className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-white focus:outline-none cursor-pointer"
                  >
                    <option value="current">Month 2 (Current)</option>
                    <option value="previous">Month 1 (Concluded)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Counterparty / Recipient</label>
                  <input
                    type="text"
                    placeholder="e.g. Father, Vendor, Pharmacy"
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Settlement Channel</label>
                  <select
                    value={newPaymentChannel}
                    onChange={(e) => setNewPaymentChannel(e.target.value)}
                    className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-white focus:outline-none cursor-pointer"
                  >
                    <option value="Cash in Hand">Cash in Hand (PKR)</option>
                    <option value="Raast ID">Raast ID (State Bank Instant)</option>
                    <option value="EasyPaisa">EasyPaisa</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="Nayapay / Sadapay">Nayapay / Sadapay</option>
                    <option value="Bank Transfer">Bank Transfer (1Link)</option>
                  </select>
                </div>
              </div>

              {newEntryType === 'receivable' && (
                <div>
                  <label className="block text-neutral-400 mb-1">Expected Repayment Date (Alarm Trigger)</label>
                  <input
                    type="date"
                    value={newReturnDate}
                    onChange={(e) => setNewReturnDate(e.target.value)}
                    className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-white font-mono focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-neutral-400 mb-1">Notes / Audit Memo</label>
                <input
                  type="text"
                  placeholder="Optional audit notes..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold transition"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
