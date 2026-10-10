import { useNavigate } from "@tanstack/react-router";
import logo from "@/assets/logo.png";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Eye, EyeOff, GraduationCap, Presentation, School } from "lucide-react";
import { track } from "@/lib/track";
import { ACCOUNT_CHOICES, type AccountChoice } from '@/lib/account-choices';
import { applyPendingSignupChoice } from '@/lib/signup-choice';
import { guardianEmails, safetyError } from '@/lib/student-safety';

export function AuthForm() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [role, setRole] = useState<AccountChoice>('student');
  const [school, setSchool] = useState('');
  const [dob, setDob] = useState('');
  const [guardians, setGuardians] = useState('');
  const [showPw, setShowPw] = useState(false);

  const done = async () => {
    await applyPendingSignupChoice();
    if (sessionStorage.getItem("demo_started")) { await track("demo_converted"); sessionStorage.removeItem("demo_started"); }
    navigate({ to: "/home" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "up") {
        const emails = guardianEmails(guardians);
        if (role === 'student') { const problem = safetyError(dob, emails, email); if (problem) throw new Error(problem); }
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { full_name: name, signup_role: role, school_name: school.trim(), ...(role === 'student' ? { date_of_birth: dob, guardian_emails: emails } : {}) } } });
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
    if (mode === 'up') {
      if (role === 'student') { const problem = safetyError(dob, guardianEmails(guardians), email); if (problem) { toast.error(problem); return; } }
      if (role !== 'student' && school.trim().length < 2) { toast.error('Please enter your school name.'); return; }
      sessionStorage.setItem('signup-choice', JSON.stringify({ role, school: school.trim(), dob: role === 'student' ? dob : null, emails: guardianEmails(guardians) }));
    }
    const r = await lovable.auth.signInWithOAuth(p, { redirect_uri: window.location.origin });
    if (r.error) toast.error(r.error.message);
    else if (!r.redirected) await done();
  };

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-6 py-12">
      <div className="text-center">
        <img src={logo} alt="MySchoolStory logo" width={96} height={96} className="mx-auto h-24 w-24 object-contain" />
        <p className="mt-0 text-2xl font-extrabold tracking-tight text-primary">MySchoolStory</p>
        <h1 className="mt-5 text-3xl font-bold">{mode === "in" ? "Welcome back" : "Create your account"}</h1>
        <p className="mt-1 text-muted-foreground">Your learning. Your community. Your story.</p>
      </div>
      {mode === 'up' && <section className="space-y-3"><Label>Account type</Label><div className="grid grid-cols-3 gap-2">{ACCOUNT_CHOICES.map(choice => { const Icon = choice === 'student' ? GraduationCap : choice === 'teacher' ? Presentation : School; return <Button key={choice} type="button" variant={role === choice ? 'default' : 'outline'} aria-pressed={role === choice} onClick={() => setRole(choice)} className="capitalize"><Icon className="size-4" />{choice}</Button>; })}</div>{role !== 'student' && <div className="space-y-1"><Label htmlFor="signup-school">School name</Label><Input id="signup-school" maxLength={120} value={school} onChange={e => setSchool(e.target.value)} required /><p className="text-xs text-muted-foreground">{role === 'teacher' ? 'Teacher' : 'School'} access needs approval from a school administrator.</p></div>}</section>}
      {mode === 'up' && role === 'student' && <section className="space-y-3"><div className="space-y-1"><Label htmlFor="signup-dob">Date of birth</Label><div className="relative"><Input id="signup-dob" type="date" max={new Date().toISOString().slice(0,10)} value={dob} onChange={e=>setDob(e.target.value)} required className="pr-9" /><Calendar className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /></div></div><div className="space-y-1"><Label htmlFor="signup-guardians">Guardian email addresses</Label><Input id="signup-guardians" value={guardians} onChange={e=>setGuardians(e.target.value)} placeholder="parent@email.com" required /><p className="text-xs text-muted-foreground">Both you and your verified guardian must approve before results can be shared.</p></div></section>}
      <div className="grid gap-2 rounded-2xl bg-card p-5 shadow-soft">
        <p className="text-sm font-semibold">Quick sign-in</p>
        <Button variant="outline" onClick={() => sso("google")}>
          {mode === "in" ? "Sign in with Google" : "Sign up with Google"}
        </Button>
        <Button variant="secondary" onClick={() => sso("microsoft")}>Microsoft Entra ID</Button>
        {mode === 'up' && role === 'teacher' && <p className="text-xs text-muted-foreground">Approved teachers also use their school Google or Microsoft account.</p>}
      </div>
      <form onSubmit={submit} className="grid gap-5 rounded-2xl bg-card p-5 shadow-soft">
        {mode === "up" && (
          <div className="grid gap-1"><Label htmlFor="name">Full name</Label><Input id="name" placeholder="e.g. Lina Haddad" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
        )}
        <div className="grid gap-1"><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="you@school.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="placeholder:text-right" required /></div>
        <div className="grid gap-1"><Label htmlFor="pw">Password</Label><div className="relative"><Input id="pw" type={showPw ? "text" : "password"} minLength={6} placeholder="At least 6 characters" autoComplete={mode === "up" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" required /><Button type="button" variant="ghost" size="icon" aria-label={showPw ? "Hide password" : "Show password"} title={showPw ? "Hide password" : "Show password"} aria-pressed={showPw} onClick={() => setShowPw(v => !v)} className="absolute right-0 top-0 text-muted-foreground">{showPw ? <EyeOff /> : <Eye />}</Button></div></div>
        <Button type="submit" disabled={busy || (mode === 'up' && role !== 'student' && school.trim().length < 2)}>{mode === "in" ? "Sign in" : "Sign up"}</Button>
        <Button variant="link" type="button" className="text-sm hover:no-underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          <span className="text-foreground">{mode === "in" ? "New here? " : "Already have an account? "}</span>
          <span className="underline">{mode === "in" ? "Create an account" : "Sign in"}</span>
        </Button>
      </form>
    </main>
  );
}
