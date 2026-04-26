# bpmn-flow

Toolkit, um BPMN-2.0-Diagramme iterativ mit einem AI-Coding-Assistant (Claude Code, Codex CLI, …) zu erstellen und zu pflegen. Du gibst per Voice oder Text Anweisungen, der Assistant editiert die Semantik in `flows/*.bpmn`, ein Layout-Skript ergänzt das Diagramm-Interchange, ein leichtgewichtiger Browser-Viewer rendert das Ergebnis live (Polling alle ~1,5 s).

## Konzept

- **Semantik vs. Layout getrennt**: Der Assistant editiert ausschließlich die semantischen Teile der BPMN-Datei. Das Layout (Koordinaten, Waypoints, Bounds) wird per `npm run layout` automatisch generiert. So muss der Assistant keine Koordinaten ausrechnen, und PR-Diffs zeigen primär semantische Änderungen.
- **Browser-Viewer als Live-Preview**: `index.html` rendert das aktuell ausgewählte Diagramm und pollt alle ~1,5 s auf Änderungen. Funktioniert editor-agnostisch und reloaded zuverlässig.
- **VS Code Extension als optionales Zusatz-Tool** für visuelles Modellieren — mit Vorsicht zu nutzen (siehe „Parallele Edits" unten).
- **Validierung**: `bpmnlint` prüft Konventionen (Default-Flow, IDs, Verbindungen) vor dem Commit oder im CI.

## Voraussetzungen

- [Node.js](https://nodejs.org/en/download) ≥ 18 (oder via [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Python 3 (für den HTTP-Server) oder ein beliebiger anderer statischer Webserver
- Ein moderner Browser
- Ein AI-Coding-Assistant — entwickelt mit [Claude Code](https://docs.claude.com/en/docs/claude-code); andere Harnesses wie [Codex CLI](https://github.com/openai/codex) sollten analog funktionieren.
- **Optional**: VS Code/Cursor mit der Extension [`bpmn-io.vs-code-bpmn-io`](https://marketplace.visualstudio.com/items?itemName=bpmn-io.vs-code-bpmn-io) für visuelles Modellieren. Beim ersten Öffnen des Repos schlägt VS Code die Installation automatisch vor.

## Setup

```
npm install
```

## Live-Preview starten

In einem separaten Terminal:

```
python3 -m http.server 8000
```

Browser öffnen: `http://localhost:8000`. Der Viewer entdeckt alle `flows/*.bpmn` automatisch (Dropdown oben rechts) und pollt alle ~1,5 s auf Änderungen.

## Iterativer Workflow

```
anweisen → Semantik editieren → npm run layout → npm run validate → committen
```

1. Anweisung an den Assistant geben (Voice oder Text), z. B. „Füge nach ‚Antrag prüfen' ein exklusives Gateway mit zwei Pfaden ein."
2. Assistant editiert die Semantik in `flows/<datei>.bpmn`.
3. `npm run layout` ergänzt/aktualisiert das Diagramm-Interchange. Der Browser-Viewer rendert innerhalb von ~1,5 s neu.
4. `npm run validate` prüft semantische Korrektheit.
5. Visuell prüfen, präzisieren oder nächste Änderung anweisen.
6. Sobald ein Zwischenstand sitzt: committen.

Schritte 3 und 4 erledigt der Assistant idealerweise selbst (siehe `CLAUDE.md`).

## NPM-Scripts

| Script              | Zweck                                                                |
|---------------------|----------------------------------------------------------------------|
| `npm run layout`    | Auto-Layout für alle `flows/*.bpmn`. Optional: `npm run layout -- flows/foo.bpmn` für gezielten Aufruf. |
| `npm run validate`  | `bpmnlint` über alle `flows/*.bpmn`. Konfiguration in `.bpmnlintrc`. |

## Dateistruktur

| Pfad                       | Zweck                                                  |
|----------------------------|--------------------------------------------------------|
| `flows/*.bpmn`             | BPMN-2.0-Diagramme — eines pro Workflow                |
| `index.html`               | Browser-Viewer mit Multi-File-Picker und Auto-Reload   |
| `scripts/layout.mjs`       | Auto-Layout-Wrapper (`bpmn-auto-layout`)               |
| `.bpmnlintrc`              | Lint-Regeln                                            |
| `.vscode/extensions.json`  | Empfehlung der bpmn-io Modeler-Extension (optional)    |
| `.vscode/settings.json`    | Workspace-Settings (Auto-Save, falls Extension genutzt)|
| `CLAUDE.md`                | Edit-Regeln und Konventionen für den AI-Assistant      |
| `package.json`             | Tooling-Dependencies (nicht laufzeitrelevant)          |

## Andere Assistants als Claude Code

`CLAUDE.md` enthält die Regeln, die der Assistant beim Editieren befolgen muss. Diese Regeln sind Assistant-agnostisch — nur der Dateiname unterscheidet sich:

- **Codex CLI** → `AGENTS.md`
- **Cursor** → `.cursor/rules/bpmn.mdc`
- **Aider** → `CONVENTIONS.md` (mit `aider --read CONVENTIONS.md` einbinden)

Empfehlung: per Symlink referenzieren statt kopieren (`ln -s CLAUDE.md AGENTS.md`).

## Best Practices für das Team

- **Lesbare IDs vergeben** (`Approve_Task` statt `Task_2`). Erleichtert das gezielte Referenzieren in Prompts.
- **Pro Workflow eine eigene Datei** in `flows/`. Subprocesses bleiben wo möglich inline; eigenständige End-to-End-Flows kriegen ein eigenes File.
- **Kleine Commits.** Jeder klar abgrenzbare Zwischenstand bekommt einen eigenen Commit. Erleichtert Reverts und Reviews.
- **`CLAUDE.md` aktiv pflegen.** Wenn der Assistant wiederholt eine Konvention verletzt, ergänze die Regel dort, nicht im Prompt.
- **`.bpmn` ist Text.** Diffs im PR-Review wie jeden anderen Code lesen. Layout-Diffs sind durch `bpmn-auto-layout` deterministisch und meist klein.

## Parallele Edits — VS Code BPMN Extension mit Vorsicht

Die optionale VS-Code-Extension `bpmn-io.vs-code-bpmn-io` ist ein vollwertiger Modeler — du kannst Elemente per Drag-and-Drop verschieben, Labels per Doppelklick ändern. **Aber: ihr WebView-Reload ist unzuverlässig**, was zu *silent data loss* führen kann, wenn Assistant und User parallel arbeiten:

1. Assistant editiert `flows/foo.bpmn` (Disk wird neu).
2. Editor-WebView reloaded NICHT zuverlässig — auch nicht beim Tab-Wechsel oder via „Revert File". Nur „Developer: Reload Window" funktioniert.
3. Du editierst visuell etwas im Editor (während WebView noch alten Stand zeigt).
4. Auto-Save persistiert den **gesamten alten WebView-State** auf Disk → die Edits des Assistants werden kommentarlos überschrieben.

→ Die einzige sichere Regel: **Wenn du die Extension neben dem Assistant nutzt, nach jedem Assistant-Edit „Cmd+Shift+P → Developer: Reload Window" ausführen**, bevor du visuell editierst.

→ Pragmatischer: **Browser-Viewer für die iterative AI-driven Arbeit nutzen** (immer aktuell durch Polling). Die VS-Code-Extension nur für dedizierte Modellierungs-Sessions öffnen, in denen der Assistant nicht gleichzeitig arbeitet.

## Troubleshooting

| Symptom                                  | Ursache und Fix                                                                              |
|------------------------------------------|----------------------------------------------------------------------------------------------|
| Viewer zeigt `Fehler: …`                 | Syntax- oder Strukturfehler in `flows/*.bpmn`. Browser-Konsole öffnen für Details.           |
| Diagramm aktualisiert nicht im Browser   | Auto-Reload-Checkbox an? Server läuft? Hard-Reload (`Cmd+Shift+R`).                          |
| `npm run validate` schlägt fehl          | Lint-Regel verletzt (z. B. unverbundenes Element). Fehlermeldung benennt Element + Regel.   |
| Edge-Labels überlappen mit Linien        | Bekannte Schwäche von `bpmn-auto-layout`. Workaround: kürzere Labels oder akzeptieren.       |
| VS-Code-Extension zeigt veralteten Stand | Reload-Bug der Extension — Cmd+Shift+P → „Developer: Reload Window" (siehe „Parallele Edits"). |
