import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  AlarmClock,
  Building2,
  MapPin,
  Plus,
  TriangleAlert,
} from "lucide-react";
import type { Route } from "./+types/home";
import { useObras } from "@/contexts/obras-context";
import { alertsFor, statsFor, viewTask } from "@/lib/obras";
import { APP_TIME_ZONE } from "@/lib/due";
import { Dot, Eyebrow, ProgressBar, StatCard } from "@/components/obra/bits";
import { AlertList } from "@/components/obra/alerts-sheet";
import { NotifyBanner } from "@/components/obra/notify-banner";
import { NewProjectDialog } from "@/components/obra/create-dialogs";
import { LoadState } from "@/components/obra/load-state";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Mis obras · Obra Clara" }];
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

export default function Home() {
  const { data, today } = useObras();
  const navigate = useNavigate();
  const [newProject, setNewProject] = useState(false);

  const projects = useMemo(
    () =>
      data.projects.map((p) => ({
        ...p,
        stats: statsFor(
          data.tasks
            .filter((t) => t.project_id === p.id)
            .map((t) => viewTask(t, today)),
        ),
      })),
    [data, today],
  );
  const alerts = useMemo(() => alertsFor(data, today), [data, today]);
  const late = alerts.filter((a) => a.due.level === "late").length;
  const soon = alerts.length - late;
  const pending = data.tasks.filter((t) => t.status !== "hecho").length;

  const summary =
    alerts.length === 0
      ? "Todo al día. No tienes tareas por vencer."
      : `Tienes ${plural(soon, "tarea", "tareas")} por vencer${
          late ? ` y ${plural(late, "vencida", "vencidas")}` : ""
        }. Empieza por ahí.`;

  const todayLabel = new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: APP_TIME_ZONE,
  });

  return (
    <LoadState>
      <section>
        <Eyebrow>{todayLabel}</Eyebrow>
        <h1 className="mt-1.5 font-display text-[32px] leading-tight md:text-[40px]">
          Buen día. Así van tus obras.
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground">{summary}</p>
      </section>

      <NotifyBanner />

      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <StatCard
          icon={Building2}
          tone="neutral"
          value={projects.length}
          label="Obras activas"
          sub={plural(pending, "tarea pendiente", "tareas pendientes")}
        />
        <StatCard
          icon={AlarmClock}
          tone="soon"
          value={soon}
          label="Por vencer"
          sub="Hoy y próximos 3 días"
        />
        <StatCard
          icon={TriangleAlert}
          tone="late"
          value={late}
          label="Vencidas"
          sub="Requieren atención"
        />
      </div>

      <section>
        <div className="mb-4">
          <Eyebrow>Proyectos</Eyebrow>
          <h2 className="mt-1 font-display text-[28px] leading-tight">
            Tus obras
          </h2>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
          {projects.map((p) => (
            <Link
              key={p.id}
              to={`/obras/${p.id}`}
              className="flex flex-col gap-3.5 rounded-2xl border border-[#E6E1D7] bg-card p-5 transition hover:border-[#B9B1A3] hover:shadow-[0_6px_18px_rgba(31,42,38,0.08)]"
            >
              <div className="flex items-center gap-2.5">
                <Dot color={p.color} className="size-[11px]" />
                <Eyebrow className="tracking-[0.1em]">{p.type}</Eyebrow>
              </div>
              <div>
                <p className="text-lg font-bold">{p.name}</p>
                <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  {p.place}
                </p>
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-[13px] text-[#55514A]">
                  <span>
                    {p.stats.done} de {p.stats.total} tareas
                  </span>
                  <b className="text-foreground">{p.stats.pct}%</b>
                </div>
                <ProgressBar pct={p.stats.pct} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {p.stats.late > 0 && (
                  <span className="rounded-md bg-[#F5D3CC] px-2 py-1 text-xs font-semibold text-[#8C2516]">
                    {plural(p.stats.late, "vencida", "vencidas")}
                  </span>
                )}
                {p.stats.soon > 0 && (
                  <span className="rounded-md bg-[#FAE0C2] px-2 py-1 text-xs font-semibold text-[#874108]">
                    {p.stats.soon} por vencer
                  </span>
                )}
                {p.stats.late + p.stats.soon === 0 && (
                  <span className="rounded-md bg-[#E1E8DC] px-2 py-1 text-xs font-semibold text-[#2F4A2C]">
                    Al día
                  </span>
                )}
              </div>
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setNewProject(true)}
            className="flex min-h-44 flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-[#C9C1B3] font-semibold text-muted-foreground hover:border-[#8F8676] hover:text-foreground"
          >
            <Plus className="size-[22px]" aria-hidden="true" />
            {projects.length === 0 ? "Crea tu primera obra" : "Nueva obra"}
          </button>
        </div>
      </section>

      {projects.length > 0 && (
        <section>
          <div className="mb-4">
            <Eyebrow>Todas las obras</Eyebrow>
            <h2 className="mt-1 font-display text-[28px] leading-tight">
              Próximas a vencer
            </h2>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#E6E1D7] bg-card">
            <AlertList
              alerts={alerts}
              showDate
              onPick={(a) => navigate(`/obras/${a.project_id}`)}
            />
          </div>
        </section>
      )}

      <NewProjectDialog open={newProject} onOpenChange={setNewProject} />
    </LoadState>
  );
}
