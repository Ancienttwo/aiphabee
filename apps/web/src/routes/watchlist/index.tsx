import { createFileRoute } from "@tanstack/react-router";
import { ShellPlaceholder } from "../../components/ShellPlaceholder";
import { getWatchlistRuntime } from "../../lib/api";

export const Route = createFileRoute("/watchlist/")({
  component: Watchlist,
});

function Watchlist() {
  return (
    <ShellPlaceholder
      title="观察列表"
      description="价格、公告与指标提醒；每日 / 每周简报只总结有实质变化的项目，并做去重、频率与静默期控制。"
      pose="thinking"
      probe={getWatchlistRuntime}
    />
  );
}
