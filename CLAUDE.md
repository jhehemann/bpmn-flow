# CLAUDE.md — bpmn-flow

## Projektkontext

Iteratives BPMN-Editing per Voice-/Text-Input. Live-Preview erfolgt primär im **Browser-Viewer** (`index.html` mit Polling alle ~1,5 s). Auto-Layout via `npm run layout`, Validierung via `npm run validate`.

- **`flows/*.bpmn`** — eine Datei pro Workflow. Du editierst die Semantik dort.
- VS Code öffnet `.bpmn` per Default als Text. Der User kann optional via „Open With → BPMN Editor" visuell editieren.
- Tooling-Dependencies in `package.json` (`bpmn-auto-layout`, `bpmnlint`).

## Edit-Regel (zentral)

**Editiere nur die Semantik unter `<bpmn:process>`. Lass DI-Blöcke (`<bpmndi:...>`) so wie sie sind oder lösche sie.** Layout wird per `npm run layout` deterministisch (re-)generiert. Du musst keine Koordinaten ausrechnen.

Bei jedem Edit:
- Knoten als `<bpmn:...>` in `<bpmn:process>` anlegen, mit lesbarer ID (`Approve_Task` statt `Task_2`).
- **Jeder Knoten braucht ein `name`-Attribut** — auch Start- und End-Events (z. B. `name="Start"`, `name="Done"`). `bpmnlint` schlägt sonst mit `label-required` fehl.
- Sequence Flow als `<bpmn:sequenceFlow>` plus passende `<bpmn:incoming>`/`<bpmn:outgoing>` an Quelle/Ziel.
- Danach: `npm run layout` (regeneriert DI), dann `npm run validate` (lintet).

Die bestehende Datei in `flows/` ist die beste Referenz für die Struktur.

## Workflow nach jedem Edit

```
edit → npm run layout → npm run validate → committen
```

1. `npm run layout` — schreibt aktuelle Layouts in `flows/*.bpmn`. Optional gezielt: `npm run layout -- flows/foo.bpmn`.
2. `npm run validate` — `bpmnlint`. Fehler beheben, bevor du committest.
3. Commit mit aussagekräftiger Message.

## Multi-File

- Pro eigenständigem End-to-End-Workflow eine eigene Datei in `flows/`.
- Subprocesses bleiben standardmäßig inline (`<bpmn:subProcess>`) — separate Datei nur, wenn ein Subprocess wiederverwendbar wird.
- Datei-Naming: `kebab-case.bpmn`, sprechend (`order-approval.bpmn`, nicht `flow1.bpmn`).

## ID-Konvention

Lesbare Namen statt Nummern: `Approve_Task` statt `Task_2`, `Decision_Gateway` statt `Gateway_1`. Erleichtert iterative Edits, weil der User per Voice gezielt referenzieren kann.

## Was NICHT tun

- **Keine Koordinaten manuell setzen.** DI ist generiert; manuelle Edits werden beim nächsten `npm run layout` überschrieben.
- **Keine zusätzlichen Build-Tools** (Vite, Webpack, Bundler) einführen — Tooling beschränkt sich auf `bpmn-auto-layout` + `bpmnlint`.
- **Keine zusätzlichen Top-Level-Verzeichnisse** anlegen, außer der User fragt danach. Diagramme gehören nach `flows/`, Skripte nach `scripts/`, der Viewer nach `index.html`.

## Commit-Workflow

Der User editiert `flows/*.bpmn` ggf. als Text oder visuell (via „Open With → BPMN Editor"). Konvention: visuelles Editieren und Assistant-Edits sind sequenziell, nicht parallel — der User schließt den BPMN-Editor-Tab, bevor er dich beauftragt.

1. **Vor jeder Änderung** `git status` prüfen.
   - Clean → loslegen.
   - Dirty → `git diff HEAD -- flows/` prüfen:
     - **Normalfall** (Additionen, kleine Korrekturen, Auto-Layout-Drift): still als `chore: editor edits` committen und weiterarbeiten. **Nicht nachfragen.**
     - **Ausnahme**: Der Diff macht klar erkennbar einen substantiellen Teil meines letzten Commits rückgängig. Wahrscheinlich hat ein offener BPMN-Editor-Tab seinen Stale-WebView-State auf Disk geschrieben. → **Stop, beim User nachfragen** und ihn bitten, den Tab zu schließen.
2. **Nach jeder Änderung** sofort committen mit aussagekräftiger Message. Hält den Working Tree zwischen Anweisungen clean.

## Verifikation nach jedem Edit

1. `npm run validate` ist grün
2. Jeder Sequence Flow als `<bpmn:sequenceFlow>` plus `<bpmn:incoming>`/`<bpmn:outgoing>` an Quelle/Ziel
3. IDs eindeutig und sprechend
4. Bei Unsicherheit: User bitten, das Diagramm im Browser-Viewer zu prüfen
