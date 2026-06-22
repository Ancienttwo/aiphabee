import { createFileRoute } from "@tanstack/react-router";
import { ShellPlaceholder } from "../../components/ShellPlaceholder";
import { getResearchRuntime } from "../../lib/api";

export const Route = createFileRoute("/library/")({
  component: Library,
});

function Library() {
  return (
    <ShellPlaceholder
      title="研究库"
      description="保存完整 run（问题、工具输入、证据与模型版本）；重跑时区分数据 / 模型 / 参数差异，旧报告不被静默改写。"
      pose="insight"
      probe={getResearchRuntime}
    />
  );
}
