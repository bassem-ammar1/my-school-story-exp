import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Lets a student ask a school admin for teacher access. Approval happens only on the admin side. */
export function TeacherRequestCard({ userId, isTeacher }: { userId: string; isTeacher: boolean }) {
  const qc = useQueryClient();
  const [school, setSchool] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: req, isLoading } = useQuery({
    queryKey: ["teacher-request", userId],
    queryFn: async () => (await supabase.from("teacher_requests").select("*").eq("user_id", userId).maybeSingle()).data,
  });
  if (isTeacher || isLoading) return null;

  const send = async () => {
    if (school.trim().length < 2) { toast.error("Please enter your school's name."); return; }
    setBusy(true);
    const { error } = await supabase.from("teacher_requests").insert({ user_id: userId, school_name: school.trim(), note: note.trim() || null });
    setBusy(false);
    if (error) toast.error("Could not send your request. Please try again.");
    else { toast.success("Request sent. A school admin will review it."); qc.invalidateQueries({ queryKey: ["teacher-request", userId] }); }
  };
  const withdraw = async () => {
    if (!req) return;
    const { error } = await supabase.from("teacher_requests").delete().eq("id", req.id);
    if (error) toast.error("Could not remove the request."); else qc.invalidateQueries({ queryKey: ["teacher-request", userId] });
  };

  return (
    <section className="mt-2 bg-card p-4">
      <h2 className="text-lg font-semibold">Are you a teacher?</h2>
      {req?.status === "pending" && <p className="mt-1 text-sm text-muted-foreground">Your request for {req.school_name} is waiting for a school admin.</p>}
      {req?.status === "approved" && <p className="mt-1 text-sm text-muted-foreground">Approved! Sign in with your school Google or Microsoft account to unlock teacher tools.</p>}
      {req?.status === "rejected" && <p className="mt-1 text-sm text-muted-foreground">Your last request wasn't approved. You can send a new one.</p>}
      {req && req.status !== "approved" && <Button variant="outline" size="sm" className="mt-2 rounded-full" onClick={withdraw}>{req.status === "pending" ? "Cancel request" : "Clear and try again"}</Button>}
      {!req && (
        <div className="mt-2 space-y-2">
          <p className="text-sm text-muted-foreground">Ask a school admin to give you teacher access.</p>
          <Input aria-label="School name" placeholder="School name" maxLength={120} value={school} onChange={(e) => setSchool(e.target.value)} />
          <Input aria-label="Note for the admin" placeholder="Subject or class you teach (optional)" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
          <Button className="rounded-full" disabled={busy} onClick={send}>{busy ? "Sending…" : "Request teacher access"}</Button>
        </div>
      )}
    </section>
  );
}
