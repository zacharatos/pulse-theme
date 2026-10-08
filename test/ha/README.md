# Throwaway Home Assistant

A local Home Assistant with the Pulse themes, the `demo` integration (invented lights, climate, media, locks, covers, sensors) and the three Pulse cards, for checking what the preview harness can't: real dashboards, dialogs, settings pages and HA's own components. **It never touches the live house.**

## Run

From the repo root, with Python 3.13 and the card repos next to this one (`../area-pulse-card`, `../home-pulse-card`, `../stock-pulse`):

```bash
bash test/ha/run.sh                         # latest HA, venv in ./ha-test/.venv (first run takes a few minutes)
HA_VERSION=2025.7.4 bash test/ha/run.sh     # our minimum version (use a separate venv: pass its path as the first argument)
```

`run.sh` copies `themes/pulse.yaml`, the two card bundles and the Stock Pulse integration into `./ha-test/` (gitignored), starts HA on http://localhost:8123 and runs `setup.py`, which onboards it (user `alex`, password `throwaway-1234`, both local to this instance), adds Stock Pulse with four items, puts some demo entities in the Living Room and saves a sections dashboard, **Pulse test** (http://localhost:8123/pulse-test/home), with tile, area, entities, thermostat, media and button cards next to Home Pulse, Area Pulse and Stock Pulse.

Re-run `run.sh` after changing the theme or a card bundle; it copies the new files and is safe to run on an already set-up config. Stop HA with `kill <pid>` (printed at start).

## Screenshots

```bash
npx -y -p playwright@1.56.1 node test/ha/shots.mjs            # writes ha-test/shots/*.png
```

The first time, Playwright needs a browser: `npx -y playwright@1.56.1 install chromium`. To use a Chromium you already have, set `CHROMIUM_PATH`. The script covers every theme in light and dark (plus HA's default for comparison), a phone in Greek, Glass on a phone, a more-info dialog, a settings page and the entities table, and warns if a page scrolls sideways.

## What to look at

- Every Pulse theme in light and dark: tile colours (lights gold, open doors orange, locked green, unlocked red), the accent on switches and buttons, the font, the header and sidebar.
- Phone width (~380px) and Greek.
- A more-info dialog (Glass: frosted), the settings pages, the entities table.
- Our three cards next to the native ones: do they look like one family?

## Things we hit, so you don't have to

- A bare `pip install homeassistant` lacks packages HA installs at runtime. Without `numpy` and `PyTurboJPEG` the demo integration fails (no entities); without the voice packages (`pymicro-vad`, `pyspeex-noise`, `hassil`, …) loading the list of actions fails and the frontend hangs on "Loading data". `run.sh` installs them.
- HA 2025.x needs `pycares==4.9.0`; newer versions break its DNS library at start-up.
- `lovelace: resource_mode` is a newer option; on 2025.7 it puts HA into recovery mode (no custom integrations). That's why `setup.py` adds the dashboard resources through the API instead.
- From HA 2026 the default *Overview* is an automatic dashboard that takes over `/lovelace`, so `setup.py` creates its own dashboard (`/pulse-test`) instead of editing the default one.
- One page error ("Object") appears on every page load in this setup, with HA's default theme too. It comes from the demo setup, not from Pulse.
