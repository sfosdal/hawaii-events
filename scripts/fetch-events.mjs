#!/usr/bin/env node
/**
 * Aggregates upcoming events across the Hawaiian Islands into site/events.json
 * and site/events.ics. Runs in CI (see .github/workflows/events.yml) and
 * locally for preview. The pipeline is lqa-events' (scripts/*.mjs are its
 * files, byte for byte); only the sources below and site/city.js are this
 * site's.
 *
 * The state site reads no venue itself (Steve, 2026-10-25: "for HI I want
 * hawaii.here.events and each city.here.events"): its sources are the island
 * sites' published feeds — honolulu, maui, kona and hilo .here.events, each
 * site's events.json — and its rooms (site/city.js) are theirs, folded by
 * island. A sister not yet live is read from its repo on this Mac when
 * SISTER_LOCAL=1 (the first build, before every island site is up; SISTER_LOCAL=only
 * reads every sister from this Mac). The
 * Rainbow Warriors' seasons come from ESPN (scripts/schedules.mjs).
 */
import { writeFileSync, readFileSync } from 'node:fs';
import { buildIcs } from './ics.mjs';
import { isChurch } from './sources.mjs';
import { mergeWithArchive, unionArchives, eventKey } from './merge.mjs';
import { fixLinks } from './links.mjs';
import { calmTitle, isNotice } from './titles.mjs';
import { applySchedules } from './schedules.mjs';
import { slugify, BADGE_FEEDS, TEAMS, CITY } from './badges.mjs';
import { emptyListGate } from './feeds.mjs';

const JSON_OUT = new URL('../site/events.json', import.meta.url);
const ICS_OUT = new URL('../site/events.ics', import.meta.url);
// A full year each way: venues announce whole seasons ahead, and past events
// are kept for a year (carried forward from the previously published feed —
// see mergeWithArchive).
const WINDOW_DAYS = 365;
// The live feed is read from the site's own domain (a build that reads
// neither copy of the archive refuses to publish — see mergeWithArchive;
// ALLOW_NO_ARCHIVE=1 lets the very first build through).
const FEED_URL = process.env.FEED_URL || 'https://hawaii.here.events/events.json';
// the second copy of the archive: every past event ever published, kept on
// the orphan `archive` branch by the workflow after each successful build
const ARCHIVE_URL = process.env.ARCHIVE_URL || 'https://raw.githubusercontent.com/sfosdal/hawaii-events/archive/events-archive.json';
const ARCHIVE_OUT = new URL('../events-archive.json', import.meta.url); // repo root, ignored; the workflow commits it to the branch
const MAX_EVENTS = 4000; // sanity cap, not a display cap

// --- the island sites' feeds ---
// city.js `sisters`: one entry per island site — its key (repo and host), the
// island fold it fills, its feed. Every row keeps what the sister published
// (venue as it spells it, title, date, clock, link, type, sold-out tag); a
// venue the state site's city.js lacks is counted and dropped (strays below).
const sisterFeed = ({ key, label, url }) => async () => {
  let data;
  try {
    if (process.env.SISTER_LOCAL === 'only') throw new Error('SISTER_LOCAL=only'); // the island sites' published feeds are not yet the current builds — read this Mac's copies
    const r = await fetch(url, { headers: { 'User-Agent': CITY.userAgent } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    data = await r.json();
  } catch (err) {
    if (!process.env.SISTER_LOCAL) throw new Error(`${label} feed (${url}): ${err.message}`);
    const local = new URL(`../../../${key}-events/repo/site/events.json`, import.meta.url);
    data = JSON.parse(readFileSync(local, 'utf8'));
    console.warn(`${label}: ${err.message} — read this Mac's copy (${local.pathname})`);
  }
  const rows = (data.events || []).map(({ venue, title, date, time, url: link, type, soldOut, series }) => ({ venue, title, date, time, url: link, type, ...(soldOut ? { soldOut } : {}), ...(series ? { series } : {}) }));
  console.log(`${label}: ${rows.length} events from the ${key} site`);
  return rows;
};
const sisterFeeds = (CITY.sisters || []).map(sisterFeed);
// A row an island site published without a type (Ticketmaster files some under nothing) takes its room's
const roomType = (rows) => rows.map((e) => (e.type || !CITY.venues[e.venue] ? e : { ...e, type: CITY.venues[e.venue].type }));
const sources = sisterFeeds.map((fn) => async () => roomType(await fn())); // the island sites are the only sources
const secondary = []; // nothing re-lists them

// Venue names as city.js spells them: a venue listed under other spellings
// (`alias`) folds to its one name; the state site sets no `groundsVenue`, so a row that
// still arrives under a name city.js lacks is dropped (and counted) rather
// than listed under a stray name.
const CANONICAL_VENUES = new Set(Object.keys(CITY.venues));
const ALIASES = Object.entries(CITY.venues).filter(([, v]) => v.alias).map(([label, v]) => [label, v.alias]);
const aliasHit = (s) => { const hit = ALIASES.find(([, re]) => re.test(s || '')); return hit ? hit[0] : null; };
const aliasVenue = (name) => aliasHit(name) || name;
// A listing whose venue field is just the city names its room at the end of
// the title ("X live at The Vic").
const roomInTitle = (title) => { const m = /\b(?:at|@)\s+(.+)$/i.exec(title || ''); return m ? aliasHit(m[1]) : null; };
const normalizeVenue = (e) => {
  const byName = aliasVenue(e.venue);
  const venue = CANONICAL_VENUES.has(byName) ? byName : (roomInTitle(e.title) || byName);
  if (CITY.groundsVenue && !CANONICAL_VENUES.has(venue)) return { ...e, venue: CITY.groundsVenue };
  return venue === e.venue ? e : { ...e, venue };
};
// HTML entities in the sisters' titles are already decoded; the shared hygiene below runs the same decoder anyway
const unent = (t) => String(t || '').replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d))).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#?039;|&apos;/g, "'").replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const strays = new Map();
const knownVenue = (e) => { if (CANONICAL_VENUES.has(e.venue)) return true; strays.set(e.venue, (strays.get(e.venue) || 0) + 1); return false; };

