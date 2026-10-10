import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Me = {
  id: string;
  email: string | null;
  profile: { display_name: string; grade: number | null; age_13_plus: boolean; voice_consent: boolean; avatar_url: string | null; cover_url: string | null; about: string; headline: string; theme: string; sample_portfolio: boolean } | null;
  signupRole: string;
  dateOfBirth: string | null;
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
    const [{ data: profile }, { data: roles }, { data: sso }, { data: preference }, { data: safety }] = await Promise.all([
      supabase.from("profiles").select("display_name,grade,age_13_plus,voice_consent,avatar_url,cover_url,about,headline,theme,sample_portfolio").eq("id", u.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", u.id),
      supabase.rpc("is_sso_teacher", { _user_id: u.id }),
      supabase.from('account_preferences').select('signup_role').eq('user_id', u.id).maybeSingle(),
      supabase.from('student_safety').select('date_of_birth').eq('user_id', u.id).maybeSingle(),
    ]);
    const r = (roles ?? []).map((x) => x.role as string);
    return { id: u.id, email: u.email ?? null, profile, dateOfBirth: safety?.date_of_birth ?? null, roles: r, signupRole: preference?.signup_role ?? 'student', ssoTeacher: !!sso, isAdmin: r.includes("school_admin") };
  },
  staleTime: 30_000,
};

export function useMe() {
  return useQuery(meQuery);
}
