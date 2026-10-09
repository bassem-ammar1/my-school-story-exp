import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { COGNITIVE_SKILLS, cognitiveProfile, type Rubric } from "@/lib/thinking";

export function CognitiveAssessment({ studentId }: { studentId: string }) {
  const { data } = useQuery({
    queryKey: ["cognitive", studentId],
    queryFn: async () => {
      const [{ data: subs }, { data: awards }, { data: badges }] = await Promise.all([
        supabase.from("submissions").select("rubric,confidence,confidence_initial").eq("student_id", studentId),
        supabase.from("badge_awards").select("badge_id").eq("student_id", studentId),
        supabase.from("competency_badges").select("id,name,icon,linked_skill"),
      ]);
      return { subs: subs ?? [], awards: awards ?? [], badges: badges ?? [] };
    },
  });
  const rubrics = (data?.subs ?? []).map((s) => s.rubric as Rubric | null).filter((r): r is Rubric => !!r);
  const profile = cognitiveProfile(rubrics);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        How your thinking skills are growing, based on {rubrics.length} scored challenge{rubrics.length === 1 ? "" : "s"} and the badges your teachers gave you.
      </p>
      {COGNITIVE_SKILLS.map((s) => {
        const score = profile[s.key];
        const evidence = (data?.awards ?? []).map((a) => data!.badges.find((b) => b.id === a.badge_id)).filter((b) => b?.linked_skill === s.key);
        return (
          <div key={s.key} className="rounded-xl bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{s.label}</h3>
              <span className="text-sm font-semibold text-primary">{score ?? "–"} / 4</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary" style={{ width: `${((score ?? 0) / 4) * 100}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Evidence in your portfolio: {evidence.length ? evidence.map((b) => `${b!.icon} ${b!.name}`).join(", ") : "none yet"}
            </p>
          </div>
        );
      })}
      {rubrics.length === 0 && <p className="rounded-xl bg-card p-4 text-center text-sm text-muted-foreground">Finish a teacher challenge to see your first results.</p>}
    </div>
  );
}
