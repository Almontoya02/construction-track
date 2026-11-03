import { z } from "zod";
import { db } from "../server/supabase";
import { dbFail, fail, handle, json, readBody } from "../server/http";
import { EPIC_COLORS } from "../app/lib/types";

const NewEpic = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  color: z.string().max(20),
  position: z.number().int().min(0),
});

const NewProject = z.object({
  // Generated on the phone so a project can be created offline.
  id: z.string().uuid(),
  name: z.string().trim().min(1, "La obra necesita un nombre.").max(120),
  place: z.string().trim().max(120).default(""),
  type: z.string().trim().max(60).default(""),
  color: z.string().max(20).default(EPIC_COLORS[0]),
  epics: z.array(NewEpic).max(30).default([]),
});

/**
 * Creates a project together with its starting epics. Idempotent: replaying
 * the same request (offline outbox retry) leaves the existing rows alone.
 */
export const POST = handle(async (request) => {
  const body = await readBody(request, NewProject);
  if (body instanceof Response) return body;
  const { epics, ...project } = body;

  const { error } = await db()
    .from("projects")
    .upsert(
      {
        ...project,
        place: project.place || "Sin ubicación",
        type: project.type || "Obra",
      },
      { onConflict: "id", ignoreDuplicates: true },
    );
  if (error) return dbFail(error);

  if (epics.length) {
    const { error: epicError } = await db()
      .from("epics")
      .upsert(
        epics.map((e) => ({ ...e, project_id: project.id })),
        { onConflict: "id", ignoreDuplicates: true },
      );
    if (epicError) return dbFail(epicError);
  }
  return json({ ok: true }, 201);
});

/** Deletes a project; its epics and tasks go with it (ON DELETE CASCADE). */
export const DELETE = handle(async (request) => {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return fail("Falta el id de la obra.");
  const { error } = await db().from("projects").delete().eq("id", id);
  if (error) return dbFail(error);
  return json({ ok: true });
});
