import { PERMISSIONS, type Permission } from "@/lib/permissions";
import { Gauge, House, Users, type LucideIcon } from "lucide-react";

/**
 * A single entry in the application navigation.
 */
export type NavItem = {
  /** Label shown in the sidebar and on the home page */
  title: string;
  /** Absolute path the entry links to */
  url: string;
  /** Icon rendered next to the label */
  icon?: LucideIcon;
  /** Permission required to reach the section; omit to make it available to everyone */
  permission?: Permission;
  /** Short explanation shown on the home page cards */
  description?: string;
  /**
   * Marks the entry that *is* the home landing, so it isn't listed as a card
   * pointing at itself. Exactly one entry should set this.
   */
  landing?: boolean;
};

/**
 * Single source of truth for the application sections.
 * Both the sidebar and the home page derive what the user can see from here,
 * so a section only has to be declared once.
 */
export const nav: NavItem[] = [
  {
    title: "Home",
    url: "/",
    icon: House,
    description: "Your available sections",
    landing: true,
  },
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Gauge,
    permission: PERMISSIONS.clients.create,
    description: "Metrics and activity overview",
  },
  {
    title: "Clients",
    url: "/clients",
    icon: Users,
    permission: PERMISSIONS.clients.create,
    description: "Browse and manage clients",
  },
];

/**
 * Whether the given permissions grant access to a navigation entry.
 * Entries without a `permission` are open to every authenticated user.
 */
export const canAccess = (item: NavItem, permissions: string[]) =>
  !item.permission || permissions.includes(item.permission);

/**
 * The navigation entries the given permissions grant access to.
 */
export const visibleNav = (permissions: string[]) =>
  nav.filter((item) => canAccess(item, permissions));

/**
 * The sections to offer as cards on the home landing: everything the user can
 * reach except the landing itself.
 */
export const homeSections = (permissions: string[]) =>
  visibleNav(permissions).filter((item) => !item.landing);
