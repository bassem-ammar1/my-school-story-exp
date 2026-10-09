import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    const { data } = await supabase.rpc("has_role", { _user_id: u.user!.id, _role: "school_admin" });
    if (!data) throw redirect({ to: "/lab" });
  },
  head: () => ({ meta: [{ title: "School admin · Thinking Lab" }, { name: "description", content: "Assign teacher roles." }] }),
  component: Admin,
});

function Admin() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: p }, { data: r }] = await Promise.all([supabase.from("profiles").select("id,display_name").order("display_name"), supabase.from("user_roles").select("user_id,role")]);
      return (p ?? []).map((x) => ({ ...x, teacher: !!r?.some((y) => y.user_id === x.id && y.role === "teacher") }));
    },
  });
  const toggle = async (id: string, on: boolean) => {
    const { error } = on ? await supabase.from("user_roles").insert({ user_id: id, role: "teacher" }) : await supabase.from("user_roles").delete().match({ user_id: id, role: "teacher" });
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["admin-users"] });
  };
  return (
    <main className="mx-auto max-w-2xl space-y-4 px-6 py-10">
      <h1 className="text-3xl font-bold">Teacher roles</h1>
      <p className="text-sm text-muted-foreground">Teachers also need to sign in with school sign-in (Google Workspace or Microsoft) to unlock teacher tools.</p>
      <ul className="divide-y rounded-2xl bg-card shadow-soft">
        {data.map((u) => <li key={u.id} className="flex items-center justify-between px-4 py-3"><span>{u.display_name}</span><Switch checked={u.teacher} onCheckedChange={(v) => toggle(u.id, v)} aria-label={`Teacher role for ${u.display_name}`} /></li>)}
      </ul>
    </main>
  );
}
