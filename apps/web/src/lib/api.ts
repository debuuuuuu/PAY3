// Same-origin `/api` proxy (see next.config rewrites) so auth cookies stick on refresh.
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : typeof data.message === "string"
          ? data.message
          : `Request failed (${res.status})`
    );
  }
  return data as T;
}
