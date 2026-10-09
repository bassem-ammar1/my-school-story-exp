import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { suggestMicroTask } from "@/lib/thinking.functions";
import { COPY } from "@/lib/thinking";
import { track } from "@/lib/track";

export function MicroTaskModal({ open, onClose, studentId, studentName, submissionId, artifactId }: {
  open: boolean; onClose: () => void; studentId: string; studentName: string; submissionId: string; artifactId?: string | null;
}) {
  const suggest = useServerFn(suggestMicroTask);
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    suggest({ data: { submissionId } })
      .then((r) => { setTitle(r.title); setInstructions(r.instructions); })
      .catch(() => { setTitle("Explain one step again"); setInstructions("Pick the step you felt least sure about. In 3 sentences, explain why it works, then check it with a different method."); })
      .finally(() => setLoading(false));
  }, [open, submissionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = async () => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("micro_tasks").insert({
      assigned_by: u.user!.id, student_id: studentId, artifact_id: artifactId ?? null, title, instructions, duration_min: 5,
      due_at: new Date(Date.now() + 86400000).toISOString(),
    });
    if (error) { toast.error(error.message); return; }
    await track("micro_task_assigned", { student_id: studentId });
    toast.success(COPY.microSent(studentName));
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>5-minute micro-task for {studentName}</DialogTitle></DialogHeader>
        {loading ? <p className="text-sm text-muted-foreground">Suggesting a task based on this student's gap…</p> : (
          <div className="space-y-3">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Task title" />
            <Textarea rows={5} value={instructions} onChange={(e) => setInstructions(e.target.value)} aria-label="Instructions" />
            <div className="flex justify-end"><Button onClick={send}>Send</Button></div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
