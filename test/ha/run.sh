#!/usr/bin/env bash
# Start a throwaway Home Assistant with the Pulse themes, the demo integration, the Pulse Cards bundle and Stock Pulse.
# Never the live house: it runs on http://localhost:8123 from ./ha-test (gitignored).
#
#   bash test/ha/run.sh [path-to-venv]        default venv: ./ha-test/.venv (created on first run)
#   HA_VERSION=2025.7.4 bash test/ha/run.sh   test a specific version (our minimum is 2025.7)
#
# Needs Python 3.13 and the sibling repos next to this one: ../pulse-cards and ../stock-pulse (their
# built bundles are copied in). See test/ha/README.md for what to look at.
set -euo pipefail
cd "$(dirname "$0")/../.."
ROOT="$PWD"; CFG="$ROOT/ha-test"; VENV="${1:-$CFG/.venv}"; PROJECTS="$(dirname "$ROOT")"
mkdir -p "$CFG/themes" "$CFG/www" "$CFG/custom_components"

if [ ! -x "$VENV/bin/hass" ]; then
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install --quiet --upgrade pip
  # A bare `pip install homeassistant` lacks packages HA normally installs at runtime; without these
  # the demo integration fails and the frontend hangs on "Loading data".
  "$VENV/bin/pip" install --quiet "homeassistant${HA_VERSION:+==$HA_VERSION}" numpy PyTurboJPEG \
    pymicro-vad pyspeex-noise hassil home-assistant-intents mutagen ha-ffmpeg
  # HA 2025.x needs the older DNS library its aiodns was built against.
  case "${HA_VERSION:-}" in 2025.*) "$VENV/bin/pip" install --quiet "pycares==4.9.0" ;; esac
fi

cp "$ROOT/test/ha/configuration.yaml" "$CFG/configuration.yaml"
cp "$ROOT/themes/pulse.yaml" "$CFG/themes/"
# The per-card bundles from before Pulse Cards would load first and win, so they go.
rm -f "$CFG/www/area-pulse-card.js" "$CFG/www/home-pulse-card.js"
cp "$PROJECTS/pulse-cards/dist/pulse-cards.js" "$CFG/www/"
rm -rf "$CFG/custom_components/stock_pulse"
cp -r "$PROJECTS/stock-pulse/custom_components/stock_pulse" "$CFG/custom_components/"

"$VENV/bin/hass" -c "$CFG" > "$CFG/hass.out" 2>&1 &
echo "Home Assistant starting (pid $!), log: ha-test/hass.out"
for _ in $(seq 1 60); do curl -s -o /dev/null http://localhost:8123/ && break; sleep 3; done
sleep 30  # let the demo integration finish setting up its entities
"$VENV/bin/python" "$ROOT/test/ha/setup.py" "$CFG"
echo "Ready: http://localhost:8123 (user alex / throwaway-1234). Pick a Pulse theme in the profile."