// Church events never make the listing (Steve, 2026-10-11, for Everett;
// the same here), judged on the
// source's own venue name and title before anything folds into the
// Elsewhere row; the count is logged so a new church booking is visible.
let churchDropped = 0;
const noChurch = (rows) => rows.filter((e) => { if (isChurch(e)) { churchDropped++; return false; } return true; });

let all = [];
for (const src of sources) {
  try { all = all.concat(noChurch(await src()).map(normalizeVenue).filter(knownVenue)); }
  catch (err) { console.error('Source failed:', err.message); }
}
for (const src of secondary) {
  try { all = all.concat(dropDateClashes(noChurch(await src()).map(normalizeVenue).filter(knownVenue), all)); }
  catch (err) { console.error('Source failed:', err.message); }
}
if (churchDropped) console.log(`Church events dropped: ${churchDropped}`);
// A listing that prints a show twice — once with a clock, once without (the Palace's all-day film
// rows beside its timed ones): when a timed row shares a venue, link and date with an untimed one,
// the untimed one goes
{ const timed = new Set(all.filter((e) => e.time).map((e) => `${e.venue}|${e.url}|${e.date}`)); all = all.filter((e) => e.time || !timed.has(`${e.venue}|${e.url}|${e.date}`)); }
if (strays.size) console.log(`Rows under venues city.js lacks, dropped: ${[...strays].map(([v, n]) => `${v} (${n})`).join(', ')}`);

// window, de-dupe, sort
const today = new Date().toISOString().slice(0, 10);
const horizon = new Date(Date.now() + WINDOW_DAYS * 86400e3).toISOString().slice(0, 10);
const cutoff = new Date(Date.now() - WINDOW_DAYS * 86400e3).toISOString().slice(0, 10);
const seen = new Set();
const fresh = all
  .filter((e) => e.date && e.date >= cutoff && e.date <= horizon)
  .filter((e) => !isNotice(e.title)) // a closure or construction notice is information, not an event
  .map((e) => ({ ...e, title: calmTitle(unent(e.title)) })) // shouted titles (the Concert Society's season page) come down to Title Case, entities decoded first
  .map((e) => (/\s*[-–—]\s*sold out!?\s*$/i.test(e.title) ? { ...e, title: e.title.replace(/\s*[-–—]\s*sold out!?\s*$/i, ''), soldOut: true } : e)) // a "– Sold Out!" title suffix is the tag, not the words
  .filter((e) => { const k = eventKey(e); if (seen.has(k)) return false; seen.add(k); return true; }); // venue|title|date|clock (merge.mjs): a second showing on one day is kept

// the empty-list gate (feeds.mjs): nothing upcoming in this build's own pull means a room was
// missed in scouting or every source is down — not a fact about the town. ALLOW_EMPTY_LIST=1 overrides.
if (!emptyListGate(fresh, today, sources.length)) process.exit(1);

