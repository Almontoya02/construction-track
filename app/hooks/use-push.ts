import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  disablePush,
  enablePush,
  getPushState,
  type PushState,
} from "@/lib/push";

export function usePush() {
  const [state, setState] = useState<PushState | "loading">("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getPushState().then(setState, () => setState("unsupported"));
  }, []);

  const enable = useCallback(async () => {
    setBusy(true);
    try {
      const next = await enablePush();
      setState(next);
      if (next === "on") {
        toast.success("Notificaciones activadas en este celular");
        await api.testPush().catch(() => {});
      } else if (next === "denied") {
        toast.error(
          "El celular bloqueó las notificaciones. Actívalas en los ajustes del navegador.",
        );
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudieron activar.");
    } finally {
      setBusy(false);
    }
  }, []);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      setState(await disablePush());
      toast("Notificaciones desactivadas en este celular");
    } finally {
      setBusy(false);
    }
  }, []);

  const test = useCallback(async () => {
    setBusy(true);
    try {
      const { sent } = await api.testPush();
      toast.success(
        sent
          ? "Aviso enviado. Revisa tu celular."
          : "No hay dispositivos suscritos.",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo enviar.");
    } finally {
      setBusy(false);
    }
  }, []);

  return { state, busy, enable, disable, test };
}
