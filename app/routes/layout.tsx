import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useParams } from "react-router";
import {
  Bell,
  ChevronLeft,
  LayoutGrid,
  Plus,
  TriangleAlert,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { ObrasProvider, useObras } from "@/contexts/obras-context";
import { HardHatIcon, Dot } from "@/components/obra/bits";
import { SyncBadge } from "@/components/obra/sync-badge";
import { AlertsSheet } from "@/components/obra/alerts-sheet";
import {
  TaskDialogProvider,
  useTaskDialog,
} from "@/components/obra/task-dialog";
import { alertsFor } from "@/lib/obras";
import { registerServiceWorker } from "@/lib/push";
import { cn } from "@/lib/utils";

export default function AppLayout() {
  useEffect(registerServiceWorker, []);
  return (
    <ObrasProvider>
      <TaskDialogProvider>
        <Shell />
      </TaskDialogProvider>
      <Toaster position="bottom-center" richColors />
    </ObrasProvider>
  );
}

function Shell() {
  const { data, today } = useObras();
  const { projectId } = useParams();
  const { openNew } = useTaskDialog();
  const [alertsOpen, setAlertsOpen] = useState(false);
  const alerts = useMemo(() => alertsFor(data, today), [data, today]);
  const project = data.projects.find((p) => p.id === projectId);

  const navItem = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] text-[#D6D3CB] hover:bg-ink-2",
      isActive && "bg-ink-3 font-semibold text-white",
    );

  return (
    <div className="flex min-h-dvh flex-wrap content-start md:content-stretch">
      <aside className="flex flex-[1_1_100%] flex-wrap items-center gap-2 bg-ink px-4 py-2.5 text-[#EDEAE3] md:max-w-66 md:flex-[1_1_240px] md:flex-col md:flex-nowrap md:items-stretch md:gap-7 md:px-3.5 md:py-6">
        <Link to="/" className="flex items-center gap-3 px-1.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-clay text-white md:size-[42px]">
            <HardHatIcon className="size-5 md:size-[22px]" />
          </span>
          <span>
            <span className="block font-display text-xl leading-none text-white md:text-[22px]">
              Obra Clara
            </span>
            <span className="mt-1 hidden text-[10px] tracking-[0.18em] text-ink-muted uppercase md:block">
              Control de obra
            </span>
          </span>
        </Link>

        <nav
          aria-label="Principal"
          className="ml-auto flex gap-1 md:ml-0 md:flex-col"
        >
          <NavLink to="/" end className={navItem}>
            <LayoutGrid className="size-5" aria-hidden="true" />
            <span className="hidden md:inline">Mis obras</span>
            <span className="sr-only md:hidden">Mis obras</span>
          </NavLink>
          <button
            type="button"
            className={navItem({ isActive: false })}
            onClick={() => setAlertsOpen(true)}
          >
            <TriangleAlert className="size-5" aria-hidden="true" />
            <span className="hidden md:inline">Por vencer</span>
            <span className="sr-only md:hidden">Por vencer</span>
            {alerts.length > 0 && (
              <span className="ml-auto grid h-[22px] min-w-[22px] place-items-center rounded-full bg-clay px-1.5 text-xs font-bold text-white">
                {alerts.length}
              </span>
            )}
          </button>
        </nav>

        <div className="hidden md:block">
          <p className="mb-1.5 px-3 text-[11px] tracking-[0.14em] text-ink-muted uppercase">
            Obras
          </p>
          {data.projects.map((p) => (
            <NavLink
              key={p.id}
              to={`/obras/${p.id}`}
              className={({ isActive }) =>
                cn(
                  "flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-sm text-[#D6D3CB] hover:bg-ink-2",
                  isActive && "bg-ink-3 text-white",
                )
              }
            >
              <Dot color={p.color} />
              <span className="truncate">{p.name}</span>
            </NavLink>
          ))}
        </div>

        <div className="mt-auto hidden items-center gap-3 border-t border-ink-3 px-2 pt-4 md:flex">
          <span className="grid size-9 place-items-center rounded-full bg-[#E8C9A8] text-[13px] font-bold text-[#5A3517]">
            RO
          </span>
          <span>
            <span className="block text-sm font-semibold text-white">
              Mi tablero
            </span>
            <span className="block text-xs text-ink-muted">
              Residente de obra
            </span>
          </span>
        </div>
      </aside>

      <div className="flex min-w-0 flex-[999_1_560px] flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-ground px-4 py-2.5 md:px-8 md:py-3.5">
          <div className="mr-auto flex min-w-0 items-center gap-2 text-[15px] text-muted-foreground">
            {project ? (
              <>
                <Link
                  to="/"
                  className="flex min-h-11 items-center gap-1 px-1 hover:text-foreground"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" /> Obras
                </Link>
                <span aria-hidden="true">/</span>
                <b className="truncate font-semibold text-foreground">
                  {project.name}
                </b>
              </>
            ) : (
              <b className="font-semibold text-foreground">Mis obras</b>
            )}
          </div>
          <SyncBadge />
          <button
            type="button"
            aria-label={`Avisos de vencimiento (${alerts.length})`}
            onClick={() => setAlertsOpen(true)}
            className="relative grid size-11 shrink-0 place-items-center rounded-xl border border-[#DCD6CB] bg-card"
          >
            <Bell className="size-5" aria-hidden="true" />
            {alerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-clay px-1 text-[11px] font-bold text-white">
                {alerts.length}
              </span>
            )}
          </button>
          <Button
            className="h-11 shrink-0 rounded-xl px-3.5 text-[15px] font-semibold sm:px-[18px]"
            onClick={() => openNew({ projectId: project?.id })}
            disabled={data.projects.length === 0}
          >
            <Plus
              className="size-[18px]"
              strokeWidth={2.2}
              aria-hidden="true"
            />
            <span className="hidden sm:inline">Nueva tarea</span>
            <span className="sr-only sm:hidden">Nueva tarea</span>
          </Button>
        </header>

        <main className="flex w-full max-w-[1400px] flex-col gap-6 px-4 pt-5 pb-14 md:gap-8 md:px-8 md:pt-7 md:pb-18">
          <Outlet />
        </main>
      </div>

      <AlertsSheet
        open={alertsOpen}
        onOpenChange={setAlertsOpen}
        alerts={alerts}
      />
    </div>
  );
}
