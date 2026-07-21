import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "../../ds";
import { KV } from "../../components/KV";
import { Disclaimer } from "../../components/Disclaimer";
import { useSession } from "../../lib/context/SessionContext";
import { authClient } from "../../lib/auth-client";
import { SHELL } from "../../lib/ui";
import { useLocale } from "../../i18n/locale";

export const Route = createFileRoute("/account/")({
  component: Account,
});

function Account() {
  const { t } = useLocale();
  const session = useSession();
  const [action, setAction] = useState<"idle" | "logout" | "revoke">("idle");
  const [actionError, setActionError] = useState<string>();

  const signOut = async () => {
    setAction("logout");
    setActionError(undefined);
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setAction("idle");
        setActionError(t("signOutFailed"));
        return;
      }
      window.location.assign("/login");
    } catch {
      setAction("idle");
      setActionError(t("authUnavailable"));
    }
  };

  const revokeSessions = async () => {
    setAction("revoke");
    setActionError(undefined);
    try {
      const result = await authClient.revokeSessions();
      if (result.error) {
        setAction("idle");
        setActionError(t("revokeFailed"));
        return;
      }
      window.location.assign("/login");
    } catch {
      setAction("idle");
      setActionError(t("revokeUnavailable"));
    }
  };

  return (
    <main style={{ ...SHELL, paddingTop: 40, paddingBottom: 72 }}>
      <h1
        style={{
          margin: 0,
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-3xl)",
          fontWeight: 700,
          color: "var(--text-primary)",
        }}
      >
        {t("accountTitle")}
      </h1>
      <p style={{ margin: "8px 0 24px", fontSize: "var(--text-base)", color: "var(--text-muted)" }}>
        {t("accountDescription")}
      </p>

      <Card style={{ maxWidth: 560 }}>
        <CardHeader>
          <CardTitle>{t("currentSession")}</CardTitle>
        </CardHeader>
        <CardContent>
          {session.isPending ? (
            <KV label={t("authStatus")} value={t("checking")} />
          ) : session.isAuthenticated ? (
            <>
              <KV label={t("name")} value={session.name ?? "—"} />
              <KV label={t("email")} value={session.email ?? "—"} mono />
              <KV label={t("userId")} value={session.userId ?? "—"} mono />
              <KV label={t("authStatus")} value={t("signedIn")} />
              <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
                <Button type="button" variant="outline" onClick={signOut} disabled={action !== "idle"}>
                  {t("signOutSession")}
                </Button>
                <Button type="button" variant="danger" onClick={revokeSessions} disabled={action !== "idle"}>
                  {t("revokeAllSessions")}
                </Button>
              </div>
              {actionError ? (
                <p role="alert" style={{ color: "var(--red-600)", marginBottom: 0 }}>
                  {actionError}
                </p>
              ) : null}
            </>
          ) : (
            <>
              <KV label={t("authStatus")} value={t("signedOut")} />
              <Link to="/login">{t("goToLogin")}</Link>
            </>
          )}
        </CardContent>
      </Card>

      <Disclaimer style={{ marginTop: 24, maxWidth: 560 }} />
    </main>
  );
}
