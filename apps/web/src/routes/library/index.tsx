import { createFileRoute } from "@tanstack/react-router";
import { ShellPlaceholder } from "../../components/ShellPlaceholder";
import { getResearchRuntime } from "../../lib/api";
import { useLocale } from "../../i18n/locale";

export const Route = createFileRoute("/library/")({
  component: Library,
});

function Library() {
  const { t } = useLocale();
  return (
    <ShellPlaceholder
      title={t("libraryTitle")}
      description={t("libraryDescription")}
      pose="insight"
      probe={getResearchRuntime}
    />
  );
}
