// The state — every fact that makes this calendar Hawaiʻi's rather than one
// town's, in one place (2026-10-25: the state site over the island sites,
// built on lqa-events; Steve: "for HI I want hawaii.here.events and each
// city.here.events"). Its rooms are the island sites' rooms, folded by island
// (HOODS); its events are their published feeds (fetch-events.mjs reads
// `sisters` below). scripts/sister-venues.mjs prints the room blocks from the
// sisters' city.js files on this Mac — run it when an island site gains a room. The browser (filter.js, app.js) and
// the build (scripts/*.mjs) both read it; nothing else names a venue or a
// team. The shared files (app.js, filter.js, styles.css bar its --v-* hues,
// scripts/*.mjs bar fetch-events.mjs and sources.mjs) are lqa-events' own,
// byte for byte — see README "Sister sites".
//
// Loaded before filter.js (a plain script, so the tests can share it): it
// sets globalThis.LQACity (the name is the shared code's, not the city's).
(function (global) {
  'use strict';

  // The home teams, matched on the event title whatever the venue. Order =
  // the Teams strip, left to right. Per team:
  //   re        the title match (Ticketmaster writes "Hawaii Rainbow Warriors
  //             Football vs. …", and the women's volleyball team, oddly,
  //             "Hawaii Rainbow Warriors Womens Volleyball")
  //   venue     the home building; schedule = the program's own schedule page
  //   sport     keys the strip icon (app.js SPORT_ICONS — none for volleyball
  //             yet, so the Wahine's pill carries the crest alone), the game
  //             clock, the leader categories
  //   colors    [primary, accent] — the season calendar's home cells and
  //             card frames (UH green and the grey of the away kit)
  //   espn      ESPN's sport/league/team id — the university is id 62 in
  //             every college league, so the season, the form block and news
  //             all come from there (schedules.mjs). No pro club plays in
  //             Hawaii, and nothing from the mainland is listed.
  //   club      the program's name on Ticketmaster; wiki the article; opens
  //             when the season usually starts
  var UH_LOGO = 'https://a.espncdn.com/i/teamlogos/ncaa/500/62.png';
  var TEAMS = [
    { slug: 'football', label: 'Warriors Football', re: /rainbow warriors football/i, sport: 'football', venue: 'Ching Athletics Complex', colors: ['#024731', '#a7a9ac'],
      espn: { sport: 'football', league: 'college-football', id: '62' }, season: { kind: 'espn' }, form: { kind: 'espn' },
      logo: UH_LOGO, schedule: 'https://hawaiiathletics.com/sports/football/schedule',
      club: 'Hawaii Rainbow Warriors Football', opens: 'late August', wiki: { title: 'Hawaii Rainbow Warriors football', startYear: true } },
    // strip: false was set 2026-10-11 (lifted the same night: schedules.mjs now merges the regular season for college basketball) while ESPN's plain call answers with an empty preseason (the
    // shared adapter asks for the regular season by name only for the NBA) —
    // a filter row, no Teams tab; drop the flag once the season begins in November
    { slug: 'basketball', label: 'Warriors Basketball', re: /rainbow warriors mens basketball|rainbow warriors basketball/i, sport: 'basketball', venue: 'Stan Sheriff Center', colors: ['#024731', '#000000'],
      espn: { sport: 'basketball', league: 'mens-college-basketball', id: '62' }, season: { kind: 'espn' }, form: { kind: 'espn' },
      logo: UH_LOGO, schedule: 'https://hawaiiathletics.com/sports/mens-basketball/schedule',
      club: 'Hawaii Rainbow Warriors Mens Basketball', opens: 'early November', wiki: { title: "Hawaii Rainbow Warriors men's basketball", startYear: true } },
    { slug: 'volleyball', label: 'Wahine Volleyball', re: /womens volleyball|rainbow wahine volleyball/i, sport: 'volleyball', venue: 'Stan Sheriff Center', colors: ['#024731', '#ffffff'],
      espn: { sport: 'volleyball', league: 'womens-college-volleyball', id: '62' }, season: { kind: 'espn' }, form: { kind: 'espn' },
      logo: UH_LOGO, schedule: 'https://hawaiiathletics.com/sports/womens-volleyball/schedule',
      club: 'Hawaii Rainbow Warriors Womens Volleyball', opens: 'late August', wiki: { title: "Hawaii Rainbow Wahine volleyball", startYear: true } },
  ];

  // The venues: every room the island sites list, as they spell them (the
  // feeds arrive under these names), with the sister's key in `island`. No
  // sources here — the sisters read the rooms. Printed by scripts/sister-venues.mjs.
  var VENUES = { // printed by scripts/sister-venues.mjs 2026-10-25 — geo: [lat, lon] puts the room on the Map view; island: the sister that reads it
    // --- Oʻahu ---
    'Blaisdell Arena': {
      island: 'honolulu',
      geo: [21.29895,-157.85142],
      capacity: 8800,
      type: 'concert',
      cssVar: '--v-arena',
      color: '#ea8686',
      url: 'https://www.blaisdellcenter.com/events/',
      icon: 'https://www.google.com/s2/favicons?domain=www.blaisdellcenter.com&sz=128',
    },
    'Blaisdell Concert Hall': {
      island: 'honolulu',
      geo: [21.30109,-157.84982],
      capacity: 2158,
      type: 'arts',
      cssVar: '--v-concerthall',
      color: '#86eaa4',
      url: 'https://www.blaisdellcenter.com/events/',
      icon: 'https://www.google.com/s2/favicons?domain=www.blaisdellcenter.com&sz=128',
    },
    'Blaisdell Exhibition Hall': {
      island: 'honolulu',
      geo: [21.29989,-157.85089],
      capacity: 5000,
      type: 'community',
      cssVar: '--v-exhibition',
      color: '#c086ea',
      url: 'https://www.blaisdellcenter.com/events/',
      icon: 'https://www.google.com/s2/favicons?domain=www.blaisdellcenter.com&sz=128',
    },
    'Stan Sheriff Center': {
      island: 'honolulu',
      geo: [21.29431,-157.81892],
      capacity: 10300,
      type: 'sports',
      cssVar: '--v-sheriff',
      color: '#eade86',
      url: 'https://hawaiiathletics.com/calendar',
      icon: 'https://www.google.com/s2/favicons?domain=hawaiiathletics.com&sz=128',
    },
    'Ching Athletics Complex': {
      island: 'honolulu',
      geo: [21.29429,-157.81712],
      capacity: 15000,
      type: 'sports',
      cssVar: '--v-ching',
      color: '#86d9ea',
      url: 'https://hawaiiathletics.com/sports/football/schedule',
      icon: 'https://www.google.com/s2/favicons?domain=hawaiiathletics.com&sz=128',
    },
    'Waikiki Shell': {
      island: 'honolulu',
      geo: [21.26819,-157.81856],
      capacity: 8400,
      type: 'concert',
      cssVar: '--v-shell',
      color: '#ea86bb',
      url: 'https://www.blaisdellcenter.com/events/',
      icon: 'https://www.google.com/s2/favicons?domain=www.blaisdellcenter.com&sz=128',
    },
    'Hawaii Theatre Center': {
      island: 'honolulu',
      geo: [21.31098,-157.86123],
      capacity: 1400,
      type: 'arts',
      cssVar: '--v-hawaiitheatre',
      color: '#9fea86',
      url: 'https://www.hawaiitheatre.com/upcoming-events/',
      icon: 'https://www.google.com/s2/favicons?domain=www.hawaiitheatre.com&sz=128',
    },
    'Diamond Head Theatre': {
      island: 'honolulu',
      geo: [21.2711,-157.80331],
      capacity: 480,
      type: 'arts',
      cssVar: '--v-diamondhead',
      color: '#ea869f',
      url: 'https://www.diamondheadtheatre.com/shows-tickets/',
      icon: 'https://www.google.com/s2/favicons?domain=www.diamondheadtheatre.com&sz=128',
    },
    'Kumu Kahua Theatre': {
      island: 'honolulu',
      geo: [21.30959,-157.86314],
      capacity: 100,
      type: 'arts',
      cssVar: '--v-kumukahua',
      color: '#86c0ea',
      url: 'https://www.kumukahua.org/',
      icon: 'https://www.google.com/s2/favicons?domain=www.kumukahua.org&sz=128',
    },
    'Honolulu Museum of Art': {
      island: 'honolulu',
      geo: [21.30419,-157.84808],
      capacity: 280,
      type: 'arts',
      cssVar: '--v-homa',
      color: '#86eadc',
      url: 'https://honolulumuseum.org/events',
      icon: 'https://www.google.com/s2/favicons?domain=honolulumuseum.org&sz=128',
    },
    'Orvis Auditorium': {
      island: 'honolulu',
      geo: [21.29589,-157.82039],
      capacity: 500,
      type: 'arts',
      cssVar: '--v-orvis',
      color: '#86ea86',
      url: 'https://manoa.hawaii.edu/music/events/',
      icon: 'https://www.google.com/s2/favicons?domain=manoa.hawaii.edu&sz=128',
    },
    'Bishop Museum': {
      island: 'honolulu',
      geo: [21.33308,-157.87071],
      capacity: 5000,
      type: 'community',
      cssVar: '--v-bishop',
      color: '#e1ea86',
      url: 'https://www.bishopmuseum.org/exhibits-and-programs/events/',
      icon: 'https://www.google.com/s2/favicons?domain=www.bishopmuseum.org&sz=128',
    },
    'ʻIolani Palace': {
      island: 'honolulu',
      geo: [21.30681,-157.85877],
      capacity: 1000,
      type: 'community',
      cssVar: '--v-iolani',
      color: '#86a4ea',
      url: 'https://www.iolanipalace.org/events/',
      icon: 'https://www.google.com/s2/favicons?domain=www.iolanipalace.org&sz=128',
    },
    'Hawaiian Mission Houses': {
      island: 'honolulu',
      geo: [21.3058,-157.8578],
      capacity: 300,
      type: 'community',
      cssVar: '--v-missionhouses',
      color: '#a786ea',
      url: 'https://missionhouses.org/events/',
      icon: 'https://www.google.com/s2/favicons?domain=missionhouses.org&sz=128',
    },
    'HB Social Club': {
      island: 'honolulu',
      geo: [21.29147,-157.83816],
      capacity: 800,
      type: 'concert',
      cssVar: '--v-hbsocial',
      color: '#86eac5',
      url: 'https://hbsocialclub.com/events/',
      icon: 'https://www.google.com/s2/favicons?domain=hbsocialclub.com&sz=128',
    },
    'The Republik': {
      island: 'honolulu',
      geo: [21.29357,-157.8454],
      capacity: 1000,
      type: 'concert',
      cssVar: '--v-republik',
      color: '#8b86ea',
      url: 'https://jointherepublik.com/',
      icon: 'https://www.google.com/s2/favicons?domain=jointherepublik.com&sz=128',
    },
    'Blue Note Hawaii': {
      island: 'honolulu',
      geo: [21.27715,-157.82767],
      capacity: 300,
      type: 'concert',
      cssVar: '--v-bluenote',
      color: '#eaa786',
      url: 'https://www.bluenotehawaii.com/',
      icon: 'https://www.google.com/s2/favicons?domain=www.bluenotehawaii.com&sz=128',
    },
    "Hula's Bar & Lei Stand": {
      island: 'honolulu',
      geo: [21.27182,-157.82187],
      capacity: 200,
      type: 'concert',
      cssVar: '--v-hulas',
      color: '#eac086',
      url: 'https://hulas.com/events/',
      icon: 'https://www.google.com/s2/favicons?domain=hulas.com&sz=128',
    },
    'Royal Hawaiian Center': {
      island: 'honolulu',
      geo: [21.27846,-157.82928],
      capacity: 500,
      type: 'community',
      cssVar: '--v-royalhawaiian',
      color: '#d686ea',
      url: 'https://www.royalhawaiiancenter.com/events',
      icon: 'https://www.google.com/s2/favicons?domain=www.royalhawaiiancenter.com&sz=128',
    },
    'SALT at Our Kakaʻako': {
      island: 'honolulu',
      geo: [21.29819,-157.86148],
      capacity: 2000,
      type: 'community',
      cssVar: '--v-salt',
      color: '#ea9a86',
      url: 'https://saltatkakaako.com/events/',
      icon: 'https://www.google.com/s2/favicons?domain=saltatkakaako.com&sz=128',
    },
    'Palikū Theatre': {
      island: 'honolulu',
      geo: [21.40856,-157.81347],
      capacity: 300,
      type: 'arts',
      cssVar: '--v-paliku',
      color: '#b8ea86',
      url: 'https://windward.hawaii.edu/campus-life/events-calendar/',
      icon: 'https://www.google.com/s2/favicons?domain=windward.hawaii.edu&sz=128',
    },
    'Waimea Valley': {
      island: 'honolulu',
      geo: [21.63637,-158.0548],
      capacity: 2000,
      type: 'community',
      cssVar: '--v-waimea',
      color: '#ea86d9',
      url: 'https://www.waimeavalley.net/events',
      icon: 'https://www.google.com/s2/favicons?domain=www.waimeavalley.net&sz=128',
    },
    // --- Maui ---
    'Maui Arts & Cultural Center': {
      island: 'maui',
      geo: [20.8927,-156.4804],
      capacity: 5000,
      type: 'arts',
      cssVar: '--v-macc',
      color: '#ea8686',
      url: 'https://mauiarts.org/events',
      icon: 'https://www.google.com/s2/favicons?domain=mauiarts.org&sz=128',
    },
    'ʻĪao Theater': {
      island: 'maui',
      geo: [20.88929,-156.50227],
      capacity: 350,
      type: 'arts',
      cssVar: '--v-iao',
      color: '#eac086',
      url: 'https://www.mauionstage.com/',
      icon: 'https://www.google.com/s2/favicons?domain=www.mauionstage.com&sz=128',
    },
    'Hale Hōʻikeʻike': {
      island: 'maui',
      geo: [20.88604,-156.50788],
      capacity: 200,
      type: 'community',
      cssVar: '--v-bailey',
      color: '#e1ea86',
      url: 'https://mauimuseum.org/events',
      icon: 'https://www.google.com/s2/favicons?domain=mauimuseum.org&sz=128',
    },
    'ProArts Playhouse': {
      island: 'maui',
      geo: [20.74933,-156.45697],
      capacity: 70,
      type: 'arts',
      cssVar: '--v-proarts',
      color: '#b8ea86',
      url: 'https://proartsmaui.org/events/',
      icon: 'https://www.google.com/s2/favicons?domain=proartsmaui.org&sz=128',
    },
    'Mulligans on the Blue': {
      island: 'maui',
      geo: [20.6898,-156.4393],
      capacity: 200,
      type: 'concert',
      cssVar: '--v-mulligans',
      color: '#86ea86',
      url: 'https://mulligansontheblue.com/events/',
      icon: 'https://www.google.com/s2/favicons?domain=mulligansontheblue.com&sz=128',
    },
    'Da Playground': {
      island: 'maui',
      geo: [20.7905,-156.5125],
      capacity: 500,
      type: 'concert',
      cssVar: '--v-playground',
      color: '#86eadc',
      url: 'https://www.daplaygroundmaui.com/collections/tickets',
      icon: 'https://www.google.com/s2/favicons?domain=www.daplaygroundmaui.com&sz=128',
    },
    'Pacific Whale Foundation': {
      island: 'maui',
      geo: [20.79278,-156.51188],
      capacity: 2000,
      type: 'community',
      cssVar: '--v-pwf',
      color: '#86c0ea',
      url: 'https://pacificwhale.org/how-you-can-help/events/',
      icon: 'https://www.google.com/s2/favicons?domain=pacificwhale.org&sz=128',
    },
    'Lahaina Civic Center': {
      island: 'maui',
      geo: [20.9044,-156.68367],
      capacity: 2400,
      type: 'sports',
      cssVar: '--v-civic',
      color: '#86a4ea',
      url: 'https://mauiinvitational.com/',
      icon: 'https://www.google.com/s2/favicons?domain=mauiinvitational.com&sz=128',
    },
    'Lahaina Cannery Mall': {
      island: 'maui',
      geo: [20.88631,-156.68416],
      capacity: 500,
      type: 'community',
      cssVar: '--v-cannery',
      color: '#a786ea',
      url: 'https://lahainacannerymall.com/',
      icon: 'https://www.google.com/s2/favicons?domain=lahainacannerymall.com&sz=128',
    },
    'Hui Noʻeau': {
      island: 'maui',
      geo: [20.87054,-156.32155],
      capacity: 300,
      type: 'arts',
      cssVar: '--v-hui',
      color: '#d686ea',
      url: 'https://www.huinoeau.com/exhibitions',
      icon: 'https://www.google.com/s2/favicons?domain=www.huinoeau.com&sz=128',
    },
    'Haleakalā National Park': {
      island: 'maui',
      geo: [20.71511,-156.24981],
      capacity: 300,
      type: 'community',
      cssVar: '--v-haleakala',
      color: '#ea86d9',
      url: 'https://www.nps.gov/hale/planyourvisit/calendar.htm',
      icon: 'https://www.google.com/s2/favicons?domain=www.nps.gov&sz=128',
    },
    'Lānaʻi Culture & Heritage Center': {
      island: 'maui',
      geo: [20.82607,-156.91803],
      capacity: 100,
      type: 'community',
      cssVar: '--v-lanai',
      color: '#ea869f',
      url: 'https://lanaichc.org/our-events/',
      icon: 'https://www.google.com/s2/favicons?domain=lanaichc.org&sz=128',
    },
    // --- Hawaiʻi Island — Kona & Kohala ---
    'KBXtreme': {
      island: 'bigisland',
      geo: [19.644,-155.988],
      capacity: 3300,
      type: 'concert',
      cssVar: '--v-kbx',
      color: '#86c8ea',
      url: 'https://www.kbxtreme.com/',
      icon: 'https://www.google.com/s2/favicons?domain=www.kbxtreme.com&sz=128',
    },
    'Kona Coffee Cultural Festival': {
      festival: true,      island: 'bigisland',
      geo: [19.63691,-155.99259],
      capacity: 5000,
      type: 'community',
      cssVar: '--v-coffeefest',
      color: '#eac886',
      url: 'https://konacoffeefest.com/calendar/',
      icon: 'https://www.google.com/s2/favicons?domain=konacoffeefest.com&sz=128',
    },
    'Aloha Theatre': {
      island: 'bigisland',
      geo: [19.53309,-155.92728],
      capacity: 350,
      type: 'arts',
      cssVar: '--v-aloha',
      color: '#ea8686',
      url: 'https://www.apachawaii.org/',
      icon: 'https://www.google.com/s2/favicons?domain=www.apachawaii.org&sz=128',
    },
    'Puʻuhonua o Hōnaunau National Historical Park': {
      island: 'bigisland',
      geo: [19.42239,-155.90943],
      capacity: 300,
      type: 'community',
      cssVar: '--v-puuhonua',
      color: '#86ea86',
      url: 'https://www.nps.gov/puho/planyourvisit/calendar.htm',
      icon: 'https://www.google.com/s2/favicons?domain=www.nps.gov&sz=128',
    },
    'Kaloko-Honokōhau National Historical Park': {
      island: 'bigisland',
      geo: [19.68182,-156.02709],
      capacity: 200,
      type: 'community',
      cssVar: '--v-kaloko',
      color: '#86eac8',
      url: 'https://www.nps.gov/kaho/planyourvisit/calendar.htm',
      icon: 'https://www.google.com/s2/favicons?domain=www.nps.gov&sz=128',
    },
    'Waikoloa Bowl at Queens’ Gardens': {
      island: 'bigisland',
      geo: [19.9135,-155.8812],
      capacity: 3000,
      type: 'concert',
      cssVar: '--v-bowl',
      color: '#c886ea',
      url: 'https://www.waikoloabeachresort.com/events/',
      icon: 'https://www.google.com/s2/favicons?domain=www.waikoloabeachresort.com&sz=128',
    },
    'Hilton Waikoloa Village': {
      island: 'bigisland',
      geo: [19.92459,-155.88893],
      capacity: 2000,
      type: 'concert',
      cssVar: '--v-hilton',
      color: '#8696ea',
      url: 'https://www.hilton.com/en/hotels/koahwhh-hilton-waikoloa-village/',
      icon: 'https://www.google.com/s2/favicons?domain=www.hilton.com&sz=128',
    },
    'Queens’ MarketPlace': {
      island: 'bigisland',
      geo: [19.91418,-155.88011],
      capacity: 1000,
      type: 'community',
      cssVar: '--v-queens',
      color: '#ea86d9',
      url: 'https://www.queensmarketplace.com/qmp-events/',
      icon: 'https://www.google.com/s2/favicons?domain=www.queensmarketplace.com&sz=128',
    },
    'Kings’ Shops': {
      island: 'bigisland',
      geo: [19.9172,-155.8818],
      capacity: 800,
      type: 'community',
      cssVar: '--v-kings',
      color: '#eaa786',
      url: 'https://kingsshops.com/events/',
      icon: 'https://www.google.com/s2/favicons?domain=kingsshops.com&sz=128',
    },
    'Kahilu Theatre': {
      island: 'bigisland',
      geo: [20.01912,-155.66737],
      capacity: 490,
      type: 'arts',
      cssVar: '--v-kahilu',
      color: '#eae186',
      url: 'https://kahilu.org/shows/',
      icon: 'https://www.google.com/s2/favicons?domain=kahilu.org&sz=128',
    },
    'Honokaʻa People’s Theatre': {
      island: 'bigisland',
      geo: [20.0787,-155.4665],
      capacity: 525,
      type: 'concert',
      cssVar: '--v-honokaa',
      color: '#eab386',
      url: 'https://www.honokaapeople.com/now-playing',
      icon: 'https://www.google.com/s2/favicons?domain=www.honokaapeople.com&sz=128',
    },
    'Puʻukoholā Heiau National Historic Site': {
      island: 'bigisland',
      geo: [20.02802,-155.82112],
      capacity: 300,
      type: 'community',
      cssVar: '--v-puukohola',
      color: '#a7ea86',
      url: 'https://www.nps.gov/puhe/planyourvisit/calendar.htm',
      icon: 'https://www.google.com/s2/favicons?domain=www.nps.gov&sz=128',
    },
    // --- Hawaiʻi Island — Hilo, Volcano & Hāmākua ---
    'Palace Theater': {
      island: 'bigisland',
      geo: [19.72458,-155.08651],
      capacity: 500,
      type: 'arts',
      cssVar: '--v-palace',
      color: '#ea8686',
      url: 'https://hilopalace.com/events/',
      icon: 'https://www.google.com/s2/favicons?domain=hilopalace.com&sz=128',
    },
    'UH Hilo Performing Arts Center': {
      island: 'bigisland',
      geo: [19.7031,-155.0846],
      capacity: 600,
      type: 'arts',
      cssVar: '--v-pac',
      color: '#c886ea',
      url: 'https://artscenter.uhh.hawaii.edu/future.php',
      icon: 'https://www.google.com/s2/favicons?domain=hilo.hawaii.edu&sz=128',
    },
    'Afook-Chinen Civic Auditorium': {
      island: 'bigisland',
      geo: [19.71811,-155.06953],
      capacity: 3500,
      type: 'sports',
      cssVar: '--v-hilo-civic',
      color: '#8696ea',
      url: 'https://www.hawaiicounty.gov/departments/parks-and-recreation',
      icon: 'https://www.google.com/s2/favicons?domain=www.hawaiicounty.gov&sz=128',
    },
    'Merrie Monarch Festival': {
      festival: true,      island: 'bigisland',
      geo: [19.7172,-155.0668],
      capacity: 4500,
      type: 'community',
      cssVar: '--v-merrie',
      color: '#eac886',
      url: 'https://www.merriemonarch.com/',
      icon: 'https://www.google.com/s2/favicons?domain=www.merriemonarch.com&sz=128',
    },
    'Crown Room at the Grand Naniloa': {
      island: 'bigisland',
      geo: [19.72957,-155.06493],
      capacity: 400,
      type: 'concert',
      cssVar: '--v-crown',
      color: '#ea86d9',
      url: 'https://grandnaniloahilo.com/onsite-events.htm',
      icon: 'https://www.google.com/s2/favicons?domain=grandnaniloahilo.com&sz=128',
    },
    'ʻImiloa Astronomy Center': {
      island: 'bigisland',
      geo: [19.70082,-155.08895],
      capacity: 300,
      type: 'community',
      cssVar: '--v-imiloa',
      color: '#86c8ea',
      url: 'https://imiloahawaii.org/event-calendar',
      icon: 'https://www.google.com/s2/favicons?domain=imiloahawaii.org&sz=128',
    },
    'Vulcan Gym & Fields': {
      island: 'bigisland',
      geo: [19.7005,-155.0825],
      capacity: 2000,
      type: 'sports',
      cssVar: '--v-vulcans',
      color: '#eaa786',
      url: 'https://hiloathletics.com/calendar',
      icon: 'https://www.google.com/s2/favicons?domain=hiloathletics.com&sz=128',
    },
    'Hawaiʻi Volcanoes National Park': {
      island: 'bigisland',
      geo: [19.4295,-155.2573],
      capacity: 500,
      type: 'community',
      cssVar: '--v-volcanoes',
      color: '#eae186',
      url: 'https://www.nps.gov/havo/planyourvisit/calendar.htm',
      icon: 'https://www.google.com/s2/favicons?domain=www.nps.gov&sz=128',
    },
    'Volcano Art Center': {
      island: 'bigisland',
      geo: [19.44417,-155.20725],
      capacity: 150,
      type: 'arts',
      cssVar: '--v-vac',
      color: '#86eac8',
      url: 'https://volcanoartcenter.org/ep-events/',
      icon: 'https://www.google.com/s2/favicons?domain=volcanoartcenter.org&sz=128',
    },
  };

  var HOODS = [
    { label: 'Oʻahu', venues: ['Blaisdell Arena', 'Blaisdell Concert Hall', 'Blaisdell Exhibition Hall', 'Stan Sheriff Center', 'Ching Athletics Complex', 'Waikiki Shell', 'Hawaii Theatre Center', 'Diamond Head Theatre', 'Kumu Kahua Theatre', 'Honolulu Museum of Art', 'Orvis Auditorium', 'Bishop Museum', 'ʻIolani Palace', 'Hawaiian Mission Houses', 'HB Social Club', 'The Republik', 'Blue Note Hawaii', "Hula's Bar & Lei Stand", 'Royal Hawaiian Center', 'SALT at Our Kakaʻako', 'Palikū Theatre', 'Waimea Valley'] },
    { label: 'Maui', venues: ['Maui Arts & Cultural Center', 'ʻĪao Theater', 'Hale Hōʻikeʻike', 'ProArts Playhouse', 'Mulligans on the Blue', 'Da Playground', 'Pacific Whale Foundation', 'Lahaina Civic Center', 'Lahaina Cannery Mall', 'Hui Noʻeau', 'Haleakalā National Park', 'Lānaʻi Culture & Heritage Center'] },
    { label: 'Hawaiʻi Island — Kona & Kohala', venues: ['KBXtreme', 'Kona Coffee Cultural Festival', 'Aloha Theatre', 'Puʻuhonua o Hōnaunau National Historical Park', 'Kaloko-Honokōhau National Historical Park', 'Waikoloa Bowl at Queens’ Gardens', 'Hilton Waikoloa Village', 'Queens’ MarketPlace', 'Kings’ Shops', 'Kahilu Theatre', 'Honokaʻa People’s Theatre', 'Puʻukoholā Heiau National Historic Site'] },
    { label: 'Hawaiʻi Island — Hilo, Volcano & Hāmākua', venues: ['Palace Theater', 'UH Hilo Performing Arts Center', 'Afook-Chinen Civic Auditorium', 'Merrie Monarch Festival', 'Crown Room at the Grand Naniloa', 'ʻImiloa Astronomy Center', 'Vulcan Gym & Fields', 'Hawaiʻi Volcanoes National Park', 'Volcano Art Center'] },
  ];

  // Rooms off by default on their own island's site stay off here
  var DEFAULT_ON = ['Blaisdell Arena', 'Blaisdell Concert Hall', 'Blaisdell Exhibition Hall', 'Stan Sheriff Center', 'Ching Athletics Complex', 'Waikiki Shell', 'Hawaii Theatre Center', 'Diamond Head Theatre', 'Kumu Kahua Theatre', 'Honolulu Museum of Art', 'Orvis Auditorium', 'Bishop Museum', 'ʻIolani Palace', 'Hawaiian Mission Houses', 'HB Social Club', 'The Republik', 'Royal Hawaiian Center', 'Palikū Theatre', 'Waimea Valley', 'Maui Arts & Cultural Center', 'ʻĪao Theater', 'Hale Hōʻikeʻike', 'ProArts Playhouse', 'Mulligans on the Blue', 'Da Playground', 'Pacific Whale Foundation', 'Lahaina Civic Center', 'Lahaina Cannery Mall', 'Hui Noʻeau', 'Haleakalā National Park', 'Lānaʻi Culture & Heritage Center', 'KBXtreme', 'Kona Coffee Cultural Festival', 'Aloha Theatre', 'Puʻuhonua o Hōnaunau National Historical Park', 'Kaloko-Honokōhau National Historical Park', 'Waikoloa Bowl at Queens’ Gardens', 'Hilton Waikoloa Village', 'Queens’ MarketPlace', 'Kings’ Shops', 'Kahilu Theatre', 'Honokaʻa People’s Theatre', 'Puʻukoholā Heiau National Historic Site', 'Palace Theater', 'UH Hilo Performing Arts Center', 'Afook-Chinen Civic Auditorium', 'Merrie Monarch Festival', 'Crown Room at the Grand Naniloa', 'ʻImiloa Astronomy Center', 'Vulcan Gym & Fields', 'Hawaiʻi Volcanoes National Park', 'Volcano Art Center'];
  var DEFAULT_OFF = ['Blue Note Hawaii', "Hula's Bar & Lei Stand", 'SALT at Our Kakaʻako'];


  var HOODS_REST = 'Elsewhere in the islands';
  var PREFS_KNOWN_FROM = null;

  // Event types: every event lands in exactly one, from its flags, title,
  // then venue. The rows the panel shows, in order.
  var TYPES = [
    { key: 'concert', label: 'Concerts', title: 'Live music — arena tours to club nights' },
    { key: 'sports', label: 'Sports', title: 'Rainbow Warriors football and basketball, Rainbow Wahine volleyball — home games' },
    { key: 'arts', label: 'Arts & Theater', title: 'Broadway tours and the symphony at the Blaisdell, the MACC, the Hawaii Theatre, the Palace, the Kahilu — plays, dance, film, the exhibitions' },
    { key: 'community', label: 'Community', title: 'The museums and palaces, the parks’ programmes, the festivals, the markets' },
  ];
  var MOVIE_VENUE = null; // no cinema here

  // Share codes (?f=CODE): REGISTRY is every filterable key in a fixed
  // order and a code is a bitmask over it, so the list is APPEND-ONLY —
  // adding an entry adds a bit and every existing code keeps meaning what
  // it meant; removing or reordering one changes every link out there.
  // 66 slots from the first build (55 rooms + 4 types + 3 teams + 4 sizes): thirteen base-36 digits.
  var CODE_LENGTH = 13;
  var REGISTRY = [
    ['venue', 'Blaisdell Arena'], ['venue', 'Blaisdell Concert Hall'], ['venue', 'Blaisdell Exhibition Hall'], ['venue', 'Stan Sheriff Center'], ['venue', 'Ching Athletics Complex'], ['venue', 'Waikiki Shell'], ['venue', 'Hawaii Theatre Center'], ['venue', 'Diamond Head Theatre'], ['venue', 'Kumu Kahua Theatre'], ['venue', 'Honolulu Museum of Art'], ['venue', 'Orvis Auditorium'], ['venue', 'Bishop Museum'], ['venue', 'ʻIolani Palace'], ['venue', 'Hawaiian Mission Houses'], ['venue', 'HB Social Club'], ['venue', 'The Republik'], ['venue', 'Blue Note Hawaii'], ['venue', "Hula's Bar & Lei Stand"], ['venue', 'Royal Hawaiian Center'], ['venue', 'SALT at Our Kakaʻako'], ['venue', 'Palikū Theatre'], ['venue', 'Waimea Valley'], ['venue', 'Maui Arts & Cultural Center'], ['venue', 'ʻĪao Theater'], ['venue', 'Hale Hōʻikeʻike'], ['venue', 'ProArts Playhouse'], ['venue', 'Mulligans on the Blue'], ['venue', 'Da Playground'], ['venue', 'Pacific Whale Foundation'], ['venue', 'Lahaina Civic Center'], ['venue', 'Lahaina Cannery Mall'], ['venue', 'Hui Noʻeau'], ['venue', 'Haleakalā National Park'], ['venue', 'Lānaʻi Culture & Heritage Center'], ['venue', 'KBXtreme'], ['venue', 'Kona Coffee Cultural Festival'], ['venue', 'Aloha Theatre'], ['venue', 'Puʻuhonua o Hōnaunau National Historical Park'], ['venue', 'Kaloko-Honokōhau National Historical Park'], ['venue', 'Waikoloa Bowl at Queens’ Gardens'], ['venue', 'Hilton Waikoloa Village'], ['venue', 'Queens’ MarketPlace'], ['venue', 'Kings’ Shops'], ['venue', 'Kahilu Theatre'], ['venue', 'Honokaʻa People’s Theatre'], ['venue', 'Puʻukoholā Heiau National Historic Site'], ['venue', 'Palace Theater'], ['venue', 'UH Hilo Performing Arts Center'], ['venue', 'Afook-Chinen Civic Auditorium'], ['venue', 'Merrie Monarch Festival'], ['venue', 'Crown Room at the Grand Naniloa'], ['venue', 'ʻImiloa Astronomy Center'], ['venue', 'Vulcan Gym & Fields'], ['venue', 'Hawaiʻi Volcanoes National Park'], ['venue', 'Volcano Art Center'],
    ['badge', 'concert'], ['badge', 'sports'], ['badge', 'arts'], ['badge', 'community'],
    ['team', 'football'], ['team', 'basketball'], ['team', 'volleyball'],
    ['cap', 'stadium'], ['cap', 'arena'], ['cap', 'hall'], ['cap', 'room'],
  ];

  // The words the page uses for the place
  var WORDS = {
    teamCity: 'Hawaii',  // the programs' names on Ticketmaster and ESPN // the board drops it from the programs' names ("Hawaii Rainbow Warriors Football" → Rainbow Warriors Football)
    presetDefault: 'Every room on every island — Oʻahu, Maui and Hawaiʻi Island — every team and type',
    presetNeighborhood: 'Every room the island sites list — the same as the usual view here',
    presetBig: 'Only the places that hold 2,000 or more — the Blaisdell, the Shell, the university grounds, the MACC, the Lahaina Civic Center, the Waikoloa Bowl, the Civic in Hilo',
    phrases: { all: 'Showing everything.', none: 'Showing nothing yet — open Filter and pick some venues.', neighborhood: 'Showing every room on every island.', big: 'Showing the big rooms only — the arenas, the concert halls and the grounds.' },
  };

  // City-wide feeds (scripts/feeds.mjs): none — the island sites read every room
  var FEEDS = [];

  // Hawaiʻi's public holidays (app.js holidaysFor reads this instead of its
  // Seattle list): the federal set without Columbus Day and Juneteenth, which
  // the state does not observe, plus its own three — Prince Kūhiō Day, King
  // Kamehameha I Day and Statehood Day — and Good Friday.
  function nthWeekday(y, month, weekday, n) { var d = new Date(y, month, 1); while (d.getDay() !== weekday) d.setDate(d.getDate() + 1); d.setDate(d.getDate() + (n - 1) * 7); return d; }
  function lastMonday(y, month) { var d = new Date(y, month + 1, 0); while (d.getDay() !== 1) d.setDate(d.getDate() - 1); return d; }
  function easter(y) { // Gregorian computus (Meeus/Jones/Butcher)
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    var h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    var month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, month - 1, day);
  }
  var HOLIDAYS = function (y) {
    var gf = easter(y); gf.setDate(gf.getDate() - 2);
    return [
      [new Date(y, 0, 1), "New Year's Day"],
      [nthWeekday(y, 0, 1, 3), 'Martin Luther King Jr. Day'],
      [nthWeekday(y, 1, 1, 3), "Presidents' Day"],
      [new Date(y, 2, 26), 'Prince Kūhiō Day'],
      [gf, 'Good Friday'],
      [lastMonday(y, 4), 'Memorial Day'],
      [new Date(y, 5, 11), 'King Kamehameha I Day'],
      [new Date(y, 6, 4), 'Independence Day'],
      [nthWeekday(y, 7, 5, 3), 'Statehood Day'],
      [nthWeekday(y, 8, 1, 1), 'Labor Day'],
      [new Date(y, 10, 11), 'Veterans Day'],
      [nthWeekday(y, 10, 4, 4), 'Thanksgiving'],
      [new Date(y, 11, 25), 'Christmas Day'],
    ];
  };

  global.LQACity = {
    key: 'hawaii',
    name: 'Hawaiʻi',
    site: 'https://hawaii.here.events/',
    userAgent: 'Mozilla/5.0 (compatible; hawaii-events/1.0; +https://hawaii.here.events/)',
    // the island sites whose feeds this site reads (fetch-events.mjs sisterFeed), in the panel's order
    sisters: [
      { key: 'honolulu', label: 'Oʻahu', url: 'https://honolulu.here.events/events.json' },
      { key: 'maui', label: 'Maui', url: 'https://maui.here.events/events.json' },
      { key: 'bigisland', label: 'Hawaiʻi Island', url: 'https://bigisland.here.events/events.json' }, // Kona and Hilo were separate sites for one day (2026-10-25); bigisland.here.events merged them
    ],
    tz: 'Pacific/Honolulu', tzName: 'Hawaii', // the city's time zone (no daylight time): the ICS feed's TZID, the game clocks, the poster's footer
    state: "Hawaii", stateOutline: 'M3.7 6.3L3.3 6.5L3.1 6.4L2.7 6.3L2.6 6.2L2.2 6.0L2.0 5.8L2.3 5.4L2.8 5.0L3.8 5.0L3.9 5.3L4.0 5.5L3.8 5.7L3.8 6.1L3.7 6.3ZM10.0 8.3L10.1 8.3L10.3 8.3L10.4 8.6L10.6 8.8L10.6 8.9L10.4 9.1L10.0 9.1L9.8 9.0L9.6 8.8L9.3 8.9L9.3 8.7L9.3 8.6L9.1 8.7L9.3 8.9L8.9 8.9L8.7 8.9L8.6 8.6L8.2 8.2L8.2 8.0L8.1 7.7L8.7 7.7L9.1 7.3L9.3 7.2L9.8 7.9L9.8 8.1L9.9 8.2L10.0 8.3ZM12.3 9.3L13.2 9.4L13.4 9.4L13.5 9.5L14.2 9.6L14.3 9.6L14.2 9.8L13.8 10.0L13.1 9.8L12.0 9.8L12.1 9.6L12.2 9.5L12.2 9.3L12.3 9.3ZM15.2 10.5L15.4 10.6L15.8 10.5L16.1 10.5L16.6 10.7L16.8 10.9L17.1 11.1L17.2 11.3L17.1 11.5L16.8 11.8L16.3 11.8L16.0 12.0L15.6 11.9L15.4 11.9L15.4 11.5L15.3 11.1L15.0 11.2L14.7 11.0L14.4 10.7L14.4 10.5L14.6 10.1L14.9 10.1L15.1 10.3L15.2 10.5ZM18.9 18.8L18.7 19.0L18.5 19.0L17.7 18.5L17.6 18.3L17.6 17.2L17.3 16.3L17.0 15.6L17.2 15.3L17.6 15.0L17.9 14.5L17.6 13.8L17.7 13.4L17.9 13.4L18.7 13.8L20.4 14.6L20.9 15.1L20.9 15.6L21.3 15.7L21.4 16.1L21.9 16.4L22.0 16.6L21.8 16.9L21.0 17.5L20.0 17.7L19.1 18.4L18.9 18.8Z', // the masthead's small state, linking to here.events (scripts/state-outline.mjs, Natural Earth 1:50m)
    // the calendar feed's header; the UID domain never changes (changing it
    // re-creates every event in subscribers' calendars)
    ics: { name: 'Hawaiʻi Events', short: 'Hawaiʻi Events', teams: 'Hawaiʻi home teams — every season', prodid: '-//here.events//hawaii-events//EN', uidDomain: 'fosdal.net', // the UID domain the whole family issues (the shared ics test pins it)
      desc: 'Upcoming events across the Hawaiian Islands — Oʻahu\\, Maui and Hawaiʻi Island\\, from the island calendars at here.events' },
    teams: TEAMS,
    // the Map view (site/local-map.js, the Map stop): the ground scripts/build-local-map.mjs draws into site/local-map.json
    // — the eight main islands from Natural Earth (public domain), Niʻihau and Kahoʻolawe faint — with a pin on every
    // room above that carries geo: [lat, lon]. The frame is the whole chain, Kauaʻi to Hawaiʻi.
    map: {
      kind: 'island',
      country: 'USA',
      land: [[22.05, -159.5], [21.45, -158.0], [21.15, -157.0], [20.83, -156.92], [20.8, -156.3], [19.6, -155.5]], // Kauaʻi, Oʻahu, Molokaʻi, Lānaʻi, Maui, Hawaiʻi — a point on each ring to draw as land
      far: [[21.9, -160.15], [20.55, -156.6]], // Niʻihau and Kahoʻolawe, faint
      pad: 0.04,
      labels: [ // the places a visitor steers by; anchor: which side of the dot the name sits
        { name: 'Honolulu', lat: 21.307, lon: -157.858, anchor: 'end', dy: 14 },
        { name: 'Līhuʻe', lat: 21.981, lon: -159.371, anchor: 'start' },
        { name: 'Kahului', lat: 20.889, lon: -156.474, anchor: 'start', dy: -8 },
        { name: 'Lahaina', lat: 20.878, lon: -156.682, anchor: 'end', dy: 12 },
        { name: 'Kailua-Kona', lat: 19.64, lon: -155.996, anchor: 'end' },
        { name: 'Hilo', lat: 19.724, lon: -155.087, anchor: 'start' },
        { name: 'Waimea', lat: 20.023, lon: -155.668, anchor: 'start', dy: -6 },
        { name: 'Mauna Kea', lat: 19.821, lon: -155.468, kind: 'peak' },
        { name: 'Haleakalā', lat: 20.71, lon: -156.25, kind: 'peak' },
      ],
    },
    venues: VENUES,
    hoods: HOODS, hoodsRest: HOODS_REST,
    feeds: FEEDS,
    defaultOn: DEFAULT_ON,
    defaultOff: DEFAULT_OFF,
    prefsKnownFrom: PREFS_KNOWN_FROM,
    types: TYPES,
    movieVenue: MOVIE_VENUE,
    groundsVenue: null, // every listing is read by room, so nothing arrives under a name city.js lacks
    codeLength: CODE_LENGTH,
    registry: REGISTRY,
    words: WORDS,
    holidays: HOLIDAYS,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
