import { beforeEach, describe, expect, it } from "vitest";
import {
  applyAll,
  applyOp,
  EMPTY_DATA,
  loadOutbox,
  loadSnapshot,
  saveOutbox,
  saveSnapshot,
  type QueuedOp,
} from "@/lib/offline";
import type { AppData, Epic, Project, Task } from "@/lib/types";

const project: Project = {
  id: "p1",
  name: "Casa del Lago",
  place: "Rionegro",
  type: "Vivienda",
  color: "#C8693A",
  created_at: "",
};
const epic: Epic = {
  id: "e1",
  project_id: "p1",
  name: "Estructura",
  color: "#C8693A",
  position: 0,
};
const task: Task = {
  id: "t1",
  project_id: "p1",
  epic_id: "e1",
  title: "Fundir vigas",
  due_date: "2026-11-04",
  assignee: "Andrés",
  tag: "Concreto",
  status: "pendiente",
  created_at: "",
};
const seeded: AppData = { projects: [project], epics: [epic], tasks: [task] };

describe("applyOp", () => {
  it("creates a project with its epics", () => {
    const d = applyOp(EMPTY_DATA, {
      kind: "createProject",
      project,
      epics: [epic],
    });
    expect(d.projects).toHaveLength(1);
    expect(d.epics).toHaveLength(1);
  });

  it("ignores a create that already arrived from the server", () => {
    const d = applyOp(seeded, { kind: "createTask", task });
    expect(d.tasks).toHaveLength(1);
  });

  it("updates a task", () => {
    const d = applyOp(seeded, {
      kind: "updateTask",
      id: "t1",
      patch: { status: "hecho" },
    });
    expect(d.tasks[0].status).toBe("hecho");
  });

  it("deleting a project removes its epics and tasks", () => {
    expect(applyOp(seeded, { kind: "deleteProject", id: "p1" })).toEqual(
      EMPTY_DATA,
    );
  });

  it("deleting an epic removes its tasks", () => {
    const d = applyOp(seeded, { kind: "deleteEpic", id: "e1" });
    expect(d.epics).toHaveLength(0);
    expect(d.tasks).toHaveLength(0);
  });

  it("replays the outbox in order over server data", () => {
    const outbox: QueuedOp[] = [
      {
        opId: "a",
        op: { kind: "createTask", task: { ...task, id: "t2", title: "Nueva" } },
      },
      {
        opId: "b",
        op: { kind: "updateTask", id: "t2", patch: { status: "proceso" } },
      },
    ];
    const d = applyAll(seeded, outbox);
    expect(d.tasks.map((t) => [t.id, t.status])).toEqual([
      ["t1", "pendiente"],
      ["t2", "proceso"],
    ]);
  });
});

describe("persistence", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips the snapshot and the outbox", () => {
    expect(loadSnapshot()).toBeNull();
    expect(loadOutbox()).toEqual([]);
    saveSnapshot(seeded);
    const outbox: QueuedOp[] = [
      { opId: "a", op: { kind: "deleteTask", id: "t1" } },
    ];
    saveOutbox(outbox);
    expect(loadSnapshot()).toEqual(seeded);
    expect(loadOutbox()).toEqual(outbox);
  });

  it("survives corrupted storage", () => {
    localStorage.setItem("obra-clara:data", "{not json");
    expect(loadSnapshot()).toBeNull();
  });
});
