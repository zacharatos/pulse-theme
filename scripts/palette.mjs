// The Pulse palette, derived rather than hand-picked.
// Each colour is a hue + chroma (OKLCH); solve() finds the lightness that meets its contrast target.
// To change a colour, change its hue or chroma here and run `node scripts/build-theme.mjs`.
import { hex, solve, ratio, mix } from "./color.mjs";

// State hues (OKLCH degrees), shared by all variations. The warm side is spread out:
// gold (lights) 77, orange (needs a look) 50, vermilion (problem) 27.
const STATE = {
  ok: [152, 0.1], info: [250, 0.09], warn: [50, 0.15], bad: [27, 0.17], active: [77, 0.17],
  cold: [245, 0.09], warm: [40, 0.1], dry: [80, 0.03], humid: [250, 0.09],
};
// HA's palette variables: some reuse a state colour, the rest are muted category colours.
const PALETTE = {
  red: "bad", green: "ok", blue: "info", amber: "active", orange: "warn", "deep-orange": "warm",
  "light-blue": [232, 0.09], cyan: [205, 0.08], teal: [180, 0.08], indigo: [278, 0.1], purple: [315, 0.1],
  // The rest of HA's palette, so any colour a user picks (e.g. a Home Pulse shortcut) is calm too.
  pink: [355, 0.12], "deep-purple": [295, 0.1], "light-green": [135, 0.1], lime: [118, 0.11], yellow: [98, 0.13], brown: [55, 0.06],
};
// Dark-mode starting lightness per token: problems sit deeper so they read as red, not peach.
const DARK_L = { bad: 0.7, warn: 0.79, warm: 0.75, active: 0.85, ok: 0.8, info: 0.78, cold: 0.78, humid: 0.78, dry: 0.82 };
// Tokens our cards also use as text (4.5:1); the others colour icons and fills only (3:1).
export const TEXT_TOKENS = new Set(["ok", "info", "warn", "bad", "cold", "warm", "dry", "humid"]);

export const SYSTEM_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI Variable Text", "Segoe UI", Roboto, Noto, sans-serif';

/** The three variations. `name` is what HA shows in the theme picker.
 *  shape: corner radii and tile-icon shape; font: the font stack.
 *  Per mode: neutral [hue, chroma] and lightness of page / card / section, accent [hue, chroma],
 *  border width, card shadow, and chip fill ({ on: "text" | "accent" | "white", alpha }).
 */
/**
 * Pulse Glass's grain: a tiny inline SVG noise tile (no download), tinted `rgb` 0–1 and as strong as `alpha`.
 * Percent-encoded so it sits unquoted in url() and in the YAML string.
 */
function grain(rgb, alpha) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 ${rgb} 0 0 0 0 ${rgb} 0 0 0 0 ${rgb} ${alpha} 0 0 0 0'/></filter><rect width='160' height='160' filter='url(%23g)'/></svg>`;
  const data = encodeURIComponent(svg).replace(/'/g, "%27").replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/%2523/g, "%23");
  return `url(data:image/svg+xml,${data}) repeat`;
}

