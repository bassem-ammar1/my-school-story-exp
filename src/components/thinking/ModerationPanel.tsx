import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const TABS = [
  ["pending", "Pending"],
  ["under_review", "Under review"],
  ["resolved", "Resolved"],
  ["escalated", "Escalated"],
] as const;
type Status = (typeof TABS)[number][0];
const REASON: Record<string, string> = { bullying: "Bullying", inappropriate: "Inappropriate", spam: "Spam", privacy: "Privacy", other: "Other" };

export function ModerationPanel() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Status>("pending");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const { data = [] } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const { data: r } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
      const ids = [...new Set((r ?? []).map((x) => x.reporter_id))];
      const { data: p } = ids.length ? await supabase.from("profiles").select("id,display_name").in("id", ids) : { data: [] };
      return (r ?? []).map((x) => ({ ...x, reporter: p?.find((y) => y.id === x.reporter_id)?.display_name ?? "Unknown" }));
    },
  });
  const move = async (id: string, status: Status) => {
    const { data: u } = await supabase.auth.getUser();
    const note = notes[id]?.trim();
    const { error } = await supabase.from("reports").update({ status, handled_by: u.user!.id, updated_at: new Date().toISOString(), ...(note ? { admin_note: note.slice(0, 500) } : {}) }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Report updated");
    qc.invalidateQueries({ queryKey: ["reports"] });
  };
  const list = data.filter((r) => r.status === tab);
  return (
    <section>
      <h2 className="text-lg font-semibold">Reports & moderation</h2>
      <div className="mt-2 flex gap-1 overflow-x-auto">
        {TABS.map(([v, t]) => (
          <button key={v} onClick={() => setTab(v)} className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${tab === v ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
            {t} ({data.filter((r) => r.status === v).length})
          </button>
        ))}
      </div>
      {list.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Nothing here.</p> : (
        <ul className="mt-2 divide-y rounded-2xl bg-card shadow-soft">
          {list.map((r) => (
            <li key={r.id} className="space-y-2 px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">{REASON[r.reason]} · {r.target_type} · {new Date(r.created_at).toLocaleDateString()}</p>
                <p className="line-clamp-3 text-sm">{r.target_label}</p>
                <p className="text-xs text-muted-foreground">Reported by {r.reporter}{r.details ? ` — "${r.details}"` : ""}</p>
                {r.admin_note && <p className="text-xs">Note: {r.admin_note}</p>}
              </div>
              <input value={notes[r.id] ?? ""} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} maxLength={500} placeholder="Add a note (optional)" className="w-full rounded-xl border bg-background px-2 py-1.5 text-sm" />
              <div className="flex flex-wrap gap-2">
                {TABS.filter(([v]) => v !== r.status).map(([v, t]) => (
                  <Button key={v} size="sm" variant={v === "resolved" ? "default" : "outline"} className="rounded-full" onClick={() => move(r.id, v)}>{t}</Button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
