/**
 * Always call same-origin `/api/...`.
 * Next.js rewrites those to the Express API (see next.config.ts).
 * Do not point the browser at :3001 directly — cookies and CORS get messy.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json().catch(() => ({}))) as {
    data?: T;
    error?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new ApiError(
      response.status,
      body.error ?? "ERROR",
      body.message ?? `Request failed (${response.status})`,
    );
  }

  return (body.data ?? body) as T;
}