const STONE_LIGHT_SHADOW = "0 1px 2px rgba(40, 30, 20, 0.05), 0 4px 16px -4px rgba(40, 30, 20, 0.07)";
export const VARIATIONS = [
  {
    // Pulse: matte and precise. Warm stone neutrals, hairline edges; in light mode a soft shadow for depth.
    key: "stone", name: "Pulse",
    shape: { radius: 16, control: 12, tileIcon: null },
    font: SYSTEM_FONT,
    dark: { neutral: [70, 0.006], L: { bg: 0.165, card: 0.215, section: 0.245 }, accent: [272, 0.075], divider: "rgba(240, 236, 228, 0.09)",
      border: 1, shadow: "none", chip: { on: "text", alpha: 0.07 } },
    light: { neutral: [75, 0.009], L: { bg: 0.948, card: 0.998, section: 0.92 }, cardChroma: 0.25, accent: [272, 0.085], divider: "rgba(40, 36, 30, 0.07)", statePrefer: 0.68,
      border: 1, shadow: STONE_LIGHT_SHADOW, chip: { on: "text", alpha: 0.065 } },
  },
  {
    // Pulse Glass: visionOS-like. Frosted panels with a light rim and a soft drop shadow, over a quiet textured
    // background: a fine grain on a neutral base with one soft pool of light at the top. No colour fields, so a
    // card's tint never reads as a state.
    key: "glass", name: "Pulse Glass",
    shape: { radius: 20, control: 14, tileIcon: null },
    font: SYSTEM_FONT,
    dark: {
      neutral: [285, 0.02], L: { bg: 0.16, card: 0.24, section: 0.22 }, accent: [272, 0.09], divider: "rgba(255, 255, 255, 0.08)",
      border: 0, chip: { on: "white", alpha: 0.09 },
      shadow: "inset 0 1px 0 rgba(255, 255, 255, 0.16), inset 0 0 0 1px rgba(255, 255, 255, 0.07), 0 12px 32px -12px rgba(0, 0, 0, 0.65)",
      glass: {
        alpha: 0.075, blur: "blur(26px) saturate(180%)",
        background: `${grain(1, 0.15)}, radial-gradient(90% 60% at 50% -10%, #2b2c3c 0%, transparent 70%), linear-gradient(170deg, #17171f 0%, #1b1b25 55%, #141419 100%) fixed`,
      },
    },
    light: {
      neutral: [60, 0.012], L: { bg: 0.94, card: 0.98, section: 0.95 }, accent: [272, 0.1], divider: "rgba(60, 40, 60, 0.08)", statePrefer: 0.64,
      border: 0, chip: { on: "white", alpha: 0.55 },
      shadow: "inset 0 1px 0 rgba(255, 255, 255, 0.95), inset 0 0 0 1px rgba(255, 255, 255, 0.5), 0 12px 32px -14px rgba(70, 50, 100, 0.3)",
      glass: {
        alpha: 0.5, blur: "blur(26px) saturate(180%)",
        background: `${grain(0, 0.16)}, radial-gradient(90% 60% at 50% -10%, #fbfaf8 0%, transparent 70%), linear-gradient(170deg, #f1eeea 0%, #eae8ec 55%, #e6e5e9 100%) fixed`,
      },
    },
  },
  {
    // Pulse Tonal: Material You-like. Rounder and borderless; filled tonal cards on a clean page (the inverse of
    // Pulse's white cards on stone), with light pills on the cards in light mode and accent-tinted ones in dark.
    key: "tonal", name: "Pulse Tonal",
    shape: { radius: 24, control: 16, tileIcon: "14px" },
    font: '"SF Pro Rounded", ui-rounded, ' + SYSTEM_FONT,
    dark: { neutral: [345, 0.022], L: { bg: 0.135, card: 0.235, section: 0.17 }, cardChroma: 1.9, accent: [345, 0.085], divider: "rgba(255, 230, 240, 0.06)",
      border: 0, shadow: "none", chip: { on: "accent", alpha: 0.16 } },
    light: { neutral: [345, 0.022], L: { bg: 0.985, card: 0.938, section: 0.96 }, cardChroma: 1.5, accent: [345, 0.1], divider: "rgba(60, 30, 45, 0.07)", statePrefer: 0.6,
      border: 0, shadow: "none", chip: { on: "white", alpha: 0.62 } },
  },
];

// Approximate OKLCH lightness of HA's neutral scale (frontend 2026.10 core.globals.ts), re-tinted per variation.
const NEUTRAL_L = { "05": 0.171, 10: 0.233, 20: 0.315, 30: 0.388, 40: 0.457, 50: 0.551, 60: 0.656, 70: 0.744, 80: 0.84, 90: 0.928, 95: 0.967 };
// Accent scale lightness targets; 40 is the button fill (white text), 60 the dark-mode link.
const PRIMARY_L = { "05": 0.17, 10: 0.23, 20: 0.3, 30: 0.38, 40: 0.475, 50: 0.58, 60: 0.68, 70: 0.765, 80: 0.86, 90: 0.935, 95: 0.97 };

