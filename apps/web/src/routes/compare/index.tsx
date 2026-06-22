import { createFileRoute } from "@tanstack/react-router";
import { ShellPlaceholder } from "../../components/ShellPlaceholder";
import { getAnalyticsRuntime } from "../../lib/api";

export const Route = createFileRoute("/compare/")({
  component: Compare,
});

function Compare() {
  return (
    <ShellPlaceholder
      title="比较器"
      description="2–5 只证券统一口径比较：按同业、指数或历史分位对照，币种与单位自动统一或明确提示不可比。"
      pose="compare"
      probe={getAnalyticsRuntime}
    />
  );
}
