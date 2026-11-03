import { dueInfo, formatShortDate, type DueInfo } from "@/lib/due";
import type { AppData, Epic, Project, Task } from "@/lib/types";

export interface TaskView extends Task {
  due: DueInfo;
  dateLabel: string;
  done: boolean;
}

export interface ProjectStats {
  total: number;
  done: number;
  pct: number;
  late: number;
  soon: number;
}

/** Tag colors per urgency. Text on background is ≥ 4.5:1 in every pair. */
export const DUE_STYLES: Record<DueInfo["level"], string> = {
  late: "bg-[#F5D3CC] text-[#8C2516]",
  soon: "bg-[#FAE0C2] text-[#874108]",
  week: "bg-[#F3EBC4] text-[#5E4A06]",
  ok: "bg-[#EFEBE4] text-[#4A4640]",
  done: "bg-[#E1E8DC] text-[#2F4A2C]",
};

/** Today and tomorrow read as red, like overdue: they need action now. */
export function dueStyle(due: DueInfo) {
  if (due.level === "soon" && due.days === 0) return DUE_STYLES.late;
  return DUE_STYLES[due.level];
}

export function viewTask(task: Task, today: string): TaskView {
  return {
    ...task,
    due: dueInfo(task.due_date, task.status, today),
    dateLabel: formatShortDate(task.due_date),
    done: task.status === "hecho",
  };
}

export function statsFor(tasks: TaskView[]): ProjectStats {
  const done = tasks.filter((t) => t.done).length;
  return {
    total: tasks.length,
    done,
    pct: tasks.length ? Math.round((done * 100) / tasks.length) : 0,
    late: tasks.filter((t) => t.due.level === "late").length,
    soon: tasks.filter((t) => t.due.level === "soon").length,
  };
}

export function needsAttention(t: TaskView) {
  return t.due.level === "late" || t.due.level === "soon";
}

/** Pending first, then by how soon they are due. */
export function byUrgency(a: TaskView, b: TaskView) {
  return Number(a.done) - Number(b.done) || a.due.days - b.due.days;
}

export interface AlertItem extends TaskView {
  project: Project;
  epic: Epic | undefined;
}

/** Overdue tasks and those due within three days, across every project. */
export function alertsFor(data: AppData, today: string): AlertItem[] {
  const projects = new Map(data.projects.map((p) => [p.id, p]));
  const epics = new Map(data.epics.map((e) => [e.id, e]));
  return data.tasks
    .map((t) => viewTask(t, today))
    .filter(needsAttention)
    .sort(byUrgency)
    .flatMap((t) => {
      const project = projects.get(t.project_id);
      return project ? [{ ...t, project, epic: epics.get(t.epic_id) }] : [];
    });
}

export type TaskFilter = "all" | "soon" | "late" | "done";

export function matchesFilter(t: TaskView, filter: TaskFilter, query: string) {
  const q = query.trim().toLowerCase();
  if (q && !`${t.title} ${t.tag} ${t.assignee}`.toLowerCase().includes(q)) {
    return false;
  }
  if (filter === "soon") return t.due.level === "soon";
  if (filter === "late") return t.due.level === "late";
  if (filter === "done") return t.done;
  return true;
}

export const STATUS_LABEL: Record<Task["status"], string> = {
  pendiente: "Pendiente",
  proceso: "En proceso",
  hecho: "Hecha",
};

export const NEXT_STATUS: Record<Task["status"], Task["status"]> = {
  pendiente: "proceso",
  proceso: "hecho",
  hecho: "pendiente",
};