// carry past events forward. Two copies of the archive: the live feed and
// the `archive` branch's file (every past event ever published; the workflow
// rewrites it after each build). Each is fetched with three tries; the build
// goes on with the union of whatever it got and stops only when it got
// neither. Since the union can only grow, a publish that lost history can no
// longer shrink the record.
const cleanArchive = (d) => (Array.isArray(d) ? d : (d.events || []))
  .filter((e) => !isChurch(e)) // past church events leave the record too
  .map(normalizeVenue).filter(knownVenue) // past events published under other spellings fold onto the one name
  .filter((e) => !isNotice(e.title)).map((e) => ({ ...e, title: calmTitle(e.title) })); // the same title hygiene as fresh events, so the merge keys agree
async function fetchArchive(url, what) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return cleanArchive(await r.json());
    } catch (err) {
      console.error(`${what} fetch (try ${attempt} of 3) failed: ${err.message}`);
      if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 20000));
    }
  }
  return null;
}
const [liveArchive, branchArchive] = await Promise.all([
  fetchArchive(FEED_URL, 'Live feed'),
  fetchArchive(ARCHIVE_URL, 'Archive branch'),
]);
if (liveArchive === null && branchArchive === null && !process.env.ALLOW_NO_ARCHIVE) {
  console.error('No archive from either copy — not publishing (ALLOW_NO_ARCHIVE=1 to override for a first build)');
  process.exit(1);
}
if (liveArchive === null) console.error('Live feed unreadable — building on the archive branch copy');
if (branchArchive === null) console.error('Archive branch unreadable — building on the live feed alone');
const archived = unionArchives(liveArchive || [], branchArchive || []);
console.log(`Archive: ${(liveArchive || []).length} events in the live feed, ${(branchArchive || []).length} on the archive branch, ${archived.length} in the union`);

const merged = mergeWithArchive(fresh, archived, today, cutoff).slice(-MAX_EVENTS);

// League schedules flag floating dates Ticketmaster doesn't know yet, and
// the full seasons (home and away) feed the site's Teams view
let seasons = {}, form = {};
try { ({ teams: seasons, form } = await applySchedules(merged)); } catch (err) { console.error('Schedules step failed:', err.message); }
// The clubs whose home games have no ticket feed here (city.js `inject`: the
// none here — the Vulcans' dates come as listings from their season calendar) enter the listing from the league's schedule —
// typed sports, the club's ticket page as the link — unless the feed already
// has that day at that ground
// (city.js teams, not badges' TEAMS, which carries only slug/label/re — the
// loop was a no-op until 2026-10-11; the game takes the club's own ground name)
for (const t of CITY.teams.filter((x) => x.inject)) {
  for (const g of (seasons[t.slug] || []).filter((x) => x.home && x.date >= today)) { // from today: a written row is not a record of a past event (the archive keeps only what was listed)
    const ground = t.inject.venue || t.venue || g.venue;
    const room = CITY.venues[ground];
    if (g.venue && room && room.alias && !room.alias.test(g.venue)) continue; // a neutral-site game ESPN flags as home (Creighton v Michigan at T-Mobile Arena, 2026-11-24) stays off the home ground
    const listed = merged.find((e) => e.date === g.date && (e.venue === ground || e.venue === g.venue));
    if (listed) { if (!listed.time && g.time && !g.tbd) listed.time = g.time; continue; } // the feed's listing stands; the league's first pitch fills a time it lacks
    merged.push({ venue: ground, title: `${t.inject.name || t.name || t.label} vs ${g.opp.name}`, date: g.date, time: g.time, url: t.inject.url, type: 'sports', ...(g.tbd ? { dateTbd: true } : {}), ...(g.watch ? { watch: g.watch } : {}) });
  }
}
// Ticket availability for the Ticketmaster venues, from a local checker
// (scripts/data/soldout.json — empty until one runs here): counts and
// lowest price, and soldOut when the box office has nothing left.
try {
  const so = JSON.parse(readFileSync(new URL('./data/soldout.json', import.meta.url), 'utf8'));
  let n = 0, s = 0;
  for (const e of merged) {
    const m = (e.url || '').match(/\/event\/([0-9A-F]{16})/i); // Ticketmaster's 16-hex id
    const r = m && (so.events || {})[m[1].toUpperCase()];
    if (!r || !/^(available|soldout)$/.test(r.status)) continue;
    const out = r.status === 'soldout';
    e.tickets = { box: out ? 0 : (r.primary == null ? null : r.primary), resale: r.resale || 0, checked: r.checked };
    const from = out ? r.fromResale : r.fromPrimary;
    if (from != null) e.tickets.from = from;
    if (out) { e.soldOut = true; s++; }
    n++;
  }
  if (n) console.log(`soldout: ${n} events with ticket counts (checked ${so.generated}), ${s} sold out`);
} catch (err) { console.error('soldout.json:', err.message); }
merged.sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
if (Object.keys(seasons).length) {
  const postseason = JSON.parse(readFileSync(new URL('./data/postseason.json', import.meta.url), 'utf8')); // each league's playoff rounds (hand-kept), shown until the real games land
  delete postseason._;
  writeFileSync(new URL('../site/teams.json', import.meta.url), JSON.stringify({ generated: new Date().toISOString(), teams: seasons, form, postseason }, null, 1) + '\n');
} else {
  console.error('teams.json: no season fetched this run, the last one stands');
}

