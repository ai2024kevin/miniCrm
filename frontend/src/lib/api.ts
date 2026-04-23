const AUTH_SESSION_KEY = 'crm_auth';
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function buildUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const apiPath = normalizedPath === "/api" || normalizedPath.startsWith("/api/") ? normalizedPath : `/api${normalizedPath}`;

  return apiBaseUrl ? `${apiBaseUrl}${apiPath}` : apiPath;
}

function parseErrorMessage(text: string, status: number): string {
  if (!text) {
    return `Request failed: ${status}`;
  }

  try {
    const parsed = JSON.parse(text) as { message?: unknown };

    if (typeof parsed.message === 'string' && parsed.message.trim()) {
      return parsed.message;
    }

    if (Array.isArray(parsed.message) && parsed.message.every((item) => typeof item === 'string')) {
      return parsed.message.join('; ');
    }
  } catch {
    return text;
  }

  return `Request failed: ${status}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const isFormDataBody = typeof FormData !== 'undefined' && init?.body instanceof FormData;

  if (init?.body !== undefined && !isFormDataBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = window.sessionStorage.getItem(AUTH_SESSION_KEY)?.trim();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();

  if (!response.ok) {
    throw new ApiError(parseErrorMessage(text, response.status), response.status);
  }

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

const isFormData = (body: unknown): body is FormData => typeof FormData !== 'undefined' && body instanceof FormData;

const toRequestBody = (body: unknown, fallbackJson: unknown): BodyInit | undefined => {
  if (body === undefined) {
    return JSON.stringify(fallbackJson);
  }

  if (isFormData(body)) {
    return body;
  }

  return JSON.stringify(body);
};

export const api = {
  get: <T,>(path: string) => request<T>(path),
  post: <T,>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: toRequestBody(body, {}) }),
  put: <T,>(path: string, body: unknown) => request<T>(path, { method: "PUT", body: toRequestBody(body, undefined) }),
  delete: (path: string) => request<void>(path, { method: "DELETE" }),
};
