import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "../ds";
import { authClient } from "../lib/auth-client";
import { SHELL } from "../lib/ui";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
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
          <CardTitle>AiphaBee staging 登录</CardTitle>
        </CardHeader>
        <CardContent>
          <p style={{ marginTop: 0, color: "var(--text-muted)", lineHeight: 1.6 }}>
            登录用于自选、设置等账户功能；浏览行情与数据无需登录。登录只建立产品会话，不自动授予工作区或数据权限。
          </p>
          {session?.user ? (
            <Link to="/account">已登录，进入账户</Link>
          ) : (
            <Button
              type="button"
              onClick={signIn}
              disabled={isPending || submitting}
              fullWidth
            >
              {submitting ? "正在前往 Google…" : "使用 Google 登录"}
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
