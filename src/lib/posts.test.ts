import { describe, it, expect, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { buildThread, timeAgo } from "./posts";

const c = (id: string, parent_id: string | null, t: string) => ({ id, post_id: "p", parent_id, author_id: "a", body: id, created_at: t });

describe("comment threads", () => {
  it("nests replies under their top-level comment, including replies to replies", () => {
    const t = buildThread([c("r2", "r1", "3"), c("top", null, "1"), c("r1", "top", "2")], { a: "Lina" });
    expect(t).toHaveLength(1);
    expect(t[0].replies.map((r) => r.id)).toEqual(["r1", "r2"]);
    expect(t[0].author).toBe("Lina");
  });
  it("keeps a reply whose parent was removed as a top-level comment", () => {
    expect(buildThread([c("orphan", "gone", "1")], {}).map((x) => x.id)).toEqual(["orphan"]);
  });
});

describe("timeAgo", () => {
  it("formats hours and days", () => {
    const now = Date.parse("2026-01-02T00:00:00Z");
    expect(timeAgo("2026-01-01T22:00:00Z", now)).toBe("2h");
    expect(timeAgo("2025-12-31T00:00:00Z", now)).toBe("2d");
  });
});
