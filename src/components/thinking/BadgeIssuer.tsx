import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/track";
import { cn } from "@/lib/utils";

export const badgesQuery = {
  queryKey: ["badges"],
  queryFn: async () => (await supabase.from("competency_badges").select("*").order("name")).data ?? [],
};

export function BadgeIssuer({ open, onClose, studentId, studentName, artifactId }: { open: boolean; onClose: () => void; studentId: string; studentName: string; artifactId?: string | null }) {
  const { data: badges = [] } = useQuery(badgesQuery);
  const [badge, setBadge] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const issue = async () => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("badge_awards").insert({ badge_id: badge!, student_id: studentId, teacher_id: u.user!.id, artifact_id: artifactId ?? null, note: note || null });
    if (error) { toast.error(error.message); return; }
    await track("badge_issued", { badge_id: badge });
    toast.success(`Badge issued to ${studentName}`);
    setBadge(null); setNote("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Issue a badge to {studentName}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          {badges.map((b) => (
            <button key={b.id} onClick={() => setBadge(b.id)} className={cn("rounded-xl border p-3 text-left", badge === b.id && "border-primary bg-secondary")}>
              <span className="text-2xl">{b.icon}</span><p className="text-sm font-semibold">{b.name}</p>
            </button>
          ))}
        </div>
        {badge && (
          <div className="space-y-2">
            <Input placeholder="Optional note" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="flex justify-end"><Button onClick={issue}>Issue</Button></div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function BadgeWall({ studentId }: { studentId: string }) {
  const { data: badges = [], isLoading } = useQuery(badgesQuery);
  const { data: awards = [] } = useQuery({
    queryKey: ["awards", studentId],
    queryFn: async () => {
      const { data } = await supabase.from("badge_awards").select("*").eq("student_id", studentId).order("created_at", { ascending: false });
      const ids = [...new Set((data ?? []).map((a) => a.teacher_id))];
      const { data: t } = ids.length ? await supabase.from("profiles").select("id,display_name").in("id", ids) : { data: [] };
      return (data ?? []).map((a) => ({ ...a, teacher: t?.find((x) => x.id === a.teacher_id)?.display_name ?? "Your teacher" }));
    },
  });
  const [openId, setOpenId] = useState<string | null>(null);
  const open = badges.find((b) => b.id === openId);
  const openAwards = awards.filter((a) => a.badge_id === openId);
  const skills = [...new Set(awards.map((a) => badges.find((b) => b.id === a.badge_id)?.linked_skill).filter(Boolean))];
  if (isLoading) return <p className="p-6 text-center text-sm text-muted-foreground">Loading badges…</p>;
  if (!badges.length) return <p className="p-6 text-center text-sm text-muted-foreground">No badges available yet.</p>;
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{awards.length ? `You've earned ${new Set(awards.map((a) => a.badge_id)).size} of ${badges.length} badges.` : "Teachers award badges when your thinking shows a skill. Tap a badge to see how to earn it."}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {badges.map((b) => {
          const n = awards.filter((a) => a.badge_id === b.id);
          return (
            <button key={b.id} type="button" onClick={() => setOpenId(b.id)} aria-label={`${b.name} badge, ${n.length ? "earned" : "not earned yet"}. Show details`}
              className={cn("rounded-2xl bg-card p-4 text-left shadow-soft transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", !n.length && "opacity-50")}>
              <span className="text-3xl">{b.icon}</span>
              <p className="mt-1 font-semibold">{b.name}{n.length > 1 && ` ×${n.length}`}</p>
              <p className="text-xs text-muted-foreground">{b.description}</p>
              <p className="mt-1 text-xs font-medium">{n.length ? "Earned ✓" : "🔒 Not earned yet"}</p>
            </button>
          );
        })}
      </div>
      {skills.length > 0 && (
        <p className="text-sm">Evidence in your portfolio: {skills.map((s) => <span key={s} className="mr-1 rounded-full bg-gold/30 px-2 py-0.5">{String(s).replace("_", " ")}</span>)}</p>
      )}
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          {open && <>
            <DialogHeader><DialogTitle className="flex items-center gap-2"><span className="text-3xl">{open.icon}</span>{open.name}</DialogTitle></DialogHeader>
            <p className="text-sm">{open.description}</p>
            <p className="text-xs text-muted-foreground">Skill: {open.linked_skill.replace("_", " ")}</p>
            {openAwards.length ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Earned {openAwards.length > 1 ? `${openAwards.length} times` : "✓"}</p>
                {openAwards.map((a) => (
                  <div key={a.id} className="rounded-xl bg-secondary p-3 text-sm">
                    <p>Awarded by {a.teacher} · {new Date(a.created_at).toLocaleDateString()}</p>
                    {a.artifact_id && <p className="text-xs text-muted-foreground">For one of your published thinking posts</p>}
                    {a.note && <p className="mt-1 italic">“{a.note}”</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-secondary p-3 text-sm">🔒 Not earned yet. A teacher awards this badge when your thinking in a challenge clearly shows {open.linked_skill.replace("_", " ")}.</p>
            )}
          </>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
