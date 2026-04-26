# bpmn-flow

Proof-of-Concept für Live-BPMN-Editing per Voice-Input mit Claude Code. Du diktierst Änderungen am Workflow, Claude editiert `flow.bpmn`, und der Browser rendert das Diagramm innerhalb von ~1,5 s neu — ideal für Screencasts.

## Quickstart

1. Lokalen HTTP-Server im Repo-Verzeichnis starten (`fetch()` aus `file://` ist im Browser blockiert):
   ```
   python3 -m http.server 8000
   ```
2. Browser öffnen: `http://localhost:8000`
3. In einem zweiten Terminal Claude Code im selben Verzeichnis starten und per Voice oder Text Anweisungen geben.

Oben links im Viewer steht der Status: `Geladen — HH:MM:SS` bei Erfolg, sonst die Fehlermeldung.

## Workflow für Screen Recording

- Browser-Fenster links, Claude-Code-Terminal rechts (oder umgekehrt)
- Auto-Reload-Checkbox oben rechts aktiv lassen — der Viewer pollt `flow.bpmn` alle 1,5 s
- Bei Bedarf manuell „Neu laden" oder „Einpassen" klicken

## Dateistruktur

| Datei        | Zweck                                              |
|--------------|----------------------------------------------------|
| `flow.bpmn`  | Single Source of Truth — BPMN 2.0 XML              |
| `index.html` | Viewer mit `bpmn-js` (CDN), Auto-Reload via Polling |
| `CLAUDE.md`  | Projektspezifische Regeln für Claude Code          |

Keine `package.json`, kein Build-Step, keine Node-Dependencies.

## Beispiel-Prompts

- „Füge nach der bestehenden Aufgabe ein exklusives Gateway mit zwei Pfaden ein — einer zum End-Event, einer zu einer neuen Aufgabe ‚Prüfung‘, die danach auch zum End-Event geht."
- „Benenne die Aufgabe in ‚Antrag prüfen‘ um und mach eine User Task draus."
- „Füge zwischen Start und der bestehenden Aufgabe eine Service Task ‚Daten laden‘ ein."
- „Pack die Aufgabe in einen Subprocess ‚Bearbeitung‘."

## Optional für VS Code-User

Im Marketplace nach „bpmn" suchen (z. B. die Extension von `bpmn.io`) — `.bpmn`-Dateien lassen sich dann direkt als Diagramm im Editor öffnen. Auto-Refresh-Verhalten variiert je nach Extension; der HTML-Viewer hier ist die zuverlässige Default-Variante.
