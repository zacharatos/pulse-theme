// Apply a Pulse theme to a page the way Home Assistant does: the theme's base variables, then the
// light or dark mode's, set as inline custom properties, plus an rgb-* twin for every hex value
// (HA's processTheme in apply_themes_on_element.ts). Used by test/preview.html and by the Pulse card
// harnesses (`?theme=pulse|glass|tonal`), which load it from the sibling pulse-theme repo.
import { parseThemes } from "../scripts/yaml.mjs";

export const THEME_NAMES = { pulse: "Pulse", glass: "Pulse Glass", tonal: "Pulse Tonal" };

/**
 * @param {string} key      pulse | glass | tonal
 * @param {boolean} dark    dark mode
 * @param {HTMLElement} target element to set the variables on (HA uses <html>; harnesses that set
 *                          their own defaults on <body> pass document.body so the theme wins)
 * @returns {Promise<Record<string, string>>} the variables that were applied
 */
export async function applyPulseTheme(key, dark, target = document.documentElement) {
  const name = THEME_NAMES[key];
  if (!name) throw new Error(`Unknown Pulse theme "${key}" (use ${Object.keys(THEME_NAMES).join(", ")})`);
  const url = new URL("../themes/pulse.yaml", import.meta.url);
  const themes = parseThemes(await (await fetch(url)).text());
  const { modes, ...base } = themes[name];
  const vars = { ...base, ...modes[dark ? "dark" : "light"] };
  for (const [k, v] of Object.entries(vars)) {
    target.style.setProperty(`--${k}`, v);
    const m = /^#([0-9a-f]{6})$/i.exec(v);
    if (m) target.style.setProperty(`--rgb-${k}`, [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)).join(","));
  }
  return vars;
}
