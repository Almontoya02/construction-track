import { createContext, useContext, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useObras } from "@/contexts/obras-context";
import { addDays } from "@/lib/due";
import { STATUS_LABEL } from "@/lib/obras";
import type { Task, TaskStatus } from "@/lib/types";

interface FormState {
  id?: string;
  project_id: string;
  epic_id: string;
  title: string;
  due_date: string;
  assignee: string;
  tag: string;
  status: TaskStatus;
}

interface TaskDialogApi {
  openNew: (opts?: { projectId?: string; epicId?: string }) => void;
  openEdit: (task: Task) => void;
}

const TaskDialogContext = createContext<TaskDialogApi | null>(null);

export function useTaskDialog() {
  const ctx = useContext(TaskDialogContext);
  if (!ctx)
    throw new Error(
      "useTaskDialog debe usarse dentro de <TaskDialogProvider>.",
    );
  return ctx;
}

export function TaskDialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data, today, createTask, updateTask, deleteTask } = useObras();
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const firstEpic = (projectId: string) =>
    data.epics.find((e) => e.project_id === projectId)?.id ?? "";

  const dialogApi = useMemo<TaskDialogApi>(
    () => ({
      openNew({ projectId, epicId } = {}) {
        const pid = projectId ?? data.projects[0]?.id ?? "";
        setForm({
          project_id: pid,
          epic_id: epicId ?? firstEpic(pid),
          title: "",
          due_date: addDays(today, 3),
          assignee: "",
          tag: "",
          status: "pendiente",
        });
        setError(null);
        setConfirmDelete(false);
      },
      openEdit(task) {
        setForm({ ...task });
        setError(null);
        setConfirmDelete(false);
      },
    }),
    [data, today],
  );

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    setError(null);
  };

  const editing = Boolean(form?.id);
  const epics = form
    ? data.epics.filter((e) => e.project_id === form.project_id)
    : [];

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    if (!form.title.trim()) return setError("Escribe qué hay que hacer.");
    if (!form.project_id) return setError("Primero crea una obra.");
    if (!form.epic_id)
      return setError("Esta obra no tiene épicas. Crea una primero.");
    if (!form.due_date) return setError("Elige la fecha límite.");

    setSaving(true);
    const fields = {
      epic_id: form.epic_id,
      title: form.title.trim(),
      due_date: form.due_date,
      assignee: form.assignee.trim(),
      tag: form.tag.trim(),
    };
    const ok = form.id
      ? await updateTask(form.id, { ...fields, status: form.status })
      : Boolean(await createTask({ ...fields, project_id: form.project_id }));
    setSaving(false);
    if (ok) setForm(null);
  }

  async function remove() {
    if (!form?.id) return;
    if (!confirmDelete) return setConfirmDelete(true);
    setSaving(true);
    const ok = await deleteTask(form.id);
    setSaving(false);
    if (ok) setForm(null);
  }

  return (
    <TaskDialogContext.Provider value={dialogApi}>
      {children}
      <Dialog
        open={form !== null}
        onOpenChange={(open) => !open && setForm(null)}
      >
        <DialogContent>
          <DialogTitle>{editing ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Cambia lo que necesites y guarda."
              : "Te avisaremos antes de que se venza."}
          </DialogDescription>
          {form && (
            <form onSubmit={save} className="flex flex-col gap-4" noValidate>
              <Field label="¿Qué hay que hacer?">
                <input
                  className="field-input"
                  autoFocus={!editing}
                  placeholder="Ej.: Revisar acero de losa piso 3"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Obra">
                  <select
                    className="field-input"
                    value={form.project_id}
                    disabled={editing}
                    onChange={(e) => {
                      set("project_id", e.target.value);
                      set("epic_id", firstEpic(e.target.value));
                    }}
                  >
                    {data.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Épica">
                  <select
                    className="field-input"
                    value={form.epic_id}
                    onChange={(e) => set("epic_id", e.target.value)}
                  >
                    {epics.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Fecha límite">
                  <input
                    className="field-input"
                    type="date"
                    value={form.due_date}
                    onChange={(e) => set("due_date", e.target.value)}
                  />
                </Field>
                <Field label="Responsable">
                  <input
                    className="field-input"
                    placeholder="Ej.: Maestro Jorge"
                    value={form.assignee}
                    onChange={(e) => set("assignee", e.target.value)}
                  />
                </Field>
                <Field label="Tag (opcional)">
                  <input
                    className="field-input"
                    placeholder="Ej.: Concreto, Compras"
                    value={form.tag}
                    onChange={(e) => set("tag", e.target.value)}
                  />
                </Field>
                {editing && (
                  <Field label="Estado">
                    <select
                      className="field-input"
                      value={form.status}
                      onChange={(e) =>
                        set("status", e.target.value as TaskStatus)
                      }
                    >
                      {(Object.keys(STATUS_LABEL) as TaskStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
              </div>
              {error && (
                <p className="text-sm font-semibold text-destructive">
                  {error}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-end gap-2.5">
                {editing && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="mr-auto h-11 text-destructive hover:bg-[#F5D3CC] hover:text-destructive"
                    onClick={remove}
                    disabled={saving}
                  >
                    <Trash2 aria-hidden="true" />
                    {confirmDelete ? "Toca de nuevo para eliminar" : "Eliminar"}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl px-5"
                  onClick={() => setForm(null)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="h-11 rounded-xl px-5"
                  disabled={saving}
                >
                  {saving ? "Guardando…" : "Guardar tarea"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </TaskDialogContext.Provider>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[#3F3B35]">
      {label}
      {children}
    </label>
  );
}
