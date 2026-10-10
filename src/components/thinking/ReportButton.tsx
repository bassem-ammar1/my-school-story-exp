import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const REASONS = [
  ["bullying", "Bullying or harassment"],
  ["inappropriate", "Inappropriate content"],
  ["spam", "Spam"],
  ["privacy", "Shares private information"],
  ["other", "Something else"],
] as const;

export function ReportButton({ targetType, targetId, label }: { targetType: "post" | "artifact" | "comment" | "user"; targetId: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REASONS)[number][0]>("inappropriate");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("reports").insert({ reporter_id: u.user!.id, target_type: targetType, target_id: targetId, target_label: label.slice(0, 200), reason, details: details.trim().slice(0, 500) || null });
    setBusy(false);
    if (error) { toast.error("Couldn't send the report. Please try again."); return; }
    toast.success("Thanks — a school admin will review this.");
    setOpen(false); setDetails("");
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button aria-label="Report" className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary"><Flag className="h-4 w-4" /></button>
      </DialogTrigger>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader><DialogTitle>Report this</DialogTitle></DialogHeader>
        <div className="space-y-2">
          {REASONS.map(([v, t]) => (
            <label key={v} className="flex items-center gap-2 text-sm"><input type="radio" name="reason" checked={reason === v} onChange={() => setReason(v)} />{t}</label>
          ))}
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} maxLength={500} placeholder="Anything else we should know? (optional)" className="mt-2 w-full rounded-xl border bg-background p-2 text-sm" rows={3} />
          <Button className="w-full rounded-full" disabled={busy} onClick={send}>Send report</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