await fixLinks(merged, { venues: CITY.venues, today }); // ticket links that reach a real page: no scheme-less or wrapped links, a 404 goes to the venue's page (scripts/links.mjs)
writeFileSync(JSON_OUT, JSON.stringify({ generated: new Date().toISOString(), events: merged }, null, 2) + '\n');
// the archive record: this build's past events on top of everything already
// recorded, never pruned (the feed keeps a year; the branch keeps it all)
const record = unionArchives(merged.filter((e) => e.date < today), archived.filter((e) => e.date < today));
writeFileSync(ARCHIVE_OUT, JSON.stringify({ events: record }, null, 1) + '\n'); // no timestamp: the branch commits only when the events change
console.log(`Archive record: ${record.length} past events`);
writeFileSync(ICS_OUT, buildIcs(merged));

// Filtered subscribe feeds, one per venue and one per badge, so the site's
// filter chips can offer a matching calendar subscription.
const siteDir = new URL('../site/', import.meta.url);
let nFeeds = 0;
for (const venue of new Set(merged.map((e) => e.venue))) {
  const evs = merged.filter((e) => e.venue === venue);
  writeFileSync(new URL(`events-venue-${slugify(venue)}.ics`, siteDir),
    buildIcs(evs, new Date(), { calname: `${CITY.ics.short} — ${venue}` }));
  nFeeds++;
}
for (const [slug, [label, pred]] of Object.entries(BADGE_FEEDS)) {
  writeFileSync(new URL(`events-${slug}.ics`, siteDir),
    buildIcs(merged.filter(pred), new Date(), { calname: `${CITY.ics.short} — ${label}` }));
  nFeeds++;
}
// Exclusion feeds, one per local team: everything except that team's games.
for (const t of TEAMS) {
  writeFileSync(new URL(`events-no-${t.slug}.ics`, siteDir),
    buildIcs(merged.filter((e) => !t.re.test(e.title || '')), new Date(), { calname: `${CITY.ics.short} — no ${t.label}` }));
  nFeeds++;
}
// Season feeds for the Teams view: each club's whole season, home and away
// (team-<slug>.ics), and every club's in one (teams.ics). Each game links to
// the club's page on the site.
const seasonEvents = (slug, label, games) => games.map((g) => ({
  title: `${label} ${g.home ? 'vs' : 'at'} ${g.opp.name}${g.pre ? ' (preseason)' : g.playoff ? ' (playoff)' : ''}`,
  venue: g.venue || (g.home ? '' : g.opp.name), date: g.date, time: g.tbd ? null : g.time, ...(g.tbd ? { dateTbd: true } : {}),
  url: `${CITY.site}?team=${slug}`,
}));
const allSeasons = [];
for (const t of TEAMS) {
  if (!seasons[t.slug]) continue;
  const evs = seasonEvents(t.slug, t.label, seasons[t.slug]);
  allSeasons.push(...evs);
  writeFileSync(new URL(`team-${t.slug}.ics`, siteDir), buildIcs(evs, new Date(), { calname: `${t.label} season` }));
  nFeeds++;
}
writeFileSync(new URL('teams.ics', siteDir), buildIcs(allSeasons, new Date(), { calname: CITY.ics.teams }));
nFeeds++;

const nPast = merged.filter((e) => e.date < today).length;
console.log(`Wrote ${merged.length} events (${nPast} past, ${merged.length - nPast} upcoming) + ${nFeeds} filtered feeds`);
