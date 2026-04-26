# CLAUDE.md — bpmn-flow

## Projektkontext

Iteratives BPMN-Editing per Voice-/Text-Input. Ein Browser-Viewer rendert `flow.bpmn` automatisch alle ~1,5 s neu.

- **`flow.bpmn`** — Single Source of Truth. Hier liegen alle Edits.
- **`index.html`** — Viewer mit `bpmn-js` aus dem CDN. **NICHT anfassen**, außer der User bittet explizit darum.
- Kein Build, keine `package.json`, kein npm. Setup ist bewusst dependency-frei.

## BPMN 2.0 — die zwei Hälften

Jedes BPMN-Element existiert **zweimal** in der Datei und beide Teile müssen synchron bleiben, sonst rendert der Viewer falsch oder gar nicht:

1. **Semantik** unter `<bpmn:process>` — was das Element ist und wie es verbunden ist
2. **Diagramm-Interchange (DI)** unter `<bpmndi:BPMNDiagram>` → `<bpmndi:BPMNPlane>` — wo das Element auf der Zeichenfläche liegt

Die IDs müssen zwischen Semantik und DI **exakt** übereinstimmen (DI verweist via `bpmnElement="..."`).

Bei jedem neuen Element/Flow alle Stellen updaten:
- **Knoten**: `<bpmn:...>` in `<bpmn:process>` **und** `<bpmndi:BPMNShape>` mit `<dc:Bounds>` in DI
- **Sequence Flow**: `<bpmn:sequenceFlow>` in Process **und** `<bpmndi:BPMNEdge>` mit `<di:waypoint>` in DI **und** `<bpmn:incoming>`/`<bpmn:outgoing>` an Quelle/Ziel ergänzen

Die bestehende `flow.bpmn` ist die beste Referenz für die exakte Struktur.

## Layout-Konventionen

Horizontaler Flow, links nach rechts, Mittelachse `y=120`:

| Element-Typ      | Größe   | Resultierendes `y` (oben) |
|------------------|---------|---------------------------|
| Event (start/end) | 36×36  | `y=102`                   |
| Task / userTask / serviceTask | 100×80 | `y=80`        |
| Gateway (alle)   | 50×50   | `y=95`                    |

Spacing: ~160 px zwischen Element-Mittelpunkten. Edge-Waypoints liegen auf `y=120`.

## ID-Konvention

Lesbare Namen statt Nummern: `Approve_Task` statt `Task_2`, `Decision_Gateway` statt `Gateway_1`. Erleichtert iterative Edits, weil der User per Voice gezielt referenzieren kann.

## Was NICHT tun

- **Keine Build-Tools** (npm, package.json, Vite, Webpack) einführen — bricht das dependency-freie Setup
- **`index.html` nicht anfassen**, außer der User bittet explizit darum
- Keine zusätzlichen Dateien anlegen (z. B. zweites BPMN-File), außer der User fragt danach

## Commit-Workflow

Der User editiert `flow.bpmn` parallel über das BPMN-Plugin in VS Code. Damit Edits nicht kollidieren:

1. **Vor jeder Änderung** `git status` prüfen.
   - Clean → loslegen.
   - Dirty → `git diff HEAD -- flow.bpmn` prüfen:
     - **Normalfall** (Additionen, Layout-Tweaks, kleine Korrekturen): still als `chore: VSCode plugin edits` committen und weiterarbeiten. **Nicht nachfragen.**
     - **Ausnahme**: Der Diff macht **klar erkennbar einen substantiellen Teil meines letzten Commits rückgängig** (komplettes neues Element/Flow fehlt, größerer Bereich auf alten Stand zurück). Wahrscheinlich war der Editor stale. → **Stop, beim User nachfragen.**
2. **Nach jeder Änderung** sofort committen mit aussagekräftiger Message. Hält den Working Tree zwischen Anweisungen clean.

## Verifikation nach jedem Edit

1. XML valide — alle Tags geschlossen, IDs eindeutig
2. Jedes neue/verschobene Element existiert in **beiden** Hälften (Semantik + DI) mit identischer ID
3. Jeder Sequence Flow als `<bpmn:sequenceFlow>` **und** `<bpmndi:BPMNEdge>`, plus passende `<bpmn:incoming>`/`<bpmn:outgoing>` an Quelle/Ziel
4. Bei Unsicherheit: Status oben links im Viewer — `Geladen — HH:MM:SS` heißt OK, `Fehler: ...` zeigt Parse-Probleme
