import { db } from "../server/supabase";
import { handle, json, fail } from "../server/http";

/** Everything the app shows, in one round trip. The data set is small. */
export const GET = handle(async () => {
  const [projects, epics, tasks] = await Promise.all([
    db().from("projects").select("*").order("created_at"),
    db().from("epics").select("*").order("position"),
    db().from("tasks").select("*").order("due_date"),
  ]);
  const error = projects.error ?? epics.error ?? tasks.error;
  if (error) return fail(error.message, 500);
  return json({
    projects: projects.data,
    epics: epics.data,
    tasks: tasks.data,
  });
});
