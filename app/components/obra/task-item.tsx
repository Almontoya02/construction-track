import { Check, Clock } from "lucide-react";
import { useObras } from "@/contexts/obras-context";
import { NEXT_STATUS, STATUS_LABEL, type TaskView } from "@/lib/obras";
import { cn } from "@/lib/utils";
import { DueTag, PlainTag } from "./bits";
import { useTaskDialog } from "./task-dialog";

function DoneCheckbox({ task }: { task: TaskView }) {
  const { updateTask } = useObras();
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={task.done}
      aria-label={task.done ? "Marcar como pendiente" : "Marcar como hecha"}
      onClick={() =>
        updateTask(task.id, { status: task.done ? "pendiente" : "hecho" })
      }
      className="-m-2.5 grid size-11 shrink-0 place-items-center"
    >
      <span
        className={cn(
          "grid size-[22px] place-items-center rounded-md border-[1.5px] transition-colors",
          task.done
            ? "border-[#2F5D3A] bg-[#2F5D3A] text-white"
            : "border-[#9C968B] bg-white text-transparent",
        )}
      >
        <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
      </span>
    </button>
  );
}

function StatusButton({ task }: { task: TaskView }) {
  const { updateTask } = useObras();
  return (
    <button
      type="button"
      onClick={() => updateTask(task.id, { status: NEXT_STATUS[task.status] })}
      aria-label={`Estado: ${STATUS_LABEL[task.status]}. Tocar para cambiar.`}
      className={cn(
        "-my-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1.5 text-xs font-semibold hover:bg-accent",
        task.status === "pendiente" && "text-[#55514A]",
        task.status === "proceso" && "text-[#7A4A12]",
        task.status === "hecho" && "text-[#2F5D3A]",
      )}
    >
      <Clock className="size-3.5" aria-hidden="true" />
      {STATUS_LABEL[task.status]}
    </button>
  );
}

function Title({ task }: { task: TaskView }) {
  const { openEdit } = useTaskDialog();
  return (
    <button
      type="button"
      onClick={() => openEdit(task)}
      className={cn(
        "text-left text-[15px] leading-snug font-semibold hover:underline",
        task.done && "font-medium text-[#8A857C] line-through",
      )}
    >
      {task.title}
    </button>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="grid size-[26px] shrink-0 place-items-center rounded-full bg-[#EDE3D6] text-[11px] font-bold text-[#5A3517]">
      {(name || "?").trim().charAt(0).toUpperCase()}
    </span>
  );
}

/** Card used in the board (kanban) view. */
export function TaskCard({ task }: { task: TaskView }) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl bg-card p-3.5 shadow-[0_1px_2px_rgba(31,42,38,0.08)]">
      <div className="flex items-start gap-3">
        <DoneCheckbox task={task} />
        <div className="min-w-0">
          <Title task={task} />
          <div className="mt-2 flex flex-wrap gap-1.5">
            <DueTag due={task.due} />
            {task.tag && <PlainTag>{task.tag}</PlainTag>}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-muted pt-2.5">
        <div className="flex min-w-0 items-center gap-2 text-[13px] text-[#55514A]">
          <Avatar name={task.assignee} />
          <span className="truncate">
            {task.assignee || "Sin asignar"} · {task.dateLabel}
          </span>
        </div>
        <StatusButton task={task} />
      </div>
    </article>
  );
}

/** Row used in the grouped list view. */
export function TaskRow({ task }: { task: TaskView }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 border-t border-muted px-4 py-2.5 first:border-t-0 sm:px-5">
      <div className="flex min-w-0 flex-[1_1_240px] items-start gap-3">
        <DoneCheckbox task={task} />
        <div className="min-w-0">
          <Title task={task} />
          <div className="mt-0.5 text-[13px] text-[#55514A]">
            {task.assignee || "Sin asignar"} · {task.dateLabel}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 pl-8 sm:pl-0">
        {task.tag && <PlainTag>{task.tag}</PlainTag>}
        <DueTag due={task.due} />
        <StatusButton task={task} />
      </div>
    </div>
  );
}
