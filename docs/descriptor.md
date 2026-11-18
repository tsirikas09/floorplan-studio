# Μορφή περιγραφέα

Αποθηκεύεται στο `.storage/floorplan_studio.descriptor`. Συντεταγμένες σε μονάδες του σχεδίου κάτοψης (όχι εικονοστοιχεία οθόνης).

```json
{
  "version": 1,
  "house": {"name": "Σπίτι"},
  "floors": [{
    "id": "g", "name": "Ισόγειο", "caption": "GROUND FLOOR",
    "plan": {
      "view": [x, y, πλάτος, ύψος],        // το τμήμα του σχεδίου που εμφανίζεται
      "walls": [ [[x,y], ...] ],            // πολύγωνα τοίχων
      "rooms": [{"id": "bedroom", "name": "Υπνοδωμάτιο", "polygon": [[x,y], ...],
                 "popup": "g_bedroom", "label": [x,y], "style": "outdoor"}],
      "dividers": [[x1,y1,x2,y2]],
      "shapes": [{"t":"rect","x":0,"y":0,"w":10,"h":10,"r":4},
                 {"t":"ellipse","cx":0,"cy":0,"rx":5,"ry":3},
                 {"t":"circle","cx":0,"cy":0,"r":4},
                 {"t":"line","x1":0,"y1":0,"x2":9,"y2":0},
                 {"t":"arc","x1":0,"y1":0,"x2":9,"y2":9,"r":9}]
    },
    "devices": [{
      "id": "bds1", "kind": "socket", "name": "Πρίζα 1", "room": "bedroom", "pos": [138, 92],
      "entity": "switch.bd_socket_1", "power": "sensor.bd_socket_1_power"
    }],
    "readouts": {"power": "sensor.…", "water": "sensor.…", "presence": "binary_sensor.…",
                 "illuminance": "sensor.…", "temperature": "sensor.…", "humidity": "sensor.…",
                 "power_popup": "g_energy", "water_popup": "g_water"}
  }]
}
```

**Τύποι συσκευών (`kind`):** `ceiling`, `lamp`, `strip`, `spot`, `socket`, `washer`, `valve`, `boiler`, `tv`, `ac`, `camera`, `bell`, `person`.

**Προαιρετικά πεδία συσκευής:** `power` (αισθητήρας ισχύος: κεραυνάκι και watt), `color`, `tap` (`more-info`), `popup` (hash που ανοίγει το tap), `popup_room`, `nobolt`, `hot` (αισθητήρας θερμοκρασίας κάτω από το εικονίδιο), `flow` (αισθητήρας ροής δίπλα στο εικονίδιο), `status` (για το πλυντήριο, αισθητήρας με καταστάσεις `washing`/`finished`/`idle`).
