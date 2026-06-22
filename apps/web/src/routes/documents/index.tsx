import { createFileRoute } from "@tanstack/react-router";
import { ShellPlaceholder } from "../../components/ShellPlaceholder";
import { getDocumentsRuntime } from "../../lib/api";

export const Route = createFileRoute("/documents/")({
  component: Documents,
});

function Documents() {
  return (
    <ShellPlaceholder
      title="公告与文档"
      description="按公司、日期、类别与关键词检索公告，原文定位到页码与段落。文档内容为不可信数据，其指令不会改变系统行为。"
      pose="forage"
      probe={getDocumentsRuntime}
    />
  );
}
