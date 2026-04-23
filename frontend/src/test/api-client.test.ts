import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, buildUrl, resolveApiBaseUrl } from "@/lib/api";

beforeEach(() => {
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("resolveApiBaseUrl", () => {
  it("drops localhost API base when the app is opened on a remote host", () => {
    expect(resolveApiBaseUrl("http://localhost:8000", "crm.digitai.icu")).toBe("");
  });

  it("keeps localhost API base for local browser sessions", () => {
    expect(resolveApiBaseUrl("http://localhost:8000", "localhost")).toBe("http://localhost:8000");
  });
});

describe("buildUrl", () => {
  it("normalizes client paths before prefixing with /api", () => {
    expect(buildUrl("/clients", "")).toBe("/api/clients");
    expect(buildUrl("clients", "")).toBe("/api/clients");
    expect(buildUrl("/api/clients", "")).toBe("/api/clients");
  });

  it("prefixes urls with the resolved API base when provided", () => {
    expect(buildUrl("/clients", "https://api.example.com")).toBe("https://api.example.com/api/clients");
  });
});

describe("api client", () => {
  it("does not send Content-Type for requests without a JSON body", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue('{"items":[]}'),
    });

    vi.stubGlobal("fetch", fetchMock);

    await api.get<{ items: unknown[] }>("clients");
    await api.delete("/clients/1");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/clients",
      expect.not.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/clients/1",
      expect.not.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      }),
    );
  });

  it("sends Content-Type when a JSON body is present", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue('{"id":"1"}'),
    });

    vi.stubGlobal("fetch", fetchMock);

    await api.post<{ id: string }>("clients", { name: "Acme" });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/clients",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Acme" }),
      }),
    );

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("adds Authorization header when session token exists", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue('{"items":[]}'),
    });

    vi.stubGlobal("fetch", fetchMock);
    window.sessionStorage.setItem("crm_auth", "auth-token-123");

    await api.get<{ items: unknown[] }>("clients");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(headers.get("Authorization")).toBe("Bearer auth-token-123");
  });

  it("returns undefined for 204 responses without parsing JSON", async () => {
    const json = vi.fn();
    const text = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json,
      text,
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(api.delete("clients/1")).resolves.toBeUndefined();
    expect(json).not.toHaveBeenCalled();
    expect(text).not.toHaveBeenCalled();
  });

  it("returns undefined for empty successful responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue(""),
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(api.delete("clients/1")).resolves.toBeUndefined();
  });
});
