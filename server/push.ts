import webpush from "web-push";
import { db } from "./supabase.js";

let configured = false;

function configure() {
  if (configured) return;
  const publicKey = process.env.VITE_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:obra-clara@example.com";
  if (!publicKey || !privateKey) {
    throw new Error(
      "Faltan VITE_VAPID_PUBLIC_KEY o VAPID_PRIVATE_KEY. Genéralas con `pnpm vapid`.",
    );
  }
  if (publicKey === privateKey) {
    throw new Error(
      "VAPID_PRIVATE_KEY es igual a la pública. Copia la «Private Key» (la más corta) que mostró `pnpm vapid`.",
    );
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/**
 * Sends `payload` to every saved device. Subscriptions the push service
 * reports as gone (404/410: app uninstalled, permission revoked) are deleted.
 */
export async function sendToAll(
  payload: PushPayload,
): Promise<{ sent: number; removed: number }> {
  configure();
  const { data: subs, error } = await db()
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth");
  if (error) throw new Error(error.message);

  let sent = 0;
  const gone: string[] = [];
  await Promise.all(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 12 },
        );
        sent++;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) gone.push(s.endpoint);
        else console.error("push failed", status, err);
      }
    }),
  );
  if (gone.length) {
    await db().from("push_subscriptions").delete().in("endpoint", gone);
  }
  return { sent, removed: gone.length };
}
