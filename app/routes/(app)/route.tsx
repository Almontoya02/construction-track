import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthorizedLoader } from "@/lib/auth.server";
import { homeSections } from "@/lib/navigation";
import { Link } from "react-router";
import type { Route } from "./+types/route";

export function meta() {
  return [
    { title: "Home" },
    { name: "description", content: "Wellcome to Iluma" },
  ];
}

export const handle = {
  title: "Home",
};

export const loader = AuthorizedLoader(async (_args, user, permissions) => ({
  user,
  permissions,
}));

export default function Page({ loaderData }: Route.ComponentProps) {
  const { user, permissions } = loaderData;
  const sections = homeSections(permissions);

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">
          Welcome{user.name ? `, ${user.name}` : ""}
        </h2>
        <p className="text-muted-foreground">
          {sections.length > 0
            ? "Pick a section to get started."
            : "You don't have access to any section yet."}
        </p>
      </div>

      {sections.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <Link key={section.title} to={section.url} className="group">
              <Card className="h-full transition-colors group-hover:border-primary/50">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                    {section.icon && (
                      <section.icon className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <CardTitle>{section.title}</CardTitle>
                  {section.description && (
                    <CardDescription>{section.description}</CardDescription>
                  )}
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Nothing available yet</CardTitle>
            <CardDescription>
              Your account is active, but no sections have been granted to it.
              Ask an administrator to assign the permissions you need.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
