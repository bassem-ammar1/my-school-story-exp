import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-me";
import { Button } from "@/components/ui/button";

export function SiteNav() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
  const link = "rounded-full px-3 py-1.5 text-sm font-medium text-foreground/80 hover:bg-secondary";
  const active = { className: "bg-secondary text-secondary-foreground" };
  return (
    <header className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-3">
        <Link to="/" className="mr-3 flex items-center gap-2 font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground">💭</span>
          Thinking Lab
        </Link>
        <Link to="/lab" className={link} activeProps={active}>Thinking Lab</Link>
        {me && <Link to="/profile" className={link} activeProps={active}>My thinking</Link>}
        {me && <Link to="/synthesis/join" className={link} activeProps={active}>Join session</Link>}
        {me?.ssoTeacher && <Link to="/orchestrator" className={link} activeProps={active}>Orchestrator (teachers)</Link>}
        {me?.isAdmin && <Link to="/admin" className={link} activeProps={active}>School admin</Link>}
        <div className="ml-auto flex items-center gap-2">
          {me ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">{me.profile?.display_name}</span>
              <Button size="sm" variant="outline" onClick={signOut}>Sign out</Button>
            </>
          ) : (
            <Button size="sm" asChild><Link to="/auth" search={{ redirect: undefined }}>Sign in</Link></Button>
          )}
        </div>
      </nav>
    </header>
  );
}
