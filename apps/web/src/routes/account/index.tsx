import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "../../ds";
import { KV } from "../../components/KV";
import { Disclaimer } from "../../components/Disclaimer";
import { useSession } from "../../lib/context/SessionContext";
import { getAccountRuntime } from "../../lib/api";
import { SHELL } from "../../lib/ui";

export const Route = createFileRoute("/account/")({
  component: Account,
});

function Account() {
  const session = useSession();
  const { data: env, isLoading } = useQuery({
    queryKey: ["account-runtime"],
    queryFn: getAccountRuntime,
  });
  const online = env?.ok === true;

  return (
    <main style={{ ...SHELL, paddingTop: 40, paddingBottom: 72 }}>
      <h1
        style={{
          margin: 0,
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-3xl)",
          fontWeight: 700,
          color: "var(--ink-800)",
        }}
      >
        账户
      </h1>
      <p style={{ margin: "8px 0 24px", fontSize: "var(--text-base)", color: "var(--text-muted)" }}>
        真实登录（邮箱 / 社交 / 无密码）与订阅、用量、隐私管理将在 Gate 0 通过后接入。当前为占位会话。
      </p>

      <Card style={{ maxWidth: 560 }}>
        <CardHeader>
          <CardTitle>当前会话（占位）</CardTitle>
        </CardHeader>
        <CardContent>
          <KV label="邮箱" value={session.email} mono />
          <KV label="套餐" value={<Badge tone="honey" variant="soft" size="sm">{session.plan}</Badge>} />
          <KV label="认证状态" value={session.isAuthenticated ? "已登录（占位）" : "未登录"} />
          <KV
            label="后端账户能力"
            value={
              <Badge tone={online ? "bullish" : "neutral"} variant="soft" size="sm" dot>
                {isLoading ? "检查中…" : online ? "在线（合成）" : "未连接"}
              </Badge>
            }
          />
        </CardContent>
      </Card>

      <Disclaimer style={{ marginTop: 24, maxWidth: 560 }} />
    </main>
  );
}
