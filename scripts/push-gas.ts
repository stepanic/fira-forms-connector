/**
 * Push merged GAS bundle to Google Apps Script via clasp.
 *
 * Usage:
 *   npm run push:gas -- <slug> [scriptId]
 *
 * Examples:
 *   # First-time setup for an event (creates .clasp.json):
 *   npm run push:gas -- badija-2026 1eaz0mvFEng6PVxqfkSb6jUZmMHZYEJCLi7mhDLL5vFIuIiyMRMoPRba5
 *
 *   # Subsequent pushes (uses existing .clasp.json):
 *   npm run push:gas -- badija-2026
 *
 * Prereqs:
 *   - npm install -g @google/clasp
 *   - clasp login
 *   - In script.google.com → Settings: enable "Google Apps Script API"
 */

import { execSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.resolve(__dirname, '..', 'google-apps-script');
const OUT_DIR = path.join(SRC_DIR, 'dist');

function fail(msg: string): never {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

function ensureClasp(): void {
  const r = spawnSync('clasp', ['--version'], { stdio: 'ignore' });
  if (r.error || r.status !== 0) {
    fail('clasp not found. Install: npm install -g @google/clasp');
  }
}

function main(): void {
  const [slug, scriptId] = process.argv.slice(2);
  if (!slug) fail('Missing event slug. Usage: npm run push:gas -- <slug> [scriptId]');

  ensureClasp();

  // Rebuild only this event (cheap and ensures sources are fresh)
  console.log(`▶ Building ${slug}...`);
  execSync('npm run build:gas --silent', { stdio: 'inherit' });

  const eventDir = path.join(OUT_DIR, slug);
  if (!fs.existsSync(eventDir)) {
    fail(`Event directory not found: ${eventDir}\n  Available: ${fs.existsSync(OUT_DIR) ? fs.readdirSync(OUT_DIR).join(', ') : '(none)'}`);
  }

  const claspJsonPath = path.join(eventDir, '.clasp.json');
  if (!fs.existsSync(claspJsonPath)) {
    if (!scriptId) {
      fail(
        `No .clasp.json in ${eventDir}.\n\n` +
          `First-time setup needs a scriptId. Either:\n` +
          `  (a) Provide scriptId now:\n` +
          `      npm run push:gas -- ${slug} <scriptId>\n` +
          `  (b) Or clone an existing project:\n` +
          `      cd ${path.relative(process.cwd(), eventDir)} && clasp clone <scriptId>`
      );
    }
    console.log(`▶ Creating .clasp.json (scriptId: ${scriptId})`);
    fs.writeFileSync(
      claspJsonPath,
      JSON.stringify({ scriptId, rootDir: eventDir }, null, 2) + '\n'
    );
  }

  console.log(`▶ clasp push (cwd: ${path.relative(process.cwd(), eventDir)})`);
  const result = spawnSync('clasp', ['push', '-f'], { cwd: eventDir, stdio: 'inherit' });
  if (result.status !== 0) fail(`clasp push failed (exit ${result.status})`);

  console.log(`\n✓ Pushed ${slug}`);
}

main();
