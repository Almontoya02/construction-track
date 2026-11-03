import type { TaskStatus } from "./due.js";

export type { TaskStatus };

export interface Project {
  id: string;
  name: string;
  place: string;
  type: string;
  color: string;
  created_at: string;
}

export interface Epic {
  id: string;
  project_id: string;
  name: string;
  color: string;
  position: number;
}

export interface Task {
  id: string;
  project_id: string;
  epic_id: string;
  title: string;
  due_date: string;
  assignee: string;
  tag: string;
  status: TaskStatus;
  created_at: string;
}

export interface AppData {
  projects: Project[];
  epics: Epic[];
  tasks: Task[];
}

export type NewProject = Pick<Project, "name" | "place" | "type">;
export type NewEpic = Pick<Epic, "project_id" | "name">;
export type NewTask = Pick<
  Task,
  "project_id" | "epic_id" | "title" | "due_date" | "assignee" | "tag"
>;
export type TaskPatch = Partial<
  Pick<Task, "epic_id" | "title" | "due_date" | "assignee" | "tag" | "status">
>;

export const EPIC_COLORS = [
  "#7A8B6F",
  "#8C6D4F",
  "#C8693A",
  "#4F6B7A",
  "#9A6A8A",
  "#5F7F6A",
  "#A0743A",
  "#6A6F9A",
];

export const DEFAULT_EPICS = [
  "Preliminares",
  "Cimentación",
  "Estructura",
  "Mampostería",
  "Redes técnicas",
  "Acabados",
];
