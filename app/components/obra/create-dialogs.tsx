import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useObras } from "@/contexts/obras-context";
import { DEFAULT_EPICS } from "@/lib/types";
import { Field } from "./task-dialog";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Actions({
  saving,
  label,
  onCancel,
}: {
  saving: boolean;
  label: string;
  onCancel: () => void;
}) {
  return (
    <div className="flex justify-end gap-2.5">
      <Button
        type="button"
        variant="outline"
        className="h-11 rounded-xl px-5"
        onClick={onCancel}
      >
        Cancelar
      </Button>
      <Button type="submit" className="h-11 rounded-xl px-5" disabled={saving}>
        {saving ? "Guardando…" : label}
      </Button>
    </div>
  );
}

export function NewProjectDialog({ open, onOpenChange }: DialogProps) {
  const { createProject } = useObras();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [place, setPlace] = useState("");
  const [type, setType] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Escribe el nombre de la obra.");
    setSaving(true);
    const project = await createProject({
      name: name.trim(),
      place: place.trim(),
      type: type.trim(),
    });
    setSaving(false);
    if (!project) return;
    setName("");
    setPlace("");
    setType("");
    onOpenChange(false);
    navigate(`/obras/${project.id}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Nueva obra</DialogTitle>
        <DialogDescription>
          Se crea con las épicas {DEFAULT_EPICS.join(", ")}. Puedes agregar o
          quitar.
        </DialogDescription>
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <Field label="Nombre de la obra">
            <input
              className="field-input"
              autoFocus
              placeholder="Ej.: Edificio Los Almendros"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Ubicación">
              <input
                className="field-input"
                placeholder="Ej.: Envigado, Antioquia"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
              />
            </Field>
            <Field label="Tipo">
              <input
                className="field-input"
                placeholder="Ej.: Vivienda"
                value={type}
                onChange={(e) => setType(e.target.value)}
              />
            </Field>
          </div>
          {error && (
            <p className="text-sm font-semibold text-destructive">{error}</p>
          )}
          <Actions
            saving={saving}
            label="Crear obra"
            onCancel={() => onOpenChange(false)}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NewEpicDialog({
  open,
  onOpenChange,
  projectId,
}: DialogProps & { projectId: string }) {
  const { createEpic } = useObras();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Escribe el nombre de la épica.");
    setSaving(true);
    const epic = await createEpic({ project_id: projectId, name: name.trim() });
    setSaving(false);
    if (!epic) return;
    setName("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Nueva épica</DialogTitle>
        <DialogDescription>
          Agrupa las tareas por frente de trabajo: Cubierta, Fachada,
          Paisajismo…
        </DialogDescription>
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <Field label="Nombre de la épica">
            <input
              className="field-input"
              autoFocus
              placeholder="Ej.: Cubierta"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
            />
          </Field>
          {error && (
            <p className="text-sm font-semibold text-destructive">{error}</p>
          )}
          <Actions
            saving={saving}
            label="Crear épica"
            onCancel={() => onOpenChange(false)}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
