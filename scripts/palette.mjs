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
// Light-mode chip fill (share of the text colour) and dark-mode chip fill.
export const CHIP_FILL = { light: 0.05, dark: 0.07 };

export const SYSTEM_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI Variable Text", "Segoe UI", Roboto, Noto, sans-serif';

/** The three variations. `name` is what HA shows in the theme picker. */
export const VARIATIONS = [
  {
    key: "stone", name: "Pulse",
    shape: { control: 12, tileIcon: null, border: 1, shadow: "none" },
    dark: { neutral: [70, 0.008], L: { bg: 0.17, card: 0.215, section: 0.245 }, accent: [272, 0.075], divider: "rgba(240, 236, 228, 0.09)" },
    light: { neutral: [75, 0.008], L: { bg: 0.962, card: 0.995, section: 0.93 }, cardChroma: 0.3, accent: [272, 0.085], divider: "rgba(40, 36, 30, 0.09)", statePrefer: 0.68 },
  },
  {
    key: "glass", name: "Pulse Glass",
    shape: { control: 12, tileIcon: null, border: 0, shadow: "inset 0 1px 0 rgba(255, 255, 255, 0.08)" },
    dark: {
      neutral: [285, 0.02], L: { bg: 0.16, card: 0.24, section: 0.22 }, accent: [272, 0.09], divider: "rgba(255, 255, 255, 0.08)",
      glass: {
        alpha: 0.07, blur: "blur(22px) saturate(150%)", background: "radial-gradient(120% 80% at 10% 0%, #3a2a52 0%, transparent 60%), radial-gradient(90% 70% at 100% 100%, #4a2a28 0%, transparent 60%), linear-gradient(160deg, #15172a 0%, #1d1a2c 50%, #171b24 100%) fixed",
      },
    },
    light: {
      neutral: [60, 0.012], L: { bg: 0.94, card: 0.98, section: 0.95 }, accent: [272, 0.1], divider: "rgba(60, 40, 60, 0.08)", statePrefer: 0.64,
      glass: {
        alpha: 0.6, blur: "blur(22px) saturate(160%)", background: "radial-gradient(110% 80% at 0% 0%, #f6cfb4 0%, transparent 55%), radial-gradient(100% 80% at 100% 20%, #d8cdf0 0%, transparent 60%), linear-gradient(170deg, #f4e9df 0%, #e6e3f1 55%, #dbe7ef 100%) fixed",
      },
    },
  },
  {
    key: "tonal", name: "Pulse Tonal",
    shape: { control: 14, tileIcon: "12px", border: 0, shadow: "0 1px 2px rgba(0, 0, 0, 0.06)" },
    dark: { neutral: [345, 0.014], L: { bg: 0.165, card: 0.215, section: 0.245 }, cardChroma: 1.4, accent: [345, 0.085], divider: "rgba(255, 230, 240, 0.07)" },
    light: { neutral: [345, 0.012], L: { bg: 0.965, card: 0.99, section: 0.935 }, cardChroma: 0.6, accent: [345, 0.1], divider: "rgba(60, 30, 45, 0.07)", statePrefer: 0.66 },
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
  m.chipFill = dark ? CHIP_FILL.dark : CHIP_FILL.light;
  const onAll = (min) => [(h) => Math.min(...m.surfaces.map((x) => ratio(h, x))), min];
  const onChips = (min) => [(h) => Math.min(...m.surfaces.map((x) => ratio(h, mix(m.text, x, m.chipFill)))), min];
  m.text2 = solve(nC * 0.8, nH, [onAll(4.6), onChips(4.6), [(h) => ratio(h, m.bg), 4.6]], dark, dark ? 0.72 : 0.5);
  m.disabled = hex(dark ? 0.5 : 0.72, nC, nH);
  const [aH, aC] = s.accent;
  m.accent = solve(aC, aH, [onAll(4.6), ...(dark ? [] : [[(h) => ratio("#ffffff", h), 4.6]])], dark, dark ? 0.78 : 0.5);
  m.onAccent = dark ? hex(0.2, 0.03, aH) : "#ffffff";
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
  m.glowDay = hex(dark ? 0.82 : 0.8, 0.12, 80);
  m.glowNight = hex(dark ? 0.72 : 0.62, 0.1, 280);
  m.glowAlpha = dark ? 0.14 : 0.16;
  m.divider = s.divider;
  return m;
}
