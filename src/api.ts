import type { Letter } from "./letters";

export interface PublicLetter extends Letter {
  origin: "editorial" | "community";
  createdAt: string;
}
export class ApiError extends Error {
  status: number;
  code: string;
  constructor(message: string, status: number, code: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(path, {
    ...options,
    cache: "no-store",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new ApiError(
      data?.error?.message || "Letters could not be reached. Please try again.",
      response.status,
      data?.error?.code || "SERVICE_UNAVAILABLE",
    );
  return data as T;
}
export function letterLink(id: string): string {
  const origin =
    (import.meta as ImportMeta & { env: Record<string, string> }).env
      .VITE_SHARE_ORIGIN || location.origin;
  const url = new URL("/", origin);
  url.searchParams.set("letter", id);
  return url.href;
}
