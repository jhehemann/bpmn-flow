#!/usr/bin/env node
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { layoutProcess } from 'bpmn-auto-layout';

const args = process.argv.slice(2);
const targets = args.length
  ? args.map((a) => resolve(a))
  : (await readdir('flows'))
      .filter((f) => f.endsWith('.bpmn'))
      .map((f) => resolve('flows', f));

if (targets.length === 0) {
  console.error('Keine .bpmn-Dateien gefunden.');
  process.exit(1);
}

for (const file of targets) {
  const xml = await readFile(file, 'utf-8');
  const layouted = await layoutProcess(xml);
  await writeFile(file, layouted);
  console.log(`Layout aktualisiert: ${file}`);
}
