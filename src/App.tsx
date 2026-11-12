import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  UserProfile,
  SimpleMoneyEntry,
  MonthBook,
  SmartNote,
  AppSettings,
  SalaryBreakdownConfig,
  AppNotification,
  DetectedMoneyPrompt,
} from './types';
import {
  getActiveUserId,
  setActiveUserId,
  getAllUsers,
  saveAllUsers,
  loadUserData,
  saveUserData,
  createFreshUserData,
  DEFAULT_SETTINGS,
  DEFAULT_SALARY_CONFIG,
  UserVaultData,
} from './services/storage';
import {
  ensureMonthBook,
  checkAndAutoLockMonths,
  getMonthKeyFromDate,
} from './services/monthEngine';
import { playChimeSound, checkLoanAlarms } from './services/notifications';

// Components
import { AuthView } from './components/AuthView';
import { LockScreen } from './components/LockScreen';
import {
  DesktopSidebar,
  MobileHeader,
  MobileBottomBar,
  MobileDrawer,
  TabKey,
} from './components/Navigation';
import { AddEntryModal } from './components/AddEntryModal';
import { HomeView } from './components/HomeView';
import { MonthlyView } from './components/MonthlyView';
import { DailyView } from './components/DailyView';
import { SavingsView } from './components/SavingsView';
import { NotesView } from './components/NotesView';
import { SalaryView } from './components/SalaryView';
import { SettingsView } from './components/SettingsView';

