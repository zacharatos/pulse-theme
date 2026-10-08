"""Prepare the throwaway Home Assistant started by run.sh.

Onboards it (or logs in if it is already onboarded), sets up the shopping list and Stock Pulse with a
few items, registers the two card bundles as dashboard resources, puts some demo entities in the
Living Room area and saves a sections dashboard ("Pulse test", /pulse-test/home) with native cards next to
the Pulse cards.
Writes the login tokens to tokens.json next to the config, for shots.mjs.

Run with the Python of the HA virtualenv (it has aiohttp):  <venv>/bin/python test/ha/setup.py <config dir>
Everything here is invented and local; the user and password only exist in this throwaway instance.
"""

import asyncio
import json
import sys
from pathlib import Path

import aiohttp

BASE = "http://localhost:8123"
CLIENT = BASE + "/"
USER, PASSWORD = "alex", "throwaway-1234"
DASHBOARD = "pulse-test"  # the dashboard setup.py creates: http://localhost:8123/pulse-test/home


async def tokens(s: aiohttp.ClientSession) -> dict:
    r = await s.get(f"{BASE}/api/onboarding")
    steps = {x["step"]: x["done"] for x in await r.json()} if r.status == 200 else {}
    if steps and not steps.get("user"):
        r = await s.post(f"{BASE}/api/onboarding/users", json={"client_id": CLIENT, "name": "Alex", "username": USER, "password": PASSWORD, "language": "en"})
        code = (await r.json())["auth_code"]
    else:
        flow = await (await s.post(f"{BASE}/auth/login_flow", json={"client_id": CLIENT, "handler": ["homeassistant", None], "redirect_uri": CLIENT})).json()
        res = await (await s.post(f"{BASE}/auth/login_flow/{flow['flow_id']}", json={"client_id": CLIENT, "username": USER, "password": PASSWORD})).json()
        code = res["result"]
    tok = await (await s.post(f"{BASE}/auth/token", data={"grant_type": "authorization_code", "code": code, "client_id": CLIENT})).json()
    h = {"Authorization": f"Bearer {tok['access_token']}"}
    for step, body in [("core_config", {}), ("analytics", {}), ("integration", {"client_id": CLIENT, "redirect_uri": CLIENT + "?auth_callback=1"})]:
        if steps and not steps.get(step):
            await s.post(f"{BASE}/api/onboarding/{step}", json=body, headers=h)
    return tok


async def config_flow(s, h, handler: str, data: dict | None) -> str | None:
    flow = await (await s.post(f"{BASE}/api/config/config_entries/flow", json={"handler": handler}, headers=h)).json()
    if flow.get("type") == "form" and data is not None:
        flow = await (await s.post(f"{BASE}/api/config/config_entries/flow/{flow['flow_id']}", json=data, headers=h)).json()
    print(f"{handler}: {flow.get('type')} {flow.get('reason') or flow.get('title') or ''}")
    return flow.get("type")


