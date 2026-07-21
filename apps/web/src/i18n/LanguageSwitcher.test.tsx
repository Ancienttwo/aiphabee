import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { getMessage, isLocale, LocaleProvider } from "./locale";

describe("frontend locale controls", () => {
  it("renders the default language button", () => {
    const html = renderToStaticMarkup(
      <LocaleProvider>
        <LanguageSwitcher />
      </LocaleProvider>,
    );

    expect(html).toContain("繁中");
    expect(html).toContain('aria-haspopup="menu"');
    expect(html).toContain("語言: 繁體中文");
  });

  it("keeps the frontend locale set aligned with the backend contract", () => {
    expect(isLocale("zh-Hant")).toBe(true);
    expect(isLocale("zh-Hans")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("ja")).toBe(false);
    expect(getMessage("en", "stockSearch")).toBe("Stock search");
    expect(getMessage("zh-Hant", "homeHeadline2")).toBe("追溯到它的證據。");
    expect(getMessage("zh-Hans", "homeHeadline2")).toBe("追溯到它的证据。");
    expect(getMessage("en", "homeHeadline2")).toBe("back to its evidence.");
  });

  it("renders the selected locale label on the server", () => {
    const html = renderToStaticMarkup(
      <LocaleProvider initialLocale="en">
        <LanguageSwitcher />
      </LocaleProvider>,
    );

    expect(html).toContain("EN");
    expect(html).toContain("Language: English");
  });
});
