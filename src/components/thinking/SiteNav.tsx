import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Search, LogOut, Share2, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-me";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { headerActions, signOutAndRedirect } from "@/lib/header-actions";
import { shareTargets } from "@/lib/posts";
import logo from "@/assets/logo.png";

export function SiteNav() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const actions = headerActions(pathname);
  const [signingOut, setSigningOut] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const signOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOutAndRedirect({
        cancelQueries: () => qc.cancelQueries(),
        clear: () => qc.clear(),
        signOut: () => supabase.auth.signOut(),
        redirect: async () => {
          await qc.cancelQueries();
          qc.clear();
          qc.setQueryData(["me"], null);
          await navigate({ to: "/", replace: true });
        },
      });
    } catch {
      toast.error("Couldn't sign out. Please try again.");
      await qc.invalidateQueries({ queryKey: ["me"] });
    } finally {
      setSigningOut(false);
    }
  };
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied");
    } catch { toast.error("Couldn't copy the link."); }
  };
  const share = async () => {
    try { await navigator.share({ title: "MySchoolStory", url: shareUrl }); }
    catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) toast.error("Couldn't share. Try copying the link instead.");
    }
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
        {actions.search ? <form className="relative min-w-0 flex-1"
          onSubmit={(e) => { e.preventDefault(); const q = new FormData(e.currentTarget).get("q")?.toString() ?? ""; navigate({ to: "/search", search: { q } }); }}>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input name="q" placeholder="Search schools or students" aria-label="Search schools or students"
            onFocus={() => navigate({ to: "/search", search: { q: "" } })}
            className="h-9 w-full rounded-md bg-secondary pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </form> : <div className="min-w-0 flex-1" />}
        {actions.share && <DropdownMenu key={pathname} onOpenChange={(open) => { if (open) setShareUrl(`${window.location.origin}/home`); }}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Share MySchoolStory" title="Share MySchoolStory" className="shrink-0 text-muted-foreground [&_svg]:size-5"><Share2 /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" aria-label="Share MySchoolStory">
            {typeof navigator !== "undefined" && "share" in navigator && <DropdownMenuItem onSelect={share}>More apps…</DropdownMenuItem>}
            {shareTargets("MySchoolStory", shareUrl).map((target) => <DropdownMenuItem asChild key={target.name}><a href={target.href} target="_blank" rel="noopener noreferrer">{target.name}</a></DropdownMenuItem>)}
            <DropdownMenuItem onSelect={copyLink}><Copy />Copy link</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>}
        {actions.logout && <Button variant="ghost" size="icon" onClick={signOut} disabled={signingOut} aria-label="Logout" title="Logout" className="shrink-0 text-muted-foreground [&_svg]:size-5"><LogOut /></Button>}
      </nav>
    </header>
  );
}
