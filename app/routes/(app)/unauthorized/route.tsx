import { Button } from "@/components/ui/button";
import { AuthorizedLoader } from "@/lib/auth.server";
import { ShieldAlert } from "lucide-react";
import { Link } from "react-router";

export function meta() {
  return [
    { title: "No access" },
    { name: "description", content: "You don't have access to this section" },
  ];
}

export const handle = {
  title: "No access",
};

// Authenticated but intentionally permission-free: this is where the auth
// wrappers send users who lack a permission, so it must never gate itself.
export const loader = AuthorizedLoader(async (_args, user) => ({ user }));

export default function Page() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 lg:px-6">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <ShieldAlert className="h-7 w-7 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">
          You don't have access to this section
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Your account is signed in, but it's missing the permissions required
          to open this page. Ask an administrator to grant them, or head back to
          the sections available to you.
        </p>
        <Button asChild className="mt-2">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
