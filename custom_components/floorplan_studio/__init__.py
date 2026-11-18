"""Floorplan Studio: interactive floor plans for Home Assistant dashboards.

The integration stores a *house descriptor* (floors, rooms, devices and their positions),
serves the Lovelace card that draws it, and exposes two websocket commands used by the card.
"""
from __future__ import annotations

import json
import logging
from pathlib import Path

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.storage import Store
from homeassistant.helpers.typing import ConfigType

from .const import CARD_FILE, DOMAIN, STORAGE_KEY, STORAGE_VERSION, URL_BASE, VERSION

_LOGGER = logging.getLogger(__name__)
_DIR = Path(__file__).parent


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Register the card and the websocket API once per Home Assistant run."""
    domain_data = hass.data.setdefault(DOMAIN, {})
    if domain_data.get("registered"):
        return True
    await hass.http.async_register_static_paths(
        [StaticPathConfig(URL_BASE, str(_DIR / "frontend"), cache_headers=False)]
    )
    add_extra_js_url(hass, f"{URL_BASE}/{CARD_FILE}?v={VERSION}")
    websocket_api.async_register_command(hass, ws_get_descriptor)
    websocket_api.async_register_command(hass, ws_save_descriptor)
    domain_data["registered"] = True
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Load the stored descriptor (or the bundled example on first run)."""
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
    data = await store.async_load()
    if data is None:
        text = await hass.async_add_executor_job(_read_default)
        data = json.loads(text)
        await store.async_save(data)
        _LOGGER.info("Floorplan Studio: created the descriptor from the bundled example")
    hass.data[DOMAIN]["store"] = store
    hass.data[DOMAIN]["descriptor"] = data
    return True


def _read_default() -> str:
    return (_DIR / "default_descriptor.json").read_text(encoding="utf-8")


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload; the stored descriptor stays on disk."""
    hass.data.get(DOMAIN, {}).pop("store", None)
    hass.data.get(DOMAIN, {}).pop("descriptor", None)
    return True


@websocket_api.websocket_command({vol.Required("type"): "floorplan_studio/get_descriptor"})
@callback
def ws_get_descriptor(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    """Return the house descriptor."""
    data = hass.data.get(DOMAIN, {}).get("descriptor")
    if data is None:
        connection.send_error(msg["id"], "not_ready", "Η integration Floorplan Studio δεν έχει προστεθεί στις Ρυθμίσεις.")
        return
    connection.send_result(msg["id"], data)


@websocket_api.require_admin
@websocket_api.websocket_command(
    {vol.Required("type"): "floorplan_studio/save_descriptor", vol.Required("descriptor"): dict}
)
@websocket_api.async_response
async def ws_save_descriptor(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    """Persist a new descriptor (admins only)."""
    store = hass.data.get(DOMAIN, {}).get("store")
    descriptor = msg["descriptor"]
    if store is None or not isinstance(descriptor.get("floors"), list):
        connection.send_error(msg["id"], "invalid", "Μη έγκυρος περιγραφέας.")
        return
    await store.async_save(descriptor)
    hass.data[DOMAIN]["descriptor"] = descriptor
    connection.send_result(msg["id"], {"saved": True})
