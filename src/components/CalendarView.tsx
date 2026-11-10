import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  DollarSign,
  AlertCircle,
  Clock,
  CheckCircle2,
  X,
  Filter,
  Radio,
  Globe,
  Bell,
  BellRing,
  Volume2,
} from 'lucide-react';
import { BudgetItem, CalendarEvent, EventType, Note, SalaryConfig, SupportedCurrency } from '../types';
import { getPaydaysForMonth } from '../services/salaryMath';
import { formatCurrencyValue } from '../services/currency';
import { playChimeSound } from '../services/notifications';

interface CalendarViewProps {
  events: CalendarEvent[];
  onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  onUpdateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  onDeleteEvent: (id: string) => void;
  salaryConfig: SalaryConfig;
  budgetItems: BudgetItem[];
  notes: Note[];
  searchQuery: string;
  activeCurrency?: SupportedCurrency;
  currencyRates?: Record<SupportedCurrency, number>;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  salaryConfig,
  budgetItems,
  notes,
  searchQuery,
  activeCurrency = 'USD',
  currencyRates = { USD: 1, PKR: 278.5, EGP: 49.3, EUR: 0.92, GBP: 0.79 },
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState<EventType | 'all' | 'receivables'>('all');
  const [liveTime, setLiveTime] = useState(new Date());
  const [activeTz, setActiveTz] = useState<'local' | 'PKT' | 'EGP' | 'EST'>('PKT');
  const [alarmPlayedNotice, setAlarmPlayedNotice] = useState<string | null>(null);

  // Real-time live clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // New event form state
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('09:00');
  const [newType, setNewType] = useState<EventType>('event');
  const [newDescription, setNewDescription] = useState('');
  const [newAmount, setNewAmount] = useState<number | undefined>();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Compute calendar grid days
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Dynamically project salary paydays for this month
  const scheduledPaydays = getPaydaysForMonth(salaryConfig, year, month);

