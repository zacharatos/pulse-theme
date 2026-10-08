// OKLCH <-> sRGB, WCAG contrast, and a lightness solver.
// Colours are specified by hue + chroma; the solver picks the lightness that meets a contrast target.
const toLin = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const enc = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function oklchToLinear([L, C, H]) {
  const a = C * Math.cos((H * Math.PI) / 180), b = C * Math.sin((H * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
}
const inGamut = (lin) => lin.every((v) => v >= -0.0005 && v <= 1.0005);
/** OKLCH -> hex, reducing chroma until the colour fits sRGB. */
export function hex(L, C, H) {
  let c = C, lin = oklchToLinear([L, c, H]);
  while (!inGamut(lin) && c > 0) { c -= 0.002; lin = oklchToLinear([L, Math.max(c, 0), H]); }
  return "#" + lin.map((v) => Math.round(255 * Math.min(1, Math.max(0, enc(Math.min(1, Math.max(0, v)))))).toString(16).padStart(2, "0")).join("");
}
export const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = (h) => { const [r, g, b] = (Array.isArray(h) ? h : rgb(h)).map(toLin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
export const mix = (fg, bg, a) => { const f = rgb(fg), g = rgb(bg); return "#" + f.map((c, i) => Math.round(c * a + g[i] * (1 - a)).toString(16).padStart(2, "0")).join(""); };

/**
 * Find the lightness (searching away from the background) for hue/chroma so that every check passes.
 * checks: [(hexColour) => ratio, minimum][]. Light mode searches downward from 0.9, dark upward from 0.5.
 */
export function solve(C, H, checks, dark, prefer = dark ? 0.8 : 0.62) {
  const ok = (h) => checks.every(([f, min]) => f(h) >= min);
  const step = dark ? 0.005 : -0.005;
  // Start at the preferred lightness; move away from the background only as far as needed.
  for (let L = prefer; dark ? L <= 0.97 : L >= 0.2; L += step) { const h = hex(L, C, H); if (ok(h)) return h; }
  throw new Error(`no lightness for C=${C} H=${H}`);
}
