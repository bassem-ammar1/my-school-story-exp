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
  const { data: badges = [] } = useQuery(badgesQuery);
  const { data: awards = [] } = useQuery({
    queryKey: ["awards", studentId],
    queryFn: async () => (await supabase.from("badge_awards").select("*").eq("student_id", studentId)).data ?? [],
  });
  const skills = [...new Set(awards.map((a) => badges.find((b) => b.id === a.badge_id)?.linked_skill).filter(Boolean))];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {badges.map((b) => {
          const n = awards.filter((a) => a.badge_id === b.id);
          return (
            <div key={b.id} className={cn("rounded-2xl bg-card p-4 shadow-soft", !n.length && "opacity-50")}>
              <span className="text-3xl">{b.icon}</span>
              <p className="mt-1 font-semibold">{b.name}{n.length > 1 && ` ×${n.length}`}</p>
              <p className="text-xs text-muted-foreground">{b.description}</p>
              {n[0]?.note && <p className="mt-1 text-xs italic">“{n[0].note}”</p>}
            </div>
          );
        })}
      </div>
      {skills.length > 0 && (
        <p className="text-sm">Evidence in your portfolio: {skills.map((s) => <span key={s} className="mr-1 rounded-full bg-gold/30 px-2 py-0.5">{String(s).replace("_", " ")}</span>)}</p>
      )}
    </div>
  );
}
