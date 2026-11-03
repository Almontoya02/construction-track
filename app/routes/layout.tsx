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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
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
      <Toaster
        position="bottom-center"
        richColors
        mobileOffset={{ bottom: "calc(16px + var(--safe-bottom))" }}
      />
    </ObrasProvider>
  );
}

function Shell() {
  const { data, today } = useObras();
  const { projectId } = useParams();
  const { openNew } = useTaskDialog();
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const alerts = useMemo(() => alertsFor(data, today), [data, today]);
  const project = data.projects.find((p) => p.id === projectId);

  return (
    <div className="flex min-h-dvh flex-wrap content-start md:content-stretch">
      {/* Solid strip behind the iPhone status bar, so scrolled content never
          shows under the clock. Zero height where there is no inset. */}
      <div
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-30 h-(--safe-top) bg-ink"
      />
      <aside className="flex flex-[1_1_100%] items-center gap-2 bg-ink px-4 pt-[calc(0.625rem+var(--safe-top))] pb-2.5 text-[#EDEAE3] md:max-w-66 md:flex-[1_1_240px] md:flex-col md:items-stretch md:gap-7 md:px-3.5 md:pt-[calc(1.5rem+var(--safe-top))] md:pb-[calc(1.5rem+var(--safe-bottom))]">
        <Brand />
        {/* Phone: the grid button opens the full menu in a drawer. */}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
          className="relative ml-auto grid size-11 place-items-center rounded-xl bg-ink-3 text-white md:hidden"
        >
          <LayoutGrid className="size-5" aria-hidden="true" />
          {alerts.length > 0 && (
            <span className="absolute -top-1 -right-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-clay px-1 text-[11px] font-bold text-white">
              {alerts.length}
            </span>
          )}
        </button>
        <div className="hidden flex-1 flex-col gap-7 md:flex">
          <SideMenu
            alertCount={alerts.length}
            onAlerts={() => setAlertsOpen(true)}
          />
        </div>
      </aside>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="left"
          className="w-[82vw] max-w-80 gap-7 border-ink-3 bg-ink px-3.5 pt-[calc(1.5rem+var(--safe-top))] pb-[calc(1.5rem+var(--safe-bottom))] text-[#EDEAE3] [&>button:last-child]:text-white"
        >
          <SheetTitle className="sr-only">Menú</SheetTitle>
          <SheetDescription className="sr-only">
            Navega entre tus obras y los avisos de vencimiento.
          </SheetDescription>
          <Brand />
          <SideMenu
            alertCount={alerts.length}
            onAlerts={() => {
              setMenuOpen(false);
              setAlertsOpen(true);
            }}
            onNavigate={() => setMenuOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-[999_1_560px] flex-col md:pt-(--safe-top)">
        <header className="sticky top-(--safe-top) z-20 flex items-center gap-3 border-b border-border bg-ground px-4 py-2.5 md:px-8 md:py-3.5">
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

        <main className="flex w-full max-w-[1400px] flex-col gap-6 px-4 pt-5 pb-[calc(3.5rem+var(--safe-bottom))] md:gap-8 md:px-8 md:pt-7 md:pb-[calc(4.5rem+var(--safe-bottom))]">
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

function Brand() {
  return (
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
  );
}

const navItem = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] text-[#D6D3CB] hover:bg-ink-2",
    isActive && "bg-ink-3 font-semibold text-white",
  );

/** Navigation, project list and profile: the desktop sidebar and the phone drawer. */
function SideMenu({
  alertCount,
  onAlerts,
  onNavigate,
}: {
  alertCount: number;
  onAlerts: () => void;
  onNavigate?: () => void;
}) {
  const { data } = useObras();
  return (
    <>
      <nav aria-label="Principal" className="flex flex-col gap-1">
        <NavLink to="/" end className={navItem} onClick={onNavigate}>
          <LayoutGrid className="size-5" aria-hidden="true" />
          Mis obras
        </NavLink>
        <button
          type="button"
          className={navItem({ isActive: false })}
          onClick={onAlerts}
        >
          <TriangleAlert className="size-5" aria-hidden="true" />
          Por vencer
          {alertCount > 0 && (
            <span className="ml-auto grid h-[22px] min-w-[22px] place-items-center rounded-full bg-clay px-1.5 text-xs font-bold text-white">
              {alertCount}
            </span>
          )}
        </button>
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <p className="mb-1.5 px-3 text-[11px] tracking-[0.14em] text-ink-muted uppercase">
          Obras
        </p>
        {data.projects.length === 0 && (
          <p className="px-3 text-sm text-ink-muted">Aún no tienes obras.</p>
        )}
        {data.projects.map((p) => (
          <NavLink
            key={p.id}
            to={`/obras/${p.id}`}
            onClick={onNavigate}
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

      <div className="flex items-center gap-3 border-t border-ink-3 px-2 pt-4">
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
    </>
  );
}
