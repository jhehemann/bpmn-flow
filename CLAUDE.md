# CLAUDE.md — bpmn-flow

## Project context

Iterative BPMN editing via voice/text input. Live preview happens primarily in the **browser viewer** (`index.html` polling every ~1.5 s). Auto-layout via `npm run layout`, validation via `npm run validate`.

- **`flows/*.bpmn`** — one file per workflow. You edit the semantics there.
- VS Code opens `.bpmn` as text by default. The user can optionally edit visually via "Open With → BPMN Editor".
- Tooling dependencies in `package.json` (`bpmn-auto-layout`, `bpmnlint`).

## Edit rule (central)

**Only edit the semantics under `<bpmn:process>`. Leave `<bpmndi:...>` blocks alone or delete them.** The layout is regenerated deterministically via `npm run layout`. You don't need to compute coordinates.

For every edit:
- Add nodes as `<bpmn:...>` inside `<bpmn:process>` with a readable ID (`Approve_Task`, not `Task_2`).
- **Every node needs a `name` attribute** — including start and end events (e.g. `name="Start"`, `name="Done"`). Otherwise `bpmnlint` fails with `label-required`.
- Sequence flows as `<bpmn:sequenceFlow>` plus matching `<bpmn:incoming>`/`<bpmn:outgoing>` on source/target.
- Then: `npm run layout` (regenerates DI), then `npm run validate` (lints).

The existing files in `flows/` are the best reference for structure.

## Workflow after every edit

```
edit → npm run layout → npm run validate → commit
```

1. `npm run layout` — writes current layouts into `flows/*.bpmn`. Optionally targeted: `npm run layout -- flows/foo.bpmn`.
2. `npm run validate` — `bpmnlint`. Fix errors before committing.
3. Commit with a meaningful message.

## Multi-file

- One file per standalone end-to-end workflow in `flows/`.
- Subprocesses stay inline (`<bpmn:subProcess>`) by default — only split into a separate file when a subprocess becomes reusable.
- File naming: `kebab-case.bpmn`, descriptive (`order-approval.bpmn`, not `flow1.bpmn`).

## ID convention

Readable names instead of numbers: `Approve_Task` not `Task_2`, `Decision_Gateway` not `Gateway_1`. Makes iterative edits easier because the user can reference elements precisely by voice.

## What NOT to do

- **Don't set coordinates manually.** DI is generated; manual edits are overwritten on the next `npm run layout`.
- **Don't introduce additional build tooling** (Vite, Webpack, bundlers) — tooling stays limited to `bpmn-auto-layout` + `bpmnlint`.
- **Don't create additional top-level directories** unless the user asks. Diagrams belong in `flows/`, scripts in `scripts/`, the viewer is `index.html`.

## Commit workflow

The user may edit `flows/*.bpmn` as text or visually (via "Open With → BPMN Editor"). Convention: visual editing and assistant edits are sequential, not parallel — the user closes the BPMN editor tab before instructing you.

1. **Before every change**, run `git status`.
   - Clean → proceed.
   - Dirty → run `git diff HEAD -- flows/`:
     - **Normal case** (additions, small corrections, auto-layout drift): silently commit as `chore: editor edits` and continue. **Don't ask.**
     - **Exception**: the diff clearly reverts a substantial part of my last commit. An open BPMN editor tab has likely written its stale WebView state to disk. → **Stop, ask the user** and request that they close the tab.
2. **After every change**, commit immediately with a meaningful message. Keeps the working tree clean between instructions.

## Commit message convention

- **Conventional Commits**: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:` as prefix.
- **English**, imperative, short summary line (≤ 72 characters).
- Optional scope only when it adds value (e.g. `feat(viewer): …`); otherwise omit.
- Body only for non-trivial changes, with "what/why" — not "how".

## Verification after every edit

1. `npm run validate` is green
2. Every sequence flow exists as `<bpmn:sequenceFlow>` plus `<bpmn:incoming>`/`<bpmn:outgoing>` on source/target
3. IDs are unique and descriptive
4. When in doubt: ask the user to inspect the diagram in the browser viewer
