import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod/v4";
import { parseAnswers, QUESTIONNAIRE_VERSION, SCORING_VERSION } from "./cognitive";

export const getCognitiveAttempts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("cognitive_attempts").select("*").eq("student_id", context.userId).order("created_at", { ascending: false });
    if (error) throw new Error("Your reflections could not be loaded. Please try again.");
    return data ?? [];
  });
const saveSchema = z.object({ id: z.uuid().optional(), responses: z.record(z.string(), z.number()), goal: z.string().max(300), submit: z.boolean(), useForCoach: z.boolean() });
export const saveCognitiveAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.infer<typeof saveSchema>) => saveSchema.parse(input))
  .handler(async ({ data, context }) => {
    const responses = parseAnswers(data.responses);
    let id = data.id;
    if (!id) {
      const { data: created, error } = await context.supabase.from("cognitive_attempts").insert({ student_id: context.userId, questionnaire_version: QUESTIONNAIRE_VERSION, scoring_version: SCORING_VERSION }).select("id").single();
      if (error || !created) throw new Error("Your reflection could not be started.");
      id = created.id;
    }
    const { data: saved, error } = await context.supabase.from("cognitive_attempts").update({ responses, goal: data.goal, questionnaire_version: QUESTIONNAIRE_VERSION, scoring_version: SCORING_VERSION, use_for_coach: data.useForCoach, status: data.submit ? "submitted" : "draft" }).eq("id", id).eq("student_id", context.userId).eq("status", "draft").select("*").single();
    if (error || !saved) throw new Error("This reflection could not be saved. Submitted reflections cannot be changed.");
    return saved;
  });
export const deleteCognitiveAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("cognitive_attempts").delete().eq("id", data.id).eq("student_id", context.userId);
    if (error) throw new Error("This reflection could not be deleted.");
    return { deleted: true };
  });
export const setCognitiveCoachPermission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; allowed: boolean }) => z.object({ id: z.uuid(), allowed: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("cognitive_attempts").update({ use_for_coach: data.allowed }).eq("id", data.id).eq("student_id", context.userId);
    if (error) throw new Error("Your coach preference could not be updated.");
    return { allowed: data.allowed };
  });