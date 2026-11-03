import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { api, isRetryable, sendOp } from "@/lib/api";
import { todayISO } from "@/lib/due";
import {
  applyAll,
  EMPTY_DATA,
  loadOutbox,
  loadSnapshot,
  newId,
  saveOutbox,
  saveSnapshot,
  type Op,
  type QueuedOp,
} from "@/lib/offline";
import {
  DEFAULT_EPICS,
  EPIC_COLORS,
  type AppData,
  type Epic,
  type NewEpic,
  type NewProject,
  type NewTask,
  type Project,
  type Task,
  type TaskPatch,
} from "@/lib/types";

export interface SyncState {
  /** Last contact with the server worked. */
  online: boolean;
  /** Changes made on this phone that the server has not received yet. */
  pending: number;
  syncing: boolean;
}

interface ObrasContextValue {
  data: AppData;
  loading: boolean;
  error: string | null;
  today: string;
  sync: SyncState;
  reload: () => Promise<void>;
  createProject: (p: NewProject) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<boolean>;
  createEpic: (e: NewEpic) => Promise<Epic | null>;
  deleteEpic: (id: string) => Promise<boolean>;
  createTask: (t: NewTask) => Promise<Task | null>;
  updateTask: (id: string, patch: TaskPatch) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
}

const ObrasContext = createContext<ObrasContextValue | null>(null);
const RETRY_MS = 30_000;

function message(error: unknown) {
  return error instanceof Error ? error.message : "Algo salió mal.";
}

export function ObrasProvider({ children }: { children: React.ReactNode }) {
  const [base, setBase] = useState<AppData>(EMPTY_DATA);
  const [outbox, setOutbox] = useState<QueuedOp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [today, setToday] = useState(todayISO);

  // Refs mirror the state so the async sync loop always sees the latest queue.
  const outboxRef = useRef<QueuedOp[]>([]);
  const hasSnapshot = useRef(false);
  const flushing = useRef(false);

  const setQueue = useCallback((next: QueuedOp[]) => {
    outboxRef.current = next;
    saveOutbox(next);
    setOutbox(next);
  }, []);

  const reload = useCallback(async () => {
    try {
      const fresh = await api.load();
      saveSnapshot(fresh);
      hasSnapshot.current = true;
      setBase(fresh);
      setOnline(true);
      setError(null);
    } catch (e) {
      if (isRetryable(e)) setOnline(false);
      // With a saved copy the app keeps working; only a first-ever load fails.
      if (!hasSnapshot.current) setError(message(e));
    } finally {
      setLoading(false);
    }
  }, []);

  /** Sends queued changes in order; stops at the first one that can't go. */
  const flush = useCallback(async () => {
    if (flushing.current) return;
    flushing.current = true;
    setSyncing(true);
    try {
      // Changes made while the final reload is in flight are picked up by the
      // outer loop instead of waiting for the next retry.
      do {
        while (outboxRef.current.length > 0) {
          const next = outboxRef.current[0];
          try {
            await sendOp(next.op);
            setOnline(true);
          } catch (e) {
            if (isRetryable(e)) {
              setOnline(false);
              return;
            }
            // The server refused it for good (e.g. invalid data): drop it, or
            // it would block every change queued after it.
            toast.error(`No se pudo guardar un cambio: ${message(e)}`);
          }
          setQueue(outboxRef.current.filter((q) => q.opId !== next.opId));
        }
        await reload();
      } while (outboxRef.current.length > 0);
    } finally {
      flushing.current = false;
      setSyncing(false);
    }
  }, [reload, setQueue]);

  const sync = useCallback(
    () => (outboxRef.current.length > 0 ? flush() : reload()),
    [flush, reload],
  );

  useEffect(() => {
    const snapshot = loadSnapshot();
    if (snapshot) {
      hasSnapshot.current = true;
      setBase(snapshot);
      setLoading(false);
    }
    setQueue(loadOutbox());
    sync();

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      setToday(todayISO());
      sync();
    };
    const onOnline = () => sync();
    const onOffline = () => setOnline(false);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    const timer = setInterval(() => {
      if (outboxRef.current.length > 0) flush();
    }, RETRY_MS);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      clearInterval(timer);
    };
  }, [flush, setQueue, sync]);

  const enqueue = useCallback(
    (op: Op) => {
      setQueue([...outboxRef.current, { opId: newId(), op }]);
      flush();
    },
    [flush, setQueue],
  );

  const data = useMemo(() => applyAll(base, outbox), [base, outbox]);

  const value = useMemo<ObrasContextValue>(() => {
    const saved = (text: string) =>
      toast.success(text, {
        description:
          online && navigator.onLine
            ? undefined
            : "Sin señal: se guardó en el celular y se sincroniza al volver.",
      });

    return {
      data,
      loading,
      error,
      today,
      sync: { online, pending: outbox.length, syncing },
      reload: sync,

      async createProject(p) {
        const project: Project = {
          id: newId(),
          name: p.name,
          place: p.place || "Sin ubicación",
          type: p.type || "Obra",
          color: EPIC_COLORS[data.projects.length % EPIC_COLORS.length],
          created_at: new Date().toISOString(),
        };
        const epics: Epic[] = DEFAULT_EPICS.map((name, position) => ({
          id: newId(),
          project_id: project.id,
          name,
          position,
          color: EPIC_COLORS[position % EPIC_COLORS.length],
        }));
        enqueue({ kind: "createProject", project, epics });
        saved("Obra creada");
        return project;
      },

      async deleteProject(id) {
        enqueue({ kind: "deleteProject", id });
        saved("Obra eliminada");
        return true;
      },

      async createEpic(e) {
        const position = data.epics.filter(
          (x) => x.project_id === e.project_id,
        ).length;
        const epic: Epic = {
          id: newId(),
          project_id: e.project_id,
          name: e.name,
          position,
          color: EPIC_COLORS[position % EPIC_COLORS.length],
        };
        enqueue({ kind: "createEpic", epic });
        saved(`Épica creada: ${epic.name}`);
        return epic;
      },

      async deleteEpic(id) {
        enqueue({ kind: "deleteEpic", id });
        saved("Épica eliminada");
        return true;
      },

      async createTask(t) {
        const task: Task = {
          ...t,
          id: newId(),
          status: "pendiente",
          created_at: new Date().toISOString(),
        };
        enqueue({ kind: "createTask", task });
        saved("Tarea agregada");
        return task;
      },

      // Instant on screen; reaches the server whenever there is signal.
      async updateTask(id, patch) {
        enqueue({ kind: "updateTask", id, patch });
        return true;
      },

      async deleteTask(id) {
        enqueue({ kind: "deleteTask", id });
        saved("Tarea eliminada");
        return true;
      },
    };
  }, [
    data,
    loading,
    error,
    today,
    online,
    outbox.length,
    syncing,
    sync,
    enqueue,
  ]);

  return (
    <ObrasContext.Provider value={value}>{children}</ObrasContext.Provider>
  );
}

export function useObras() {
  const ctx = useContext(ObrasContext);
  if (!ctx) throw new Error("useObras debe usarse dentro de <ObrasProvider>.");
  return ctx;
}
