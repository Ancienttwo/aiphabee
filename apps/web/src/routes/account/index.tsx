import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "../../ds";
import { KV } from "../../components/KV";
import { Disclaimer } from "../../components/Disclaimer";
import { useSession } from "../../lib/context/SessionContext";
import { authClient } from "../../lib/auth-client";
import { SHELL } from "../../lib/ui";

export const Route = createFileRoute("/account/")({
  component: Account,
});

function Account() {
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
        setActionError("退出失败，会话仍保持有效。请重试。");
        return;
      }
      window.location.assign("/login");
    } catch {
      setAction("idle");
      setActionError("认证服务暂时不可用，会话仍保持有效。");
    }
  };

  const revokeSessions = async () => {
    setAction("revoke");
    setActionError(undefined);
    try {
      const result = await authClient.revokeSessions();
      if (result.error) {
        setAction("idle");
        setActionError("撤销失败，现有会话未被确认失效。请重试。");
        return;
      }
      window.location.assign("/login");
    } catch {
      setAction("idle");
      setActionError("认证服务暂时不可用，现有会话未被确认失效。");
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
        账户
      </h1>
      <p style={{ margin: "8px 0 24px", fontSize: "var(--text-base)", color: "var(--text-muted)" }}>
        登录建立真实会话，用于自选、设置等账户功能；工作区、套餐和数据权限不会从会话或邮箱推断。
      </p>

      <Card style={{ maxWidth: 560 }}>
        <CardHeader>
          <CardTitle>当前会话</CardTitle>
        </CardHeader>
        <CardContent>
          {session.isPending ? (
            <KV label="认证状态" value="检查中…" />
          ) : session.isAuthenticated ? (
            <>
              <KV label="名称" value={session.name ?? "—"} />
              <KV label="邮箱" value={session.email ?? "—"} mono />
              <KV label="用户 ID" value={session.userId ?? "—"} mono />
              <KV label="认证状态" value="已登录" />
              <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
                <Button type="button" variant="outline" onClick={signOut} disabled={action !== "idle"}>
                  退出当前会话
                </Button>
                <Button type="button" variant="danger" onClick={revokeSessions} disabled={action !== "idle"}>
                  撤销全部会话
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
              <KV label="认证状态" value="未登录" />
              <Link to="/login">前往登录</Link>
            </>
          )}
        </CardContent>
      </Card>

      <Disclaimer style={{ marginTop: 24, maxWidth: 560 }} />
    </main>
  );
}
