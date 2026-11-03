import { PaginatedTable } from "@/components/layouts/paginated-table";
import { AuthorizedLoaderWithFetcher, type Fetcher } from "@/lib/auth.server";
import { paginateArrayFromLoader } from "@/lib/pagination.server";
import { PERMISSIONS } from "@/lib/permissions";
import type { AuthUser } from "@/types/auth";
import type { Todo } from "@/types/auth/todo";
import type { Route } from "./+types/route";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { Plus } from "lucide-react";

export function meta() {
  return [
    { title: "Clients" },
    { name: "description", content: "Wellcome to Iluma" },
  ];
}

export const handle = {
  title: "Clients",
};

const permission = PERMISSIONS.clients.create;

async function clientsLoader(
  { request }: Route.LoaderArgs,
  fetch: Fetcher,
  user: AuthUser,
) {
  // No data is fetched here on purpose — the template does not know your
  // endpoints. Replace with your own call, and surface `error` so a failed
  // request is visible instead of rendering as an empty table:
  //
  //   const response = await fetch.get<Todo[]>("/your-endpoint");
  //   const paginationResult = await paginateArrayFromLoader(
  //     response.data ?? [],
  //     request,
  //   );
  //   return { user, error: response.error, ...paginationResult };
  //
  // `paginateArrayFromLoader` slices a full array in memory. If your backend
  // paginates, use `parsePaginationParams` and pass the params through instead.
  const paginationResult = await paginateArrayFromLoader([] as Todo[], request);

  return { user, ...paginationResult };
}

export const loader = AuthorizedLoaderWithFetcher(permission, clientsLoader);

export default function Page({ loaderData }: Route.ComponentProps) {
  const { data, pagination } = loaderData;
  return (
    <div className="px-4 lg:px-6">
      <PaginatedTable
        extra={
          <Button asChild>
            <Link to="/clients/new">
              <Plus className="h-4 w-4" />
              New Client
            </Link>
          </Button>
        }
        pagination={pagination}
        data={data || []}
        columns={[
          {
            accessorKey: "id",
            header: "ID",
          },
          {
            accessorKey: "title",
            header: "Title",
          },
          {
            accessorKey: "completed",
            header: "Completed",
          },
        ]}
      />
    </div>
  );
}
