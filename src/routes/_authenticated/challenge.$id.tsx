import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { StepwiseSubmission, type SubmissionState } from "@/components/thinking/StepwiseSubmission";
import { requestHint } from "@/lib/thinking.functions";
import { signedUrl, track, uploadMedia } from "@/lib/track";
import { useMe } from "@/hooks/use-me";
import type { StepImage } from "@/components/thinking/types";

export const Route = createFileRoute("/_authenticated/challenge/$id")({
  head: () => ({ meta: [{ title: "Thinking Challenge · Thinking Lab" }, { name: "description", content: "Show your thinking step by step." }] }),
  component: ChallengePage,
});

function ChallengePage() {
  const { id } = Route.useParams();
  const { data: me } = useMe();
  const hint = useServerFn(requestHint);
  const { data, isLoading } = useQuery({
    queryKey: ["challenge", id],
    enabled: !!me,
    queryFn: async () => {
      const { data: ch } = await supabase.from("challenges").select("id,title,prompt_text,prompt_image,concept_tokens").eq("id", id).single();
      let { data: sub } = await supabase.from("submissions").select("*").eq("challenge_id", id).eq("student_id", me!.id).maybeSingle();
      if (!sub) sub = (await supabase.from("submissions").insert({ challenge_id: id, student_id: me!.id }).select().single()).data;
      const imgs = ((sub?.step_images ?? []) as StepImage[]);
      const initial: SubmissionState = {
        steps: [sub?.step1_text ?? "", sub?.step2_text ?? "", sub?.step3_text ?? ""],
        images: await Promise.all(imgs.map(async (i) => ({ ...i, url: (await signedUrl(i.path)) ?? "" }))),
        voice: { url: await signedUrl(sub?.voice_url), duration: sub?.voice_duration_s ?? 0, transcript: sub?.voice_transcript ?? "" },
        concept: sub?.concept_token ?? null, confidence: sub?.confidence ?? null,
      };
      return { ch, sub, initial };
    },
  });

  if (isLoading || !data || !me) return <p className="p-10 text-center text-muted-foreground">Loading…</p>;
  if (!data.ch || !data.sub) return <p className="p-10 text-center">This challenge isn't available. Join the class first.</p>;
  const sub = data.sub;
  let voicePath = sub.voice_url;
  let lastSaved = { s1: sub.step1_text, s2: sub.step2_text, s3: sub.step3_text };

  const save = async (s: SubmissionState) => {
    if (s.voice.blob) voicePath = await uploadMedia(me.id, s.voice.blob, "webm");
    else if (!s.voice.url) voicePath = null;
    const changed = sub.status !== "draft" && (s.steps[0] !== lastSaved.s1 || s.steps[1] !== lastSaved.s2 || s.steps[2] !== lastSaved.s3);
    if (changed) {
      await supabase.from("submission_versions").insert({ submission_id: sub.id, version: sub.version, step1_text: lastSaved.s1, step2_text: lastSaved.s2, step3_text: lastSaved.s3, confidence: sub.confidence });
      sub.version += 1;
    }
    const { error } = await supabase.from("submissions").update({
      step1_text: s.steps[0], step2_text: s.steps[1], step3_text: s.steps[2],
      step_images: s.images.map(({ step, path, alt }) => ({ step, path, alt })),
      voice_url: voicePath, voice_transcript: s.voice.transcript || null, voice_duration_s: s.voice.duration || null,
      concept_token: s.concept, confidence: s.confidence, confidence_initial: sub.confidence_initial ?? s.confidence,
      version: sub.version, status: changed ? "revised" : sub.status, updated_at: new Date().toISOString(),
    }).eq("id", sub.id);
    if (error) throw error;
    sub.confidence_initial ??= s.confidence;
    lastSaved = { s1: s.steps[0], s2: s.steps[1], s3: s.steps[2] };
    s.voice.blob = null;
  };

  return (
    <StepwiseSubmission
      challenge={data.ch}
      initial={data.initial}
      initialStatus={sub.status}
      voiceDisabledReason={!me.profile?.age_13_plus && !me.profile?.voice_consent ? "Voice notes need a parent's permission for students under 13. You can turn this on in My thinking → Settings once a parent agrees." : undefined}
      uploadImage={async (b, ext) => { const path = await uploadMedia(me.id, b, ext); return { path, url: URL.createObjectURL(b) }; }}
      onSave={save}
      onRequestHint={async (s, message) => {
        if (sub.status === "draft") {
          await track("micro_lesson_submitted", { challenge_id: id, has_voice: !!s.voice.url, voice_duration_s: s.voice.duration, steps_filled: s.steps.filter((x) => x.trim()).length, confidence: s.confidence });
          sub.status = "queued";
          await supabase.from("submissions").update({ status: "queued" }).eq("id", sub.id);
        }
        const r = await hint({ data: { submissionId: sub.id, message } });
        sub.status = "hinted";
        return r;
      }}
      onPublish={async (s) => {
        await save(s);
        await supabase.from("submissions").update({ status: "published" }).eq("id", sub.id);
        const { error } = await supabase.from("artifacts").insert({ submission_id: sub.id });
        if (error && !error.message.includes("duplicate")) throw error;
        sub.status = "published";
        await track("artifact_published", { visibility: "class" });
      }}
    />
  );
}
