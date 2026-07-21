import { createFileRoute } from "@tanstack/react-router";
import { ShellPlaceholder } from "../../components/ShellPlaceholder";
import { getWatchlistRuntime } from "../../lib/api";
import { useLocale } from "../../i18n/locale";

export const Route = createFileRoute("/watchlist/")({
  component: Watchlist,
});

function Watchlist() {
  const { t } = useLocale();
  return (
    <ShellPlaceholder
      title={t("watchlistTitle")}
      description={t("watchlistDescription")}
      pose="thinking"
      probe={getWatchlistRuntime}
    />
  );
}
