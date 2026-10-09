import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Me = {
  id: string;
  email: string | null;
  profile: { display_name: string; grade: number | null; age_13_plus: boolean; voice_consent: boolean; avatar_url: string | null } | null;
  roles: string[];
  ssoTeacher: boolean;
  isAdmin: boolean;
};

export const meQuery = {
  queryKey: ["me"],
  queryFn: async (): Promise<Me | null> => {
    const { data } = await supabase.auth.getUser();
    const u = data.user;
    if (!u) return null;
    const [{ data: profile }, { data: roles }, { data: sso }] = await Promise.all([
      supabase.from("profiles").select("display_name,grade,age_13_plus,voice_consent,avatar_url").eq("id", u.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", u.id),
      supabase.rpc("is_sso_teacher", { _user_id: u.id }),
    ]);
    const r = (roles ?? []).map((x) => x.role as string);
    return { id: u.id, email: u.email ?? null, profile, roles: r, ssoTeacher: !!sso, isAdmin: r.includes("school_admin") };
  },
  staleTime: 30_000,
};

export function useMe() {
  return useQuery(meQuery);
}
