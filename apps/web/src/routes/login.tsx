import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "../ds";
import { authClient } from "../lib/auth-client";
import { SHELL } from "../lib/ui";
import { useLocale } from "../i18n/locale";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const { t } = useLocale();
  const { data: session, isPending } = authClient.useSession();
  const [submitting, setSubmitting] = useState(false);

  const signIn = () => {
    setSubmitting(true);
    window.location.assign("/api/auth/google/start");
  };

  return (
    <main style={{ ...SHELL, paddingTop: 64, paddingBottom: 72 }}>
      <Card style={{ maxWidth: 480, margin: "0 auto" }}>
        <CardHeader>
          <CardTitle>{t("loginTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p style={{ marginTop: 0, color: "var(--text-muted)", lineHeight: 1.6 }}>
            {t("loginDescription")}
          </p>
          {session?.user ? (
            <Link to="/account">{t("signedInGoAccount")}</Link>
          ) : (
            <Button
              type="button"
              onClick={signIn}
              disabled={isPending || submitting}
              fullWidth
            >
              {submitting ? t("goingToGoogle") : t("signInGoogle")}
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
