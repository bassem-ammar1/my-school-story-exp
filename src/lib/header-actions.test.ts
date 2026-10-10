import { describe, expect, it, vi } from "vitest";
import { headerActions, signOutAndRedirect } from "./header-actions";

describe("header actions", () => {
  it("allows search and sharing only on Home", () => {
    expect(headerActions("/home")).toEqual({ search: true, share: true, logout: false });
    expect(headerActions("/home/")).toEqual({ search: true, share: true, logout: false });
  });
  it.each(["/profile", "/lab", "/challenges", "/search", "/author/My School", "/u/123", "/post", "/admin", "/demo", "/"]) ("offers logout instead on %s", (path) => {
    expect(headerActions(path)).toEqual({ search: false, share: false, logout: true });
  });
  it("stops queries and clears private data before signing out and redirecting", async () => {
    const calls: string[] = [];
    await signOutAndRedirect({
      cancelQueries: async () => { calls.push("cancel"); },
      clear: () => { calls.push("clear"); },
      signOut: async () => { calls.push("signOut"); return { error: null }; },
      redirect: async () => { calls.push("redirect"); },
    });
    expect(calls).toEqual(["cancel", "clear", "signOut", "redirect"]);
  });
  it("does not pretend sign-out succeeded when it fails", async () => {
    const redirect = vi.fn();
    const error = new Error("Sign-out failed");
    await expect(signOutAndRedirect({ cancelQueries: async () => {}, clear: () => {}, signOut: async () => ({ error }), redirect })).rejects.toThrow(error);
    expect(redirect).not.toHaveBeenCalled();
  });
});