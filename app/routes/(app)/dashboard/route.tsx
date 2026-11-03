import { ChartAreaInteractive } from "@/components/dashboard/chart-area-interactive";
import { SectionCards } from "@/components/dashboard/section-cards";
import { DataTable } from "@/components/layouts/data-table";
import { AuthorizedLoaderWithFetcher, type Fetcher } from "@/lib/auth.server";
import { PERMISSIONS } from "@/lib/permissions";
import type { AuthUser } from "@/types/auth";
import type { Todo } from "@/types/auth/todo";
import type { Route } from "./+types/route";

export function meta() {
  return [
    { title: "Dashboard" },
    { name: "description", content: "Wellcome to Iluma" },
  ];
}

export const handle = {
  title: "Dashboard",
};

const permission = PERMISSIONS.clients.create;

async function dashboardLoader(
  _args: Route.LoaderArgs,
  fetch: Fetcher,
  user: AuthUser,
) {
  // No data is fetched here on purpose — the template does not know your
  // endpoints. Replace with your own call, and surface `error` so a failed
  // request is visible instead of rendering as an empty table:
  //
  //   const response = await fetch.get<Todo[]>("/your-endpoint");
  //   return { user, data: response.data ?? [], error: response.error };
  return { user, data: [] as Todo[] };
}

export const loader = AuthorizedLoaderWithFetcher(permission, dashboardLoader);

export default function Page({ loaderData }: Route.ComponentProps) {
  const { data } = loaderData;
  return (
    <>
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <DataTable data={data ?? []} />
    </>
  );
}
