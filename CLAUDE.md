# CLAUDE.md — bpmn-flow

## Projektkontext

Iteratives BPMN-Editing per Voice-/Text-Input. Visualisierung läuft in VS Code via Extension `bpmn-io.vs-code-bpmn-io`. Auto-Layout via `npm run layout`, Validierung via `npm run validate`.

- **`flows/*.bpmn`** — eine Datei pro Workflow. Du editierst die Semantik dort.
- **Kein Browser-Viewer**, kein Polling. Render passiert im Editor.
- Tooling-Dependencies in `package.json` (`bpmn-auto-layout`, `bpmnlint`).

## Edit-Regel (zentral)

**Editiere nur die Semantik unter `<bpmn:process>`. Lass DI-Blöcke (`<bpmndi:...>`) so wie sie sind oder lösche sie.** Layout wird per `npm run layout` deterministisch (re-)generiert. Du musst keine Koordinaten ausrechnen.

Bei jedem Edit:
- Knoten als `<bpmn:...>` in `<bpmn:process>` anlegen, mit lesbarer ID (`Approve_Task` statt `Task_2`).
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
- **Keine zusätzlichen Top-Level-Verzeichnisse** anlegen, außer der User fragt danach. Diagramme gehören nach `flows/`, Skripte nach `scripts/`.

## Commit-Workflow

Der User editiert `flows/*.bpmn` parallel im VS-Code-BPMN-Modeler. Der Workspace hat `files.autoSave: onFocusChange` aktiviert (`.vscode/settings.json`) — sobald der User den Editor-Fokus verlässt (z.B. ins Terminal wechselt), persistiert VS Code den Buffer auf Disk. Damit ist der Disk-Stand fast immer aktuell, wenn du dran arbeitest.

Wichtig zum Editor-Verhalten: Der bpmn-io-Editor erkennt deine externen Änderungen *nur* beim Wechsel in den BPMN-Tab und zeigt dann einen „Diagram changed externally"-Dialog. Falls der User den Dialog ignoriert und visuell weiter editiert, überschreibt der nächste Save deine Änderungen kommentarlos. Wenn du nach einem Edit also den Verdacht hast, dass dein Commit gleich überschrieben wird, weise den User aktiv darauf hin, beim nächsten Tab-Wechsel „Reload" zu klicken.

Trotzdem:

1. **Vor jeder Änderung** `git status` prüfen.
   - Clean → loslegen.
   - Dirty → `git diff HEAD -- flows/` prüfen:
     - **Normalfall** (Additionen, kleine Korrekturen, Auto-Layout-Drift): still als `chore: editor edits` committen und weiterarbeiten. **Nicht nachfragen.**
     - **Ausnahme**: Der Diff macht **klar erkennbar einen substantiellen Teil meines letzten Commits rückgängig** (komplettes neues Element/Flow fehlt). Wahrscheinlich war Auto-Save aus oder der Buffer ungespeichert. → **Stop, beim User nachfragen.**
2. **Nach jeder Änderung** sofort committen mit aussagekräftiger Message. Hält den Working Tree zwischen Anweisungen clean.

## Verifikation nach jedem Edit

1. `npm run validate` ist grün
2. Jeder Sequence Flow als `<bpmn:sequenceFlow>` plus `<bpmn:incoming>`/`<bpmn:outgoing>` an Quelle/Ziel
3. IDs eindeutig und sprechend
4. Bei Unsicherheit: User bitten, das Diagramm in VS Code zu prüfen
