import { destroySession, getSession } from "@/sessions.server";
import { redirect } from "react-router";
import type { Route } from "./+types/logout";
import { auth0Strategy } from "@/lib/auth.server";

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  await auth0Strategy.revokeToken(session.get("token") ?? "");
  return redirect("/login", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}
