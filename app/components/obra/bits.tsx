import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { dueStyle } from "@/lib/obras";
import type { DueInfo } from "@/lib/due";

export function HardHatIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M2 18h20" />
      <path d="M4 18v-1a8 8 0 0 1 16 0v1" />
      <path d="M10 9V5h4v4" />
      <path d="M7 11.5V14" />
      <path d="M17 11.5V14" />
    </svg>
  );
}

export function DueTag({
  due,
  className,
}: {
  due: DueInfo;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded-md px-2 py-1 text-xs font-semibold whitespace-nowrap",
        dueStyle(due),
        className,
      )}
    >
      {due.label}
    </span>
  );
}

export function PlainTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium whitespace-nowrap text-[#4A4640]">
      {children}
    </span>
  );
}

export function Dot({
  color,
  className,
}: {
  color: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-2.5 shrink-0 rounded-full", className)}
      style={{ background: color }}
    />
  );
}

export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function ProgressBar({ pct, dark }: { pct: number; dark?: boolean }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "h-2 overflow-hidden rounded",
        dark ? "bg-ink-3" : "bg-[#ECE7DE]",
      )}
    >
      <div
        className={cn(
          "h-full rounded transition-[width]",
          dark ? "bg-clay-light" : "bg-clay",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

const TONES = {
  neutral: "bg-column text-[#3F3B35]",
  soon: "bg-[#FAE0C2] text-[#874108]",
  late: "bg-[#F5D3CC] text-[#8C2516]",
  done: "bg-[#E1E8DC] text-[#2F4A2C]",
};

export function StatCard({
  icon: Icon,
  tone,
  value,
  label,
  sub,
}: {
  icon: LucideIcon;
  tone: keyof typeof TONES;
  value: number;
  label: string;
  sub: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-[#E6E1D7] bg-card p-3.5 sm:gap-3 sm:p-5">
      <div
        className={cn(
          "grid size-10 place-items-center rounded-xl",
          TONES[tone],
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div className="font-display text-3xl leading-none sm:text-4xl">
        {value}
      </div>
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <div className="hidden text-[13px] text-muted-foreground sm:block">
          {sub}
        </div>
      </div>
    </div>
  );
}
