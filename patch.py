"""Edit the live dashboard config in place.

Cameron rearranges these dashboards by hand (he moved Living Room above Kitchen
and deleted the shopping list). Regenerating from rooms.py would silently throw
that away, so updates go through here: read what is live, swap individual cards
by entity, write it back. rooms.py is only for building a dashboard from scratch.
"""
import copy
import design as d

KEEP = ("grid_options", "visibility", "view_layout", "layout_options")


def swap(cfg, entity, make, match_type=None):
    """Replace every card bound to `entity` with make(), preserving placement keys."""
    n = 0
    for sec in cfg["views"][0].get("sections", []):
        for i, card in enumerate(sec.get("cards", [])):
            if card.get("entity") != entity:
                continue
            if match_type and card.get("type") != match_type:
                continue
            fresh = copy.deepcopy(make())
            for k in KEEP:
                if k in card:
                    fresh[k] = card[k]
            sec["cards"][i] = fresh
            n += 1
    return n


def plant(entity, label):
    return d.tile_sensor(entity, label, "mdi:sprout", accent=d.LEAF)


def apply_all(cfg):
    report = []
    report.append(("heatpump stepper",
                   swap(cfg, "climate.living_room", d.heatpump_stepper)))
    report.append(("Fiddle leaf fig green",
                   swap(cfg, "sensor.soil_moisture_sensor_1_humidity",
                        lambda: plant("sensor.soil_moisture_sensor_1_humidity",
                                      "Fiddle leaf fig"))))
    report.append(("Banana Leaf green",
                   swap(cfg, "sensor.moisture_sensor_2_humidity",
                        lambda: plant("sensor.moisture_sensor_2_humidity",
                                      "Banana Leaf"))))
    return report
