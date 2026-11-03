import { db } from "./supabase.js";
import { sendToAll } from "./push.js";
import {
  buildReminderMessage,
  selectReminders,
  todayISO,
  type TaskStatus,
} from "../app/lib/due.js";

/** Builds today's digest of due tasks and pushes it to every device. */
export async function sendDailyReminders(today: string = todayISO()) {
  const { data, error } = await db()
    .from("tasks")
    .select("title, due_date, status, projects(name)")
    .neq("status", "hecho");
  if (error) throw new Error(error.message);

  const tasks = (data ?? []).map((t) => {
    const project = t.projects as { name: string } | { name: string }[] | null;
    return {
      title: t.title as string,
      due_date: t.due_date as string,
      status: t.status as TaskStatus,
      project_name:
        (Array.isArray(project) ? project[0]?.name : project?.name) ?? "",
    };
  });

  const reminders = selectReminders(tasks, today);
  const message = buildReminderMessage(reminders, today);
  if (!message) return { reminders: 0, sent: 0, removed: 0 };

  const result = await sendToAll({
    ...message,
    url: "/",
    tag: `daily-${today}`,
  });
  return { reminders: reminders.length, ...result };
}
