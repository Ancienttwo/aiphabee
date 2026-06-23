import type { ReactNode } from "react";
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import aiphabeeCss from "../ds/styles/aiphabee.css?url";
import { NavBar } from "../components/NavBar";
import { Footer } from "../components/Footer";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AiphaBee · 港股 IPO 投研 Agent" },
      {
        name: "description",
        content:
          "数据驱动的港股 IPO 投研平台 — 多模型估值、AI 招股书解读、基石与机构评分、市场情绪。Illustrative demo with mock data.",
      },
    ],
    links: [
      { rel: "stylesheet", href: aiphabeeCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;700&display=swap",
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "var(--surface-page)",
        }}
      >
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <NavBar />
        <div id="main-content" tabIndex={-1} style={{ flex: 1 }}>
          <Outlet />
        </div>
        <Footer />
      </div>
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-Hans">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
