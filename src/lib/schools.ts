import { supabase } from "@/integrations/supabase/client";

export async function searchSchools(term: string) {
  let q = supabase.from("schools").select("id,name,logo_url,location").order("name").limit(20);
  if (term) q = q.ilike("name", `%${term.replace(/[%_]/g, "")}%`);
  return (await q).data ?? [];
}

export async function loadSchool(id: string) {
  const { data: u } = await supabase.auth.getUser();
  const [{ data: school }, { count: followers }, { count: posts }, { data: mine }] = await Promise.all([
    supabase.from("schools").select("id,name,verified,founded_year,mission,student_count,teacher_count,languages,location,logo_url").eq("id", id).maybeSingle(),
    supabase.from("school_follows").select("user_id", { count: "exact", head: true }).eq("school_id", id),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("school_id", id).eq("hidden", false),
    supabase.from("school_follows").select("user_id").eq("school_id", id).eq("user_id", u.user?.id ?? "").maybeSingle(),
  ]);
  return { school, followers: followers ?? 0, posts: posts ?? 0, following: !!mine };
}

export async function setFollow(schoolId: string, follow: boolean) {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user!.id;
  const { error } = follow
    ? await supabase.from("school_follows").insert({ school_id: schoolId, user_id: uid })
    : await supabase.from("school_follows").delete().match({ school_id: schoolId, user_id: uid });
  if (error) throw error;
}
