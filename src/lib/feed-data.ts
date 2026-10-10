import { supabase } from "@/integrations/supabase/client";
import type { ArtifactView, StepImage } from "@/components/thinking/types";
import { signedUrl } from "./track";

/** Loads published artifacts visible to the current user (database rules decide what's visible). */
export async function loadArtifacts(opts: { classId?: string; challengeId?: string; studentId?: string; ids?: string[] }): Promise<ArtifactView[]> {
  const { data: u } = await supabase.auth.getUser();
  let q = supabase.from("artifacts")
    .select("id, visibility, published_at, endorsed_by, endorsed_at, endorsement_note, submission_id, submissions!inner(id, student_id, challenge_id, step1_text, step2_text, step3_text, step_images, voice_url, voice_transcript, concept_token, confidence, challenges!inner(class_id, classes!inner(anonymous_mode)))")
    .order("published_at", { ascending: false });
  if (opts.classId) q = q.eq("submissions.challenges.class_id", opts.classId);
  if (opts.challengeId) q = q.eq("submissions.challenge_id", opts.challengeId);
  if (opts.studentId) q = q.eq("submissions.student_id", opts.studentId);
  if (opts.ids) q = q.in("id", opts.ids);
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as any[];
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const studentIds = [...new Set(rows.map((r) => r.submissions.student_id))];
  const [{ data: profs }, { data: reacts }, { data: anns }] = await Promise.all([
    supabase.from("profiles").select("id, display_name, avatar_url").in("id", studentIds),
    supabase.from("reactions").select("artifact_id, emoji, user_id").in("artifact_id", ids),
    supabase.from("annotations").select("artifact_id").in("artifact_id", ids),
  ]);
  return Promise.all(rows.map(async (r) => {
    const s = r.submissions;
    const anon = s.challenges.classes.anonymous_mode && s.student_id !== u.user?.id;
    const p = profs?.find((x) => x.id === s.student_id);
    const reactions: Record<string, number> = {};
    const mine: string[] = [];
    reacts?.filter((x) => x.artifact_id === r.id).forEach((x) => { reactions[x.emoji] = (reactions[x.emoji] ?? 0) + 1; if (x.user_id === u.user?.id) mine.push(x.emoji); });
    const imgs = (s.step_images ?? []) as StepImage[];
    return {
      id: r.id, submissionId: s.id, challengeId: s.challenge_id, studentId: s.student_id,
      name: anon ? "Anonymous classmate" : p?.display_name ?? "Student",
      avatar: anon ? null : p?.avatar_url ?? null,
      concept: s.concept_token ?? "", confidence: s.confidence ?? 0,
      steps: [s.step1_text, s.step2_text, s.step3_text],
      images: (await Promise.all(imgs.map(async (i) => ({ step: i.step, alt: i.alt, url: (await signedUrl(i.path)) ?? "" })))).filter((i) => i.url),
      voiceUrl: await signedUrl(s.voice_url), transcript: s.voice_transcript,
      reactions, mine, annotationCount: anns?.filter((x) => x.artifact_id === r.id).length ?? 0,
      publishedAt: r.published_at, visibility: r.visibility,
      endorsed: !!r.endorsed_by, endorsementNote: r.endorsement_note ?? null,
    } satisfies ArtifactView;
  }));
}

export async function toggleReaction(a: ArtifactView, emoji: string) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  if (a.mine.includes(emoji)) await supabase.from("reactions").delete().match({ artifact_id: a.id, user_id: u.user.id, emoji });
  else await supabase.from("reactions").insert({ artifact_id: a.id, user_id: u.user.id, emoji });
}
