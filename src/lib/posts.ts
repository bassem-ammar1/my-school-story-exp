import { supabase } from "@/integrations/supabase/client";

export const REACTIONS = [
  { id: "like", emoji: "👍", label: "Like" },
  { id: "love", emoji: "❤️", label: "Love" },
  { id: "celebrate", emoji: "🎉", label: "Celebrate" },
  { id: "support", emoji: "🤝", label: "Support" },
  { id: "inspiring", emoji: "💡", label: "Inspiring" },
] as const;
export type ReactionId = (typeof REACTIONS)[number]["id"];
export type ReactionCounts = Partial<Record<ReactionId, number>>;

/** Recomputes counts after the current user changes reaction from `from` to `to` (null = none). */
export function applyReaction(counts: ReactionCounts, from: ReactionId | null, to: ReactionId | null): ReactionCounts {
  const next = { ...counts };
  if (from) next[from] = Math.max(0, (next[from] ?? 0) - 1);
  if (to) next[to] = (next[to] ?? 0) + 1;
  return next;
}
export const totalReactions = (c: ReactionCounts) => Object.values(c).reduce((a, b) => a + (b ?? 0), 0);

export type FeedPost = { id: string; authorId: string | null; avatar: string; avatarUrl: string | null; author: string; subtitle: string; when: string; body: string; imageUrl?: string | null; imageAlt?: string | null; challengeId?: string | null; reactions: ReactionCounts; mine: ReactionId | null; comments: number };
export type CommentRow = { id: string; post_id: string; parent_id: string | null; author_id: string; body: string; created_at: string };
export type CommentNode = CommentRow & { author: string; avatarUrl?: string | null; replies: CommentNode[] };

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
  const [{ data: likes }, { data: comments }, people, { data: schools }] = await Promise.all([
    supabase.from("post_likes").select("post_id,user_id,reaction").in("post_id", ids),
    supabase.from("post_comments").select("post_id").in("post_id", ids).eq("hidden", false),
    names((posts ?? []).map((p) => p.author_id).filter(Boolean) as string[]),
    supabase.rpc('current_school_labels', { _ids: (posts ?? []).map(p=>p.author_id).filter((id): id is string=>id!==null) }),
  ]);
  return (posts ?? []).map((p) => {
    const prof = p.author_id ? people[p.author_id] : undefined;
    return {
      id: p.id, authorId: p.author_id, body: p.body, when: timeAgo(p.created_at),
      imageUrl: p.image_url, imageAlt: p.image_alt, challengeId: p.challenge_id,
      author: p.author_name ?? prof?.display_name ?? "Someone",
      avatar: p.author_avatar ?? "🙂", avatarUrl: prof?.avatar_url ?? null,
      subtitle: schools?.find(s=>s.user_id===p.author_id) ? `${schools.find(s=>s.user_id===p.author_id)?.school_name} · Grade ${schools.find(s=>s.user_id===p.author_id)?.grade}` : p.author_subtitle ?? "Student",
      reactions: (likes ?? []).filter((l) => l.post_id === p.id).reduce<ReactionCounts>((c, l) => applyReaction(c, null, l.reaction as ReactionId), {}),
      mine: ((likes ?? []).find((l) => l.post_id === p.id && l.user_id === u.user?.id)?.reaction as ReactionId | undefined) ?? null,
      comments: comments?.filter((c) => c.post_id === p.id).length ?? 0,
    };
  });
}

export async function createPost(body: string) {
  const { data: u } = await supabase.auth.getUser();
  const { error } = await supabase.from("posts").insert({ author_id: u.user!.id, body: body.trim().slice(0, 1000) });
  if (error) throw error;
}

export async function setReaction(postId: string, reaction: ReactionId | null) {
  const { data: u } = await supabase.auth.getUser();
  const { error } = reaction
    ? await supabase.from("post_likes").upsert({ post_id: postId, user_id: u.user!.id, reaction }, { onConflict: "post_id,user_id" })
    : await supabase.from("post_likes").delete().match({ post_id: postId, user_id: u.user!.id });
  if (error) throw error;
}

export async function loadComments(postId: string): Promise<CommentNode[]> {
  const { data } = await supabase.from("post_comments").select("id,post_id,parent_id,author_id,body,created_at").eq("post_id", postId).eq("hidden", false).order("created_at");
  const people = await names((data ?? []).map((c) => c.author_id));
  const withAvatar = (n: CommentNode): CommentNode => ({ ...n, avatarUrl: people[n.author_id]?.avatar_url ?? null, replies: n.replies.map(withAvatar) });
  return buildThread(data ?? [], Object.fromEntries(Object.entries(people).map(([k, v]) => [k, v.display_name]))).map(withAvatar);
}

/** Posts from sample/organisation authors that have no account (e.g. a school page), matched by their public name. */
export async function loadPostsByName(name: string): Promise<FeedPost[]> {
  return (await loadPosts()).filter((p) => !p.authorId && p.author === name);
}

/** Mirrors the database `is_hurtful_text` rule so users get instant feedback. The database is the real gate. */
const HURTFUL_EN = /\b(stupid|idiots?|dumb|ugly|losers?|fat|worthless|useless|pathetic|moron|retard(ed)?|freak|weirdo|trash|failure|disgusting|hate you|shut up|you suck|nobody likes you|kill yourself|kys)\b/i;
const HURTFUL_AR = /(غبي|غبية|حمار|فاشل|فاشلة|تافه|تافهة|قبيح|قبيحة|اخرس|أخرس|حقير|حقيرة)/;
export const isHurtful = (t: string) => HURTFUL_EN.test(t) || HURTFUL_AR.test(t);
export const HURTFUL_MESSAGE = "This comment can't be posted — please keep it kind and respectful to others.";

export async function addComment(postId: string, body: string, parentId?: string) {
  if (isHurtful(body)) throw new Error(HURTFUL_MESSAGE);
  const { data: u } = await supabase.auth.getUser();
  const { error } = await supabase.from("post_comments").insert({ post_id: postId, author_id: u.user!.id, body: body.trim().slice(0, 500), parent_id: parentId ?? null });
  if (error) throw error.message.includes("HURTFUL_LANGUAGE") ? new Error(HURTFUL_MESSAGE) : error;
}

export async function loadProfile(id: string) {
  const { data } = await supabase.from("profiles").select("id,display_name,avatar_url,cover_url,grade,headline,about").eq("id", id).maybeSingle();
  return data;
}

export async function loadPostsBy(authorId: string): Promise<FeedPost[]> {
  return (await loadPosts()).filter((p) => p.authorId === authorId);
}

export function shareTargets(text: string, url: string) {
  const t = encodeURIComponent(text), u = encodeURIComponent(url), both = encodeURIComponent(`${text}\n${url}`);
  return [
    { name: "WhatsApp", href: `https://wa.me/?text=${both}` },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}&quote=${t}` },
    { name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { name: "X", href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
    { name: "Telegram", href: `https://t.me/share/url?url=${u}&text=${t}` },
    { name: "Email", href: `mailto:?subject=${encodeURIComponent("A post on MySchoolStory")}&body=${both}` },
  ];
}

export async function deleteComment(id: string) {
  const { error } = await supabase.from("post_comments").delete().eq("id", id);
  if (error) throw error;
}
