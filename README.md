# bpmn-flow

Toolkit, um BPMN-2.0-Diagramme iterativ mit einem AI-Coding-Assistant (Claude Code, Codex CLI, …) zu erstellen und zu pflegen. Du gibst per Voice oder Text Anweisungen, der Assistant editiert die Semantik in `flows/*.bpmn`, ein Layout-Skript ergänzt das Diagramm-Interchange, und VS Code rendert das Ergebnis live im Editor.

## Konzept

- **Semantik vs. Layout getrennt**: Der Assistant editiert ausschließlich die semantischen Teile der BPMN-Datei. Das Layout (Koordinaten, Waypoints, Bounds) wird per `npm run layout` automatisch generiert. So muss der Assistant keine Koordinaten ausrechnen, und PR-Diffs zeigen primär semantische Änderungen.
- **Visualisierung im Editor**: VS Code mit der bpmn.io-Extension rendert `.bpmn`-Dateien direkt — kein Browser, kein Polling, kein zweites Fenster.
- **Validierung**: `bpmnlint` prüft Konventionen (Default-Flow, IDs, Verbindungen) vor dem Commit oder im CI.

## Voraussetzungen

- Node.js ≥ 18 (für Tooling — Layout, Lint). Installation: [nodejs.org/en/download](https://nodejs.org/en/download) oder via Versionsmanager wie [nvm](https://github.com/nvm-sh/nvm#installing-and-updating).
- VS Code oder Cursor mit der Extension [`bpmn-io.vs-code-bpmn-io`](https://marketplace.visualstudio.com/items?itemName=bpmn-io.vs-code-bpmn-io). Beim ersten Öffnen des Repos schlägt VS Code die Installation automatisch vor (siehe `.vscode/extensions.json`).
- Ein AI-Coding-Assistant — entwickelt mit [Claude Code](https://docs.claude.com/en/docs/claude-code); andere Harnesses wie [Codex CLI](https://github.com/openai/codex) sollten analog funktionieren.

## Setup

```
npm install
```

Danach: eine `.bpmn`-Datei in `flows/` öffnen — VS Code zeigt den BPMN-Editor.

## Iterativer Workflow

```
anweisen → Semantik editieren → npm run layout → npm run validate → committen
```

1. Anweisung an den Assistant geben (Voice oder Text), z. B. „Füge nach ‚Antrag prüfen' ein exklusives Gateway mit zwei Pfaden ein."
2. Assistant editiert die Semantik in `flows/<datei>.bpmn`.
3. `npm run layout` ergänzt/aktualisiert das Diagramm-Interchange. Beim nächsten Wechsel in den BPMN-Tab lädt der Editor das aktualisierte Diagramm automatisch — **wenn dein Buffer clean ist**. Bei dirty Buffer (du hast visuell editiert ohne zu speichern) erscheint stattdessen der Dialog „Diagram changed externally, do you want to reload it?" → in dem Fall „Reload" klicken (siehe Best Practices unten).
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
| `scripts/layout.mjs`       | Auto-Layout-Wrapper (`bpmn-auto-layout`)               |
| `.bpmnlintrc`              | Lint-Regeln                                            |
| `.vscode/extensions.json`  | Extension-Empfehlung für VS Code/Cursor                |
| `.vscode/settings.json`    | Workspace-Settings (Auto-Save für Konflikt-Vermeidung) |
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
- **Parallele Edits — wie der Schutz funktioniert**:
  1. `files.autoSave: onFocusChange` (`.vscode/settings.json`): sobald du vom BPMN-Editor ins Terminal wechselst, persistiert VS Code deinen Buffer auf Disk. Claude liest dann den aktuellen Stand statt einer Stale-Version.
  2. **Bei clean Buffer** lädt der Editor Claudes externe Änderungen beim nächsten Tab-Aktivieren **automatisch und still** nach (Standard-VS-Code-Verhalten).
  3. **Bei dirty Buffer** (du hast visuell editiert, Auto-Save hat noch nicht gegriffen) zeigt der Editor stattdessen den Dialog „Diagram changed externally, do you want to reload it?" → in dem Fall **„Reload" klicken**, sonst überschreibt dein nächster Save Claudes Änderungen kommentarlos.
- **`.bpmn` ist Text.** Diffs im PR-Review wie jeden anderen Code lesen. Layout-Diffs sind durch `bpmn-auto-layout` deterministisch und meist klein.

## Troubleshooting

| Symptom                                  | Ursache und Fix                                                                              |
|------------------------------------------|----------------------------------------------------------------------------------------------|
| VS Code zeigt rohes XML statt Diagramm   | Extension `bpmn-io.vs-code-bpmn-io` nicht installiert. VS Code schlägt sie via Workspace-Recommendations vor. |
| `npm run validate` schlägt fehl          | Lint-Regel verletzt (z. B. Gateway ohne Default-Flow). Fehlermeldung benennt das Element.    |
| Diagramm sieht im Editor „kaputt" aus    | Wahrscheinlich Layout veraltet — `npm run layout` ausführen, dann kurz in einen anderen Tab und zurück.                       |
| Claudes Änderung kommt im Editor nicht an | Tab-Wechsel weg und zurück triggert den Reload. Falls trotzdem alter Stand zu sehen ist (dirty Buffer): Cmd+Shift+P → „Revert File". |
| Edge-Labels überlappen mit Linien        | Bekannte Schwäche von `bpmn-auto-layout`. Workaround: kürzere Labels oder das Element im Editor manuell verschieben (Layout-Skript überschreibt das beim nächsten Lauf wieder). |
| Layout sieht nach `npm run layout` schlechter aus als vorher | `bpmn-auto-layout` legt Knoten in der Reihenfolge ab, in der sie im XML stehen. Reihenfolge der Elemente in `<bpmn:process>` umsortieren. |
