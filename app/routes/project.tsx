import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  AlarmClock,
  Check,
  Columns3,
  List,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import type { Route } from "./+types/project";
import { useObras } from "@/contexts/obras-context";
import {
  byUrgency,
  matchesFilter,
  statsFor,
  viewTask,
  type TaskFilter,
} from "@/lib/obras";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dot, Eyebrow, ProgressBar, StatCard } from "@/components/obra/bits";
import { TaskCard, TaskRow } from "@/components/obra/task-item";
import { useTaskDialog } from "@/components/obra/task-dialog";
import { NewEpicDialog } from "@/components/obra/create-dialogs";
import { LoadState } from "@/components/obra/load-state";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Obra · Obra Clara" }];
}

type View = "board" | "list";
const VIEW_KEY = "obra-clara:view";

function readView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === "list" ? "list" : "board";
  } catch {
    return "board";
  }
}

export default function ProjectPage() {
  return (
    <LoadState>
      <ProjectView />
    </LoadState>
  );
}

function ProjectView() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { data, today, deleteProject, deleteEpic } = useObras();
  const { openNew } = useTaskDialog();
  const [view, setView] = useState<View>("board");
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [query, setQuery] = useState("");
  const [newEpic, setNewEpic] = useState(false);

  useEffect(() => setView(readView()), []);
  useEffect(() => setFilter("all"), [projectId]);

  const project = data.projects.find((p) => p.id === projectId);
  const tasks = useMemo(
    () =>
      data.tasks
        .filter((t) => t.project_id === projectId)
        .map((t) => viewTask(t, today)),
    [data.tasks, projectId, today],
  );
  const stats = statsFor(tasks);
  const epics = useMemo(
    () =>
      data.epics
        .filter((e) => e.project_id === projectId)
        .map((e) => ({
          ...e,
          tasks: tasks
            .filter(
              (t) => t.epic_id === e.id && matchesFilter(t, filter, query),
            )
            .sort(byUrgency),
        })),
    [data.epics, projectId, tasks, filter, query],
  );

  useEffect(() => {
    if (project) document.title = `${project.name} · Obra Clara`;
  }, [project]);

  if (!project) {
    return (
      <div className="rounded-2xl bg-card p-8 text-center">
        <p className="text-lg font-semibold">No encontramos esta obra.</p>
        <Link
          to="/"
          className="mt-2 inline-block font-semibold text-clay underline"
        >
          Volver a mis obras
        </Link>
      </div>
    );
  }

  function chooseView(v: View) {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* private mode: the choice just isn't remembered */
    }
  }

  async function removeProject() {
    if (!project) return;
    if (
      !window.confirm(
        `¿Eliminar "${project.name}" con todas sus épicas y tareas? No se puede deshacer.`,
      )
    )
      return;
    if (await deleteProject(project.id)) navigate("/");
  }

  async function removeEpic(id: string, name: string, count: number) {
    const detail = count ? ` y sus ${count} tareas` : "";
    if (window.confirm(`¿Eliminar la épica "${name}"${detail}?`))
      await deleteEpic(id);
  }

  const filters: { id: TaskFilter; label: string; count: number }[] = [
    { id: "all", label: "Todas", count: stats.total },
    { id: "soon", label: "Por vencer", count: stats.soon },
    { id: "late", label: "Vencidas", count: stats.late },
    { id: "done", label: "Completadas", count: stats.done },
  ];

  const epicMenu = (e: (typeof epics)[number]) => (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Opciones de ${e.name}`}
        className="ml-auto grid size-11 place-items-center rounded-xl hover:bg-black/5"
      >
        <MoreHorizontal className="size-5" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={() => openNew({ projectId: project.id, epicId: e.id })}
        >
          <Plus aria-hidden="true" /> Agregar tarea
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onSelect={() =>
            removeEpic(
              e.id,
              e.name,
              tasks.filter((t) => t.epic_id === e.id).length,
            )
          }
        >
          <Trash2 aria-hidden="true" /> Eliminar épica
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4 xl:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
        <div className="col-span-3 flex flex-col gap-3.5 rounded-3xl bg-ink p-6 text-[#EDEAE3] xl:col-span-1">
          <div className="flex items-start gap-2">
            <Eyebrow className="text-ink-muted">
              Obra seleccionada · {project.type}
            </Eyebrow>
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Opciones de la obra"
                className="-mt-2.5 -mr-2.5 ml-auto grid size-11 place-items-center rounded-xl bg-ink-3 hover:bg-[#435049]"
              >
                <MoreHorizontal className="size-5" aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setNewEpic(true)}>
                  <Plus aria-hidden="true" /> Nueva épica
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={removeProject}
                >
                  <Trash2 aria-hidden="true" /> Eliminar obra
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <h1 className="font-display text-[28px] leading-tight text-white md:text-[34px]">
            {project.name}
          </h1>
          <p className="flex items-center gap-1.5 text-[13px] text-[#BFC7C3]">
            <MapPin className="size-3.5" aria-hidden="true" />
            {project.place}
          </p>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <div className="mb-2 text-[13px] text-[#BFC7C3]">
                Avance general · {stats.done} de {stats.total} tareas
              </div>
              <ProgressBar pct={stats.pct} dark />
            </div>
            <div className="font-display text-4xl leading-none text-white">
              {stats.pct}%
            </div>
          </div>
        </div>
        <StatCard
          icon={AlarmClock}
          tone="soon"
          value={stats.soon}
          label="Por vencer"
          sub="Hoy a 3 días"
        />
        <StatCard
          icon={TriangleAlert}
          tone="late"
          value={stats.late}
          label="Vencidas"
          sub="Ponte al día"
        />
        <StatCard
          icon={Check}
          tone="done"
          value={stats.done}
          label="Completadas"
          sub={`${stats.total} en total`}
        />
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Eyebrow>Tablero de trabajo</Eyebrow>
            <h2 className="mt-1 font-display text-[28px] leading-tight">
              Tareas por épica
            </h2>
          </div>
          <div
            role="group"
            aria-label="Vista"
            className="inline-flex gap-1 rounded-xl bg-[#E4DFD5] p-1"
          >
            {(
              [
                { id: "board", label: "Tablero", icon: Columns3 },
                { id: "list", label: "Lista", icon: List },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={view === id}
                onClick={() => chooseView(id)}
                className={cn(
                  "inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3.5 text-sm font-semibold text-[#55514A]",
                  view === id && "bg-card text-foreground shadow-sm",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[#DCD6CB] bg-card px-3.5 text-sm font-medium",
                filter === f.id && "border-foreground bg-foreground text-white",
              )}
            >
              {f.label} <span className="text-xs opacity-75">{f.count}</span>
            </button>
          ))}
          <label className="flex h-10 min-w-0 flex-[1_1_220px] items-center gap-2 rounded-full border border-[#DCD6CB] bg-card px-3.5 text-muted-foreground sm:max-w-80">
            <Search className="size-4 shrink-0" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar tarea, responsable o tag…"
              aria-label="Buscar tarea"
              className="w-full bg-transparent text-sm text-foreground outline-none"
            />
          </label>
        </div>

        <div
          aria-label="Colores de vencimiento"
          className="flex flex-wrap gap-x-3.5 gap-y-2 text-xs text-[#55514A]"
        >
          <Legend className="border-[#C9897C] bg-[#F5D3CC]">
            Vencida o vence hoy
          </Legend>
          <Legend className="border-[#D59B5C] bg-[#FAE0C2]">1 a 3 días</Legend>
          <Legend className="border-[#C4B36A] bg-[#F3EBC4]">4 a 7 días</Legend>
          <Legend className="border-[#C9C1B3] bg-muted">
            Más de una semana
          </Legend>
        </div>
      </section>

      {view === "board" ? (
        <div className="-mx-4 flex snap-x snap-mandatory items-start gap-4 overflow-x-auto px-4 pb-3.5 md:mx-0 md:px-0">
          {epics.map((e) => (
            <div
              key={e.id}
              className="flex flex-[0_0_86%] snap-start flex-col gap-2.5 rounded-2xl bg-column p-3.5 sm:flex-[0_0_310px]"
            >
              <div className="flex items-center gap-2.5 pl-1">
                <Dot color={e.color} />
                <div>
                  <b className="text-base">{e.name}</b>
                  <small className="block text-xs text-muted-foreground">
                    {e.tasks.length} {e.tasks.length === 1 ? "tarea" : "tareas"}
                  </small>
                </div>
                {epicMenu(e)}
              </div>
              {e.tasks.map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
              {e.tasks.length === 0 && (
                <p className="px-1.5 py-2 text-[13px] text-muted-foreground">
                  {filter === "all" && !query
                    ? "Aún no hay tareas."
                    : "Sin tareas con este filtro."}
                </p>
              )}
              <button
                type="button"
                onClick={() => openNew({ projectId: project.id, epicId: e.id })}
                className="flex min-h-11 w-full items-center gap-2 rounded-xl px-2.5 text-sm font-medium text-[#55514A] hover:bg-[#DCD6CB] hover:text-foreground"
              >
                <Plus className="size-4" aria-hidden="true" /> Agregar tarea
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setNewEpic(true)}
            className="flex min-h-30 flex-[0_0_240px] items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-[#C9C1B3] font-semibold text-muted-foreground hover:border-[#8F8676] hover:text-foreground"
          >
            <Plus className="size-[18px]" aria-hidden="true" /> Nueva épica
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {epics.map((e) => (
            <div
              key={e.id}
              className="overflow-hidden rounded-2xl border border-[#E6E1D7] bg-card"
            >
              <div className="flex items-center gap-2.5 border-b border-muted bg-[#FAF8F4] py-1.5 pr-2 pl-4 sm:pl-5">
                <Dot color={e.color} />
                <b className="text-base">{e.name}</b>
                <small className="text-[13px] text-muted-foreground">
                  {e.tasks.length} {e.tasks.length === 1 ? "tarea" : "tareas"}
                </small>
                {epicMenu(e)}
              </div>
              {e.tasks.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
              {e.tasks.length === 0 && (
                <p className="px-5 py-3.5 text-[13px] text-muted-foreground">
                  {filter === "all" && !query
                    ? "Aún no hay tareas."
                    : "Sin tareas con este filtro."}
                </p>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setNewEpic(true)}
            className="inline-flex min-h-11 items-center gap-2 self-start rounded-xl border border-[#DCD6CB] bg-card px-4 text-sm font-semibold"
          >
            <Plus className="size-4" aria-hidden="true" /> Nueva épica
          </button>
        </div>
      )}

      <NewEpicDialog
        open={newEpic}
        onOpenChange={setNewEpic}
        projectId={project.id}
      />
    </>
  );
}

function Legend({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <i
        className={cn("inline-block size-3 rounded-[3px] border", className)}
        aria-hidden="true"
      />
      {children}
    </span>
  );
}
