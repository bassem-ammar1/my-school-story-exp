import { useNavigate } from "@tanstack/react-router";
import logo from "@/assets/logo.png";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { track } from "@/lib/track";

export function AuthForm() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const done = async () => {
    if (sessionStorage.getItem("demo_started")) { await track("demo_converted"); sessionStorage.removeItem("demo_started"); }
    navigate({ to: "/home" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/home", data: { full_name: name } } });
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
    const r = await lovable.auth.signInWithOAuth(p, { redirect_uri: window.location.origin });
    if (r.error) toast.error(r.error.message);
    else if (!r.redirected) await done();
  };

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-6 py-12">
      <div className="text-center">
        <img src={logo} alt="MySchoolStory logo" width={96} height={96} className="mx-auto h-24 w-24 object-contain" />
        <p className="mt-2 text-2xl font-extrabold tracking-tight text-primary">MySchoolStory</p>
        <h1 className="mt-4 text-3xl font-bold">{mode === "in" ? "Welcome back" : "Create your account"}</h1>
        <p className="mt-1 text-muted-foreground">Teachers: use school sign-in to unlock the Orchestrator.</p>
      </div>
      <div className="grid gap-2 rounded-2xl bg-card p-5 shadow-soft">
        <p className="text-sm font-semibold">Quick sign-in</p>
        <Button variant="outline" onClick={() => sso("google")}>
          {mode === "in" ? "Sign in with Google" : "Sign up with Google"}
        </Button>
        <Button variant="outline" onClick={() => sso("microsoft")}>Microsoft Entra ID</Button>
        <p className="text-xs text-muted-foreground">Teachers: use school sign-in to unlock the Orchestrator.</p>
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
