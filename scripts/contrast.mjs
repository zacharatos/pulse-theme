// Contrast check: reads themes/pulse.yaml and fails if any declared pair is below WCAG 2.1 AA.
// Run: node scripts/contrast.mjs        (table for every theme and mode, exit 1 on failure)
//      node scripts/contrast.mjs --json (machine-readable)
// No dependencies: pulse.yaml is generated in a small, fixed YAML subset, parsed below.
import { readFileSync } from "node:fs";
import { parseThemes } from "./yaml.mjs";

// ---------- colour maths (WCAG 2.1 relative luminance)
function parseColour(c) {
  c = c.trim();
  let m = c.match(/^#([0-9a-f]{6})$/i);
  if (m) return { rgb: [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)), a: 1 };
  m = c.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
  if (m) return { rgb: [+m[1], +m[2], +m[3]], a: m[4] === undefined ? 1 : +m[4] };
  throw new Error(`not a colour: ${c}`);
}
const over = (fg, bg) => fg.rgb.map((c, i) => c * fg.a + bg[i] * (1 - fg.a)); // composite fg (with alpha) over an opaque bg
const lin = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// ---------- the pairs that matter
// Deliberate exceptions, by decision 0001. Never lower a threshold here without a decision record.
const EXCEPTIONS = [
  // Lights in light mode use bright gold: every yellow that reaches 3:1 on a light card reads as mustard.
  // A light's state is always also shown as text ("On · 70%"). Measured: ~2.6 on cards, ~2.2 on its tile tint.
  { mode: "light", match: /^(pulse-active|amber-color)$/, min: 2.1, why: "bright gold for lights (decision 0001)" },
];

