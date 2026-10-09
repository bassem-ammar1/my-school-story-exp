import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Search, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-me";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

export function SiteNav() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  if (!me) {
    return (
      <header className="sticky top-0 z-30 border-b bg-card">
        <nav className="flex items-center gap-2 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <img src={logo} alt="" width={32} height={32} className="h-8 w-8 object-contain" />
            MySchoolStory
          </Link>
          <Button size="sm" variant="outline" asChild className="ml-auto"><Link to="/demo">Try the demo</Link></Button>
        </nav>
      </header>
    );
  }

  const initial = (me.profile?.display_name ?? "?").charAt(0).toUpperCase();
  return (
    <header className="sticky top-0 z-30 border-b bg-card">
      <nav className="flex items-center gap-3 px-3 py-2.5">
        <Link to="/profile" aria-label="My profile"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary font-semibold text-primary-foreground">
          {initial}
        </Link>
        <form className="relative min-w-0 flex-1"
          onSubmit={(e) => { e.preventDefault(); const q = new FormData(e.currentTarget).get("q")?.toString() ?? ""; navigate({ to: "/search", search: { q } }); }}>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input name="q" placeholder="Search schools or students" aria-label="Search schools or students"
            onFocus={() => navigate({ to: "/search", search: { q: "" } })}
            className="h-9 w-full rounded-md bg-secondary pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </form>
        <button onClick={signOut} aria-label="Sign out" className="shrink-0 text-muted-foreground"><LogOut className="h-5 w-5" /></button>
      </nav>
    </header>
  );
}
