import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    const { data } = await supabase.rpc("has_role", { _user_id: u.user!.id, _role: "school_admin" });
    if (!data) throw redirect({ to: "/lab" });
  },
  head: () => ({ meta: [{ title: "School admin · MySchoolStory" }, { name: "description", content: "Review teacher access requests and manage teacher roles." }, { property: "og:title", content: "School admin · MySchoolStory" }, { property: "og:description", content: "Review teacher access requests and manage teacher roles." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Admin,
});

function Admin() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const { data: requests = [] } = useQuery({
    queryKey: ["teacher-requests"],
    queryFn: async () => {
      const { data: r } = await supabase.from("teacher_requests").select("*").eq("status", "pending").order("created_at");
      const ids = (r ?? []).map((x) => x.user_id);
      const { data: p } = ids.length ? await supabase.from("profiles").select("id,display_name").in("id", ids) : { data: [] };
      return (r ?? []).map((x) => ({ ...x, name: p?.find((y) => y.id === x.user_id)?.display_name ?? "Unknown" }));
    },
  });
  const { data = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: p }, { data: r }] = await Promise.all([supabase.from("profiles").select("id,display_name").order("display_name"), supabase.from("user_roles").select("user_id,role")]);
      return (p ?? []).map((x) => ({ ...x, teacher: !!r?.some((y) => y.user_id === x.id && y.role === "teacher") }));
    },
  });
  const review = async (id: string, approve: boolean) => {
    setBusy(id);
    const { error } = await supabase.rpc("review_teacher_request", { _request_id: id, _approve: approve });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(approve ? "Teacher access approved" : "Request declined");
    qc.invalidateQueries({ queryKey: ["teacher-requests"] });
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };
  const toggle = async (id: string, on: boolean) => {
    if (!on && !confirm("Remove teacher access for this person?")) return;
    const { error } = on ? await supabase.from("user_roles").insert({ user_id: id, role: "teacher" }) : await supabase.from("user_roles").delete().match({ user_id: id, role: "teacher" });
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["admin-users"] });
  };
  return (
    <main className="space-y-4 px-4 py-6">
      <h1 className="text-2xl font-bold">School admin</h1>
      <section>
        <h2 className="text-lg font-semibold">Teacher requests</h2>
        {requests.length === 0 ? <p className="mt-1 text-sm text-muted-foreground">No requests waiting.</p> : (
          <ul className="mt-2 divide-y rounded-2xl bg-card shadow-soft">
            {requests.map((r) => (
              <li key={r.id} className="space-y-2 px-4 py-3">
                <div><p className="font-medium">{r.name}</p><p className="text-sm text-muted-foreground">{r.school_name}{r.note ? ` · ${r.note}` : ""}</p></div>
                <div className="flex gap-2">
                  <Button size="sm" className="rounded-full" disabled={busy === r.id} onClick={() => review(r.id, true)}>Approve</Button>
                  <Button size="sm" variant="outline" className="rounded-full" disabled={busy === r.id} onClick={() => review(r.id, false)}>Decline</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="text-lg font-semibold">Teacher roles</h2>
        <p className="text-sm text-muted-foreground">Teachers also need to sign in with Google or Microsoft to unlock teacher tools.</p>
        <ul className="mt-2 divide-y rounded-2xl bg-card shadow-soft">
          {data.map((u) => <li key={u.id} className="flex items-center justify-between px-4 py-3"><span>{u.display_name}</span><Switch checked={u.teacher} onCheckedChange={(v) => toggle(u.id, v)} aria-label={`Teacher role for ${u.display_name}`} /></li>)}
        </ul>
      </section>
    </main>
  );
}
