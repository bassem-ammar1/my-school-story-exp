import { Link } from "@tanstack/react-router";
import { Home, ClipboardCheck, PlusSquare, Bot, FlaskConical } from "lucide-react";
import { useMe } from "@/hooks/use-me";

const items = [
  { to: "/home", label: "Home", Icon: Home },
  { to: "/lab", label: "Assessment", Icon: ClipboardCheck },
  { to: "/post", label: "Post", Icon: PlusSquare },
  { to: "/challenges", label: "Lab", Icon: FlaskConical },
  { to: "/coach", label: "AI Coach", Icon: Bot },
] as const;

export function BottomNav() {
  const { data: me } = useMe();
  if (!me) return null;
  return (
    <nav aria-label="Main" className="sticky bottom-0 z-30 grid grid-cols-5 border-t bg-card">
      {items.map(({ to, label, Icon }) => (
        <Link key={to} to={to} className="flex flex-col items-center gap-0.5 py-2 text-xs text-muted-foreground"
          activeProps={{ className: "text-primary font-semibold" }}>
          <Icon className="h-6 w-6" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
