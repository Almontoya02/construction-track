import { z } from "zod";
import { db } from "../server/supabase.js";
import {
  dbFail,
  fail,
  handle,
  isoDate,
  json,
  readBody,
} from "../server/http.js";

const Status = z.enum(["pendiente", "proceso", "hecho"]);

const NewTask = z.object({
  // Generated on the phone so a task can be created offline.
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  epic_id: z.string().uuid(),
  title: z.string().trim().min(1, "La tarea necesita un nombre.").max(200),
  due_date: isoDate,
  assignee: z.string().trim().max(80).default(""),
  tag: z.string().trim().max(40).default(""),
  status: Status.default("pendiente"),
});

const TaskPatch = z
  .object({
    epic_id: z.string().uuid(),
    title: z.string().trim().min(1).max(200),
    due_date: isoDate,
    assignee: z.string().trim().max(80),
    tag: z.string().trim().max(40),
    status: Status,
  })
  .partial();

/** Idempotent create: a replayed request leaves the existing task alone. */
export const POST = handle(async (request) => {
  const body = await readBody(request, NewTask);
  if (body instanceof Response) return body;
  const { error } = await db()
    .from("tasks")
    .upsert(body, { onConflict: "id", ignoreDuplicates: true });
  if (error) return dbFail(error);
  return json({ ok: true }, 201);
});

export const PATCH = handle(async (request) => {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return fail("Falta el id de la tarea.");
  const body = await readBody(request, TaskPatch);
  if (body instanceof Response) return body;
  // No `.single()`: updating a task deleted on another device must succeed as
  // a no-op, or the offline outbox would retry it forever.
  const { error } = await db().from("tasks").update(body).eq("id", id);
  if (error) return dbFail(error);
  return json({ ok: true });
});

export const DELETE = handle(async (request) => {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return fail("Falta el id de la tarea.");
  const { error } = await db().from("tasks").delete().eq("id", id);
  if (error) return dbFail(error);
  return json({ ok: true });
});