async def main(config_dir: Path) -> None:
    async with aiohttp.ClientSession() as s:
        tok = await tokens(s)
        h = {"Authorization": f"Bearer {tok['access_token']}"}
        await config_flow(s, h, "shopping_list", {})
        new_inventory = await config_flow(s, h, "stock_pulse", {"name": "Home", "shopping_list": "todo.shopping_list", "auto_add": True, "auto_restock": True,
                                                "match_by_name": True, "remove_completed": False, "expiring_days": 3})

        ws = await s.ws_connect(f"{BASE}/api/websocket")
        await ws.receive_json()
        await ws.send_json({"type": "auth", "access_token": tok["access_token"]})
        assert (await ws.receive_json())["type"] == "auth_ok"
        n = 0

        async def call(msg: dict):
            nonlocal n
            n += 1
            await ws.send_json({"id": n, **msg})
            while True:
                res = await ws.receive_json()
                if res.get("id") == n and res.get("type") == "result":
                    if not res["success"]:
                        print("  !", msg["type"], res["error"].get("message"))
                    return res.get("result")

        existing = {r["url"] for r in (await call({"type": "lovelace/resources"}) or [])}
        for url in ("/local/area-pulse-card.js", "/local/home-pulse-card.js"):
            if url not in existing:
                await call({"type": "lovelace/resources/create", "res_type": "module", "url": url})

        inventory = (await call({"type": "stock_pulse/inventories"}))[0]["entry_id"]
        for item in [] if new_inventory != "create_entry" else [
            {"name": "Coffee beans", "quantity": 0, "unit": "pack", "min_quantity": 0, "category": "food", "location": "pantry"},
            {"name": "Milk", "quantity": 1, "unit": "bottle", "min_quantity": 1, "category": "drinks", "location": "fridge"},
            {"name": "Basmati rice", "quantity": 3, "unit": "bag", "category": "food", "location": "pantry"},
            {"name": "Olive oil", "quantity": 2, "unit": "bottle", "category": "food", "location": "pantry"},
        ]:
            await call({"type": "stock_pulse/item/add", "inventory": inventory, "item": item})

        # Onboarding creates a Living Room area; put a handful of demo entities in it.
        area = next(a for a in await call({"type": "config/area_registry/list"}) if a["name"] == "Living Room")
        await call({"type": "config/area_registry/update", "area_id": area["area_id"], "icon": "mdi:sofa"})
        ids = {st["entity_id"] for st in await call({"type": "get_states"})}
        for eid in ("light.ceiling_lights", "light.living_room_rgbww_lights", "media_player.living_room", "climate.hvac",
                    "binary_sensor.movement_backyard", "cover.living_room_window", "fan.living_room_fan",
                    "sensor.outside_temperature", "sensor.outside_humidity"):
            if eid in ids:
                await call({"type": "config/entity_registry/update", "entity_id": eid, "area_id": area["area_id"]})

        def tile(e, **kw):
            return {"type": "tile", "entity": e, **kw}

        switches = sorted(e for e in ids if e.startswith("switch."))[:3]
        # Our own dashboard: from HA 2026 the default "Overview" is an automatic dashboard that takes over /lovelace.
        if not any(d["url_path"] == DASHBOARD for d in await call({"type": "lovelace/dashboards/list"}) or []):
            await call({"type": "lovelace/dashboards/create", "url_path": DASHBOARD, "title": "Pulse test", "icon": "mdi:palette", "mode": "storage",
                        "show_in_sidebar": True, "require_admin": False})
        await call({"type": "lovelace/config/save", "url_path": DASHBOARD, "config": {"views": [{
            "title": "Home", "path": "home", "type": "sections", "max_columns": 3,
            "badges": [{"type": "entity", "entity": "sensor.outside_temperature"}, {"type": "entity", "entity": "sun.sun"}],
            "sections": [
                {"type": "grid", "cards": [
                    {"type": "heading", "heading": "Living room"},
                    tile("light.ceiling_lights", features=[{"type": "light-brightness"}]),
                    tile("light.living_room_rgbww_lights"), tile("lock.front_door"), tile("lock.kitchen_door"),
                    tile("cover.living_room_window"), tile("fan.living_room_fan"), tile("binary_sensor.movement_backyard"),
                    tile("alarm_control_panel.security"),
                    {"type": "area", "area": area["area_id"]},
                    {"type": "entities", "title": "Switches", "entities": switches},
                ]},
                {"type": "grid", "cards": [
                    {"type": "heading", "heading": "Climate and media"},
                    {"type": "thermostat", "entity": "climate.hvac"},
                    {"type": "media-control", "entity": "media_player.living_room"},
                    {"type": "button", "entity": "light.bed_light", "grid_options": {"columns": 6}},
                    {"type": "button", "entity": "switch.decorative_lights", "grid_options": {"columns": 6}},
                ]},
                {"type": "grid", "cards": [
                    {"type": "heading", "heading": "Our cards"},
                    {"type": "custom:home-pulse-card", "shortcuts": [
                        {"name": "Lights", "icon": "mdi:lightbulb-group", "navigation_path": "home", "badge": "lights"},
                        {"name": "Security", "icon": "mdi:shield-half-full", "navigation_path": "home"},
                        {"name": "Shopping", "icon": "mdi:cart-outline", "navigation_path": "home"}]},
                    {"type": "custom:area-pulse-card", "area": area["area_id"]},
                    {"type": "custom:stock-pulse-card", "group_by": "none"},
                ]},
            ],
        }]}})
        print(f"dashboard saved ({len(ids)} entities)")
        await ws.close()
        (config_dir / "tokens.json").write_text(json.dumps({k: tok[k] for k in ("access_token", "refresh_token", "expires_in")}))


if __name__ == "__main__":
    asyncio.run(main(Path(sys.argv[1] if len(sys.argv) > 1 else "ha-test")))
