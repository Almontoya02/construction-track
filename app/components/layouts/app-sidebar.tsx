import * as React from "react";

import { NavMain } from "@/components/elements/nav-main";
import { NavUser } from "@/components/elements/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link } from "react-router";
import type { AuthUser } from "@/types/auth";
import { nav } from "@/lib/navigation";

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: AuthUser }) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link to="/">
                <img
                  src="/iluma-green.svg"
                  className="size-7 dark:hidden"
                  alt=""
                />
                <img
                  src="/iluma-yellow.svg"
                  className="size-7 hidden dark:block"
                  alt=""
                />
                <span className="text-base font-semibold">Iluma</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={nav} user={props.user} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={props.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
