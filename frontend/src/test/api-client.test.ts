import { describe, expect, it } from "vitest";
import { buildUrl } from "@/lib/api";

describe("buildUrl", () => {
  it("prefixes app requests with /api", () => {
    expect(buildUrl("/clients")).toBe("/api/clients");
    expect(buildUrl("/reports/clients")).toBe("/api/reports/clients");
  });
});
