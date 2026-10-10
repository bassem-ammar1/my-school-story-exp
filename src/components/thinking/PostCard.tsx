import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ThumbsUp, MessageSquare, Share2, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import { ReportButton } from "@/components/thinking/ReportButton";
import { MemberAvatar } from "@/components/thinking/MemberAvatar";
import { addComment, deleteComment, loadComments, setReaction, applyReaction, totalReactions, REACTIONS, timeAgo, isHurtful, HURTFUL_MESSAGE, shareTargets, type ReactionId, type CommentNode, type FeedPost } from "@/lib/posts";

function Who({ id, name, children, className, label }: { id: string | null; name?: string; children: React.ReactNode; className?: string; label?: string }) {
  const cls = `${className ?? ""} cursor-pointer hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded`;
  if (id) return <Link to="/u/$id" params={{ id }} aria-label={label} className={cls}>{children}</Link>;
  if (name) return <Link to="/author/$name" params={{ name }} aria-label={label} className={cls}>{children}</Link>;
  return <span className={className}>{children}</span>;
}

function CommentItem({ c, me, onReply, onDelete, reply }: { c: CommentNode; me?: string | undefined; onReply: (c: CommentNode) => void; onDelete: (id: string) => void; reply?: boolean }) {
  return (
    <div className={`flex gap-2 ${reply ? "ml-8" : ""}`}>
      <Who id={c.author_id} label={`Open ${c.author}'s profile`} className="shrink-0">
        <MemberAvatar url={c.avatarUrl} name={c.author} className="h-8 w-8 text-xs" />
      </Who>
      <div className="min-w-0 flex-1">
      <div className="rounded-xl bg-secondary px-3 py-2">
        <p className="text-xs font-semibold"><Who id={c.author_id}>{c.author}</Who> <span className="font-normal text-muted-foreground">· {timeAgo(c.created_at)}</span></p>
        <p className="whitespace-pre-wrap text-sm">{c.body}</p>
      </div>
      <div className="flex items-center gap-3 px-2 pt-0.5 text-xs text-muted-foreground">
        <button onClick={() => onReply(c)} className="font-medium">Reply</button>
        {c.author_id === me && <button onClick={() => onDelete(c.id)} aria-label="Delete comment"><Trash2 className="h-3 w-3" /></button>}
        {c.author_id !== me && <ReportButton targetType="comment" targetId={c.id} label={`${c.author}: ${c.body}`} />}
      </div>
      </div>
    </div>
  );
}

