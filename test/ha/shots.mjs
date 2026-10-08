// Screenshots of the throwaway HA in every Pulse theme, light and dark, desktop and phone, English and Greek,
// plus a more-info dialog and a settings page. Playwright is not a dependency of this repo; run it with npx:
//   npx -y -p playwright@1.56.1 node test/ha/shots.mjs [outDir]      (after test/ha/run.sh; first time: npx playwright install chromium)
import { readFileSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";

const out = process.argv[2] ?? "ha-test/shots";
mkdirSync(out, { recursive: true });
const tok = JSON.parse(readFileSync("ha-test/tokens.json", "utf8"));
const desktop = [1440, 1000], phone = [390, 844];
const shots = [];
for (const theme of ["Pulse", "Pulse Glass", "Pulse Tonal", "default"]) for (const dark of [false, true]) shots.push({ theme, dark, size: desktop, path: "/pulse-test/home" });
shots.push({ theme: "Pulse", dark: false, size: phone, path: "/pulse-test/home", lang: "el" });
shots.push({ theme: "Pulse Glass", dark: true, size: phone, path: "/pulse-test/home" });
shots.push({ theme: "Pulse", dark: true, size: desktop, path: "/pulse-test/home", moreInfo: "light.ceiling_lights" });
shots.push({ theme: "Pulse Glass", dark: false, size: desktop, path: "/pulse-test/home", moreInfo: "light.ceiling_lights" });
shots.push({ theme: "Pulse", dark: false, size: desktop, path: "/config/dashboard" });
shots.push({ theme: "Pulse Tonal", dark: true, size: desktop, path: "/config/entities", lang: "el" });

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
for (const s of shots) {
  const ctx = await browser.newContext({ viewport: { width: s.size[0], height: s.size[1] } });
  await ctx.addInitScript(([t, theme, dark, lang]) => {
    localStorage.setItem("hassTokens", JSON.stringify({ ...t, token_type: "Bearer", hassUrl: location.origin, clientId: location.origin + "/", expires: Date.now() + t.expires_in * 1000 }));
    localStorage.setItem("selectedTheme", JSON.stringify({ theme, dark }));
    localStorage.setItem("selectedLanguage", JSON.stringify(lang));
  }, [tok, s.theme, s.dark, s.lang ?? "en"]);
  const page = await ctx.newPage();
  await page.goto(`http://localhost:8123${s.path}`);
  await page.waitForTimeout(6000);
  if (s.moreInfo) {
    await page.evaluate((id) => document.querySelector("home-assistant").dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true })), s.moreInfo);
    await page.waitForTimeout(2500);
  }
  const name = [s.theme.replace(/\s+/g, "-").toLowerCase(), s.dark ? "dark" : "light", s.size === phone ? "phone" : "desktop", s.lang, s.moreInfo ? "moreinfo" : "", s.path.split("/").filter(Boolean).pop()]
    .filter(Boolean).join("-");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  await page.screenshot({ path: `${out}/${name}.png` });
  console.log(`${name}.png${overflow ? "  ⚠ scrolls sideways" : ""}`);
  await ctx.close();
}
await browser.close();
