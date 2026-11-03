// Pure date logic shared by the app and the /api functions. Keep this file
// free of `@/` imports: Vercel bundles the functions without the tsconfig alias.

export type TaskStatus = "pendiente" | "proceso" | "hecho";

export type DueLevel = "done" | "late" | "soon" | "week" | "ok";

export interface DueInfo {
  level: DueLevel;
  label: string;
  days: number;
}

/** The app lives in Colombia; "today" is always computed in Bogotá time. */
export const APP_TIME_ZONE = "America/Bogota";

const MONTHS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

/** Today's date as `YYYY-MM-DD` in the app's time zone. */
export function todayISO(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function toUTCDay(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, (m || 1) - 1, d || 1);
}

/** Whole days from `today` to `iso` (negative when it is in the past). */
export function daysBetween(today: string, iso: string): number {
  return Math.round((toUTCDay(iso) - toUTCDay(today)) / 86_400_000);
}

export function addDays(iso: string, days: number): string {
  return new Date(toUTCDay(iso) + days * 86_400_000).toISOString().slice(0, 10);
}

/** `2026-11-12` → `12 nov` */
export function formatShortDate(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[(m || 1) - 1]}`;
}

export function dueInfo(
  dueDate: string,
  status: TaskStatus,
  today: string = todayISO(),
): DueInfo {
  const days = daysBetween(today, dueDate);
  if (status === "hecho") return { level: "done", label: "Completada", days };
  if (days < 0) {
    const n = -days;
    return {
      level: "late",
      label: `Vencida hace ${n} ${n === 1 ? "día" : "días"}`,
      days,
    };
  }
  if (days === 0) return { level: "soon", label: "Vence hoy", days };
  if (days === 1) return { level: "soon", label: "Vence mañana", days };
  if (days <= 3) return { level: "soon", label: `Vence en ${days} días`, days };
  if (days <= 7) return { level: "week", label: `En ${days} días`, days };
  return { level: "ok", label: `Vence ${formatShortDate(dueDate)}`, days };
}

/** Days-before-due on which the daily reminder mentions a task. */
export const REMINDER_DAYS = [3, 1, 0];

export interface ReminderTask {
  title: string;
  due_date: string;
  status: TaskStatus;
  project_name: string;
}

/**
 * Picks what today's reminder talks about: overdue tasks plus those due today,
 * tomorrow or in three days. Sorted most urgent first.
 */
export function selectReminders<T extends ReminderTask>(
  tasks: T[],
  today: string = todayISO(),
): (T & { days: number })[] {
  return tasks
    .filter((t) => t.status !== "hecho")
    .map((t) => ({ ...t, days: daysBetween(today, t.due_date) }))
    .filter((t) => t.days < 0 || REMINDER_DAYS.includes(t.days))
    .sort((a, b) => a.days - b.days);
}

/** Title and body of the daily push notification, or null when nothing is due. */
export function buildReminderMessage(
  reminders: (ReminderTask & { days: number })[],
  today: string = todayISO(),
): { title: string; body: string } | null {
  if (reminders.length === 0) return null;
  const late = reminders.filter((r) => r.days < 0).length;
  const todayCount = reminders.filter((r) => r.days === 0).length;

  const first = reminders[0];
  const firstLabel = dueInfo(first.due_date, first.status, today).label;
  const title =
    reminders.length === 1
      ? `${firstLabel}: ${first.title}`
      : `Tienes ${reminders.length} tareas para revisar`;

  const parts: string[] = [];
  if (late) parts.push(`${late} vencida${late === 1 ? "" : "s"}`);
  if (todayCount) parts.push(`${todayCount} para hoy`);
  const lines = reminders
    .slice(0, 3)
    .map((r) => `• ${r.title} (${r.project_name})`);
  const body = [parts.join(" · "), ...lines].filter(Boolean).join("\n");
  return { title, body };
}
