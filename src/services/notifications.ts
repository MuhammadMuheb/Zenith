import { AppNotification, SimpleMoneyEntry } from '../types';

/**
 * Web Audio Bell Chime Generator
 * Synthesizes a soft, clear glass chime using browser Web Audio API
 */
export function playChimeSound(type: 'success' | 'alert' | 'payday' = 'alert') {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'payday') {
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
 * Evaluate daily loan alarms and alerts
 */
export function checkLoanAlarms(
  entries: SimpleMoneyEntry[],
  existingNotifications: AppNotification[]
): AppNotification[] {
  const newAlerts: AppNotification[] = [];
  const todayStr = new Date().toISOString().split('T')[0];

  const pendingDue = entries.filter(
    (e) =>
      e.type === 'lent' &&
      !e.isCleared &&
      e.returnDate &&
      e.returnDate <= todayStr
  );

  pendingDue.forEach((loan) => {
    const title = `Loan Alarm: ${loan.person || 'Friend'}`;
    const message = `Today: take ${loan.amount.toLocaleString()} from ${loan.person || 'Friend'}.`;
    const alreadyNotified = existingNotifications.some(
      (n) => n.message === message && n.timestamp.startsWith(todayStr)
    );

    if (!alreadyNotified) {
      newAlerts.push({
        id: 'alarm-' + loan.id + '-' + todayStr,
        title,
        message,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'loan',
      });
    }
  });

  return newAlerts;
}
