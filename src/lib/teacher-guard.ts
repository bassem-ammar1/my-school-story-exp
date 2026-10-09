import { redirect } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/** Teacher routes: role = teacher AND school sign-in. Data is also locked by database rules. */
export async function requireSsoTeacher() {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw redirect({ to: "/auth", search: { redirect: undefined } });
  const { data } = await supabase.rpc("is_sso_teacher", { _user_id: u.user.id });
  if (!data) {
    toast.error("403 · Teachers with school sign-in only", { description: "Taking you back to the Thinking Lab." });
    throw redirect({ to: "/lab" });
  }
}
