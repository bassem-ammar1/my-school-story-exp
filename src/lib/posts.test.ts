import { describe, it, expect, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { buildThread, timeAgo } from "./posts";

const c = (id: string, parent_id: string | null, t: string) => ({ id, post_id: "p", parent_id, author_id: "a", body: id, created_at: t });

describe("comment threads", () => {
  it("nests replies under their top-level comment, including replies to replies", () => {
    const t = buildThread([c("r2", "r1", "3"), c("top", null, "1"), c("r1", "top", "2")], { a: "Lina" });
    expect(t).toHaveLength(1);
    expect(t[0]!.replies.map((r) => r.id)).toEqual(["r1", "r2"]);
    expect(t[0]!.author).toBe("Lina");
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

import { applyReaction, totalReactions } from "./posts";
describe("reactions", () => {
  it("changing a reaction moves the user's one vote", () => {
    const c = applyReaction({ like: 3, love: 1 }, "like", "love");
    expect(c).toEqual({ like: 2, love: 2 });
    expect(totalReactions(c)).toBe(4);
  });
  it("removing a reaction lowers the total by one and never below zero", () => {
    expect(applyReaction({ like: 1 }, "like", null)).toEqual({ like: 0 });
    expect(applyReaction({}, "celebrate", null)).toEqual({ celebrate: 0 });
  });
});
