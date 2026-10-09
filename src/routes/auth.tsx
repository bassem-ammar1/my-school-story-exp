import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { track } from "@/lib/track";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: typeof s["redirect"] === "string" ? (s["redirect"] as string) : undefined }),
  head: () => ({
    meta: [
      { title: "Sign in · Thinking Lab" },
      { name: "description", content: "Sign in to share your thinking or run your class's Thinking Lab." },
      { property: "og:title", content: "Sign in · Thinking Lab" },
      { property: "og:description", content: "Students and teachers sign in to the Thinking Lab." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const done = async () => {
    if (sessionStorage.getItem("demo_started")) { await track("demo_converted"); sessionStorage.removeItem("demo_started"); }
    navigate({ to: "/lab" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/lab", data: { full_name: name } } });
        if (error) throw error;
        if (!data.session) toast.success("Check your email to confirm your account.");
        else await done();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await done();
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const sso = async (p: "google" | "microsoft") => {
    const r = await lovable.auth.signInWithOAuth(p, { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error(r.error.message);
    else if (!r.redirected) await done();
  };

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">{mode === "in" ? "Welcome back" : "Create your account"}</h1>
        <p className="mt-1 text-muted-foreground">Teachers: use school sign-in to unlock the Orchestrator.</p>
      </div>
      <div className="grid gap-2 rounded-2xl bg-card p-5 shadow-soft">
        <p className="text-sm font-semibold">School sign-in</p>
        <Button variant="outline" onClick={() => sso("google")}>Google Workspace for Education</Button>
        <Button variant="outline" onClick={() => sso("microsoft")}>Microsoft Entra ID</Button>
      </div>
      <form onSubmit={submit} className="grid gap-3 rounded-2xl bg-card p-5 shadow-soft">
        {mode === "up" && (
          <div className="grid gap-1"><Label htmlFor="name">Your name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
        )}
        <div className="grid gap-1"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div className="grid gap-1"><Label htmlFor="pw">Password</Label><Input id="pw" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        <Button type="submit" disabled={busy}>{mode === "in" ? "Sign in" : "Sign up"}</Button>
        <button type="button" className="text-sm text-primary underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </form>
    </main>
  );
}