export default function App() {
  // 1. User & Authentication State
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => getAllUsers());
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const activeId = getActiveUserId();
    if (!activeId) return null;
    const users = getAllUsers();
    return users.find((u) => u.id === activeId) || null;
  });

  const [isLocked, setIsLocked] = useState<boolean>(false);

  // 2. User Vault States (All initialized to empty zero)
  const [entries, setEntries] = useState<SimpleMoneyEntry[]>([]);
  const [monthBooks, setMonthBooks] = useState<MonthBook[]>([]);
  const [notes, setNotes] = useState<SmartNote[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [salaryConfig, setSalaryConfig] = useState<SalaryBreakdownConfig>(DEFAULT_SALARY_CONFIG);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // 3. Navigation & Modal States
  const [currentTab, setCurrentTab] = useState<TabKey>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalInitialType, setAddModalInitialType] = useState<
    'money_in' | 'expense' | 'lent' | 'borrowed' | 'returned'
  >('expense');

  // Active / Selected month defaults to current actual month
  const todayMonthKey = useMemo(() => new Date().toISOString().substring(0, 7), []);
  const [selectedMonthlyKey, setSelectedMonthlyKey] = useState<string>(() =>
    new Date().toISOString().substring(0, 7)
  );

  // Load active user's vault data (pure zero if new/reset)
  const loadActiveUserData = useCallback((user: UserProfile) => {
    let data = loadUserData(user.id);
    if (!data) {
      data = createFreshUserData(user);
      saveUserData(user.id, data);
    }

    // Auto-lock past months if any exist
    const { updatedBooks, notifications: lockNotifs } = checkAndAutoLockMonths(
      data.monthBooks || [],
      data.entries || []
    );

    setEntries(data.entries || []);
    setMonthBooks(updatedBooks || []);
    setNotes(data.notes || []);
    setSettings(data.settings || DEFAULT_SETTINGS);
    setSalaryConfig(data.salaryConfig || DEFAULT_SALARY_CONFIG);
    setNotifications([...lockNotifs, ...(data.notifications || [])]);

    // Apply theme
    const theme = data.settings?.theme || 'dark';
    document.documentElement.classList.remove('dark', 'light', 'oled');
    document.documentElement.classList.add(theme);
  }, []);

  // Initialize vault on startup
  useEffect(() => {
    if (currentUser) {
      loadActiveUserData(currentUser);
    }
  }, [currentUser, loadActiveUserData]);

  // Persist vault changes to user's storage slot
  useEffect(() => {
    if (!currentUser) return;
    const data: UserVaultData = {
      profile: currentUser,
      entries,
      monthBooks,
      notes,
      settings,
      salaryConfig,
      notifications,
    };
    saveUserData(currentUser.id, data);
  }, [currentUser, entries, monthBooks, notes, settings, salaryConfig, notifications]);

  // Check daily loan alarms
  useEffect(() => {
    if (!currentUser || entries.length === 0) return;
    const newAlarms = checkLoanAlarms(entries, notifications);
    if (newAlarms.length > 0) {
      setNotifications((prev) => [...newAlarms, ...prev]);
      playChimeSound('alert');
    }
  }, [currentUser, entries, notifications]);

  // Inactivity auto-lock
  useEffect(() => {
    if (!currentUser || settings.autoLockMinutes <= 0 || isLocked) return;

    let timeoutId: number;
    const resetTimer = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        setIsLocked(true);
      }, settings.autoLockMinutes * 60 * 1000);
    };

    const eventsToListen = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    eventsToListen.forEach((name) => window.addEventListener(name, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      window.clearTimeout(timeoutId);
      eventsToListen.forEach((name) => window.removeEventListener(name, resetTimer));
    };
  }, [currentUser, settings.autoLockMinutes, isLocked]);

  // Handle Authentication completion
  const handleCompleteAuth = (user: UserProfile) => {
    const existing = allUsers.find((u) => u.id === user.id);
    const updatedUsers = existing
      ? allUsers.map((u) => (u.id === user.id ? user : u))
      : [...allUsers, user];

    setAllUsers(updatedUsers);
    saveAllUsers(updatedUsers);
    setActiveUserId(user.id);
    setCurrentUser(user);
    loadActiveUserData(user);
    setIsLocked(false);
    setCurrentTab('home');
    playChimeSound('success');
  };

  // Handle Log out
  const handleLogout = () => {
    setActiveUserId(null);
    setCurrentUser(null);
    setIsLocked(false);
  };

  // Handle Add Entry
  const handleAddEntry = (entryData: Omit<SimpleMoneyEntry, 'id' | 'createdAt' | 'userId'>) => {
    if (!currentUser) return;

    const newEntry: SimpleMoneyEntry = {
      ...entryData,
      id: 'entry-' + Date.now(),
      userId: currentUser.id,
      createdAt: new Date().toISOString(),
    };

    // Ensure month book exists
    const updatedBooks = ensureMonthBook(
      entryData.monthKey,
      monthBooks,
      entries,
      entryData.savingsGoalSet || 0
    );

    // If money returned, mark linked loan as cleared
    let updatedEntries = [newEntry, ...entries];
    if (entryData.type === 'returned' && entryData.linkedLoanId) {
      updatedEntries = updatedEntries.map((e) =>
        e.id === entryData.linkedLoanId ? { ...e, isCleared: true } : e
      );
    }

    setEntries(updatedEntries);
    setMonthBooks(updatedBooks);
    playChimeSound('success');
  };

  // Handle Delete Entry - permanently removes and never resurrects
  const handleDeleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  // Handle Adding Extra Spending to Next Month's Savings Goal
  const handleAddExtraToGoal = (extraAmount: number) => {
    setMonthBooks((prev) =>
      prev.map((b) =>
        b.monthKey === selectedMonthlyKey
          ? {
              ...b,
              goal: b.goal + extraAmount,
              target: b.target + extraAmount,
            }
          : b
      )
    );
    playChimeSound('success');
  };

  // Handle Withdraw from Locked Month
  const handleWithdrawFromLockedMonth = (monthKey: string, amount: number) => {
    setMonthBooks((prev) =>
      prev.map((b) => {
        if (b.monthKey === monthKey) {
          const currentTaken = b.takenBackAmount || 0;
          return {
            ...b,
            takenBackAmount: currentTaken + amount,
          };
        }
        if (b.monthKey === selectedMonthlyKey || b.monthKey === todayMonthKey) {
          return {
            ...b,
            stillToSaveFromBefore: (b.stillToSaveFromBefore || 0) + amount,
            target: b.goal + (b.stillToSaveFromBefore || 0) + amount,
          };
        }
        return b;
      })
    );
    playChimeSound('alert');
  };

  // Notes smart detector confirmation
  const handleConfirmDetectedTransaction = (noteId: string, prompt: DetectedMoneyPrompt) => {
    if (!currentUser) return;

    // Create entry in ledger
    const newEntry: SimpleMoneyEntry = {
      id: 'entry-detected-' + Date.now(),
      userId: currentUser.id,
      type: prompt.type,
      amount: prompt.amount,
      date: prompt.date,
      monthKey: getMonthKeyFromDate(prompt.date),
      whatFor: prompt.personOrCategory,
      person: prompt.type === 'lent' || prompt.type === 'borrowed' ? prompt.personOrCategory : undefined,
      createdAt: new Date().toISOString(),
    };

    setEntries((prev) => [newEntry, ...prev]);

    // Update note prompt to confirmed
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId && n.detectedPrompt
          ? {
              ...n,
              detectedPrompt: { ...n.detectedPrompt, confirmed: true },
            }
          : n
      )
    );

    playChimeSound('success');
  };

  const handleEditDetectedTransaction = (prompt: DetectedMoneyPrompt) => {
    setAddModalInitialType(prompt.type);
    setShowAddModal(true);
  };

  // Settings Handlers
  const handleUpdateSettings = (updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      if (updates.theme) {
        document.documentElement.classList.remove('dark', 'light', 'oled');
        document.documentElement.classList.add(updates.theme);
      }
      return next;
    });
  };

  const handleUpdateUserPin = (newPinHash: string) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, pinHash: newPinHash };
    setCurrentUser(updatedUser);
    setAllUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    saveAllUsers(allUsers.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
  };

  const handleToggleBiometrics = (enabled: boolean) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, biometricsEnabled: enabled };
    setCurrentUser(updatedUser);
    setAllUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    saveAllUsers(allUsers.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
  };

  // Reset ALL account data to pure zero
  const handleResetAccountData = () => {
    if (!currentUser) return;
    setEntries([]);
    setMonthBooks([]);
    setNotes([]);
    setNotifications([]);
    setSalaryConfig(DEFAULT_SALARY_CONFIG);
    const fresh = createFreshUserData(currentUser);
    saveUserData(currentUser.id, fresh);
    playChimeSound('alert');
  };

  // If not logged in, show AuthView
  if (!currentUser) {
    return <AuthView existingUsers={allUsers} onCompleteAuth={handleCompleteAuth} />;
  }

  // Active month book helper for Add Modal
  const activeBook = monthBooks.find((b) => b.monthKey === selectedMonthlyKey);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col md:flex-row relative">
      {/* Subtle Grain Noise Overlay */}
      <div className="noise-overlay" aria-hidden="true" />

      {/* Lock Screen */}
      {isLocked && (
        <LockScreen
          pinHash={currentUser.pinHash}
          biometricsEnabled={currentUser.biometricsEnabled}
          biometricCredentialId={currentUser.biometricCredentialId}
          userName={currentUser.name}
          onUnlock={() => setIsLocked(false)}
          onLogout={handleLogout}
        />
      )}

      {/* Add Entry Modal (Single button from Section 4) */}
      {showAddModal && (
        <AddEntryModal
          currentMonthKey={selectedMonthlyKey}
          initialType={addModalInitialType}
          stillToSaveFromBefore={activeBook?.stillToSaveFromBefore || 0}
          currentMonthGoal={activeBook?.goal || 0}
          activeCurrency={settings.currency}
          existingLoans={entries}
          onAddEntry={handleAddEntry}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Desktop Navigation Sidebar (Left, Tab Names Only, No badges) */}
      <DesktopSidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        labelLanguage={settings.labelLanguage}
        onOpenAddModal={() => {
          setAddModalInitialType('expense');
          setShowAddModal(true);
        }}
        currentUser={currentUser}
        onLockVault={() => setIsLocked(true)}
        onLogout={handleLogout}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Mobile Top Header */}
      <MobileHeader
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        labelLanguage={settings.labelLanguage}
        onOpenAddModal={() => {
          setAddModalInitialType('expense');
          setShowAddModal(true);
        }}
        currentUser={currentUser}
        onLockVault={() => setIsLocked(true)}
        onLogout={handleLogout}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Mobile Drawer for Notes, Salary, Settings */}
      <MobileDrawer
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        labelLanguage={settings.labelLanguage}
        onOpenAddModal={() => {
          setAddModalInitialType('expense');
          setShowAddModal(true);
        }}
        currentUser={currentUser}
        onLockVault={() => setIsLocked(true)}
        onLogout={handleLogout}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content Workspace Area */}
      <main className="flex-1 pb-24 md:pb-8 pt-4 overflow-y-auto">
        {currentTab === 'home' && (
          <HomeView
            currentMonthKey={selectedMonthlyKey}
            entries={entries}
            monthBooks={monthBooks}
            activeCurrency={settings.currency}
            onOpenAddModal={(type) => {
              setAddModalInitialType(type || 'expense');
              setShowAddModal(true);
            }}
            onDeleteEntry={handleDeleteEntry}
            onAddExtraToGoal={handleAddExtraToGoal}
          />
        )}

        {currentTab === 'monthly' && (
          <MonthlyView
            currentMonthKey={todayMonthKey}
            selectedMonthKey={selectedMonthlyKey}
            onSelectMonthKey={setSelectedMonthlyKey}
            entries={entries}
            monthBooks={monthBooks}
            activeCurrency={settings.currency}
            onOpenAddModal={(mKey) => {
              if (mKey) setSelectedMonthlyKey(mKey);
              setAddModalInitialType('expense');
              setShowAddModal(true);
            }}
            onWithdrawFromLockedMonth={handleWithdrawFromLockedMonth}
          />
        )}

        {currentTab === 'daily' && (
          <DailyView
            entries={entries}
            activeCurrency={settings.currency}
            onOpenAddModal={(type) => {
              setAddModalInitialType(type || 'expense');
              setShowAddModal(true);
            }}
            onDeleteEntry={handleDeleteEntry}
          />
        )}

        {currentTab === 'savings' && (
          <SavingsView
            currentMonthKey={selectedMonthlyKey}
            entries={entries}
            monthBooks={monthBooks}
            activeCurrency={settings.currency}
            onOpenAddModal={() => {
              setAddModalInitialType('money_in');
              setShowAddModal(true);
            }}
          />
        )}

        {currentTab === 'notes' && (
          <NotesView
            currentMonthKey={selectedMonthlyKey}
            notes={notes}
            activeCurrency={settings.currency}
            onAddNote={(note) => {
              if (!currentUser) return;
              const newNote: SmartNote = {
                ...note,
                id: 'note-' + Date.now(),
                userId: currentUser.id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              setNotes((prev) => [newNote, ...prev]);
              playChimeSound('success');
            }}
            onUpdateNote={(id, updates) => {
              setNotes((prev) =>
                prev.map((n) =>
                  n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
                )
              );
            }}
            onDeleteNote={(id) => {
              setNotes((prev) => prev.filter((n) => n.id !== id));
            }}
            onConfirmDetectedTransaction={handleConfirmDetectedTransaction}
            onEditDetectedTransaction={handleEditDetectedTransaction}
          />
        )}

        {currentTab === 'salary' && (
          <SalaryView
            entries={entries}
            activeCurrency={settings.currency}
            salaryConfig={salaryConfig}
            onUpdateSalaryConfig={(updates) => setSalaryConfig((prev) => ({ ...prev, ...updates }))}
            onOpenAddSalaryModal={() => {
              setAddModalInitialType('money_in');
              setShowAddModal(true);
            }}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            currentUser={currentUser}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onUpdateUserPin={handleUpdateUserPin}
            onToggleBiometrics={handleToggleBiometrics}
            onResetAccountData={handleResetAccountData}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (5 buttons with center +) */}
      <MobileBottomBar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        labelLanguage={settings.labelLanguage}
        onOpenAddModal={() => {
          setAddModalInitialType('expense');
          setShowAddModal(true);
        }}
        currentUser={currentUser}
        onLockVault={() => setIsLocked(true)}
        onLogout={handleLogout}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
    </div>
  );
}
