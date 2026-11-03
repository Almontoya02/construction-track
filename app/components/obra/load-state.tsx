import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useObras } from "@/contexts/obras-context";

/**
 * Renders a skeleton while the first load is in flight and a retry card if it
 * failed; otherwise renders the page.
 */
export function LoadState({ children }: { children: React.ReactNode }) {
  const { loading, error, reload, data } = useObras();

  if (loading) {
    return (
      <div
        className="flex flex-col gap-6"
        aria-busy="true"
        aria-label="Cargando"
      >
        <Skeleton className="h-24 rounded-2xl bg-column" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-2xl bg-column" />
          <Skeleton className="h-32 rounded-2xl bg-column" />
          <Skeleton className="h-32 rounded-2xl bg-column" />
        </div>
        <Skeleton className="h-56 rounded-2xl bg-column" />
      </div>
    );
  }

  if (error && data.projects.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-[#E6B9AF] bg-[#FBEDEA] p-5">
        <b className="text-base text-[#8C2516]">No pudimos cargar tus obras</b>
        <p className="text-sm text-[#5C2A20]">{error}</p>
        <Button variant="outline" className="h-11 rounded-xl" onClick={reload}>
          <RefreshCw aria-hidden="true" /> Reintentar
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
