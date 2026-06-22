import type { CSSProperties } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bookmark,
  Calendar,
  Check,
  ChevronDown,
  Database,
  Eye,
  FileText,
  Layers,
  type LucideIcon,
  MessageCircle,
  Minus,
  Rocket,
  Search,
  Shield,
  Sliders,
  Sparkles,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  User,
  X,
} from "lucide-react";

/**
 * Lucide icon registry — replaces the UI kit's client-only
 * `<i data-lucide>` + `lucide.createIcons()` pattern with SSR-safe
 * `lucide-react` components. Colour is inherited via `currentColor`.
 */

const REGISTRY = {
  sparkles: Sparkles,
  "arrow-right": ArrowRight,
  "arrow-left": ArrowLeft,
  "arrow-up-right": ArrowUpRight,
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  rocket: Rocket,
  calendar: Calendar,
  layers: Layers,
  star: Star,
  shield: Shield,
  target: Target,
  search: Search,
  "alert-circle": AlertCircle,
  minus: Minus,
  bell: Bell,
  bookmark: Bookmark,
  check: Check,
  "chevron-down": ChevronDown,
  database: Database,
  eye: Eye,
  "file-text": FileText,
  "message-circle": MessageCircle,
  sliders: Sliders,
  user: User,
  x: X,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof REGISTRY;

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: CSSProperties;
}

export function Icon({ name, size = 18, color, style }: IconProps) {
  const Glyph = REGISTRY[name];
  return (
    <span style={{ display: "inline-flex", lineHeight: 0, color, ...style }}>
      <Glyph size={size} strokeWidth={2} aria-hidden="true" />
    </span>
  );
}
