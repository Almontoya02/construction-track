import { z } from "zod";
import { db } from "../server/supabase.js";
import { dbFail, fail, handle, json, readBody } from "../server/http.js";
import { EPIC_COLORS } from "../app/lib/types.js";

const NewEpic = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  name: z.string().trim().min(1, "La épica necesita un nombre.").max(80),
  color: z.string().max(20).default(EPIC_COLORS[0]),
  position: z.number().int().min(0).default(0),
});

/** Idempotent create: a replayed request leaves the existing epic alone. */
export const POST = handle(async (request) => {
  const body = await readBody(request, NewEpic);
  if (body instanceof Response) return body;
  const { error } = await db()
    .from("epics")
    .upsert(body, { onConflict: "id", ignoreDuplicates: true });
  if (error) return dbFail(error);
  return json({ ok: true }, 201);
});

/** Deletes an epic and its tasks (ON DELETE CASCADE). */
export const DELETE = handle(async (request) => {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return fail("Falta el id de la épica.");
  const { error } = await db().from("epics").delete().eq("id", id);
  if (error) return dbFail(error);
  return json({ ok: true });
});
