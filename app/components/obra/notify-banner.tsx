import { BellOff, Check, Share, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePush } from "@/hooks/use-push";
import { cn } from "@/lib/utils";

/** Home-screen banner that gets this phone subscribed to due-date reminders. */
export function NotifyBanner() {
  const { state, busy, enable, test } = usePush();
  if (state === "loading") return null;

  const on = state === "on";
  const content = {
    on: {
      icon: Check,
      title: "Notificaciones activas en este celular",
      text: "Cada mañana a las 6:30 te avisamos lo que vence en 3 días, mañana, hoy o ya se venció.",
    },
    off: {
      icon: Smartphone,
      title: "Recibe avisos en tu celular",
      text: "Te avisamos 3 días antes, el día anterior y el mismo día en que vence cada tarea.",
    },
    "needs-install": {
      icon: Share,
      title: "Instala la app para recibir avisos",
      text: "En el iPhone toca Compartir › Agregar a pantalla de inicio, y abre Obra Clara desde ese ícono.",
    },
    denied: {
      icon: BellOff,
      title: "Las notificaciones están bloqueadas",
      text: "Actívalas para este sitio en los ajustes del navegador y vuelve a intentarlo.",
    },
    unsupported: {
      icon: BellOff,
      title: "Este navegador no permite avisos",
      text: "Abre la app en Chrome (Android) o instálala en la pantalla de inicio (iPhone).",
    },
  }[state];
  const Icon = content.icon;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-4 rounded-2xl p-4 sm:p-5",
        on ? "bg-[#E1E8DC] text-[#24391F]" : "bg-ink text-[#EDEAE3]",
      )}
    >
      <div
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-xl",
          on ? "bg-[#C9D6C1]" : "bg-ink-3 text-[#F0B48E]",
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-[1_1_260px]">
        <b className={cn("block text-base", !on && "text-white")}>
          {content.title}
        </b>
        <span
          className={cn(
            "mt-0.5 block text-sm leading-relaxed",
            on ? "text-[#3D5230]" : "text-[#BFC7C3]",
          )}
        >
          {content.text}
        </span>
      </div>
      {state === "off" && (
        <Button
          className="h-11 rounded-xl px-5 text-[15px]"
          onClick={enable}
          disabled={busy}
        >
          Activar notificaciones
        </Button>
      )}
      {on && (
        <Button
          variant="outline"
          className="h-11 rounded-xl border-[#B7C7AD] bg-transparent px-4 hover:bg-[#C9D6C1]"
          onClick={test}
          disabled={busy}
        >
          Probar aviso
        </Button>
      )}
    </div>
  );
}
