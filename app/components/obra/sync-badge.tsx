import { CloudOff, RefreshCw } from "lucide-react";
import { useObras } from "@/contexts/obras-context";
import { cn } from "@/lib/utils";

/**
 * Header pill: says when the app is working without signal and how many
 * changes are still waiting to reach the server. Hidden when all is synced.
 */
export function SyncBadge() {
  const { sync, reload } = useObras();
  if (sync.online && sync.pending === 0) return null;

  const offline = !sync.online;
  const pending =
    sync.pending > 0
      ? `${sync.pending} ${sync.pending === 1 ? "cambio" : "cambios"} por enviar`
      : "";
  const label = offline
    ? `Sin conexión${pending ? ` · ${pending}` : ""}`
    : `Sincronizando · ${pending}`;

  return (
    <button
      type="button"
      onClick={reload}
      title={
        offline
          ? "Tus cambios están guardados en el celular. Toca para reintentar."
          : undefined
      }
      aria-label={`${label}. Reintentar sincronización`}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-[13px] font-semibold",
        offline ? "bg-[#2A3632] text-[#F3EEE6]" : "bg-[#FAE0C2] text-[#874108]",
      )}
    >
      {offline ? (
        <CloudOff className="size-4" aria-hidden="true" />
      ) : (
        <RefreshCw
          className={cn("size-4", sync.syncing && "animate-spin")}
          aria-hidden="true"
        />
      )}
      <span className="hidden sm:inline">{label}</span>
      {sync.pending > 0 && (
        <span className="sm:hidden" aria-hidden="true">
          {sync.pending}
        </span>
      )}
    </button>
  );
}
