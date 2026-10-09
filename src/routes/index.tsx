import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthForm } from "@/components/thinking/AuthForm";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MySchoolStory · Sign in" },
      { name: "description", content: "MySchoolStory: share how you think, learn from classmates, and grow your school story." },
      { property: "og:title", content: "MySchoolStory" },
      { property: "og:description", content: "Share how you think, learn from classmates, and grow your school story." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/home", replace: true }); });
  }, [navigate]);
  return <AuthForm />;
}
