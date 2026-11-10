import { AppNotification, BudgetItem, CalendarEvent, SalaryConfig } from '../types';

/**
 * Web Audio Bell Chime Generator
 * Synthesizes a soft, clear glass chime using browser Web Audio API
 */
export function playChimeSound(type: 'success' | 'alert' | 'payday' = 'alert') {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'payday') {
      // Play a cheerful two-tone chime (E5 -> B5)
      const now = ctx.currentTime;
      [
        { freq: 659.25, time: now, dur: 0.4 },
        { freq: 880.0, time: now + 0.15, dur: 0.6 },
        { freq: 1046.5, time: now + 0.3, dur: 0.8 },
      ].forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.18, time + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + dur);
      });
      return;
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    const freq = type === 'success' ? 784 : 587.33; // G5 or D5
    osc.frequency.setValueAtTime(freq, now);
    if (type === 'success') {
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
    }

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  } catch {
    // AudioContext blocked or unsupported
  }
}

/**
 * Request real Web Notification API permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return await Notification.requestPermission();
}

/**
 * Trigger browser native notification if permitted
 */
export function sendBrowserNotification(title: string, options?: NotificationOptions) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: 'https://api.iconify.design/lucide:shield-check.svg',
        badge: 'https://api.iconify.design/lucide:calendar.svg',
        ...options,
      });
    } catch {
      // Ignore if iframe forbids
    }
  }
}

/**
 * Check upcoming events, paydays, and bills to generate smart auto-notifications
 */
export function evaluateAutoNotifications(
  salary: SalaryConfig,
  expenses: BudgetItem[],
  events: CalendarEvent[],
  existingNotifications: AppNotification[]
): AppNotification[] {
  const newAlerts: AppNotification[] = [];
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const currentDay = today.getDate();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  const isDuplicate = (title: string) => {
    return (
      existingNotifications.some((n) => n.title === title && n.timestamp.startsWith(todayStr)) ||
      newAlerts.some((n) => n.title === title)
    );
  };

  // 1. Payday notification check
  const isPaydayToday =
    currentDay === salary.payDayDate ||
    (salary.payDayFrequency === 'semi-monthly' && currentDay === salary.payDayDateSecondary);

  const daysUntilPayday =
    salary.payDayDate >= currentDay
      ? salary.payDayDate - currentDay
      : new Date(currentYear, currentMonth, 0).getDate() - currentDay + salary.payDayDate;

  if (isPaydayToday && !isDuplicate('💰 Payday is Today!')) {
    newAlerts.push({
      id: 'payday-' + todayStr,
      title: '💰 Payday is Today!',
      message: `Your scheduled paycheck deposit is ready. Verify your net take-home pay and update your savings.`,
      timestamp: new Date().toISOString(),
      type: 'salary',
      read: false,
      actionTab: 'salary',
    });
  } else if (daysUntilPayday === 1 && !isDuplicate('💵 Payday Tomorrow')) {
    newAlerts.push({
      id: 'payday-tomorrow-' + todayStr,
      title: '💵 Payday Tomorrow',
      message: `Get ready! Scheduled deposit arriving tomorrow. Budget allocations are locked.`,
      timestamp: new Date().toISOString(),
      type: 'salary',
      read: false,
      actionTab: 'salary',
    });
  }

  // 2. Upcoming recurring bills check (within 3 days)
  expenses.forEach((item) => {
    if (item.isRecurring && !item.isPaid && item.dueDate) {
      let daysRemaining = item.dueDate - currentDay;
      if (daysRemaining < 0) {
        // already passed this month
        daysRemaining += new Date(currentYear, currentMonth, 0).getDate();
      }

      if (daysRemaining === 0) {
        const title = `⚠️ Bill Due Today: ${item.title}`;
        if (!isDuplicate(title)) {
          newAlerts.push({
            id: `bill-due-${item.id}-${todayStr}`,
            title,
            message: `${item.title} ($${item.amount.toLocaleString()}) is scheduled for payment today.`,
            timestamp: new Date().toISOString(),
            type: 'bill',
            read: false,
            actionTab: 'budget',
          });
        }
      } else if (daysRemaining <= 3) {
        const title = `⏰ Upcoming Bill: ${item.title}`;
        if (!isDuplicate(title)) {
          newAlerts.push({
            id: `bill-warn-${item.id}-${todayStr}`,
            title,
            message: `${item.title} ($${item.amount.toLocaleString()}) is due in ${daysRemaining} day${
              daysRemaining > 1 ? 's' : ''
            }.`,
            timestamp: new Date().toISOString(),
            type: 'bill',
            read: false,
            actionTab: 'budget',
          });
        }
      }
    }
  });

  // 3. Today's calendar reminders
  events.forEach((evt) => {
    if (evt.date === todayStr && !isDuplicate(`📅 Reminder: ${evt.title}`)) {
      newAlerts.push({
        id: `cal-today-${evt.id}`,
        title: `📅 Reminder: ${evt.title}`,
        message: evt.description || `Scheduled item at ${evt.time || 'all day'}.`,
        timestamp: new Date().toISOString(),
        type: 'reminder',
        read: false,
        actionTab: 'calendar',
      });
    }
  });

  // 4. Scheduled collection alarms (e.g. 1 Dec 2026 Father collection)
  events.forEach((evt) => {
    if (evt.isAlarmEnabled && !isDuplicate(`🔔 Collection Alarm: ${evt.title}`)) {
      newAlerts.push({
        id: `alarm-${evt.id}`,
        title: `🔔 Collection Alarm: ${evt.title}`,
        message: `Scheduled for ${evt.date}. Collecting Rs. ${evt.amount?.toLocaleString() || '25,000'} achieves Rs. 121,000 in total savings (+Rs. 1,000 above your 2-Month Rs. 120,000 goal).`,
        timestamp: new Date().toISOString(),
        type: 'reminder',
        read: false,
        actionTab: 'calendar',
      });
    }
  });

  return newAlerts;
}
