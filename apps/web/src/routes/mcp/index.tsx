import { createFileRoute } from "@tanstack/react-router";
import { ShellPlaceholder } from "../../components/ShellPlaceholder";
import { getMcpRuntime } from "../../lib/api";
import { useLocale } from "../../i18n/locale";

export const Route = createFileRoute("/mcp/")({
  component: Mcp,
});

function Mcp() {
  const { t } = useLocale();
  return (
    <ShellPlaceholder
      title={t("mcpTitle")}
      description={t("mcpDescription")}
      pose="honey-finish"
      probe={getMcpRuntime}
    />
  );
}
