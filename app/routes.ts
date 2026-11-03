import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("./routes/(app)/layout.tsx", [
    index("./routes/(app)/route.tsx"),
    route("dashboard", "./routes/(app)/dashboard/route.tsx"),
    route("clients", "./routes/(app)/clients/route.tsx"),
    route("unauthorized", "./routes/(app)/unauthorized/route.tsx"),
  ]),
  layout("./routes/(auth)/layout.tsx", [
    route("login", "./routes/(auth)/login.tsx"),
  ]),
  route("/auth/callback", "./routes/(auth)/callback.ts"),
  route("/auth/logout", "./routes/(auth)/logout.ts"),
  route("/api/avatar", "./routes/api.avatar.tsx"),
] satisfies RouteConfig;
