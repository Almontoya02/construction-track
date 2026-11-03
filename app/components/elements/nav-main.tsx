import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { canAccess, type NavItem } from "@/lib/navigation";
import type { AuthUser } from "@/types/auth";
import { Link, useMatch } from "react-router";

function NavMainItem({ item }: { item: NavItem }) {
  const isActive = !!useMatch(item.url);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton tooltip={item.title} asChild isActive={isActive}>
        <Link to={item.url}>
          {item.icon && <item.icon />}
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function NavMain({ items, user }: { user: AuthUser; items: NavItem[] }) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items
            .filter((item) => canAccess(item, user.permissions))
            .map((item) => (
              <NavMainItem key={item.title} item={item} />
            ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
