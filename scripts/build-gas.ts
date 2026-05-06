/**
 * Build script: merge GAS modules into one Code.gs per event.
 *
 * Reads every `events/<slug>/Config.gs` and produces
 *   `google-apps-script/dist/<slug>/Code.gs`
 * Each output bundles:
 *   1. The event's events/<slug>/Config.gs   (CONFIG object)
 *   2. modules/Mapping.gs                    (main FIRA logic)
 *   3. modules/SplitPayment.gs               (only if config defines AKCIJA_AVANS)
 *
 * Usage:
 *   npm run build:gas
 */

import * as fs from 'fs';
import * as path from 'path';

const GAS_DIR = path.resolve(__dirname, '..', 'google-apps-script');
const EVENTS_DIR = path.join(GAS_DIR, 'events');
const MODULES_DIR = path.join(GAS_DIR, 'modules');
const OUT_DIR = path.join(GAS_DIR, 'dist');
const MAIN_MODULE = path.join(MODULES_DIR, 'Mapping.gs');
const SPLIT_MODULE = path.join(MODULES_DIR, 'SplitPayment.gs');

const SEPARATOR = '// ' + '═'.repeat(76);

const APPSSCRIPT_MANIFEST = {
  timeZone: 'Europe/Zagreb',
  dependencies: {},
  exceptionLogging: 'STACKDRIVER',
  runtimeVersion: 'V8',
};

function relFromGas(p: string): string {
  return path.relative(GAS_DIR, p);
}

function buildEvent(slug: string): { slug: string; outPath: string; withSplit: boolean } {
  const configPath = path.join(EVENTS_DIR, slug, 'Config.gs');
  if (!fs.existsSync(configPath)) {
    throw new Error(`Missing Config.gs for event "${slug}" at ${configPath}`);
  }

  const outDir = path.join(OUT_DIR, slug);
  fs.mkdirSync(outDir, { recursive: true });

  // appsscript.json — clasp requires it. Write only if missing so user edits stick.
  const manifestPath = path.join(outDir, 'appsscript.json');
  if (!fs.existsSync(manifestPath)) {
    fs.writeFileSync(manifestPath, JSON.stringify(APPSSCRIPT_MANIFEST, null, 2) + '\n');
  }

  const configBody = fs.readFileSync(configPath, 'utf8');
  const mainBody = fs.readFileSync(MAIN_MODULE, 'utf8');
  const withSplit = /\bAKCIJA_AVANS\s*:/.test(configBody);
  const splitBody = withSplit ? fs.readFileSync(SPLIT_MODULE, 'utf8') : '';

  const sources = [relFromGas(configPath), relFromGas(MAIN_MODULE)];
  if (withSplit) sources.push(relFromGas(SPLIT_MODULE));

  const header =
    `/**\n` +
    ` * AUTO-GENERATED — do not edit directly. Edit sources and rebuild.\n` +
    ` * Build:    scripts/build-gas.ts (npm run build:gas)\n` +
    ` * Event:    ${slug}\n` +
    ` * Sources:  ${sources.join(', ')}\n` +
    ` * Built:    ${new Date().toISOString()}\n` +
    ` */\n\n`;

  const sectionHeader = (label: string) =>
    `${SEPARATOR}\n// ${label}\n${SEPARATOR}\n\n`;

  const merged =
    header +
    sectionHeader(`SECTION 1/${sources.length} — ${sources[0]}`) +
    configBody +
    '\n\n' +
    sectionHeader(`SECTION 2/${sources.length} — ${sources[1]}`) +
    mainBody +
    (withSplit
      ? '\n\n' +
        sectionHeader(`SECTION 3/${sources.length} — ${sources[2]}`) +
        splitBody
      : '');

  const outPath = path.join(outDir, 'Code.gs');
  fs.writeFileSync(outPath, merged);
  return { slug, outPath, withSplit };
}

function discoverEvents(): string[] {
  if (!fs.existsSync(EVENTS_DIR)) return [];
  return fs
    .readdirSync(EVENTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(EVENTS_DIR, d.name, 'Config.gs')))
    .map((d) => d.name)
    .sort();
}

function main(): void {
  if (!fs.existsSync(MAIN_MODULE)) {
    console.error(`Missing module: ${MAIN_MODULE}`);
    process.exit(1);
  }

  // Don't wipe OUT_DIR — preserves per-event .clasp.json from `clasp clone`.
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const slugs = discoverEvents();
  if (slugs.length === 0) {
    console.error(`No event configs found. Expected: ${EVENTS_DIR}/<slug>/Config.gs`);
    process.exit(1);
  }

  console.log(`Building ${slugs.length} event bundle(s)...\n`);
  const results = slugs.map(buildEvent);

  console.log('Built:');
  for (const r of results) {
    const tag = r.withSplit ? ' (split-payment)' : '';
    const rel = path.relative(process.cwd(), r.outPath);
    console.log(`  ✓ ${r.slug.padEnd(22)} → ${rel}${tag}`);
  }
  console.log(`\nDone. Output: ${path.relative(process.cwd(), OUT_DIR)}/`);
}

main();
