import type { AppData, Epic, Project, Task, TaskPatch } from "@/lib/types";

/**
 * Offline layer. Every change is an `Op`: it is applied to the local data at
 * once and queued in an outbox kept in localStorage; the outbox is sent to the
 * server in order whenever there is signal. What the screen shows is always
 * `pending ops applied on top of the last data the server returned`, so a
 * reload never loses an unsent change.
 *
 * Ids are generated on the phone (UUIDs), so an op can be created offline and
 * replayed safely: the API ignores a create whose id already exists.
 */
export type Op =
  | { kind: "createProject"; project: Project; epics: Epic[] }
  | { kind: "deleteProject"; id: string }
  | { kind: "createEpic"; epic: Epic }
  | { kind: "deleteEpic"; id: string }
  | { kind: "createTask"; task: Task }
  | { kind: "updateTask"; id: string; patch: TaskPatch }
  | { kind: "deleteTask"; id: string };

export interface QueuedOp {
  /** Unique per op, so the outbox can drop exactly the one that was sent. */
  opId: string;
  op: Op;
}

export const EMPTY_DATA: AppData = { projects: [], epics: [], tasks: [] };

export function applyOp(data: AppData, op: Op): AppData {
  switch (op.kind) {
    case "createProject":
      if (data.projects.some((p) => p.id === op.project.id)) return data;
      return {
        ...data,
        projects: [...data.projects, op.project],
        epics: [...data.epics, ...op.epics],
      };
    case "deleteProject":
      return {
        projects: data.projects.filter((p) => p.id !== op.id),
        epics: data.epics.filter((e) => e.project_id !== op.id),
        tasks: data.tasks.filter((t) => t.project_id !== op.id),
      };
    case "createEpic":
      if (data.epics.some((e) => e.id === op.epic.id)) return data;
      return { ...data, epics: [...data.epics, op.epic] };
    case "deleteEpic":
      return {
        ...data,
        epics: data.epics.filter((e) => e.id !== op.id),
        tasks: data.tasks.filter((t) => t.epic_id !== op.id),
      };
    case "createTask":
      if (data.tasks.some((t) => t.id === op.task.id)) return data;
      return { ...data, tasks: [...data.tasks, op.task] };
    case "updateTask":
      return {
        ...data,
        tasks: data.tasks.map((t) =>
          t.id === op.id ? { ...t, ...op.patch } : t,
        ),
      };
    case "deleteTask":
      return { ...data, tasks: data.tasks.filter((t) => t.id !== op.id) };
  }
}

export function applyAll(base: AppData, outbox: QueuedOp[]): AppData {
  return outbox.reduce((d, q) => applyOp(d, q.op), base);
}

// --- Persistence -----------------------------------------------------------

const DATA_KEY = "obra-clara:data";
const OUTBOX_KEY = "obra-clara:outbox";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked (private mode): the app still works while open.
  }
}

/** Last data the server returned, or null if this phone never loaded it. */
export function loadSnapshot(): AppData | null {
  return read<AppData | null>(DATA_KEY, null);
}

export function saveSnapshot(data: AppData) {
  write(DATA_KEY, data);
}

export function loadOutbox(): QueuedOp[] {
  return read<QueuedOp[]>(OUTBOX_KEY, []);
}

export function saveOutbox(outbox: QueuedOp[]) {
  write(OUTBOX_KEY, outbox);
}

export function newId(): string {
  return crypto.randomUUID();
}
