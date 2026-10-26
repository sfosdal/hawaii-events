#!/usr/bin/env node
// The state site's rooms are the island sites' rooms (Steve, 2026-10-25: "for HI
// I want hawaii.here.events and each city.here.events"): this one-time helper
// reads each sister's site/city.js on this Mac and prints the blocks that
// site/city.js and styles.css carry by hand — VENUES (geo, capacity, type, hue,
// url, icon; no sources: the events arrive from the sisters' published feeds),
// HOODS (one fold per island site), DEFAULT_ON/OFF, the REGISTRY venue slots and
// the --v-* hue lines. Run it, paste, then edit by hand; it is not part of the
// build (the build reads nothing but the sisters' events.json).
//
//   node scripts/sister-venues.mjs            prints the blocks
//
// A room two sisters both list (Honokaʻa's People's Theatre, on the Kona and
// Hilo sites) appears once, under the first sister that names it.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const SISTERS = [ // key = the sister's repo and host; label = the island fold's heading
  { key: 'honolulu', label: 'Oʻahu' },
  { key: 'maui', label: 'Maui' },
  { key: 'kona', label: 'Hawaiʻi Island — Kona & Kohala' },
  { key: 'hilo', label: 'Hawaiʻi Island — Hilo, Volcano & Hāmākua' },
];
const require = createRequire(import.meta.url);
const cityOf = (key) => { globalThis.window = globalThis; delete globalThis.LQACity; require(`../../../${key}-events/repo/site/city.js`); const c = globalThis.LQACity; delete require.cache[require.resolve(`../../../${key}-events/repo/site/city.js`)]; return c; };
const readStyles = (key) => readFileSync(new URL(`../../../${key}-events/repo/site/styles.css`, import.meta.url), 'utf8');

const q = (s) => (s.includes("'") ? JSON.stringify(s) : `'${s}'`);
const venues = {}, hoods = [], on = [], off = [], hues = { light: {}, dark: {} }, usedVars = new Set();
for (const { key, label } of SISTERS) {
  const C = cityOf(key), css = readStyles(key);
  const light = Object.fromEntries([...css.matchAll(/(--v-[\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2].toLowerCase()])); // the first (light) value of each var
  const fold = { label, venues: [] };
  for (const [name, v] of Object.entries(C.venues)) {
    if (venues[name]) { console.error(`// ${name}: already listed by an earlier sister — skipped for ${key}`); continue; }
    let cssVar = v.cssVar; if (usedVars.has(cssVar)) cssVar = cssVar.replace('--v-', `--v-${key}-`); usedVars.add(cssVar);
    venues[name] = { ...v, cssVar, island: key };
    hues.light[cssVar] = light[v.cssVar]; hues.dark[cssVar] = v.color;
    fold.venues.push(name);
    (C.defaultOff.includes(name) ? off : on).push(name);
  }
  hoods.push(fold);
}

const field = (k, v) => `      ${k}: ${typeof v === 'string' ? q(v) : JSON.stringify(v)},`;
let out = '  var VENUES = {\n';
for (const { label } of hoods.map((h) => ({ label: h.label }))) {
  out += `    // --- ${label} ---\n`;
  for (const name of hoods.find((h) => h.label === label).venues) {
    const v = venues[name];
    out += `    ${q(name)}: {\n`;
    if (v.festival) out += field('festival', true);
    out += field('island', v.island) + '\n';
    out += field('geo', v.geo) + '\n' + field('capacity', v.capacity) + '\n' + field('type', v.type) + '\n' + field('cssVar', v.cssVar) + '\n' + field('color', v.color) + '\n';
    if (v.url) out += field('url', v.url) + '\n';
    if (v.icon) out += field('icon', v.icon) + '\n';
    out += '    },\n';
  }
}
out += '  };\n\n';
out += '  var HOODS = [\n' + hoods.map((h) => `    { label: ${q(h.label)}, venues: [${h.venues.map(q).join(', ')}] },`).join('\n') + '\n  ];\n\n';
out += `  var DEFAULT_ON = [${on.map(q).join(', ')}];\n  var DEFAULT_OFF = [${off.map(q).join(', ')}];\n\n`;
out += `  // registry venue slots (${Object.keys(venues).length})\n    ${Object.keys(venues).map((n) => `['venue', ${q(n)}]`).join(', ')},\n\n`;
out += `/* styles.css light */\n  ${Object.entries(hues.light).map(([k, v]) => `${k}: ${v};`).join(' ')}\n/* styles.css dark */\n    ${Object.entries(hues.dark).map(([k, v]) => `${k}: ${v};`).join(' ')}\n`;
process.stdout.write(out);
