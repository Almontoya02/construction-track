import { describe, expect, it } from "vitest";
import {
  addDays,
  buildReminderMessage,
  daysBetween,
  dueInfo,
  formatShortDate,
  selectReminders,
  todayISO,
} from "@/lib/due";

const TODAY = "2026-11-03";

describe("todayISO", () => {
  it("uses Bogotá time, not UTC", () => {
    // 03:00 UTC on Nov 4 is still 22:00 on Nov 3 in Bogotá (UTC-5).
    expect(todayISO(new Date("2026-11-04T03:00:00Z"))).toBe("2026-11-03");
  });
});

describe("date helpers", () => {
  it("counts whole days across month ends", () => {
    expect(daysBetween("2026-10-30", "2026-11-02")).toBe(3);
    expect(daysBetween(TODAY, "2026-11-01")).toBe(-2);
  });

  it("adds days", () => {
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
  });

  it("formats short Spanish dates", () => {
    expect(formatShortDate("2026-11-12")).toBe("12 nov");
  });
});

describe("dueInfo", () => {
  it.each([
    ["2026-11-01", "late", "Vencida hace 2 días"],
    ["2026-11-02", "late", "Vencida hace 1 día"],
    ["2026-11-03", "soon", "Vence hoy"],
    ["2026-11-04", "soon", "Vence mañana"],
    ["2026-11-06", "soon", "Vence en 3 días"],
    ["2026-11-07", "week", "En 4 días"],
    ["2026-11-10", "week", "En 7 días"],
    ["2026-11-11", "ok", "Vence 11 nov"],
  ] as const)("%s → %s", (date, level, label) => {
    expect(dueInfo(date, "pendiente", TODAY)).toMatchObject({ level, label });
  });

  it("marks finished tasks as done whatever the date", () => {
    expect(dueInfo("2026-10-01", "hecho", TODAY).level).toBe("done");
  });
});

describe("daily reminders", () => {
  const task = (
    title: string,
    due_date: string,
    status = "pendiente" as const,
  ) => ({
    title,
    due_date,
    status,
    project_name: "Casa del Lago",
  });

  it("picks overdue tasks and those due in 3, 1 or 0 days, most urgent first", () => {
    const picked = selectReminders(
      [
        task("En 2 días", "2026-11-05"),
        task("En 3 días", "2026-11-06"),
        task("Mañana", "2026-11-04"),
        task("Vencida", "2026-10-30"),
        task("Hoy", "2026-11-03"),
        task("En 5 días", "2026-11-08"),
        { ...task("Ya hecha", "2026-11-03"), status: "hecho" as const },
      ],
      TODAY,
    );
    expect(picked.map((t) => t.title)).toEqual([
      "Vencida",
      "Hoy",
      "Mañana",
      "En 3 días",
    ]);
  });

  it("says nothing when nothing is due", () => {
    expect(buildReminderMessage([], TODAY)).toBeNull();
  });

  it("names the task when there is only one", () => {
    const msg = buildReminderMessage(
      selectReminders([task("Fundir vigas", "2026-11-04")], TODAY),
      TODAY,
    );
    expect(msg?.title).toBe("Vence mañana: Fundir vigas");
  });

  it("summarises several tasks", () => {
    const msg = buildReminderMessage(
      selectReminders(
        [
          task("A", "2026-11-01"),
          task("B", "2026-11-03"),
          task("C", "2026-11-06"),
        ],
        TODAY,
      ),
      TODAY,
    );
    expect(msg?.title).toBe("Tienes 3 tareas para revisar");
    expect(msg?.body).toContain("1 vencida · 1 para hoy");
    expect(msg?.body).toContain("• A (Casa del Lago)");
  });
});
