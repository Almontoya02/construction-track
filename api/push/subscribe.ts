import { z } from "zod";
import { db } from "../../server/supabase";
import { fail, handle, json, readBody } from "../../server/http";

const Subscription = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

/** Saves (or refreshes) this device's push subscription. */
export const POST = handle(async (request) => {
  const body = await readBody(request, Subscription);
  if (body instanceof Response) return body;
  const { error } = await db()
    .from("push_subscriptions")
    .upsert({
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      user_agent: request.headers.get("user-agent") ?? "",
    });
  if (error) return fail(error.message, 500);
  return json({ ok: true }, 201);
});

export const DELETE = handle(async (request) => {
  const body = await readBody(request, z.object({ endpoint: z.string() }));
  if (body instanceof Response) return body;
  const { error } = await db()
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", body.endpoint);
  if (error) return fail(error.message, 500);
  return json({ ok: true });
});
