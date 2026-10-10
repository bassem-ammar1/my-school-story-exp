import { supabase } from "@/integrations/supabase/client";

export type FeedPost = { id: string; authorId: string | null; avatar: string; avatarUrl: string | null; author: string; subtitle: string; when: string; body: string; likes: number; liked: boolean; comments: number };
export type CommentRow = { id: string; post_id: string; parent_id: string | null; author_id: string; body: string; created_at: string };
export type CommentNode = CommentRow & { author: string; replies: CommentNode[] };

export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return `${Math.floor(s / 604800)}w`;
}

/** Builds a one-level-deep thread: replies to replies attach to the top-level comment. */
export function buildThread(rows: CommentRow[], names: Record<string, string>): CommentNode[] {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const top: CommentNode[] = [];
  const nodes = new Map<string, CommentNode>();
  const sorted = [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at));
  for (const r of sorted) if (!r.parent_id || !byId.has(r.parent_id)) { const n = { ...r, author: names[r.author_id] ?? "Someone", replies: [] }; nodes.set(r.id, n); top.push(n); }
  for (const r of sorted) {
    if (nodes.has(r.id)) continue;
    let root = r.parent_id!;
    while (byId.get(root)?.parent_id && byId.has(byId.get(root)!.parent_id!)) root = byId.get(root)!.parent_id!;
    nodes.get(root)?.replies.push({ ...r, author: names[r.author_id] ?? "Someone", replies: [] });
  }
  return top;
}

async function names(ids: string[]) {
  const u = [...new Set(ids)];
  if (!u.length) return {} as Record<string, { display_name: string; avatar_url: string | null }>;
  const { data } = await supabase.from("profiles").select("id,display_name,avatar_url").in("id", u);
  return Object.fromEntries((data ?? []).map((p) => [p.id, p]));
}

export async function loadPosts(): Promise<FeedPost[]> {
  const { data: u } = await supabase.auth.getUser();
  const { data: posts } = await supabase.from("posts").select("*").eq("hidden", false).order("created_at", { ascending: false }).limit(100);
  const ids = (posts ?? []).map((p) => p.id);
  if (!ids.length) return [];
  const [{ data: likes }, { data: comments }, people] = await Promise.all([
    supabase.from("post_likes").select("post_id,user_id").in("post_id", ids),
    supabase.from("post_comments").select("post_id").in("post_id", ids).eq("hidden", false),
    names((posts ?? []).map((p) => p.author_id).filter(Boolean) as string[]),
  ]);
  return (posts ?? []).map((p) => {
    const prof = p.author_id ? people[p.author_id] : undefined;
    return {
      id: p.id, authorId: p.author_id, body: p.body, when: timeAgo(p.created_at),
      author: p.author_name ?? prof?.display_name ?? "Someone",
      avatar: p.author_avatar ?? "🙂", avatarUrl: prof?.avatar_url ?? null,
      subtitle: p.author_subtitle ?? "MySchoolStory member",
      likes: likes?.filter((l) => l.post_id === p.id).length ?? 0,
      liked: !!likes?.some((l) => l.post_id === p.id && l.user_id === u.user?.id),
      comments: comments?.filter((c) => c.post_id === p.id).length ?? 0,
    };
  });
}

export async function createPost(body: string) {
  const { data: u } = await supabase.auth.getUser();
  const { error } = await supabase.from("posts").insert({ author_id: u.user!.id, body: body.trim().slice(0, 1000) });
  if (error) throw error;
}

export async function setLike(postId: string, like: boolean) {
  const { data: u } = await supabase.auth.getUser();
  const { error } = like
    ? await supabase.from("post_likes").insert({ post_id: postId, user_id: u.user!.id })
    : await supabase.from("post_likes").delete().match({ post_id: postId, user_id: u.user!.id });
  if (error) throw error;
}

export async function loadComments(postId: string): Promise<CommentNode[]> {
  const { data } = await supabase.from("post_comments").select("id,post_id,parent_id,author_id,body,created_at").eq("post_id", postId).eq("hidden", false).order("created_at");
  const people = await names((data ?? []).map((c) => c.author_id));
  return buildThread(data ?? [], Object.fromEntries(Object.entries(people).map(([k, v]) => [k, v.display_name])));
}

export async function addComment(postId: string, body: string, parentId?: string) {
  const { data: u } = await supabase.auth.getUser();
  const { error } = await supabase.from("post_comments").insert({ post_id: postId, author_id: u.user!.id, body: body.trim().slice(0, 500), parent_id: parentId ?? null });
  if (error) throw error;
}

export async function deleteComment(id: string) {
  const { error } = await supabase.from("post_comments").delete().eq("id", id);
  if (error) throw error;
}