  // Month navigation
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(today.toISOString().split('T')[0]);
  };

  // Helper to format date string YYYY-MM-DD
  const formatDayString = (y: number, m: number, d: number) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${y}-${pad(m + 1)}-${pad(d)}`;
  };

  // Build list of calendar items for a given date
  const getItemsForDate = (dateStr: string) => {
    const items: Array<{
      id: string;
      title: string;
      type: EventType;
      color: string;
      time?: string;
      amount?: number;
      isCompleted?: boolean;
      isAlarmEnabled?: boolean;
      receivablePerson?: string;
      source: 'custom' | 'salary' | 'bill' | 'note';
    }> = [];

    const dayNumber = parseInt(dateStr.split('-')[2], 10);
    const itemMonth = parseInt(dateStr.split('-')[1], 10) - 1;

    // 1. Dynamic salary payday check
    if (itemMonth === month && scheduledPaydays.includes(dayNumber)) {
      items.push({
        id: `auto-payday-${dateStr}`,
        title: `💵 Payday Deposit`,
        type: 'salary',
        color: '#10b981',
        time: '08:00',
        amount: salaryConfig.baseSalary > 0 ? Math.round(salaryConfig.baseSalary / 24) : 2800,
        isCompleted: new Date(dateStr) <= new Date(),
        source: 'salary',
      });
    }

    // 2. Custom events
    events.forEach((evt) => {
      if (evt.date === dateStr) {
        items.push({
          id: evt.id,
          title: evt.title,
          type: evt.type,
          color: evt.color || (evt.isAlarmEnabled ? '#a855f7' : '#6366f1'),
          time: evt.time,
          amount: evt.amount,
          isCompleted: evt.isCompleted,
          isAlarmEnabled: evt.isAlarmEnabled,
          receivablePerson: evt.receivablePerson,
          source: 'custom',
        });
      }
    });

    // 3. Recurring bills and budget items due on this day of month
    budgetItems.forEach((b) => {
      if (b.isRecurring && b.dueDate === dayNumber && itemMonth === month) {
        items.push({
          id: `bill-${b.id}-${dateStr}`,
          title: `💳 ${b.title}`,
          type: 'bill',
          color: '#f59e0b',
          amount: b.amount,
          isCompleted: b.isPaid,
          source: 'bill',
        });
      } else if (b.date === dateStr && !b.isRecurring) {
        items.push({
          id: `expense-${b.id}`,
          title: `🧾 ${b.title}`,
          type: 'bill',
          color: '#ec4899',
          amount: b.amount,
          isCompleted: b.isPaid,
          source: 'bill',
        });
      }
    });

    // 4. Notes with reminder date
    notes.forEach((n) => {
      if (n.reminderDate === dateStr && !n.isTrash) {
        items.push({
          id: `note-reminder-${n.id}`,
          title: `📝 ${n.title}`,
          type: 'reminder',
          color: '#8b5cf6',
          source: 'note',
        });
      }
    });

    // Filter by type if active
    if (filterType === 'receivables') {
      return items.filter(
        (i: any) =>
          i.isAlarmEnabled ||
          i.receivablePerson ||
          i.title.toLowerCase().includes('collect') ||
          i.title.toLowerCase().includes('receivable') ||
          i.title.toLowerCase().includes('father') ||
          i.title.toLowerCase().includes('papa')
      );
    } else if (filterType !== 'all') {
      return items.filter((i) => i.type === filterType);
    }

    // Search query
    if (searchQuery) {
      return items.filter((i) =>
        i.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return items;
  };

  const handleCreateEvent = () => {
    if (!newTitle.trim() || !newDate) return;

    let color = '#6366f1';
    if (newType === 'salary') color = '#10b981';
    if (newType === 'bill') color = '#f59e0b';
    if (newType === 'reminder') color = '#ec4899';

    onAddEvent({
      title: newTitle.trim(),
      date: newDate,
      time: newTime || undefined,
      type: newType,
      color,
      amount: newAmount,
      description: newDescription.trim() || undefined,
    });

    setNewTitle('');
    setNewDescription('');
    setNewAmount(undefined);
    setShowAddModal(false);
  };

  const openDayDrawer = (dateStr: string) => {
    setSelectedDay(dateStr);
    setNewDate(dateStr);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Timezone formatting helper
  const getFormattedLiveTime = () => {
    let tzOption: string | undefined = undefined;
    if (activeTz === 'PKT') tzOption = 'Asia/Karachi';
    if (activeTz === 'EGP') tzOption = 'Africa/Cairo';
    if (activeTz === 'EST') tzOption = 'America/New_York';

    try {
      return liveTime.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: tzOption,
      });
    } catch {
      return liveTime.toLocaleTimeString();
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-6">
      {/* CALENDAR LIVE BANNER */}
      <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-neutral-900 via-neutral-900 to-emerald-950/20 p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Calendar Live
                </span>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-300 border border-emerald-500/30">
                  Real-Time Agenda Engine
                </span>
              </div>
              <p className="text-xs text-neutral-300 mt-0.5">
                Live paydays, recurring bills &amp; agenda tracking across global timezones
              </p>
            </div>
          </div>

          {/* Live Digital Clock & Timezone Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/80 px-3.5 py-1.5 flex items-center gap-2 font-mono">
              <Clock className="h-4 w-4 text-emerald-400" />
              <span className="font-bold text-base text-white">{getFormattedLiveTime()}</span>
              <span className="text-[10px] text-neutral-400 uppercase">
                {activeTz === 'local' ? 'Local' : activeTz}
              </span>
            </div>

            <div className="flex items-center rounded-xl border border-neutral-800 bg-neutral-950 p-1 text-[11px]">
              {(['local', 'PKT', 'EGP', 'EST'] as const).map((tz) => (
                <button
                  key={tz}
                  onClick={() => setActiveTz(tz)}
                  className={`rounded-lg px-2.5 py-1 transition font-medium ${
                    activeTz === tz
                      ? 'bg-neutral-800 text-emerald-300 font-bold shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {tz === 'local'
                    ? '📍 Local'
                    : tz === 'PKT'
                    ? '🇵🇰 PKT'
                    : tz === 'EGP'
                    ? '🇪🇬 EGP'
                    : '🇺🇸 EST'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RECEIVABLES & MULTI-STAGE ALARM TIMELINE BANNER (1 Oct 2026, 1 Nov 2026, 1 Dec 2026) */}
      <div className="mb-6 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-neutral-900 via-neutral-900 to-purple-950/30 p-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 shrink-0">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  🔔 Multi-Stage Receivable &amp; Audio Alarm Timeline
                </span>
                <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] font-mono text-purple-300 border border-purple-500/30">
                  1 Oct 2026 &bull; 1 Nov 2026 &bull; 1 Dec 2026
                </span>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                  Rs. 25,000 (PKR)
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mt-1">
                Scheduled Recovery: Father (Papa) &bull; Alarms Active for 1 Oct 2026, 1 Nov 2026 &amp; 1 Dec 2026
              </h3>
              <p className="text-xs text-neutral-300 mt-0.5">
                Multi-stage recovery tracking: <strong>1 Oct 2026</strong> (60-day check-in), <strong>1 Nov 2026</strong> (30-day pre-due alert), and <strong>1 Dec 2026</strong> (Final settlement &rarr; Net savings reaches <strong className="text-emerald-400">Rs. 121,000</strong>, crushing the Rs. 120,000 2-month goal).
              </p>
              {alarmPlayedNotice && (
                <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{alarmPlayedNotice}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                playChimeSound('alert');
                setAlarmPlayedNotice('🔔 Test Alarm chime sounded! Alarms armed for 1 Oct, 1 Nov, and 1 Dec 2026.');
                setTimeout(() => setAlarmPlayedNotice(null), 4000);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-950/40 transition"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Test Alarm Sound</span>
            </button>
            <button
              onClick={() => {
                setCurrentDate(new Date(2026, 9, 1));
                setSelectedDay('2026-10-01');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-purple-300 text-xs font-semibold border border-purple-500/40 transition"
              title="Jump to 1 October 2026"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Jump to 1 Oct 2026</span>
            </button>
            <button
              onClick={() => {
                setCurrentDate(new Date(2026, 10, 1));
                setSelectedDay('2026-11-01');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-purple-300 text-xs font-semibold border border-purple-500/40 transition"
              title="Jump to 1 November 2026"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Jump to 1 Nov 2026</span>
            </button>
            <button
              onClick={() => {
                setCurrentDate(new Date(2026, 11, 1));
                setSelectedDay('2026-12-01');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-emerald-300 text-xs font-semibold border border-emerald-500/40 transition"
              title="Jump to 1 December 2026"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Jump to 1 Dec 2026</span>
            </button>
            <button
              onClick={() => {
                setFilterType('receivables');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                filterType === 'receivables'
                  ? 'bg-purple-900/60 text-purple-200 border-purple-500'
                  : 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:border-neutral-500'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter Receivables Only</span>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Header Controls */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>{monthName} {year}</span>
            </h2>
            <p className="text-xs text-neutral-400">
              Synced with Paydays, Bills, Notes &amp; Loan Receivables
            </p>
          </div>
        </div>

        {/* Filters & Month Nav Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-900 p-0.5 text-xs">
            {(['all', 'receivables', 'salary', 'bill', 'reminder', 'event'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`rounded px-2.5 py-1 text-xs capitalize transition ${
                  filterType === t
                    ? 'bg-neutral-800 text-white font-medium shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {t === 'receivables' ? '🔔 Receivables' : t === 'salary' ? '💰 Paydays' : t === 'bill' ? '💳 Bills' : t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 border-l border-neutral-800 pl-2">
            <button
              onClick={goToday}
              className="rounded-lg border border-neutral-700/60 bg-neutral-800/60 px-2.5 py-1 text-xs font-medium text-neutral-200 hover:bg-neutral-700 transition"
            >
              Today
            </button>
            <button
              onClick={prevMonth}
              className="rounded-lg border border-neutral-700/60 bg-neutral-800/60 p-1.5 text-neutral-300 hover:bg-neutral-700 transition"
              title="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextMonth}
              className="rounded-lg border border-neutral-700/60 bg-neutral-800/60 p-1.5 text-neutral-300 hover:bg-neutral-700 transition"
              title="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => {
              setNewDate(todayStr);
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 shadow-sm transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 shadow-xl overflow-hidden">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-neutral-800 bg-neutral-900/80 text-center text-xs font-semibold text-neutral-400 py-2.5">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* 7-column Month Days Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-neutral-800/60">
          {/* Previous month trailing days */}
          {Array.from({ length: firstDayOfMonth }).map((_, idx) => {
            const dayNum = daysInPrevMonth - firstDayOfMonth + idx + 1;
            return (
              <div
                key={`prev-${idx}`}
                className="min-h-[105px] sm:min-h-[120px] p-1.5 sm:p-2 bg-neutral-950/40 text-neutral-600 cursor-not-allowed"
              >
                <span className="text-xs">{dayNum}</span>
              </div>
            );
          })}

          {/* Current month days */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateStr = formatDayString(year, month, dayNum);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDay;
            const items = getItemsForDate(dateStr);

            return (
              <div
                key={dateStr}
                onClick={() => openDayDrawer(dateStr)}
                className={`min-h-[105px] sm:min-h-[120px] p-1.5 sm:p-2 transition cursor-pointer relative group flex flex-col justify-between ${
                  isSelected
                    ? 'bg-neutral-800/90 ring-1 ring-emerald-500/50'
                    : 'bg-neutral-900/30 hover:bg-neutral-800/40'
                }`}
              >
                <div>
                  {/* Day Number Header */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                        isToday
                          ? 'bg-emerald-500 font-bold text-neutral-950 shadow-md shadow-emerald-500/30'
                          : 'text-neutral-300 group-hover:text-white'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {items.length > 0 && (
                      <span className="text-[10px] text-neutral-500 font-mono hidden sm:inline">
                        {items.length} {items.length === 1 ? 'item' : 'items'}
                      </span>
                    )}
                  </div>

                  {/* Badges preview */}
                  <div className="space-y-1 overflow-hidden">
                    {items.slice(0, 3).map((item: any) => (
                      <div
                        key={item.id}
                        className={`truncate rounded px-1.5 py-0.5 text-[10px] font-medium border ${
                          item.isAlarmEnabled
                            ? 'bg-purple-900/50 text-purple-200 border-purple-500/60 font-bold'
                            : item.type === 'salary'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : item.type === 'bill'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : item.type === 'reminder'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                        }`}
                        title={`${item.title} ${item.amount ? `($${item.amount})` : ''}`}
                      >
                        {item.isAlarmEnabled ? `🔔 ${item.title}` : item.title}
                      </div>
                    ))}
                    {items.length > 3 && (
                      <div className="text-[9px] text-neutral-400 font-medium pl-1">
                        +{items.length - 3} more...
                      </div>
                    )}
                  </div>
                </div>

                {/* Hover Quick Add indicator */}
                <div className="opacity-0 group-hover:opacity-100 flex justify-end">
                  <span className="text-[10px] text-neutral-400 hover:text-emerald-400 font-medium">
                    + Add
                  </span>
                </div>
              </div>
            );
          })}

          {/* Next month leading days to complete row */}
          {(() => {
            const totalCells = firstDayOfMonth + daysInMonth;
            const remaining = (7 - (totalCells % 7)) % 7;
            return Array.from({ length: remaining }).map((_, idx) => (
              <div
                key={`next-${idx}`}
                className="min-h-[105px] sm:min-h-[120px] p-1.5 sm:p-2 bg-neutral-950/40 text-neutral-600 cursor-not-allowed"
              >
                <span className="text-xs">{idx + 1}</span>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Selected Day Agenda Drawer / Panel */}
      {selectedDay && (
        <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/90 p-5 shadow-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Agenda for {new Date(selectedDay + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                {selectedDay === todayStr && (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400 font-semibold border border-emerald-500/30">
                    Today
                  </span>
                )}
              </h3>
              <p className="text-xs text-neutral-400">
                Scheduled salary deposits, recurring expenses, events, and linked notes
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setNewDate(selectedDay);
                  setShowAddModal(true);
                }}
                className="flex items-center gap-1 rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-neutral-700 transition"
              >
                <Plus className="h-3 w-3" />
                Add Item
              </button>
              <button
                onClick={() => setSelectedDay(null)}
                className="rounded-lg p-1 text-neutral-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            {getItemsForDate(selectedDay).length === 0 ? (
              <div className="py-6 text-center text-xs text-neutral-400">
                No events or bills scheduled for this date.
              </div>
            ) : (
              getItemsForDate(selectedDay).map((item: any) => (
                <div
                  key={item.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border p-3.5 text-xs gap-3 ${
                    item.isAlarmEnabled
                      ? 'border-purple-500/50 bg-gradient-to-r from-neutral-950 via-purple-950/20 to-neutral-950 shadow-md shadow-purple-950/30'
                      : 'border-neutral-800 bg-neutral-950/60'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div
                      className={`h-3.5 w-3.5 rounded-full mt-1 sm:mt-0 shrink-0`}
                      style={{ backgroundColor: item.color }}
                    />
                    <div>
                      <div className="font-semibold text-neutral-100 flex flex-wrap items-center gap-2">
                        <span>{item.title}</span>
                        {item.time && (
                          <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {item.time}
                          </span>
                        )}
                        {item.isAlarmEnabled && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-500/40">
                            <Bell className="w-3 h-3 text-purple-400" />
                            Alarm Active ({new Date((item.date || selectedDay) + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })})
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-400 capitalize mt-0.5">
                        Type: {item.type} {item.source !== 'custom' ? `(${item.source})` : ''}
                        {item.receivablePerson && (
                          <span className="ml-2 text-purple-300 font-medium">
                            &bull; Debtor / Borrower: {item.receivablePerson}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800/60">
                    {item.isAlarmEnabled && (
                      <button
                        onClick={() => {
                          playChimeSound('alert');
                          setAlarmPlayedNotice('🔔 Alarm Chime Sounded!');
                          setTimeout(() => setAlarmPlayedNotice(null), 3000);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-purple-600/30 text-purple-200 border border-purple-500/40 hover:bg-purple-600/50 text-[11px] font-semibold transition"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Test Alarm</span>
                      </button>
                    )}

                    {item.amount !== undefined && (
                      <span className="font-mono font-bold text-sm text-neutral-100">
                        {formatCurrencyValue(item.amount, activeCurrency, currencyRates)}
                      </span>
                    )}

                    {item.source === 'custom' && (
                      <button
                        onClick={() => onDeleteEvent(item.id)}
                        className="text-neutral-500 hover:text-rose-400 text-xs p-1"
                        title="Delete custom event"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="font-bold text-white text-base">Schedule New Item</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Project Delivery, Paycheck, Car Insurance"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 block mb-1">Date *</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">Time (Optional)</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 block mb-1">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as EventType)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none"
                  >
                    <option value="event">Event / Meeting</option>
                    <option value="salary">Salary / Paycheck</option>
                    <option value="bill">Bill / Due Payment</option>
                    <option value="reminder">Task Reminder</option>
                  </select>
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">Amount ($ Optional)</label>
                  <input
                    type="number"
                    placeholder="e.g. 150"
                    value={newAmount ?? ''}
                    onChange={(e) =>
                      setNewAmount(e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Description / Notes</label>
                <textarea
                  rows={3}
                  placeholder="Optional details or instructions..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
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
                onClick={handleCreateEvent}
                className="rounded-lg bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-emerald-400"
              >
                Add to Calendar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
