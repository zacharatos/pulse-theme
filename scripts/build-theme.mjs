// Writes themes/pulse.yaml from scripts/palette.mjs. Run: node scripts/build-theme.mjs
// The YAML is committed (HACS serves it); CI re-runs this and fails if the committed file is stale.
import { writeFileSync } from "node:fs";
import { VARIATIONS, derive, SYSTEM_FONT } from "./palette.mjs";
import { rgb } from "./color.mjs";

const q = (v) => `"${String(v).replace(/"/g, '\\"')}"`;
const rgba = (h, a) => `rgba(${rgb(h).join(", ")}, ${a})`;

/** Mode-independent variables: shape, type, rhythm. */
function base(v) {
  const g = [];
  g.push([`Shape: ${v.shape.radius}px cards, ${v.shape.control}px controls`, {
    "ha-card-border-radius": `${v.shape.radius}px`,
    "ha-card-features-border-radius": `${v.shape.control}px`,
    ...(v.shape.tileIcon ? { "ha-tile-icon-border-radius": v.shape.tileIcon } : {}),
  }]);
  g.push([v.font === SYSTEM_FONT ? "Type: the device's own system font, nothing to download" : "Type: a rounded system font where the device has one (Apple), else the system font; nothing to download", { "ha-font-family-body": v.font }]);
  g.push(["Pulse tokens: shape and rhythm (read by our cards; see README)", {
    "pulse-radius": `${v.shape.radius}px`,
    "pulse-control-radius": `${v.shape.control}px`,
    "pulse-chip-height": "30px",
    "pulse-gap": "12px",
    "pulse-pad": "12px",
    "pulse-row-height": "56px",
    "pulse-motion-fast": "150ms",
    "pulse-motion-normal": "250ms",
    "pulse-motion-slow": "350ms",
    "pulse-ease": "cubic-bezier(0.2, 0, 0, 1)",
  }]);
  return g;
}

