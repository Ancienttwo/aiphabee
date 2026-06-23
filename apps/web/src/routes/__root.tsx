import { useState, type ReactNode } from "react";
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import aiphabeeCss from "../ds/styles/aiphabee.css?url";
import { NavBar } from "../components/NavBar";
import { Footer } from "../components/Footer";
import { ResponseDepthProvider } from "../lib/context/ResponseDepthContext";
import { SessionProvider } from "../lib/context/SessionContext";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AiphaBee · 港股研究 Agent 与 MCP 数据平台" },
      {
        name: "description",
        content:
          "港股研究操作系统：自然语言研究、个股工作台、比较与筛选、公告研究，每个数字都可追溯证据。Web Agent 与 Remote MCP 双入口。当前为合成数据预览（Gate 0 前）。",
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
  // One QueryClient per document (per request on SSR, persisted on the client)
  // to avoid cross-request cache bleed.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <ResponseDepthProvider>
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
          </ResponseDepthProvider>
        </SessionProvider>
      </QueryClientProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-Hant">
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
