import { createFileRoute } from "@tanstack/react-router";
import { ShellPlaceholder } from "../../components/ShellPlaceholder";
import { getAnalyticsRuntime } from "../../lib/api";

export const Route = createFileRoute("/screen/")({
  component: Screen,
});

function Screen() {
  return (
    <ShellPlaceholder
      title="筛选器"
      description="用自然语言描述条件，AiphaBee 转成可编辑的结构化筛选，并解释命中原因与排序口径；不允许用未来数据筛选历史时点。"
      pose="thinking"
      probe={getAnalyticsRuntime}
    />
  );
}
