import { supabase } from "@/integrations/supabase/client";

export async function track(event: string, props: Record<string, unknown> = {}) {
  try {
    const { data } = await supabase.auth.getSession();
    await supabase.from("analytics_events").insert({ event, props: props as never, user_id: data.session?.user.id ?? null });
  } catch {
    /* analytics never blocks the user */
  }
}

export async function signedUrl(path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:") || path.startsWith("blob:")) return path;
  const { data } = await supabase.storage.from("thinking-media").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export async function uploadMedia(userId: string, file: Blob, ext: string) {
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("thinking-media").upload(path, file, file.type ? { contentType: file.type } : {});
  if (error) throw error;
  return path;
}
