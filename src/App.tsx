import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Note,
  CalendarEvent,
  SalaryConfig,
  BudgetItem,
  CategoryAllocation,
  AppNotification,
  SecuritySettings,
  DeviceSyncStatus,
  AppThemeMode,
  AccentColor,
  SavingsGoal,
  SupportedCurrency,
  MonthExpenseItem,
  PersonDebtRecord,
  MonthlyAccountRecord,
} from './types';
import {
  INITIAL_NOTES,
  INITIAL_CALENDAR_EVENTS,
  INITIAL_SALARY_CONFIG,
  INITIAL_BUDGET_ITEMS,
  INITIAL_CATEGORIES,
  INITIAL_SECURITY,
  INITIAL_SYNC_DEVICES,
  INITIAL_SAVINGS_GOALS,
  INITIAL_MONTH_EXPENSES,
  INITIAL_DEBT_RECORDS,
  INITIAL_MONTHLY_ACCOUNTS,
  STORAGE_KEYS,
  loadFromStorage,
  saveToStorage,
} from './services/storage';
import { calculateSalaryBreakdown } from './services/salaryMath';
import {
  evaluateAutoNotifications,
  playChimeSound,
  requestNotificationPermission,
  sendBrowserNotification,
} from './services/notifications';

import { Navbar } from './components/Navbar';
import { NavigationTabs } from './components/NavigationTabs';
import { MoneyAccountView } from './components/MoneyAccountView';
import { generateMasterFinancialNote, syncDebtsToCalendarEvents } from './services/financialSync';
import { NotesView } from './components/NotesView';
import { CalendarView } from './components/CalendarView';
import { SalaryView } from './components/SalaryView';
import { BudgetView } from './components/BudgetView';
import { SavingsCalculatorView } from './components/SavingsCalculatorView';
import { ArchitectureView } from './components/ArchitectureView';
import { LockScreen } from './components/LockScreen';
import { SecurityModal } from './components/SecurityModal';