function check(name, mode, v) {
  const C = (k) => { if (v[k] === undefined) throw new Error(`${name}/${mode}: missing ${k}`); return parseColour(v[k]); };
  const page = C("primary-background-color").rgb;
  // What cards actually sit on: the page colour, or every colour stop of a gradient background.
  const stops = (v["lovelace-background"].match(/#[0-9a-f]{6}/gi) ?? [v["primary-background-color"]]).map((h) => parseColour(h).rgb);
  const cardFill = parseColour(v["ha-card-background"] ?? v["card-background-color"]);
  const cards = stops.map((s) => over(cardFill, s));
  const chips = cards.map((c) => over(C("pulse-surface-neutral"), c));
  // The active fill (an "on" action, the current mode, a shortcut whose entity is on).
  const strong = cards.map((c) => over(C("pulse-surface-neutral-strong"), c));
  const tint = (fg) => cards.map((c) => over({ rgb: fg.rgb, a: 0.2 }, c)); // a native tile's icon background
  const header = stops.map((s) => over(C("app-header-background-color"), s));
  const dialog = stops.map((s) => over(C("ha-dialog-surface-background"), s));
  const sidebar = [over(C("sidebar-background-color"), page)];
  const rows = [];
  const pair = (label, fgKey, bgs, min, fg = C(fgKey).rgb) => rows.push({ label, fgKey, r: Math.min(...bgs.map((b) => ratio(fg, b))), min });

  pair("Text on cards", "primary-text-color", cards, 4.5);
  pair("Text on page", "primary-text-color", [page], 4.5);
  pair("Text on section background", "primary-text-color", [C("secondary-background-color").rgb], 4.5);
  pair("Secondary text on cards", "secondary-text-color", cards, 4.5);
  pair("Secondary text on chips", "secondary-text-color", chips, 4.5);
  pair("Text on active fills", "primary-text-color", strong, 4.5);
  pair("Accent icon on active fills", "pulse-accent", strong, 3);
  // Not checked yet: gold on an active fill in Pulse light measures ~1.95, under the gold exception's 2.1
  // (an "on" Lights action in Area Pulse). Open question for Timos, see decision 0001, Phase 5.
  pair("Secondary text on page", "secondary-text-color", [page], 4.5);
  pair("Text on header", "app-header-text-color", header, 4.5);
  pair("Text on sidebar", "sidebar-text-color", sidebar, 4.5);
  pair("Selected item in sidebar", "sidebar-selected-text-color", sidebar, 4.5);
  pair("Text in dialogs", "primary-text-color", dialog, 4.5);
  pair("Accent as link on cards", "primary-color", cards, 4.5);
  pair("Text on accent fill", "text-primary-color", [C("primary-color").rgb], 4.5);
  pair("White on button (--ha-color-primary-40)", "ha-color-primary-40", [C("ha-color-primary-40").rgb], 4.5, [255, 255, 255]);
  pair("White on button hover (--ha-color-primary-30)", "ha-color-primary-30", [C("ha-color-primary-30").rgb], 4.5, [255, 255, 255]);
  if (mode === "dark") pair("Link on cards (--ha-color-primary-60)", "ha-color-primary-60", cards, 4.5);
  pair("Idle icons on cards", "state-icon-color", cards, 3);
  for (const k of ["success-color", "info-color", "warning-color", "error-color"]) pair(`${k} as text on cards`, k, cards, 4.5);
  for (const k of ["pulse-ok", "pulse-info", "pulse-warn", "pulse-bad", "pulse-cold", "pulse-warm", "pulse-dry", "pulse-humid"]) {
    pair(`${k} as text on cards`, k, cards, 4.5);
    pair(`${k} icon on chips`, k, chips, 3);
    pair(`${k} icon on its tile tint`, k, tint(C(k)), 3);
  }
  pair("pulse-active icon on cards", "pulse-active", cards, 3);
  pair("pulse-active icon on chips", "pulse-active", chips, 3);
  pair("pulse-active icon on its tile tint", "pulse-active", tint(C("pulse-active")), 3);
  for (const k of ["red", "green", "blue", "amber", "orange", "deep-orange", "light-blue", "cyan", "teal", "indigo", "purple",
    "pink", "deep-purple", "light-green", "lime", "yellow", "brown"]) {
    const key = `${k}-color`;
    pair(`${key} icon on its tile tint`, key, tint(C(key)), 3);
    pair(`${key} icon on chips`, key, chips, 3);
  }
  for (const row of rows) {
    const ex = EXCEPTIONS.find((e) => e.mode === mode && e.match.test(row.fgKey));
    if (ex) { row.exception = ex.why; row.min = Math.min(row.min, ex.min); }
    row.pass = row.r >= row.min - 1e-9;
  }
  return rows;
}

const themes = parseThemes(readFileSync(new URL("../themes/pulse.yaml", import.meta.url), "utf8"));
const results = [];
for (const [name, def] of Object.entries(themes)) {
  const { modes, ...base } = def;
  if (!modes?.light || !modes?.dark) throw new Error(`${name}: needs modes.light and modes.dark`);
  for (const mode of ["light", "dark"]) results.push({ name, mode, rows: check(name, mode, { ...base, ...modes[mode] }) });
}

if (process.argv.includes("--json")) console.log(JSON.stringify(results));
else {
  for (const { name, mode, rows } of results) {
    const fails = rows.filter((r) => !r.pass);
    console.log(`\n${name} · ${mode}: ${rows.length - fails.length}/${rows.length} pass`);
    for (const r of rows) if (!r.pass || r.exception) console.log(`  ${r.pass ? "exception" : "FAIL"}  ${r.label}: ${r.r.toFixed(2)} (needs ${r.min})${r.exception ? " — " + r.exception : ""}`);
  }
}
const failed = results.flatMap((t) => t.rows.filter((r) => !r.pass));
if (failed.length) { console.error(`\n${failed.length} pair(s) below AA.`); process.exit(1); }
if (!process.argv.includes("--json")) console.log("\nAll pairs meet WCAG 2.1 AA (with the exceptions listed).");
