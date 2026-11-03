import { useNavigate } from "react-router";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { AlertItem } from "@/lib/obras";
import { Dot, DueTag } from "./bits";

export function AlertList({
  alerts,
  onPick,
  showDate,
}: {
  alerts: AlertItem[];
  onPick: (a: AlertItem) => void;
  showDate?: boolean;
}) {
  if (alerts.length === 0) {
    return (
      <div className="p-7 text-center text-[15px] text-muted-foreground">
        Todo al día. No hay tareas por vencer.
      </div>
    );
  }
  return (
    <ul>
      {alerts.map((a) => (
        <li key={a.id} className="border-t border-muted first:border-t-0">
          <button
            type="button"
            onClick={() => onPick(a)}
            className="flex min-h-14 w-full flex-wrap items-center gap-x-3.5 gap-y-2 px-4 py-3 text-left hover:bg-[#FAF8F4] sm:px-5"
          >
            <Dot color={a.project.color} />
            <span className="min-w-0 flex-[1_1_200px] text-[15px] font-semibold">
              {a.title}
              <small className="mt-0.5 block text-[13px] font-normal text-muted-foreground">
                {a.project.name}
                {a.epic && ` · ${a.epic.name}`}
                {a.assignee && ` · ${a.assignee}`}
              </small>
            </span>
            {showDate && (
              <span className="hidden text-[13px] text-muted-foreground sm:inline">
                {a.dateLabel}
              </span>
            )}
            <DueTag due={a.due} />
          </button>
        </li>
      ))}
    </ul>
  );
}

export function AlertsSheet({
  open,
  onOpenChange,
  alerts,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alerts: AlertItem[];
}) {
  const navigate = useNavigate();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[92vw] gap-0 bg-card p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-muted px-5 pt-[calc(1rem+var(--safe-top))] pb-4">
          <SheetTitle className="font-display text-2xl font-normal">
            Por vencer
          </SheetTitle>
          <SheetDescription>
            Vencidas y lo que vence en los próximos 3 días.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto pb-(--safe-bottom)">
          <AlertList
            alerts={alerts}
            onPick={(a) => {
              onOpenChange(false);
              navigate(`/obras/${a.project_id}`);
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