export function PostCard({ p, meId }: { p: FeedPost; meId?: string | undefined }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<CommentNode | null>(null);
  const [mine, setMine] = useState<ReactionId | null>(p.mine);
  const [picker, setPicker] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const counts = applyReaction(p.reactions, p.mine, mine);
  const total = totalReactions(counts);
  const top = REACTIONS.filter((r) => (counts[r.id] ?? 0) > 0).sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0)).slice(0, 3);
  const current = REACTIONS.find((r) => r.id === mine);
  const { data: thread = [] } = useQuery({ queryKey: ["comments", p.id], enabled: open, queryFn: () => loadComments(p.id) });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["comments", p.id] }); qc.invalidateQueries({ queryKey: ["posts"] }); };
  const react = async (next: ReactionId | null) => {
    const prev = mine; setMine(next); setPicker(false);
    try { await setReaction(p.id, next); qc.invalidateQueries({ queryKey: ["posts"] }); } catch { setMine(prev); toast.error("Couldn't save your reaction."); }
  };
  const send = async () => {
    if (!text.trim()) return;
    if (isHurtful(text)) { toast.error(HURTFUL_MESSAGE); return; }
    try { await addComment(p.id, text, replyTo?.id); setText(""); setReplyTo(null); refresh(); }
    catch (e) { toast.error(e instanceof Error && e.message === HURTFUL_MESSAGE ? HURTFUL_MESSAGE : "Couldn't post your comment."); }
  };
  const remove = async (id: string) => { if (!confirm("Delete this comment?")) return; try { await deleteComment(id); refresh(); } catch { toast.error("Couldn't delete."); } };
  const shareText = `${p.author}: ${p.body}`.slice(0, 280);
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/home` : "";
  const nativeShare = async () => {
    try { await navigator.share({ title: "MySchoolStory", text: shareText, url: shareUrl }); setShareOpen(false); } catch { /* cancelled or blocked */ }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`); toast.success("Copied — paste it anywhere"); } catch { toast.error("Couldn't copy."); }
    setShareOpen(false);
  };
  return (
    <article className="bg-card">
      <div className="flex items-start gap-3 px-3 pt-3">
        <Who id={p.authorId} name={p.author} label={`Open ${p.author} profile`} className="shrink-0">
          {p.avatarUrl ? <MemberAvatar url={p.avatarUrl} name={p.author} className="h-12 w-12 text-xl" /> :
            <span className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-2xl">{p.avatar}</span>}
        </Who>
        <div className="min-w-0 flex-1">
          <Who id={p.authorId} name={p.author} className="block truncate font-semibold leading-tight">{p.author}</Who>
          <p className="truncate text-xs text-muted-foreground">{p.subtitle}</p>
          <p className="text-xs text-muted-foreground">{p.when}</p>
        </div>
        {p.authorId !== meId && <ReportButton targetType="post" targetId={p.id} label={`${p.author}: ${p.body}`} />}
      </div>
      <p className="whitespace-pre-wrap px-3 py-3 text-sm">{p.body}</p>
      {p.challengeId && (
        <div className="px-3 pb-3"><Link to="/challenge/$id" params={{ id: p.challengeId }} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-primary">🧪 View challenge</Link></div>
      )}
      {p.imageUrl && <img src={p.imageUrl} alt={p.imageAlt || 'Learning project'} loading="lazy" className="mb-3 block h-auto w-full object-contain" />}
      <div className="flex justify-between px-3 pb-2 text-xs text-muted-foreground">
        <span aria-label={`${total} reactions`}>{top.length ? top.map((r) => r.emoji).join("") : "👍"} {total}</span><button onClick={() => setOpen(!open)}>{p.comments} comments</button>
      </div>
      <div className="relative grid grid-cols-3 border-t text-sm font-medium text-muted-foreground">
        {picker && (
          <div role="menu" aria-label="Choose a reaction" className="absolute bottom-full left-2 z-20 mb-1 flex gap-1 rounded-full border bg-card p-1.5 shadow-soft animate-in fade-in zoom-in-95">
            {REACTIONS.map((r) => (
              <button key={r.id} role="menuitemradio" aria-checked={mine === r.id} aria-label={r.label} title={r.label} onClick={() => react(mine === r.id ? null : r.id)}
                className={`grid h-10 w-10 place-items-center rounded-full text-2xl transition hover:scale-125 ${mine === r.id ? "bg-secondary" : ""}`}>{r.emoji}</button>
            ))}
          </div>
        )}
        {shareOpen && (
          <div role="menu" aria-label="Share to" className="absolute bottom-full right-2 z-20 mb-1 w-48 rounded-2xl border bg-card p-1.5 text-foreground shadow-soft animate-in fade-in zoom-in-95">
            {typeof navigator !== "undefined" && "share" in navigator && <button role="menuitem" onClick={nativeShare} className="block w-full rounded-lg px-3 py-2 text-left hover:bg-secondary">More apps…</button>}
            {shareTargets(shareText, shareUrl).map((t) => (
              <a key={t.name} role="menuitem" href={t.href} target="_blank" rel="noopener noreferrer" onClick={() => setShareOpen(false)} className="block rounded-lg px-3 py-2 hover:bg-secondary">{t.name}</a>
            ))}
            <button role="menuitem" onClick={copy} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-secondary"><Copy className="h-4 w-4" />Copy text</button>
          </div>
        )}
        <button onClick={() => { setPicker(!picker); setShareOpen(false); }} aria-expanded={picker} aria-label={current ? `Your reaction: ${current.label}. Change reaction` : "React"} className={`flex items-center justify-center gap-1.5 py-2.5 ${current ? "text-primary" : ""}`}>
          {current ? <span className="text-base leading-none">{current.emoji}</span> : <ThumbsUp className="h-4 w-4" />}{current?.label ?? "Like"}</button>
        <button onClick={() => setOpen(!open)} className="flex items-center justify-center gap-1.5 py-2.5"><MessageSquare className="h-4 w-4" />Comment</button>
        <button onClick={() => { setShareOpen(!shareOpen); setPicker(false); }} aria-expanded={shareOpen} className="flex items-center justify-center gap-1.5 py-2.5"><Share2 className="h-4 w-4" />Share</button>
      </div>
      {open && (
        <div className="space-y-2 border-t px-3 py-3">
          {thread.map((c) => (
            <div key={c.id} className="space-y-1.5">
              <CommentItem c={c} me={meId} onReply={setReplyTo} onDelete={remove} />
              {c.replies.map((r) => <CommentItem key={r.id} c={r} me={meId} onReply={() => setReplyTo(c)} onDelete={remove} reply />)}
            </div>
          ))}
          {replyTo && <p className="text-xs text-muted-foreground">Replying to {replyTo.author} · <button className="underline" onClick={() => setReplyTo(null)}>cancel</button></p>}
          <div className="flex gap-2">
            <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} maxLength={500}
              placeholder={replyTo ? "Write a reply…" : "Add a comment…"} aria-label="Comment"
              className="h-9 flex-1 rounded-full border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <button onClick={send} disabled={!text.trim()} className="rounded-full bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50">Post</button>
          </div>
        </div>
      )}
    </article>
  );
}
