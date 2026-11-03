import { AppSidebar } from "@/components/layouts/app-sidebar";
import { SiteHeader } from "@/components/elements/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Outlet } from "react-router";
import type { Route } from "./+types/layout";
import { AuthorizedLoader } from "@/lib/auth.server";
import LoadingProgress from "@/components/elements/loading-progress";

export const loader = AuthorizedLoader(
  async ({ request }, user, permissions) => {
    return {
      user,
      permissions,
    };
  },
);

export default function AppLayout({ loaderData }: Route.ComponentProps) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <LoadingProgress />
      <AppSidebar variant="inset" user={loaderData.user} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <Outlet />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
