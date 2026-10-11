# Pulse Theme

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://hacs.xyz/docs/faq/custom_repositories)

[![Open your Home Assistant instance and open this repository in HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=zacharatos&repository=pulse-theme&category=theme)

![Pulse, Pulse Glass and Pulse Tonal, dark](https://raw.githubusercontent.com/zacharatos/pulse-theme/main/docs/hero-dark.jpg)

A calm theme family for Home Assistant. Neutral surfaces, one accent, and colour only where it means something: a light that's on, a door that's open, a leak. Three variations share one palette of state colours, so you can switch between them without relearning what anything means. All three come in light and dark modes and meet WCAG AA contrast.

It is also the design system of the [Pulse Cards](https://github.com/zacharatos/pulse-cards): every Pulse card reads this theme's `--pulse-*` tokens first, so cards and Home Assistant's own UI look like one thing. The theme works on its own too; you don't need any custom cards.

| | Light | Dark |
| :- | :- | :- |
| **Pulse**, the default: matte. Light is white cards on warm stone and linen; dark is warm charcoal, lit softly from the top, with cards that sit a little above the page. Dusk-blue accent | ![Pulse light](https://raw.githubusercontent.com/zacharatos/pulse-theme/main/docs/pulse-light.png) | ![Pulse dark](https://raw.githubusercontent.com/zacharatos/pulse-theme/main/docs/pulse-dark.png) |
| **Pulse Glass**: frosted graphite cards with a lit rim, floating over a quiet neutral background, inspired by visionOS. Clear blue accent | ![Pulse Glass light](https://raw.githubusercontent.com/zacharatos/pulse-theme/main/docs/glass-light.png) | ![Pulse Glass dark](https://raw.githubusercontent.com/zacharatos/pulse-theme/main/docs/glass-dark.png) |
| **Pulse Tonal**: soft plum-filled cards on a clean page, rounder shapes, rounded-square tile icons, inspired by Material You | ![Pulse Tonal light](https://raw.githubusercontent.com/zacharatos/pulse-theme/main/docs/tonal-light.png) | ![Pulse Tonal dark](https://raw.githubusercontent.com/zacharatos/pulse-theme/main/docs/tonal-dark.png) |

## Features

- **Built-in cards look calm too.** Pulse sets Home Assistant's own variables, so tile, area, entities, thermostat, media cards, dialogs, the sidebar and settings all change. You don't need any custom cards.
- **Colour that means something.** Muted green for "all good" (locked, home, armed), orange for "needs a look" (a door or window open, something running low), warm red for problems (leak, unlocked, alarm), gold for lights. Open doors and windows no longer share the "light on" colour, and neither do automations that are on or scripts that are running: they take the accent.
- **Readable in both modes.** Every text, icon and state colour is checked against WCAG 2.1 AA in light and dark (`npm run contrast`). One deliberate exception is listed below.
- **Your device's own font.** SF on Apple devices, Segoe UI on Windows, Roboto on Android. Nothing to download, and it works offline.
- **The newer HA design tokens too.** Buttons, switches and checkboxes in recent frontends follow the accent instead of staying HA blue.
- **Switches that read when off.** On is the accent; off is a grey thumb on a faint track, clear on every surface including Pulse Glass's frosted white.
- **Design tokens for card authors.** Every colour, radius and rhythm is also exposed as a `--pulse-*` variable (see [For card authors](#for-card-authors)).

## Installation

### HACS (custom repository)

1. Click the **Open in HACS** button above, or: HACS → ⋮ → **Custom repositories** → add `https://github.com/zacharatos/pulse-theme`, type **Theme**.
2. Install **Pulse Theme**.
3. Make sure your `configuration.yaml` loads themes (HACS puts them in `config/themes/`):
   ```yaml
   frontend:
     themes: !include_dir_merge_named themes
   ```
4. Restart Home Assistant, or call `frontend.reload_themes`.
5. Open your **profile** and pick **Pulse**, **Pulse Glass** or **Pulse Tonal** under *Theme*. Leave *Dark mode* on *Auto* to follow your device, or pick light or dark.

### Manual

Copy `themes/pulse.yaml` into `config/themes/`, then follow steps 3–5 above.

You can also give a single dashboard view its own theme: edit the view and pick a theme under *Theme*.

Requires Home Assistant **2025.7+** (some details need 2026.x, see [What Pulse doesn't change](#what-pulse-doesnt-change)).

## How this theme is made

**Built with AI coding agents, tested by a person, in a real home.** I design the theme: what it is for, how it looks, which colour means what. AI coding agents (mostly Claude) write a large part of the code, following written rules that are public in this repository ([`AGENTS.md`](AGENTS.md)). Before anything reaches you:

- **I review every change and commit it myself.** The agents are not allowed to commit, tag or release; a person decides what ships.
- **It passes the checks:** the theme file is regenerated from the palette and must match, every colour pair is measured against WCAG AA, the YAML must parse, and HACS validation runs, on every push.
- **I look at it** in a test page with invented data and in a throwaway Home Assistant: all three variations, light and dark, phone width, English and Greek.
- **It runs on my own Home Assistant first,** on my own phone, PC and tablet, before it is tagged for everyone.

Found something that looks wrong in *your* Home Assistant? [Open an issue](https://github.com/zacharatos/pulse-theme/issues/new/choose) with a screenshot: every setup is different, and that is exactly the feedback the agents can't give me.

## The three variations

| | Pulse | Pulse Glass | Pulse Tonal |
| :- | :- | :- | :- |
| Surfaces | Light: white cards on a warm stone page. Dark: warm charcoal cards on a page lit softly from the top | Frosted graphite, translucent over a quiet neutral background | Cards filled with the accent tint on a near-plain page |
| Accent | Dusk blue | Clear blue | Soft plum |
| Shape | 16px cards, 12px controls | 20px cards, 14px controls | 24px cards, 16px controls |
| Card edges | 1px hairline and a soft shadow; in dark also a faint lit top edge | No border: a lit top edge, a faint inner outline and a drop shadow | No border, no shadow: the fill carries the shape |
| Chips and buttons | A share of the text colour | Frosted white; active ones a brighter white | Light pills in light mode (active: accent-tinted), accent-tinted in dark |
| Tile icons | Circles | Circles | Rounded squares (HA 2026+) |
| Font | Your device's | Your device's | Your device's rounded variant where there is one (Apple) |
| Cost | None | Blur (see below) | None |

**About Pulse Glass and older tablets.** Frosted glass is the one heavy thing a theme can do: the browser re-blurs everything behind every card while you scroll. Phones and PCs from the last few years handle it easily. An old wall tablet may stutter, so use Pulse or Pulse Tonal there. Each device can have its own theme in its profile.

**Cards inside cards, in Pulse Glass.** Every `ha-card` gets the frosted blur, including a card nested inside another one (a vertical stack, a card inside a custom container card). The inner card then blurs the outer card's already-blurred glass, which can show as a darker or lighter patch. A theme can't blur only the outer card; if a stack looks off, use Pulse or Pulse Tonal on that view, or a container card that doesn't draw its own card.

## Accessibility

Contrast is measured, not eyeballed: 86–87 pairs per variation and mode, covering text on cards, page, chips, active fills, dialogs, header and sidebar; text on buttons; every state colour as an icon on its tile tint and on a chip, plus as text where it's used as text; and both switch thumbs (on and off) on cards. For Pulse Glass, every pair is measured against the worst case: the frosted card over each colour stop of the background.

**One deliberate exception.** In light mode, lights use a bright gold that reaches about 2.6:1 on a card and 2.2:1 on its own tile tint, below the 3:1 minimum for icons. Every yellow that reaches 3:1 on a light background looks mustard or brown. A light's state is always also written as text ("On · 70%"), so colour is never the only signal. In dark mode, lights pass normally.

## What Pulse doesn't change

A theme can only set variables that Home Assistant exposes. It can't change:

- A light's real colour on tiles and in more-info. That's intended: it's meaningful colour.
- Icons, layout and density of the built-in cards, and HA's own animations.
- The coloured icons in the Settings menu, brand images and logos (HA hard-codes them).
- The background of a view that has its own background set in the dashboard editor (your choice wins over the background of Pulse Glass and of Pulse's dark mode).
- Motion and other "detected" sensors. They use HA's generic *active* colour, which is the lights' gold. To change that, override `state-binary_sensor-motion-on-color` (or any other `state-<domain>-<device_class>-<state>-color`) in your own copy of the theme.
- **On Home Assistant 2025.x:** feature bars keep a fixed 12px radius (same value anyway), tile icons stay circles in Pulse Tonal, and buttons and switches follow `primary-color` through the older component styles.

## For card authors

Pulse exposes its decisions as `--pulse-*` CSS variables. Read them first, then fall back to Home Assistant's variable, then to your own default, so your card looks right with or without the theme:

```css
:host {
  --my-accent: var(--pulse-accent, var(--primary-color));
  --my-chip-bg: var(--pulse-surface-neutral, color-mix(in srgb, var(--primary-text-color) 6%, transparent));
  --my-bad: var(--pulse-bad, var(--error-color, #db4437));
}
```

| Token | Meaning |
| :- | :- |
| `--pulse-accent`, `--pulse-on-accent` | The one accent, and text on an accent fill |
| `--pulse-surface-neutral`, `-hover`, `-strong` | Fills for chips, rows and controls (a share of the text colour; frosted white in Glass; white or accent-tinted in Tonal) |
| `--pulse-ok` | All good: home, locked, armed, in stock |
| `--pulse-info` | Information, cooling |
| `--pulse-warn` | Needs a look: open, low, arming |
| `--pulse-bad` | A problem: leak, unlocked, alarm, out of stock |
| `--pulse-active` | Something is on (lights, switches) |
| `--pulse-cold`, `--pulse-warm` | Temperature below or above range |
| `--pulse-dry`, `--pulse-humid` | Humidity below or above range |
| `--pulse-glow-day`, `--pulse-glow-night`, `--pulse-glow-alpha` | Sun and moon glows, and how strong a meaningful glow may be |
| `--pulse-radius`, `--pulse-control-radius`, `--pulse-chip-height` | Cards and controls: 16/12px in Pulse, 20/14px in Glass, 24/16px in Tonal; 30px pill chips |
| `--pulse-gap`, `--pulse-pad`, `--pulse-row-height` | 12px, 12px, 56px |
| `--pulse-motion-fast`, `-normal`, `-slow`, `--pulse-ease` | 150 / 250 / 350 ms and a calm easing curve |

For a switch of your own, read Home Assistant's switch variables, which Pulse sets: `--switch-checked-color` (on), `--switch-unchecked-button-color` (the off thumb) and `--switch-unchecked-track-color` (the off track; HA draws it at 38%).

Home Assistant also creates `--rgb-pulse-<name>` (as `r, g, b`) for every colour token, for use in `rgba()`.

The motion tokens are plain values. They don't switch off for reduced motion, because a theme can't do that without overriding HA's own reduced-motion handling. Wrap your transitions in `@media (prefers-reduced-motion: reduce)` yourself.

## Development

There is nothing to install: the scripts are plain Node (22+) with no dependencies.

```bash
npm run build      # regenerate themes/pulse.yaml from scripts/palette.mjs
npm run contrast   # check every pair against WCAG AA (exit 1 on failure)
npm run check      # both
node scripts/check-version.mjs v1.4.0   # the tag agrees with package.json and CHANGELOG.md (CI runs it on release)
```

- `themes/pulse.yaml` is **generated**. Change colours in `scripts/palette.mjs`: each colour is a hue and chroma, and the solver finds the lightness that meets its contrast target. CI fails if the committed YAML is stale or any pair drops below AA.
- `test/preview.html` applies the theme the way Home Assistant does and shows native-style cards next to the Pulse cards. Serve the folder that contains this repo and its sibling card repos, then open `pulse-theme/test/preview.html` (`?theme=pulse|glass|tonal|none`, `?dark=1`, `?lang=el`, `?width=380`). The screenshots above come from it.
- `test/dashboard.html` is a whole dashboard laid out like a real home (greeting, alarm, Home Pulse, three Area Pulse rooms, Stock Pulse), for judging a change on the cards people actually use. Options: `?theme=`, `?dark=1`, `?width=390`, `?popup=living|bedroom|hall` (opens that room's popup) and `?from=<path to another checkout's test/apply-theme.mjs>` to see an older release on the same page.
- `test/ha/` runs a throwaway Home Assistant with the demo integration and the Pulse cards, and takes screenshots of it (see `test/ha/README.md`).

## Versions and changes

Pulse Theme follows [Semantic Versioning](https://semver.org) as seen from your Home Assistant: major when something that worked stops working or you have to act (a theme or a `--pulse-*` token renamed or removed, a higher minimum Home Assistant), minor for something new or a deliberate change of a look, patch for fixes and polish. What changed in each release is in [CHANGELOG.md](CHANGELOG.md) and on the GitHub release page.

## License

MIT, see [LICENSE](LICENSE).