export default function App() {
  // Persistent States
  const [notes, setNotes] = useState<Note[]>(() =>
    loadFromStorage(STORAGE_KEYS.NOTES, INITIAL_NOTES)
  );
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const loaded = loadFromStorage(STORAGE_KEYS.CALENDAR, INITIAL_CALENDAR_EVENTS);
    const hasOct1 = loaded.some((e) => e.date === '2026-10-01' && (e.receivablePerson?.includes('Father') || e.title.includes('Father')));
    const hasNov1 = loaded.some((e) => e.date === '2026-11-01' && (e.receivablePerson?.includes('Father') || e.title.includes('Father')));
    let result = [...loaded];
    if (!hasOct1) {
      result.push({
        id: 'evt-collect-papa-oct1',
        title: '🔔 1 Oct 2026: Milestone Recovery Check-in (Father / Papa)',
        description: 'First scheduled milestone reminder and alarm for Rs. 25,000 loan given to Father.',
        date: '2026-10-01',
        time: '09:00',
        type: 'salary',
        color: '#8b5cf6',
        amount: 25000,
        isCompleted: false,
        isAlarmEnabled: true,
        receivablePerson: 'Father (Papa)',
      });
    }
    if (!hasNov1) {
      result.push({
        id: 'evt-collect-papa-nov1',
        title: '🔔 1 Nov 2026: 30-Day Pre-Due Alarm (Father / Papa)',
        description: 'Second scheduled milestone reminder and alarm for Rs. 25,000 loan given to Father.',
        date: '2026-11-01',
        time: '09:00',
        type: 'salary',
        color: '#8b5cf6',
        amount: 25000,
        isCompleted: false,
        isAlarmEnabled: true,
        receivablePerson: 'Father (Papa)',
      });
    }
    return result;
  });
  const [salaryConfig, setSalaryConfig] = useState<SalaryConfig>(() =>
    loadFromStorage(STORAGE_KEYS.SALARY, INITIAL_SALARY_CONFIG)
  );
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.BUDGET, INITIAL_BUDGET_ITEMS)
  );
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() =>
    loadFromStorage(STORAGE_KEYS.SAVINGS_GOALS, INITIAL_SAVINGS_GOALS)
  );
  const [activeCurrency, setActiveCurrency] = useState<SupportedCurrency>(() =>
    loadFromStorage<SupportedCurrency>(STORAGE_KEYS.CURRENCY, 'PKR')
  );
  const [currencyRates, setCurrencyRates] = useState<Record<SupportedCurrency, number>>(() =>
    loadFromStorage(STORAGE_KEYS.CURRENCY_RATES, {
      USD: 1.0,
      PKR: 278.5,
      EGP: 49.3,
      EUR: 0.92,
      GBP: 0.79,
    })
  );
  const [monthExpenses, setMonthExpenses] = useState<MonthExpenseItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.EXPENSE_ITEMS, INITIAL_MONTH_EXPENSES)
  );
  const [debtRecords, setDebtRecords] = useState<PersonDebtRecord[]>(() => {
    const loaded = loadFromStorage(STORAGE_KEYS.DEBT_RECORDS, INITIAL_DEBT_RECORDS);
    return loaded.map((d) => {
      if (d.id === 'debt-1' || d.personName.toLowerCase().includes('father')) {
        if (!d.milestones || d.milestones.length === 0) {
          return {
            ...d,
            milestones: [
              {
                id: 'm-oct1-2026',
                date: '2026-10-01',
                label: '1 Oct 2026 Advance Recovery Check-in & Alarm',
                isAlarmEnabled: true,
                status: 'pending' as const,
              },
              {
                id: 'm-nov1-2026',
                date: '2026-11-01',
                label: '1 Nov 2026 30-Day Pre-Due Follow-up Alarm',
                isAlarmEnabled: true,
                status: 'pending' as const,
              },
              {
                id: 'm-dec1-2026',
                date: '2026-12-01',
                label: '1 Dec 2026 Final Settlement: Full Rs. 25,000 Recovery Alarm',
                amount: 25000,
                isAlarmEnabled: true,
                status: 'pending' as const,
              },
            ],
          };
        }
      }
      return d;
    });
  });
  const [monthlyAccounts, setMonthlyAccounts] = useState<MonthlyAccountRecord[]>(() =>
    loadFromStorage(STORAGE_KEYS.MONTHLY_ACCOUNTS, INITIAL_MONTHLY_ACCOUNTS)
  );
  const [categoryLimits] = useState<CategoryAllocation[]>(() =>
    loadFromStorage(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES)
  );
  const [security, setSecurity] = useState<SecuritySettings>(() =>
    loadFromStorage(STORAGE_KEYS.SECURITY, INITIAL_SECURITY)
  );
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    loadFromStorage(STORAGE_KEYS.NOTIFICATIONS, [])
  );
  const [syncDevices, setSyncDevices] = useState<DeviceSyncStatus[]>(() =>
    loadFromStorage(STORAGE_KEYS.SYNC_DEVICES, INITIAL_SYNC_DEVICES)
  );
  const [themeMode, setThemeMode] = useState<AppThemeMode>(() =>
    loadFromStorage(STORAGE_KEYS.THEME, 'dark')
  );
  const [accent, setAccent] = useState<AccentColor>(() =>
    loadFromStorage(STORAGE_KEYS.ACCENT, 'emerald')
  );

  // App Navigation & UI state
  const [currentTab, setCurrentTab] = useState<string>('account');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(false);
  const [showSecurityModal, setShowSecurityModal] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);


  // Compute calculated Net Monthly Income from salary configuration
  const salaryBreakdown = useMemo(() => calculateSalaryBreakdown(salaryConfig), [salaryConfig]);
  const netMonthlyIncome = salaryBreakdown.netMonthly;

  // Persist states
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.NOTES, notes);
  }, [notes]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CALENDAR, events);
  }, [events]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SALARY, salaryConfig);
  }, [salaryConfig]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.BUDGET, budgetItems);
  }, [budgetItems]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SECURITY, security);
  }, [security]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }, [notifications]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.THEME, themeMode);
  }, [themeMode]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ACCENT, accent);
  }, [accent]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SAVINGS_GOALS, savingsGoals);
  }, [savingsGoals]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CURRENCY, activeCurrency);
  }, [activeCurrency]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CURRENCY_RATES, currencyRates);
  }, [currencyRates]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.EXPENSE_ITEMS, monthExpenses);
  }, [monthExpenses]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.DEBT_RECORDS, debtRecords);
  }, [debtRecords]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.MONTHLY_ACCOUNTS, monthlyAccounts);
  }, [monthlyAccounts]);

  // Automatic Two-Way Synchronization: Ledger -> Master Notepad Note & Calendar Alarms
  useEffect(() => {
    // 1. Auto-sync to Master Financial Notepad Note in Google Keep / Notes
    const updatedMasterNote = generateMasterFinancialNote(monthExpenses, debtRecords);
    setNotes((prev) => {
      const existingIdx = prev.findIndex((n) => n.id === 'note-master-financial');
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = {
          ...copy[existingIdx],
          content: updatedMasterNote.content,
          checklist: updatedMasterNote.checklist,
          updatedAt: new Date().toISOString(),
        };
        return copy;
      } else {
        return [updatedMasterNote, ...prev];
      }
    });

    // 2. Auto-sync loans receivable with return dates to Calendar alarm events
    setEvents((prev) => syncDebtsToCalendarEvents(debtRecords, prev));
  }, [monthExpenses, debtRecords]);

  // Smart Auto-Notification Engine evaluation
  useEffect(() => {
    const newAlerts = evaluateAutoNotifications(salaryConfig, budgetItems, events, notifications);
    if (newAlerts.length > 0) {
      setNotifications((prev) => [...newAlerts, ...prev]);
      // Play audio chime and trigger browser native notification
      playChimeSound('alert');
      newAlerts.forEach((a) => {
        sendBrowserNotification(a.title, { body: a.message });
      });
    }
  }, [salaryConfig, budgetItems, events]);

  // Request browser notification permission once
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Inactivity Auto-Lock Timer
  useEffect(() => {
    if (security.autoLockMinutes <= 0) return;

    let timeoutId: number;
    const resetTimer = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        setSecurity((prev) => ({ ...prev, isLocked: true }));
      }, security.autoLockMinutes * 60 * 1000);
    };

    const eventsToListen = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    eventsToListen.forEach((name) => window.addEventListener(name, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      window.clearTimeout(timeoutId);
      eventsToListen.forEach((name) => window.removeEventListener(name, resetTimer));
    };
  }, [security.autoLockMinutes, security.isLocked]);

  // Simulated Cloud Sync
  const handleTriggerSync = () => {
    setIsSyncing(true);
    playChimeSound('success');
    setTimeout(() => {
      setIsSyncing(false);
      setSyncDevices((prev) =>
        prev.map((d) => ({
          ...d,
          lastSynced: d.isCurrentDevice ? 'Just now' : 'Synced 1m ago',
        }))
      );
    }, 1200);
  };

  // Note Handlers
  const handleAddNote = (newNoteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newNote: Note = {
      ...newNoteData,
      id: 'note-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => [newNote, ...prev]);
    playChimeSound('success');
  };

  const handleUpdateNote = (id: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n))
    );
  };

  const handleDeleteNote = (id: string, permanent: boolean = false) => {
    if (permanent) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } else {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, isTrash: true, updatedAt: new Date().toISOString() } : n
        )
      );
    }
  };

  const handleRestoreNote = (id: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, isTrash: false, updatedAt: new Date().toISOString() } : n
      )
    );
  };

  // Calendar Event Handlers
  const handleAddEvent = (eventData: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: 'evt-' + Date.now(),
    };
    setEvents((prev) => [...prev, newEvent]);
    playChimeSound('success');
  };

  const handleUpdateEvent = (id: string, updates: Partial<CalendarEvent>) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  // Salary Handlers
  const handleUpdateSalaryConfig = (updates: Partial<SalaryConfig>) => {
    setSalaryConfig((prev) => ({ ...prev, ...updates }));
  };

  const handleAddSalaryHistory = (entry: {
    title: string;
    date: string;
    annualEquivalent: number;
    notes?: string;
  }) => {
    const newEntry = {
      id: 'raise-' + Date.now(),
      ...entry,
    };
    setSalaryConfig((prev) => ({
      ...prev,
      baseSalary:
        prev.payPeriod === 'annually' ? entry.annualEquivalent : prev.baseSalary,
      history: [newEntry, ...prev.history],
    }));
    playChimeSound('success');
  };

  // Budget Handlers
  const handleAddBudgetItem = (itemData: Omit<BudgetItem, 'id'>) => {
    const newItem: BudgetItem = {
      ...itemData,
      id: 'b-' + Date.now(),
    };
    setBudgetItems((prev) => [newItem, ...prev]);
    playChimeSound('success');
  };

  const handleUpdateBudgetItem = (id: string, updates: Partial<BudgetItem>) => {
    setBudgetItems((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const handleDeleteBudgetItem = (id: string) => {
    setBudgetItems((prev) => prev.filter((b) => b.id !== id));
  };

  // Savings Goals Handlers
  const handleAddSavingsGoal = (goalData: Omit<SavingsGoal, 'id' | 'createdAt'>) => {
    const newGoal: SavingsGoal = {
      ...goalData,
      id: 'goal-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setSavingsGoals((prev) => [newGoal, ...prev]);
    playChimeSound('success');
  };

  const handleUpdateSavingsGoal = (id: string, updates: Partial<SavingsGoal>) => {
    setSavingsGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
  };

  const handleDeleteSavingsGoal = (id: string) => {
    setSavingsGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const handleSyncGoalToBudget = (goal: SavingsGoal) => {
    const existing = budgetItems.find((b) => b.title === goal.title);
    if (existing) {
      handleUpdateBudgetItem(existing.id, { amount: goal.monthlyContribution });
    } else {
      handleAddBudgetItem({
        title: goal.title,
        amount: goal.monthlyContribution,
        category: 'Savings & Investments',
        bucket: 'savings',
        date: new Date().toISOString().split('T')[0],
        isRecurring: true,
        dueDate: 1,
        isPaid: false,
        paymentMethod: 'Bank Transfer',
        notes: `Linked to Savings Goal (${goal.category})`,
      });
    }
  };

  // Month Expenses Handlers
  const handleAddMonthExpense = (itemData: Omit<MonthExpenseItem, 'id'>) => {
    const newItem: MonthExpenseItem = {
      ...itemData,
      id: 'exp-' + Date.now(),
    };
    setMonthExpenses((prev) => [newItem, ...prev]);
    playChimeSound('success');
  };

  const handleDeleteMonthExpense = (id: string) => {
    setMonthExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // Debt & Loan Records Handlers (Loans, Due Dates & Repayments)
  const handleAddDebtRecord = (recordData: Omit<PersonDebtRecord, 'id'>) => {
    const newRecord: PersonDebtRecord = {
      ...recordData,
      id: 'debt-' + Date.now(),
    };
    setDebtRecords((prev) => [newRecord, ...prev]);
    playChimeSound('success');
  };

  const handleUpdateDebtRecord = (id: string, updates: Partial<PersonDebtRecord>) => {
    setDebtRecords((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  };

  const handleDeleteDebtRecord = (id: string) => {
    setDebtRecords((prev) => prev.filter((d) => d.id !== id));
  };

  // Restore Entire Vault Handler
  const handleRestoreVault = (data: {
    notes: Note[];
    budget: BudgetItem[];
    salary: SalaryConfig;
  }) => {
    if (data.notes) setNotes(data.notes);
    if (data.budget) setBudgetItems(data.budget);
    if (data.salary) setSalaryConfig(data.salary);
    playChimeSound('payday');
  };

  // Notification handlers
  const handleMarkNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  // Theming classes
  const getThemeBackgroundClass = () => {
    if (themeMode === 'light') return 'bg-neutral-100 text-neutral-900';
    if (themeMode === 'oled') return 'bg-black text-neutral-100';
    return 'bg-neutral-950 text-neutral-100';
  };

  // Active counts for badges
  const activeNotesCount = notes.filter((n) => !n.isArchived && !n.isTrash).length;
  const unpaidBillsCount = budgetItems.filter((b) => b.isRecurring && !b.isPaid).length;

  const walletBalanceBadge = useMemo(() => {
    const prevSpent = monthExpenses
      .filter((e) => e.monthPeriod === 'previous')
      .reduce((sum, item) => sum + item.amount, 0);
    const currSpent = monthExpenses
      .filter((e) => e.monthPeriod === 'current')
      .reduce((sum, item) => sum + item.amount, 0);
    const prevCarry = 80000 - prevSpent;
    const currentBalance = prevCarry + 80000 - currSpent;
    return `Rs. ${Math.round(currentBalance / 1000)}k`;
  }, [monthExpenses]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${getThemeBackgroundClass()}`}>
      {/* Biometric & PIN Lock Screen Overlay */}
      {security.isLocked && (
        <LockScreen
          pinHash={security.pinHash}
          biometricsEnabled={security.biometricsEnabled}
          biometricCredentialId={security.biometricCredentialId}
          onUnlock={() => setSecurity((prev) => ({ ...prev, isLocked: false }))}
        />
      )}

      {/* Security & Vault Settings Modal */}
      {showSecurityModal && (
        <SecurityModal
          security={security}
          onUpdateSecurity={(updates) => setSecurity((prev) => ({ ...prev, ...updates }))}
          onClose={() => setShowSecurityModal(false)}
          syncDevices={syncDevices}
          onTriggerSync={handleTriggerSync}
          isSyncing={isSyncing}
        />
      )}

      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isLocked={security.isLocked}
        onLockVault={() => setSecurity((prev) => ({ ...prev, isLocked: true }))}
        onOpenSecurity={() => setShowSecurityModal(true)}
        notifications={notifications}
        onMarkNotificationAsRead={handleMarkNotificationRead}
        onClearAllNotifications={handleClearAllNotifications}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        accent={accent}
        setAccent={setAccent}
        isMobileFrame={isMobileFrame}
        setIsMobileFrame={setIsMobileFrame}
        syncDevices={syncDevices}
        onTriggerSync={handleTriggerSync}
        isSyncing={isSyncing}
        activeCurrency={activeCurrency}
        setActiveCurrency={setActiveCurrency}
        currencyRates={currencyRates}
        onUpdateCurrencyRate={(cur, rate) => setCurrencyRates((prev) => ({ ...prev, [cur]: rate }))}
      />

      {/* Navigation Tab Bar */}
      <NavigationTabs
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        accent={accent}
        notesCount={activeNotesCount}
        eventsCount={events.length}
        unpaidBillsCount={unpaidBillsCount}
        savingsCount={savingsGoals.length}
        walletBalanceBadge={walletBalanceBadge}
      />


      {/* Content Area with Optional Mobile Phone Simulation Container */}
      <main className="py-4">
        {isMobileFrame ? (
          /* Mobile Device Frame Simulator (iPhone 16 / Android) */
          <div className="mx-auto my-6 max-w-[420px] rounded-[48px] border-[10px] border-neutral-800 bg-neutral-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden ring-1 ring-neutral-700/50">
            {/* Dynamic Island / Notch */}
            <div className="relative bg-neutral-900 pt-3 pb-2 px-6 flex items-center justify-between border-b border-neutral-800/80">
              <span className="text-xs font-semibold text-neutral-300 font-mono">9:41</span>
              <div className="h-5 w-28 rounded-full bg-black mx-auto flex items-center justify-end px-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500/80 animate-pulse" />
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono">
                <span>5G</span>
                <span>100%</span>
              </div>
            </div>

            {/* Inner view container */}
            <div className="h-[750px] overflow-y-auto px-1 py-2 scrollbar-none">
              {currentTab === 'account' && (
                <MoneyAccountView
                  expenses={monthExpenses}
                  onAddExpense={handleAddMonthExpense}
                  onDeleteExpense={handleDeleteMonthExpense}
                  debtRecords={debtRecords}
                  onAddDebtRecord={handleAddDebtRecord}
                  onUpdateDebtRecord={handleUpdateDebtRecord}
                  onDeleteDebtRecord={handleDeleteDebtRecord}
                  monthlyAccounts={monthlyAccounts}
                  activeCurrency={activeCurrency}
                  currencyRates={currencyRates}
                />
              )}
              {currentTab === 'notes' && (
                <NotesView
                  notes={notes}
                  onAddNote={handleAddNote}
                  onUpdateNote={handleUpdateNote}
                  onDeleteNote={handleDeleteNote}
                  onRestoreNote={handleRestoreNote}
                  searchQuery={searchQuery}
                />
              )}
              {currentTab === 'calendar' && (
                <CalendarView
                  events={events}
                  onAddEvent={handleAddEvent}
                  onUpdateEvent={handleUpdateEvent}
                  onDeleteEvent={handleDeleteEvent}
                  salaryConfig={salaryConfig}
                  budgetItems={budgetItems}
                  notes={notes}
                  searchQuery={searchQuery}
                  activeCurrency={activeCurrency}
                  currencyRates={currencyRates}
                />
              )}
              {currentTab === 'salary' && (
                <SalaryView
                  salaryConfig={salaryConfig}
                  onUpdateSalaryConfig={handleUpdateSalaryConfig}
                  onAddSalaryHistory={handleAddSalaryHistory}
                  activeCurrency={activeCurrency}
                  currencyRates={currencyRates}
                />
              )}
              {currentTab === 'savings' && (
                <SavingsCalculatorView
                  savingsGoals={savingsGoals}
                  onAddSavingsGoal={handleAddSavingsGoal}
                  onUpdateSavingsGoal={handleUpdateSavingsGoal}
                  onDeleteSavingsGoal={handleDeleteSavingsGoal}
                  activeCurrency={activeCurrency}
                  currencyRates={currencyRates}
                  onSyncGoalToBudget={handleSyncGoalToBudget}
                  monthlySavingsAllocatedInBudget={budgetItems
                    .filter((b) => b.bucket === 'savings')
                    .reduce((a, c) => a + c.amount, 0)}
                />
              )}
              {currentTab === 'budget' && (
                <BudgetView
                  budgetItems={budgetItems}
                  onAddBudgetItem={handleAddBudgetItem}
                  onUpdateBudgetItem={handleUpdateBudgetItem}
                  onDeleteBudgetItem={handleDeleteBudgetItem}
                  categoryLimits={categoryLimits}
                  netMonthlyIncome={netMonthlyIncome}
                  searchQuery={searchQuery}
                  activeCurrency={activeCurrency}
                  currencyRates={currencyRates}
                  salaryConfig={salaryConfig}
                />
              )}
              {currentTab === 'architecture' && <ArchitectureView />}
            </div>

            {/* Mobile Home Indicator bar */}
            <div className="bg-neutral-900 py-2 flex justify-center border-t border-neutral-800">
              <div className="h-1 w-32 rounded-full bg-neutral-600" />
            </div>
          </div>
        ) : (
          /* Standard Full Responsive View */
          <div>
            {currentTab === 'account' && (
              <MoneyAccountView
                expenses={monthExpenses}
                onAddExpense={handleAddMonthExpense}
                onDeleteExpense={handleDeleteMonthExpense}
                debtRecords={debtRecords}
                onAddDebtRecord={handleAddDebtRecord}
                onUpdateDebtRecord={handleUpdateDebtRecord}
                onDeleteDebtRecord={handleDeleteDebtRecord}
                monthlyAccounts={monthlyAccounts}
                activeCurrency={activeCurrency}
                currencyRates={currencyRates}
              />
            )}
            {currentTab === 'notes' && (
              <NotesView
                notes={notes}
                onAddNote={handleAddNote}
                onUpdateNote={handleUpdateNote}
                onDeleteNote={handleDeleteNote}
                onRestoreNote={handleRestoreNote}
                searchQuery={searchQuery}
              />
            )}

            {currentTab === 'calendar' && (
              <CalendarView
                events={events}
                onAddEvent={handleAddEvent}
                onUpdateEvent={handleUpdateEvent}
                onDeleteEvent={handleDeleteEvent}
                salaryConfig={salaryConfig}
                budgetItems={budgetItems}
                notes={notes}
                searchQuery={searchQuery}
                activeCurrency={activeCurrency}
                currencyRates={currencyRates}
              />
            )}
            {currentTab === 'salary' && (
              <SalaryView
                salaryConfig={salaryConfig}
                onUpdateSalaryConfig={handleUpdateSalaryConfig}
                onAddSalaryHistory={handleAddSalaryHistory}
                activeCurrency={activeCurrency}
                currencyRates={currencyRates}
              />
            )}
            {currentTab === 'savings' && (
              <SavingsCalculatorView
                savingsGoals={savingsGoals}
                onAddSavingsGoal={handleAddSavingsGoal}
                onUpdateSavingsGoal={handleUpdateSavingsGoal}
                onDeleteSavingsGoal={handleDeleteSavingsGoal}
                activeCurrency={activeCurrency}
                currencyRates={currencyRates}
                onSyncGoalToBudget={handleSyncGoalToBudget}
                monthlySavingsAllocatedInBudget={budgetItems
                  .filter((b) => b.bucket === 'savings')
                  .reduce((a, c) => a + c.amount, 0)}
              />
            )}
            {currentTab === 'budget' && (
              <BudgetView
                budgetItems={budgetItems}
                onAddBudgetItem={handleAddBudgetItem}
                onUpdateBudgetItem={handleUpdateBudgetItem}
                onDeleteBudgetItem={handleDeleteBudgetItem}
                categoryLimits={categoryLimits}
                netMonthlyIncome={netMonthlyIncome}
                searchQuery={searchQuery}
                activeCurrency={activeCurrency}
                currencyRates={currencyRates}
                salaryConfig={salaryConfig}
              />
            )}
            {currentTab === 'architecture' && <ArchitectureView />}
          </div>
        )}
      </main>
    </div>
  );
}
