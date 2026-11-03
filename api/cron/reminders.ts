import { fail, handle, json } from "../../server/http.js";
import { sendDailyReminders } from "../../server/reminders.js";

/**
 * Called by Vercel Cron every morning (see vercel.json). Vercel sends
 * `Authorization: Bearer $CRON_SECRET`, which keeps anyone else from
 * triggering a round of notifications.
 */
export const GET = handle(async (request) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return fail("No autorizado.", 401);
  }
  return json(await sendDailyReminders());
});
