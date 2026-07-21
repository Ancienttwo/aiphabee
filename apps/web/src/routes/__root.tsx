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
import { EntitlementProvider } from "../lib/context/EntitlementContext";
import { IpoCompareProvider } from "../lib/context/IpoCompareContext";
import { LocaleProvider, useLocale } from "../i18n/locale";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AiphaBee · 港股研究 Agent 與 MCP 資料平台" },
      {
        name: "description",
        content:
          "港股研究作業系統：自然語言研究、個股工作台、比較與篩選、公告研究，每個數字都可追溯證據。Web Agent 與 Remote MCP 雙入口。目前為合成資料預覽（Gate 0 前）。",
      },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/brand/aiphabee-mascot.png" },
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
        <LocaleProvider>
          <SessionProvider>
            <ResponseDepthProvider>
              <EntitlementProvider>
                <IpoCompareProvider>
                  <div
                    style={{
                      minHeight: "100vh",
                      display: "flex",
                      flexDirection: "column",
                      background: "var(--surface-page)",
                    }}
                  >
                    <SkipLink />
                    <NavBar />
                    <div id="main-content" tabIndex={-1} style={{ flex: 1 }}>
                      <Outlet />
                    </div>
                    <Footer />
                  </div>
                </IpoCompareProvider>
              </EntitlementProvider>
            </ResponseDepthProvider>
          </SessionProvider>
        </LocaleProvider>
      </QueryClientProvider>
    </RootDocument>
  );
}

function SkipLink() {
  const { t } = useLocale();
  return (
    <a className="skip-link" href="#main-content">
      {t("skipToMain")}
    </a>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-Hant" suppressHydrationWarning>
      <head>
        <HeadContent />
        {/* Set the theme before first paint (no flash). Honors a saved
            choice, else the OS preference. Paired with [data-theme] in CSS. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var s=localStorage.getItem('aiphabee-theme');var t=s||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);}catch(e){}})();",
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var l=localStorage.getItem('aiphabee-locale');if(l==='zh-Hant'||l==='zh-Hans'||l==='en')document.documentElement.lang=l;}catch(e){}})();",
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
