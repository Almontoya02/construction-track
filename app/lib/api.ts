import type { Op } from "@/lib/offline";
import type { AppData } from "@/lib/types";

/** No signal, or the server could not be reached: worth retrying later. */
export class NetworkError extends Error {}

/** The server answered with an error. 5xx is retryable, 4xx is not. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function isRetryable(error: unknown) {
  return (
    error instanceof NetworkError ||
    (error instanceof ApiError && error.status >= 500)
  );
}

async function request<T>(
  method: string,
  url: string,
  body?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new NetworkError("Sin conexión con el servidor.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      (data as { error?: string }).error ??
        `Error ${response.status} al hablar con el servidor.`,
      response.status,
    );
  }
  return data as T;
}

const q = (id: string) => `?id=${encodeURIComponent(id)}`;

/** Sends one queued change to the server. */
export function sendOp(op: Op): Promise<unknown> {
  switch (op.kind) {
    case "createProject":
      return request("POST", "/api/projects", {
        ...op.project,
        epics: op.epics,
      });
    case "deleteProject":
      return request("DELETE", `/api/projects${q(op.id)}`);
    case "createEpic":
      return request("POST", "/api/epics", op.epic);
    case "deleteEpic":
      return request("DELETE", `/api/epics${q(op.id)}`);
    case "createTask":
      return request("POST", "/api/tasks", op.task);
    case "updateTask":
      return request("PATCH", `/api/tasks${q(op.id)}`, op.patch);
    case "deleteTask":
      return request("DELETE", `/api/tasks${q(op.id)}`);
  }
}

export const api = {
  load: () => request<AppData>("GET", "/api/data"),

  subscribePush: (sub: PushSubscriptionJSON) =>
    request("POST", "/api/push/subscribe", sub),
  unsubscribePush: (endpoint: string) =>
    request("DELETE", "/api/push/subscribe", { endpoint }),
  testPush: () =>
    request<{ reminders: number; sent: number }>("POST", "/api/push/test"),
};
