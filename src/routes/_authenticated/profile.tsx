import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArtifactCard } from "@/components/thinking/ArtifactCard";
import { BadgeWall } from "@/components/thinking/BadgeIssuer";
import { loadArtifacts } from "@/lib/feed-data";
import { COPY } from "@/lib/thinking";
import { useMe } from "@/hooks/use-me";
import { TeacherRequestCard } from "@/components/thinking/TeacherRequestCard";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "My thinking · Thinking Lab" }, { name: "description", content: "Your published thinking, badges and tasks." }, { property: "og:title", content: "My thinking · Thinking Lab" }, { property: "og:description", content: "Your published thinking, badges and tasks." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Profile,
});

function Profile() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const { data: arts = [] } = useQuery({ queryKey: ["my-arts"], enabled: !!me, queryFn: () => loadArtifacts({ studentId: me!.id }) });
  const { data: tasks = [] } = useQuery({ queryKey: ["my-tasks"], enabled: !!me, queryFn: async () => (await supabase.from("micro_tasks").select("*").eq("student_id", me!.id).order("created_at", { ascending: false })).data ?? [] });
  const [form, setForm] = useState({ display_name: "", grade: "", age_13_plus: false, voice_consent: false });
  useEffect(() => { if (me?.profile) setForm({ display_name: me.profile.display_name, grade: me.profile.grade?.toString() ?? "", age_13_plus: me.profile.age_13_plus, voice_consent: me.profile.voice_consent }); }, [me]);
  if (!me) return null;

  const saveProfile = async () => {
    const { error } = await supabase.from("profiles").update({ ...form, grade: form.grade ? Number(form.grade) : null }).eq("id", me.id);
    if (error) toast.error(error.message); else { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["me"] }); }
  };

  return (
    <main className="bg-muted pb-4">
      <section className="bg-card pb-4">
        <div className="h-24 bg-gradient-to-r from-primary to-accent" />
        <div className="px-4">
          <div className="-mt-12 grid h-24 w-24 place-items-center rounded-full border-4 border-card bg-primary text-4xl font-bold text-primary-foreground">
            {(me.profile?.display_name ?? "?").charAt(0).toUpperCase()}
          </div>
          <h1 className="mt-2 text-2xl font-bold">{me.profile?.display_name}</h1>
          <p className="text-sm">{me.ssoTeacher ? "Teacher" : "Student"}{me.profile?.grade ? ` · Grade ${me.profile.grade}` : ""}</p>
          <p className="text-sm text-muted-foreground">{me.email}</p>
          <p className="mt-1 text-sm font-semibold text-primary">{arts.length} published thinking posts</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button className="rounded-full" asChild><Link to="/post">New post</Link></Button>
            <Button variant="outline" className="rounded-full" asChild><Link to="/lab">Assessment</Link></Button>
          </div>
        </div>
      </section>
      <section className="mt-2 bg-card p-4">
        <h2 className="text-lg font-semibold">About</h2>
        <p className="mt-1 text-sm text-muted-foreground">A learner on MySchoolStory who shares how they think, step by step.</p>
      </section>
      <TeacherRequestCard userId={me.id} isTeacher={me.roles.includes("teacher")} />
      {me.isAdmin && <section className="mt-2 bg-card p-4"><Button variant="outline" className="rounded-full" asChild><Link to="/admin">School admin: reports & teacher requests</Link></Button></section>}
      <div className="mt-2 bg-card p-4">
      <Tabs defaultValue="thinking">
        <TabsList><TabsTrigger value="thinking">Thinking</TabsTrigger><TabsTrigger value="badges">Badges</TabsTrigger><TabsTrigger value="tasks">Tasks ({tasks.filter((t) => t.status !== "done").length})</TabsTrigger><TabsTrigger value="settings">Settings</TabsTrigger></TabsList>
        <TabsContent value="thinking">
          {arts.length ? <div className="grid gap-4 md:grid-cols-3">{arts.map((a) => <ArtifactCard key={a.id} a={a} />)}</div> : <p className="p-8 text-center text-muted-foreground">{COPY.empty}</p>}
        </TabsContent>
        <TabsContent value="badges"><BadgeWall studentId={me.id} /></TabsContent>
        <TabsContent value="tasks" className="space-y-3">
          {tasks.length === 0 && <p className="text-muted-foreground">No tasks right now.</p>}
          {tasks.map((t) => (
            <div key={t.id} className="rounded-2xl bg-card p-4 shadow-soft">
              <div className="flex items-center justify-between"><h3 className="font-semibold">{t.title} · {t.duration_min} min</h3>
                {t.status !== "done" ? <Button size="sm" onClick={async () => { const { error } = await supabase.from("micro_tasks").update({ status: "done" }).eq("id", t.id); if (error) toast.error("Couldn't update this task."); else { toast.success("Task done"); qc.invalidateQueries({ queryKey: ["my-tasks"] }); } }}>Mark done</Button> : <span className="text-sm text-muted-foreground">Done ✓</span>}
              </div>
              <p className="mt-1 text-sm">{t.instructions}</p>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="settings" className="max-w-md space-y-4 rounded-2xl bg-card p-5 shadow-soft">
          <div className="grid gap-1"><Label>Display name</Label><Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} /></div>
          <div className="grid gap-1"><Label>Grade</Label><Input type="number" min={1} max={12} value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} /></div>
          <div className="flex items-center justify-between"><Label>I am 13 or older</Label><Switch checked={form.age_13_plus} onCheckedChange={(v) => setForm({ ...form, age_13_plus: v })} /></div>
          {!form.age_13_plus && <div className="flex items-center justify-between gap-3"><Label>My parent or guardian allows voice notes</Label><Switch checked={form.voice_consent} onCheckedChange={(v) => setForm({ ...form, voice_consent: v })} /></div>}
          <Button onClick={saveProfile}>Save</Button>
        </TabsContent>
      </Tabs>
      </div>
    </main>
  );
}
