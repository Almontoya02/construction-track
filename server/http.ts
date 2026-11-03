import { z } from "zod";

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export function fail(message: string, status = 400): Response {
  return json({ error: message }, status);
}

/** Parses the JSON body against `schema`; returns a 400 Response on failure. */
export async function readBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T,
): Promise<z.infer<T> | Response> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return fail("El cuerpo de la petición no es JSON válido.");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((i) => i.message).join("; "));
  }
  return parsed.data;
}

/**
 * Maps a Supabase/Postgres error to a response. Constraint violations (a task
 * whose epic was deleted meanwhile, a bad value) are the client's fault and
 * must not be retried, so they get a 4xx; anything else is a 500.
 */
export function dbFail(error: { message: string; code?: string }): Response {
  const clientError = ["23503", "23514", "22P02", "22007"];
  return fail(
    error.message,
    clientError.includes(error.code ?? "") ? 409 : 500,
  );
}

/** Wraps a handler so unexpected errors become a JSON 500 instead of a crash. */
export function handle(
  fn: (request: Request) => Promise<Response>,
): (request: Request) => Promise<Response> {
  return async (request) => {
    try {
      return await fn(request);
    } catch (error) {
      console.error(error);
      return fail(
        error instanceof Error ? error.message : "Error inesperado.",
        500,
      );
    }
  };
}

export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato AAAA-MM-DD.");