/** Derive every colour for one variation and mode. */
export function derive(v, mode) {
  const dark = mode === "dark";
  const s = v[mode];
  const [nH, nC] = s.neutral;
  const m = { mode, dark };
  m.bg = hex(s.L.bg, nC, nH);
  m.card = hex(s.L.card, nC * (s.cardChroma ?? 1), nH);
  m.section = hex(s.L.section, nC, nH);
  m.text = hex(dark ? 0.94 : 0.2, nC * 0.6, nH);
  m.glass = s.glass ?? null;
  // What text actually sits on: the solid card, or (Glass) the frosted card over each background stop.
  // Glass: every colour stop of the background gradient, so the check matches what HA paints.
  m.surfaces = m.glass ? m.glass.background.match(/#[0-9a-f]{6}/gi).map((stop) => mix("#ffffff", stop, m.glass.alpha)) : [m.card];
  m.chipFill = s.chip.alpha;
  const onAll = (min) => [(h) => Math.min(...m.surfaces.map((x) => ratio(h, x))), min];
  // Chip colour is decided after the accent; until then text-tinted chips stand in for the check below.
  m.chipBase = s.chip.on === "white" ? "#ffffff" : m.text;
  const onChips = (min) => [(h) => Math.min(...m.surfaces.map((x) => ratio(h, mix(m.chipBase, x, m.chipFill)))), min];
  m.text2 = solve(nC * 0.8, nH, [onAll(4.6), onChips(4.6), [(h) => ratio(h, m.bg), 4.6]], dark, dark ? 0.72 : 0.5);
  m.disabled = hex(dark ? 0.5 : 0.72, nC, nH);
  const [aH, aC] = s.accent;
  m.accent = solve(aC, aH, [onAll(4.6), ...(dark ? [] : [[(h) => ratio("#ffffff", h), 4.6]])], dark, dark ? 0.78 : 0.5);
  m.onAccent = dark ? hex(0.2, 0.03, aH) : "#ffffff";
  if (s.chip.on === "accent") {
    m.chipBase = m.accent;
    // Re-check secondary text on the accent-tinted chips (darker/lighter if needed).
    m.text2 = solve(nC * 0.8, nH, [onAll(4.6), onChips(4.6), [(h) => ratio(h, m.bg), 4.6]], dark, dark ? 0.72 : 0.5);
  }
  // Accent scale for HA's newer components (buttons, switches, checkboxes).
  m.primary = Object.fromEntries(Object.entries(PRIMARY_L).map(([k, L]) => [k, hex(L, aC * Math.min(1, (1 - L) / 0.25, L / 0.35), aH)]));
  m.primary[40] = solve(aC, aH, [[(h) => ratio("#ffffff", h), 4.6]], false, 0.52);
  m.primary[30] = solve(aC, aH, [[(h) => ratio("#ffffff", h), 6]], false, 0.42);
  if (dark) m.primary[60] = solve(aC, aH, [onAll(4.6)], true, 0.68);
  m.neutralScale = Object.fromEntries(Object.entries(NEUTRAL_L).map(([k, L]) => [k, hex(L, Math.max(nC, 0.006), nH)]));
  // State and palette colours: 3:1 as an icon on the card, on a chip and on its own 20% tile tint; 4.5:1 if used as text.
  const tile = (h) => Math.min(...m.surfaces.map((x) => ratio(h, mix(h, x, 0.2))));
  const state = ([H, C], textual, key) =>
    solve(C, H, [[tile, 3.05], onAll(3.05), onChips(3.05), ...(textual ? [onAll(4.6)] : [])], dark, dark ? DARK_L[key] ?? 0.78 : s.statePrefer ?? 0.66);
  for (const [k, val] of Object.entries(STATE)) m[k] = state(val, TEXT_TOKENS.has(k), k);
  // Lights in light mode: bright gold, a deliberate exception below 3:1 (decision 0001). Must stay ≥ 2.5:1 on the card.
  if (!dark) m.active = solve(0.17, 82, [onAll(2.6)], false, 0.8);
  m.palette = Object.fromEntries(Object.entries(PALETTE).map(([k, val]) => [k, typeof val === "string" ? m[val] : state(val, false, k)]));
  // Light mode: a softer, more golden glow; on white a warm tint otherwise reads as a stain.
  m.glowDay = dark ? hex(0.82, 0.12, 80) : hex(0.86, 0.09, 88);
  m.glowNight = hex(dark ? 0.72 : 0.62, 0.1, 280);
  m.glowAlpha = dark ? 0.14 : 0.1;
  m.divider = s.divider;
  m.border = s.border;
  m.shadow = s.shadow;
  return m;
}