/** Per-mode variables. */
function mode(v, m) {
  const g = [];
  const glass = m.glass;
  const cardBg = glass ? rgba("#ffffff", glass.alpha) : m.card;
  const solidCard = m.surfaces[0];
  g.push(["Card edge and depth", { "ha-card-border-width": `${m.border}px`, "ha-card-box-shadow": m.shadow }]);
  g.push(["Surfaces and text", {
    "primary-background-color": m.bg,
    "secondary-background-color": m.section,
    "card-background-color": glass ? solidCard : m.card,
    ...(glass ? { "ha-card-background": cardBg, "ha-card-backdrop-filter": glass.blur } : {}),
    "ha-card-border-color": m.divider,
    "ha-section-background-color": m.section,
    "lovelace-background": glass ? glass.background : m.background ?? m.bg,
    "divider-color": m.divider,
    "outline-color": m.divider,
    "primary-text-color": m.text,
    "secondary-text-color": m.text2,
    "disabled-text-color": m.disabled,
    "state-icon-color": m.text2,
    "state-inactive-color": m.text2,
  }]);
  g.push(["Accent: one colour for selection, links, buttons and switches", {
    "primary-color": m.accent,
    "accent-color": m.accent,
    "dark-primary-color": m.primary[40],
    "light-primary-color": m.primary[80],
    "text-primary-color": m.onAccent,
    "text-accent-color": m.onAccent,
  }]);
  g.push(["Accent scale for newer frontends (2026+): buttons, switches, checkboxes read these, not primary-color.\n# Internal HA tokens: check on every HA release. Ignored by older frontends.",
    Object.fromEntries(Object.entries(m.primary).sort(([a], [b]) => parseFloat(a) - parseFloat(b)).map(([k, c]) => [`ha-color-primary-${k}`, c]))]);
  g.push(["Neutral scale for newer frontends, tinted to match the surfaces",
    Object.fromEntries(Object.entries(m.neutralScale).sort(([a], [b]) => parseFloat(a) - parseFloat(b)).map(([k, c]) => [`ha-color-neutral-${k}`, c]))]);
  g.push(["Header, sidebar and dialogs", {
    "app-header-background-color": glass ? rgba(m.bg, glass.header) : m.bg,
    "app-header-text-color": m.text,
    ...(glass ? { "app-header-backdrop-filter": glass.blur } : {}),
    "sidebar-background-color": m.bg,
    "sidebar-text-color": m.text,
    "sidebar-icon-color": m.text2,
    "sidebar-selected-text-color": m.accent,
    "sidebar-selected-icon-color": m.accent,
    "ha-dialog-surface-background": glass ? rgba(m.dark ? m.bg : "#ffffff", m.dark ? 0.82 : 0.86) : m.card,
    ...(glass ? { "ha-dialog-surface-backdrop-filter": glass.blur } : {}),
    "mdc-theme-surface": glass ? solidCard : m.card,
  }]);
  g.push(["Switches (HA's ha-switch, and the Pulse cards that draw their own): on in the accent; off a grey thumb on\n# a faint track (HA draws the track at 38%), so the off state reads on every surface, frosted white included", {
    "switch-checked-color": m.accent,
    "switch-unchecked-button-color": m.text2,
    "switch-unchecked-track-color": m.text2,
  }]);
  g.push(["Status colours HA uses for messages and alerts", {
    "success-color": m.ok, "info-color": m.info, "warning-color": m.warn, "error-color": m.bad,
  }]);
  g.push(["HA palette, muted. HA's state colours (state-light-active-color, …) derive from these,\n# so native tiles and our cards calm down together. amber = lights.",
    Object.fromEntries(Object.entries(m.palette).map(([k, c]) => [`${k}-color`, c]))]);
  g.push(["State colours where HA's default mapping isn't what Pulse means (open doors and windows are\n# \"needs a look\", not amber like a light that is on; an automation that is on, or a script that is\n# running, is the house's own logic at work: the accent, not a light's gold)", {
    "state-automation-on-color": m.accent,
    "state-script-on-color": m.accent,
    "state-binary_sensor-door-on-color": m.warn,
    "state-binary_sensor-garage_door-on-color": m.warn,
    "state-binary_sensor-opening-on-color": m.warn,
    "state-binary_sensor-window-on-color": m.warn,
    "state-cover-active-color": m.palette.purple,
    "state-climate-cool-color": m.cold,
    "state-climate-heat-color": m.warm,
    "state-humidifier-on-color": m.humid,
    "state-sun-above_horizon-color": m.glowDay,
    "state-sun-below_horizon-color": m.glowNight,
  }]);
  g.push(["Pulse tokens: colour (read by our cards; HA also derives --rgb-pulse-* from each hex)", {
    "pulse-accent": m.accent,
    "pulse-on-accent": m.onAccent,
    "pulse-surface-neutral": rgba(m.chipBase, m.chipFill),
    "pulse-surface-neutral-hover": rgba(...m.chipHover),
    "pulse-surface-neutral-strong": rgba(...m.chipStrong),
    "pulse-ok": m.ok, "pulse-info": m.info, "pulse-warn": m.warn, "pulse-bad": m.bad, "pulse-active": m.active,
    "pulse-cold": m.cold, "pulse-warm": m.warm, "pulse-dry": m.dry, "pulse-humid": m.humid,
    "pulse-glow-day": m.glowDay, "pulse-glow-night": m.glowNight, "pulse-glow-alpha": String(m.glowAlpha),
  }]);
  return g;
}

function emit(groups, indent) {
  const pad = " ".repeat(indent);
  return groups.map(([title, vars]) =>
    `${pad}# ${title.replace(/\n# /g, `\n${pad}# `)}\n` + Object.entries(vars).map(([k, val]) => `${pad}${k}: ${q(val)}`).join("\n")).join("\n\n");
}

let out = `# Pulse — a calm theme family for Home Assistant: Pulse (Stone), Pulse Glass and Pulse Tonal.
# GENERATED by scripts/build-theme.mjs from scripts/palette.mjs. Don't edit by hand: change the palette and re-run.
# Colours meet WCAG AA in both modes (npm run contrast), except lights in light mode (bright gold, see README).
`;
for (const v of VARIATIONS) {
  out += `\n${v.name}:\n${emit(base(v), 2)}\n\n  modes:\n`;
  for (const md of ["light", "dark"]) out += `    ${md}:\n${emit(mode(v, derive(v, md)), 6)}\n${md === "light" ? "\n" : ""}`;
}
writeFileSync(new URL("../themes/pulse.yaml", import.meta.url), out);
console.log(`themes/pulse.yaml: ${VARIATIONS.map((v) => v.name).join(", ")} (${out.split("\n").length} lines)`);
