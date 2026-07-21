import { describe, expect, it } from "vitest";
import { getWorkbenchMessage, localizedWorkbenchText } from "./i18n";

describe("stock workbench i18n", () => {
  it.each([
    ["zh-Hant", "公司檔案", "未獲授權"],
    ["zh-Hans", "公司档案", "未获授权"],
    ["en", "Company profile", "Not licensed"],
  ] as const)("provides panel and state copy for %s", (locale, profile, denial) => {
    expect(getWorkbenchMessage(locale, "companyProfile")).toBe(profile);
    expect(getWorkbenchMessage(locale, "dataNotLicensed")).toBe(denial);
  });

  it.each([
    ["zh-Hant", "騰訊控股有限公司"],
    ["zh-Hans", "腾讯控股有限公司"],
    ["en", "Tencent Holdings Ltd."],
  ] as const)("selects the matching backend-provided name for %s", (locale, expected) => {
    expect(
      localizedWorkbenchText(locale, {
        en: "Tencent Holdings Ltd.",
        zhHans: "腾讯控股有限公司",
        zhHant: "騰訊控股有限公司",
      }),
    ).toBe(expected);
  });
});
