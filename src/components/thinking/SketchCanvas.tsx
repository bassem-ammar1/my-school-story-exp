import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COLORS: string[] = ["#1B1640", "#3B2FC9", "#E5484D"];

export function SketchCanvas({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (b: Blob) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState<string>("#1B1640");
  const [eraser, setEraser] = useState(false);
  const history = useRef<ImageData[]>([]);
  const drawing = useRef(false);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      const c = ref.current; if (!c) return;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
      history.current = [];
    }, 50);
    return () => clearTimeout(t);
  }, [open]);

  const pos = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * ref.current!.width, y: ((e.clientY - r.top) / r.height) * ref.current!.height };
  };
  const down = (e: React.PointerEvent) => {
    const c = ref.current!, ctx = c.getContext("2d")!;
    history.current.push(ctx.getImageData(0, 0, c.width, c.height));
    drawing.current = true;
    const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = ref.current!.getContext("2d")!;
    ctx.strokeStyle = eraser ? "#fff" : color; ctx.lineWidth = eraser ? 24 : 4; ctx.lineCap = "round";
    const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke();
  };
  const undo = () => {
    const last = history.current.pop(); if (last) ref.current!.getContext("2d")!.putImageData(last, 0, 0);
  };
  const save = () => ref.current!.toBlob((b) => { if (b) { onSave(b); onClose(); } }, "image/png");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Sketch your thinking</DialogTitle></DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant={!eraser ? "default" : "outline"} onClick={() => setEraser(false)}>Pen</Button>
          <Button size="sm" variant={eraser ? "default" : "outline"} onClick={() => setEraser(true)}>Eraser</Button>
          {COLORS.map((c) => (
            <button key={c} aria-label={`Color ${c}`} onClick={() => { setColor(c); setEraser(false); }}
              className={cn("h-8 w-8 rounded-full border-2", color === c && !eraser ? "border-gold" : "border-transparent")} style={{ background: c }} />
          ))}
          <Button size="sm" variant="outline" onClick={undo}>Undo</Button>
        </div>
        <canvas ref={ref} width={800} height={500} className="w-full touch-none rounded-xl border bg-card"
          onPointerDown={down} onPointerMove={move} onPointerUp={() => (drawing.current = false)} onPointerLeave={() => (drawing.current = false)} />
        <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save}>Use sketch</Button></div>
      </DialogContent>
    </Dialog>
  );
}
