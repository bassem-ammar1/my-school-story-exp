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
import { PostCard } from "@/components/thinking/PostCard";
import { loadPosts } from "@/lib/posts";
import { SAMPLE_ACHIEVEMENTS } from "@/lib/profile-themes";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MemberAvatar } from '@/components/thinking/MemberAvatar';
import { showAccessRequest } from '@/lib/account-choices';
import { ThemePicker } from '@/components/thinking/ThemePicker';

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "My profile · MySchoolStory" }, { name: "description", content: "Your posts, achievements, thinking, tasks and school theme." }, { property: "og:title", content: "My profile · MySchoolStory" }, { property: "og:description", content: "Your posts, achievements, thinking, tasks and school theme." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Profile,
});

function Profile() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const { data: arts = [] } = useQuery({ queryKey: ["my-arts", me?.id], enabled: !!me, queryFn: () => me ? loadArtifacts({ studentId: me.id }) : Promise.resolve([]) });
  const { data: posts = [] } = useQuery({ queryKey: ["posts"], queryFn: loadPosts });
  const { data: tasks = [] } = useQuery({ queryKey: ["my-tasks", me?.id], enabled: !!me, queryFn: async () => {
    if (!me) return [];
    const { data, error } = await supabase.from("micro_tasks").select("*").eq("student_id", me.id).order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  } });
  const [tab, setTab] = useState('posts');
  const [achievement, setAchievement] = useState<(typeof SAMPLE_ACHIEVEMENTS)[number] | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ display_name: "", grade: "", age_13_plus: false, voice_consent: false, about: '', headline: '' });
  useEffect(() => { if (me?.profile) setForm({ display_name: me.profile.display_name, grade: me.profile.grade?.toString() ?? "", age_13_plus: me.profile.age_13_plus, voice_consent: me.profile.voice_consent, about: me.profile.about, headline: me.profile.headline }); }, [me?.profile]);
  if (!me) return null;

  const saveProfile = async () => {
    if (!form.display_name.trim()) { toast.error('Please enter your display name.'); return; }
    if (form.grade && (!Number.isInteger(Number(form.grade)) || Number(form.grade) < 1 || Number(form.grade) > 12)) { toast.error('Grade must be from 1 to 12.'); return; }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ ...form, grade: form.grade ? Number(form.grade) : null }).eq("id", me.id);
    if (error) toast.error(error.message); else { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["me"] }); }
    setSaving(false);
  };
  const myPosts = posts.filter(p => p.authorId === me.id);
  const chooseTheme = async (theme: string) => {
    const { error } = await supabase.from('profiles').update({ theme }).eq('id', me.id);
    if (error) toast.error("Couldn't save the theme.");
    else { await qc.invalidateQueries({ queryKey: ['me'] }); toast.success('Theme saved'); }
  };

  return (
    <main className="bg-muted pb-4">
      <section className="bg-card pb-4">
        {me.profile?.cover_url ? <img src={me.profile.cover_url} alt="Profile cover" width={1536} height={768} className="h-32 w-full object-cover" /> : <div className="h-24 bg-gradient-to-r from-primary to-accent" />}
        <div className="px-4">
          <MemberAvatar url={me.profile?.avatar_url} name={me.profile?.display_name ?? 'Student'} className="relative -mt-12 h-24 w-24 border-4 border-card text-4xl" />
          <h1 className="mt-2 text-2xl font-bold">{me.profile?.display_name}</h1>
          <p className="mt-1 text-sm">{me.profile?.headline}</p>
          <p className="text-sm">{me.isAdmin ? 'School' : me.ssoTeacher ? "Teacher" : "Student"}{me.profile?.grade ? ` · Grade ${me.profile.grade}` : ""}</p>
          <p className="text-sm text-muted-foreground">{me.email}</p>
          <p className="mt-1 text-sm font-semibold text-primary">{myPosts.length} posts · {arts.length} published thinking posts</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button className="rounded-full" asChild><Link to="/post">New post</Link></Button>
            <Button variant="outline" className="rounded-full" asChild><Link to="/lab">Assessment</Link></Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setTab('settings')} className="mt-2">Edit profile</Button>
        </div>
      </section>
      <section className="mt-2 bg-card p-4">
        <h2 className="text-lg font-semibold">About</h2>
        <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{me.profile?.about || "A learner on MySchoolStory who shares how they think, step by step."}</p>
      </section>
      {showAccessRequest(me.signupRole) && !me.isAdmin && <TeacherRequestCard userId={me.id} isTeacher={me.roles.includes("teacher")} />}
      {me.isAdmin && <section className="mt-2 bg-card p-4"><Button variant="outline" className="rounded-full" asChild><Link to="/admin">School admin: reports & teacher requests</Link></Button></section>}
      <div className="mt-2 bg-card p-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto w-full flex-wrap justify-start"><TabsTrigger value="posts">Posts</TabsTrigger><TabsTrigger value="thinking">Thinking</TabsTrigger><TabsTrigger value="badges">Badges</TabsTrigger><TabsTrigger value="tasks">Tasks ({tasks.filter((t) => t.status !== "done").length})</TabsTrigger><TabsTrigger value="settings">Settings</TabsTrigger></TabsList>
        <TabsContent value="posts" className="space-y-3">
          {myPosts.length ? myPosts.map(p => <PostCard key={`${p.id}-${p.mine}`} p={p} meId={me.id} />) : <Button variant="outline" asChild><Link to="/post">Create your first post</Link></Button>}
        </TabsContent>
        <TabsContent value="thinking">
          {arts.length ? <div className="grid gap-4 md:grid-cols-3">{arts.map((a) => <ArtifactCard key={a.id} a={a} />)}</div> : <div className="space-y-3 py-6"><p className="text-center text-muted-foreground">{COPY.empty}</p><Button variant="outline" asChild><Link to="/challenges">Open Thinking Lab</Link></Button></div>}
        </TabsContent>
        <TabsContent value="badges" className="space-y-4">
          {me.profile?.sample_portfolio && <section className="space-y-2"><h2 className="font-semibold">Sample achievements</h2>{SAMPLE_ACHIEVEMENTS.map(a => <Button key={a.title} variant="outline" className="h-auto w-full justify-start whitespace-normal py-3 text-left" onClick={() => setAchievement(a)}><span className="mr-2 text-2xl">{a.icon}</span>{a.title}</Button>)}</section>}
          <h2 className="font-semibold">Teacher-awarded badges</h2><BadgeWall studentId={me.id} />
        </TabsContent>
        <TabsContent value="tasks" className="space-y-3">
          {tasks.length === 0 && <div className="space-y-3"><p className="text-muted-foreground">No teacher-assigned tasks right now.</p><h2 className="font-semibold">Your next steps</h2><Button variant="outline" className="w-full" asChild><Link to="/lab">Continue your self-reflection</Link></Button><Button variant="outline" className="w-full" asChild><Link to="/challenges">Find a class challenge</Link></Button><Button variant="outline" className="w-full" asChild><Link to="/post">Share a learning moment</Link></Button></div>}
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
          <Tabs defaultValue="details"><TabsList className="w-full"><TabsTrigger value="details">Profile details</TabsTrigger><TabsTrigger value="themes">Themes</TabsTrigger></TabsList><TabsContent value="details" className="space-y-4">
          <div className="grid gap-1"><Label htmlFor="profile-name">Display name</Label><Input id="profile-name" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} /></div>
          <div className="grid gap-1"><Label htmlFor="profile-headline">Headline</Label><Input id="profile-headline" maxLength={120} value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} /></div>
          <div className="grid gap-1"><Label htmlFor="profile-about">About</Label><textarea id="profile-about" maxLength={1000} rows={4} className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.about} onChange={e => setForm({ ...form, about: e.target.value })} /></div>
          <div className="grid gap-1"><Label htmlFor="profile-grade">Grade</Label><Input id="profile-grade" type="number" min={1} max={12} value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} /></div>
          <div className="flex items-center justify-between"><Label>I am 13 or older</Label><Switch checked={form.age_13_plus} onCheckedChange={(v) => setForm({ ...form, age_13_plus: v })} /></div>
          {!form.age_13_plus && <div className="flex items-center justify-between gap-3"><Label>My parent or guardian allows voice notes</Label><Switch checked={form.voice_consent} onCheckedChange={(v) => setForm({ ...form, voice_consent: v })} /></div>}
          <Button onClick={saveProfile} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </TabsContent><TabsContent value="themes"><ThemePicker current={me.profile?.theme ?? 'classic'} onChoose={chooseTheme} /></TabsContent></Tabs>
        </TabsContent>
      </Tabs>
      </div>
      <Dialog open={!!achievement} onOpenChange={open => { if (!open) setAchievement(null); }}><DialogContent><DialogHeader><DialogTitle>{achievement?.icon} {achievement?.title}</DialogTitle></DialogHeader><p className="text-sm">{achievement?.detail}</p><p className="text-xs text-muted-foreground">Example portfolio entry · not a verified teacher award.</p></DialogContent></Dialog>
    </main>
  );
}
