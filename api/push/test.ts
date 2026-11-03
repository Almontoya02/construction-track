import { handle, json } from "../../server/http";
import { sendDailyReminders } from "../../server/reminders";
import { sendToAll } from "../../server/push";

/**
 * "Probar aviso" button: sends today's real digest right away, or a short
 * confirmation when nothing is due, so the phone shows something either way.
 */
export const POST = handle(async () => {
  const result = await sendDailyReminders();
  if (result.reminders > 0) return json(result);
  const fallback = await sendToAll({
    title: "Obra Clara",
    body: "Todo al día. Te avisaremos 3 días antes, el día anterior y el mismo día.",
    url: "/",
    tag: "test",
  });
  return json({ reminders: 0, ...fallback });
});
