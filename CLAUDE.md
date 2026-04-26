# CLAUDE.md — bpmn-flow

## Projektkontext

Live-BPMN-Editing-PoC. Der User diktiert per Voice-Input Änderungen am Workflow, ein Browser-Viewer rendert `flow.bpmn` automatisch alle ~1,5 s neu.

- **`flow.bpmn`** — Single Source of Truth. Hier liegen alle Edits.
- **`index.html`** — Viewer mit `bpmn-js` aus dem CDN. **NICHT anfassen**, außer der User bittet explizit darum.
- Kein Build, keine `package.json`, kein npm. Setup ist bewusst dependency-frei.

## BPMN 2.0 — die zwei Hälften

Jedes BPMN-Element existiert **zweimal** in der Datei und beide Teile müssen synchron bleiben, sonst rendert der Viewer falsch oder gar nicht:

1. **Semantik** unter `<bpmn:process>` — was das Element ist und wie es verbunden ist
2. **Diagramm-Interchange (DI)** unter `<bpmndi:BPMNDiagram>` → `<bpmndi:BPMNPlane>` — wo das Element auf der Zeichenfläche liegt

Die IDs müssen zwischen Semantik und DI **exakt** übereinstimmen (DI verweist via `bpmnElement="..."`).

## Element-Checkliste beim Hinzufügen / Ändern

Beim Einfügen eines neuen Elements immer **beide** Blöcke updaten:

**Knoten — Semantik:**
```xml
<bpmn:task id="Approve_Task" name="Antrag prüfen">
  <bpmn:incoming>Flow_in</bpmn:incoming>
  <bpmn:outgoing>Flow_out</bpmn:outgoing>
</bpmn:task>
```

**Knoten — DI:**
```xml
<bpmndi:BPMNShape id="Approve_Task_di" bpmnElement="Approve_Task">
  <dc:Bounds x="..." y="..." width="..." height="..." />
</bpmndi:BPMNShape>
```

**Sequence Flow — Semantik:**
```xml
<bpmn:sequenceFlow id="Flow_x" sourceRef="..." targetRef="..." />
```
Zusätzlich an Quelle/Ziel als `<bpmn:outgoing>` / `<bpmn:incoming>` eintragen.

**Sequence Flow — DI:**
```xml
<bpmndi:BPMNEdge id="Flow_x_di" bpmnElement="Flow_x">
  <di:waypoint x="..." y="..." />
  <di:waypoint x="..." y="..." />
</bpmndi:BPMNEdge>
```

## Layout-Konventionen

Horizontaler Flow, links nach rechts, Mittelachse `y=120`:

| Element-Typ      | Größe   | Resultierendes `y` (oben) |
|------------------|---------|---------------------------|
| Event (start/end) | 36×36  | `y=102`                   |
| Task / userTask / serviceTask | 100×80 | `y=80`        |
| Gateway (alle)   | 50×50   | `y=95`                    |

Spacing: ~160 px zwischen Element-Mittelpunkten. Edge-Waypoints liegen auf `y=120`.

Beispiel aus `flow.bpmn`: Start bei `x=172`, Task bei `x=260`, End bei `x=412` — also Abstände von 88 px zwischen Event-Rand und Task-Rand bzw. 52 px zwischen Task-Rand und Event-Rand. Halte dich an diese Optik, wenn du Knoten einfügst.

## ID-Konvention

Lesbare Namen statt Nummern: `Approve_Task` statt `Task_2`, `Decision_Gateway` statt `Gateway_1`. Erleichtert iterative Edits, weil der User per Voice gezielt referenzieren kann.

## Gängige Element-Typen

- **Events**: `bpmn:startEvent`, `bpmn:endEvent` (auch `intermediateThrowEvent`, `intermediateCatchEvent`)
- **Tasks**: `bpmn:task`, `bpmn:userTask`, `bpmn:serviceTask`, `bpmn:scriptTask`, `bpmn:manualTask`
- **Gateways**: `bpmn:exclusiveGateway`, `bpmn:parallelGateway`, `bpmn:inclusiveGateway`
- **Container**: `bpmn:subProcess`

## Was NICHT tun

- **Keine Build-Tools** (npm, package.json, Vite, Webpack) einführen — bricht das dependency-freie Setup
- **`index.html` nicht anfassen**, außer der User bittet explizit darum
- Keine zusätzlichen Dateien anlegen (z. B. zweites BPMN-File), außer der User fragt danach

## Commit-Workflow

Der User editiert `flow.bpmn` parallel über das BPMN-Plugin in VS Code. Damit Edits nicht kollidieren und kein Commit den letzten still überschreibt:

1. **Vor jeder Änderung**: `git status` prüfen.
   - Working Tree clean → direkt loslegen.
   - Dirty → `git diff HEAD -- flow.bpmn` ansehen und nach Befund handeln:
     - **Normalfall** (Additionen, Layout-Tweaks, kleine Korrekturen — keine offensichtlichen Reverts): still als `chore: VSCode plugin edits` committen und weiterarbeiten. **Nicht nachfragen** — das ist der Standardfall.
     - **Ausnahme** (selten): Der Diff macht **klar erkennbar einen substantiellen Teil meines letzten Commits rückgängig** — z. B. ein neu hinzugefügtes Element/Sequence-Flow fehlt komplett, oder ein größerer Bereich ist auf einen Stand vor meinem letzten Commit zurückgesetzt. Wahrscheinlich war der Editor des Users beim Editieren stale. → **Stop, beim User nachfragen**: Working Tree verwerfen / Edit auf meinen letzten Commit „rebasen" / Stand des Users beibehalten.
2. **Nach jeder Änderung**: die eigenen Edits sofort committen mit aussagekräftiger Message. So bleibt der Working Tree zwischen Anweisungen clean und das `Read → Edit → Write`-Problem nach externen Modifikationen entfällt.

## Verifikation nach jedem Edit

1. XML muss valides BPMN 2.0 bleiben — alle geöffneten Tags geschlossen, IDs eindeutig
2. Jedes neue oder verschobene Element existiert in **beiden** Hälften (Semantik + DI) mit identischer ID
3. Jeder Sequence Flow ist sowohl als `<bpmn:sequenceFlow>` als auch als `<bpmndi:BPMNEdge>` vorhanden, und Quelle/Ziel haben passende `<bpmn:incoming>` / `<bpmn:outgoing>`-Einträge
4. Bei Unsicherheit den User auf den Status oben links im Browser hinweisen — `Geladen — HH:MM:SS` heißt OK, `Fehler: ...` zeigt Parse-Probleme
