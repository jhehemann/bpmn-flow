# bpmn-flow

Leichtgewichtiges Toolkit, um BPMN-2.0-Diagramme iterativ mit einem AI-Coding-Assistant (Claude Code, Codex CLI, …) zu erstellen und zu pflegen. Du gibst per Voice oder Text Anweisungen, der Assistant editiert `flow.bpmn`, und ein lokaler Browser-Viewer rendert das Ergebnis innerhalb von ~1,5 s neu.

## Konzept

- **Eine Datei, eine Wahrheit**: `flow.bpmn` ist die Single Source of Truth. Alle Edits passieren dort.
- **Live-Preview ohne Build**: Der Viewer (`index.html`) pollt die Datei und rendert sie mit `bpmn-js` aus dem CDN. Keine `package.json`, kein Bundler, keine Node-Dependencies.
- **Assistant-driven Editing**: Statt im BPMN-Editor zu klicken, beschreibst du die gewünschte Änderung in natürlicher Sprache. Der Assistant hält Semantik und Diagramm-Interchange synchron — die Edit-Regeln dafür stehen in `CLAUDE.md`.

## Voraussetzungen

- Python 3 (für den HTTP-Server) oder ein beliebiger anderer statischer Webserver
- Ein moderner Browser
- Ein AI-Coding-Assistant — entwickelt mit [Claude Code](https://docs.claude.com/en/docs/claude-code); andere Harnesses wie [Codex CLI](https://github.com/openai/codex) sollten analog funktionieren (siehe „Andere Assistants als Claude Code")

## Quickstart

1. Lokalen HTTP-Server im Repo-Verzeichnis starten (`fetch()` aus `file://` ist im Browser blockiert):
   ```
   python3 -m http.server 8000
   ```
2. Browser öffnen: `http://localhost:8000`
3. Im selben Verzeichnis den Assistant starten:
   ```
   claude          # Claude Code
   codex           # OpenAI Codex CLI
   ```

Status oben links im Viewer: `Geladen — HH:MM:SS` bei Erfolg, sonst die Parser-Fehlermeldung.

## Iterativer Workflow

```
anweisen → editieren → rendern → prüfen → committen
```

1. Anweisung geben (Voice oder Text) — z. B. „Füge nach ‚Antrag prüfen‘ ein exklusives Gateway mit zwei Pfaden ein."
2. Assistant editiert `flow.bpmn`.
3. Viewer pollt und rendert (~1,5 s).
4. Visuell prüfen, präzisieren oder nächste Änderung anweisen.
5. Sobald ein Zwischenstand sitzt: committen — kleine Schritte machen Reverts und Reviews einfach.

Setup-Tipp: Browser links, Assistant-Terminal rechts. Auto-Reload-Checkbox aktiv.

## Dateistruktur

| Datei        | Zweck                                               |
|--------------|-----------------------------------------------------|
| `flow.bpmn`  | Single Source of Truth — BPMN 2.0 XML               |
| `index.html` | Viewer mit `bpmn-js` (CDN), Auto-Reload via Polling |
| `CLAUDE.md`  | Edit-Regeln und Konventionen für den AI-Assistant   |

Bewusst auf ein Diagramm pro Repo ausgelegt. Für mehrere Workflows: pro Workflow ein eigenes Repo oder einen eigenen Branch.

## Andere Assistants als Claude Code

`CLAUDE.md` enthält die für jedes BPMN-Edit relevanten Regeln: BPMN-Doppelstruktur (Semantik + DI), Layout-Konventionen, ID-Naming, Verifikation, Commit-Workflow. Diese Regeln sind Assistant-agnostisch — nur der Dateiname ist es nicht. Für andere Tools die Datei spiegeln:

- **Codex CLI** → `AGENTS.md`
- **Cursor** → `.cursor/rules/bpmn.mdc`
- **Aider** → `CONVENTIONS.md` (mit `aider --read CONVENTIONS.md` einbinden)

Empfehlung: per Symlink referenzieren statt kopieren, damit es eine einzige Quelle bleibt (`ln -s CLAUDE.md AGENTS.md`).

## Best Practices für das Team

- **Lesbare IDs vergeben** (`Approve_Task` statt `Task_2`) — du kannst im nächsten Prompt gezielt referenzieren.
- **Kleine Iterationen committen.** Jeder klar abgrenzbare Zwischenstand bekommt einen eigenen Commit. Erleichtert Reverts und Reviews im PR.
- **`CLAUDE.md` / `AGENTS.md` aktiv pflegen.** Wenn der Assistant wiederholt eine Konvention verletzt, ergänze die Regel dort — nicht in jedem Prompt neu.
- **Parallele Edits koordinieren.** Wenn parallel ein BPMN-Editor (z. B. VS Code-Plugin) genutzt wird, vor jeder Assistant-Anweisung den eigenen Stand committen — sonst überschreibt der Assistant unbeabsichtigt.
- **`.bpmn` ist Text.** Diffs im PR-Review wie jeden anderen Code lesen — nutzt das aktiv für Reviews komplexer Workflow-Änderungen.

## Troubleshooting

| Symptom                                | Ursache und Fix                                                                          |
|----------------------------------------|------------------------------------------------------------------------------------------|
| Viewer zeigt `Fehler: …`               | Syntax- oder Strukturfehler in `flow.bpmn`. Browser-Konsole für Details öffnen.          |
| Diagramm aktualisiert nicht            | Auto-Reload-Checkbox an? Server läuft noch? Hard-Reload (`Cmd+Shift+R`).                 |
| Element nur halb sichtbar oder verschoben | Wahrscheinlich nur die Semantik aktualisiert, der DI-Block fehlt. Assistant nachfassen.  |

## Optional: VS Code-Integration

Im Marketplace nach „bpmn" suchen (z. B. die Extension von `bpmn.io`) — `.bpmn`-Dateien lassen sich dann direkt als Diagramm im Editor öffnen, parallel zum Browser-Viewer. Gut für visuelle Inspektion; Edits darüber vor der nächsten Assistant-Anweisung committen (siehe „Best Practices").
