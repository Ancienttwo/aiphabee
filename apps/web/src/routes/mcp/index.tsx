import { createFileRoute } from "@tanstack/react-router";
import { ShellPlaceholder } from "../../components/ShellPlaceholder";
import { getMcpRuntime } from "../../lib/api";

export const Route = createFileRoute("/mcp/")({
  component: Mcp,
});

function Mcp() {
  return (
    <ShellPlaceholder
      title="数据接入 · MCP"
      description="在 Claude / ChatGPT / IDE 等外部 AI 中调用港股只读工具：通过 OAuth 授权 scope，Developer Console 查看密钥、配额与调用日志。"
      pose="honey-finish"
      probe={getMcpRuntime}
    />
  );
}
