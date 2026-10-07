// skript/bygg-seo.mjs — bygger de statiska kurssidorna för sökmotorer och AI-assistenter.
//
// Sajten (index.html) ritar kurserna med JavaScript, och robotar som GPTBot och ClaudeBot
// kör i princip inte JavaScript. Därför skapas här en vanlig HTML-sida per kurs, en
// översikt (kurser/index.html), sitemap.xml och robots.txt — allt läst DIREKT ur
// kurskatalogen i index.html, så att namn, priser och innehåll alltid stämmer med sajten.
//
// Kör efter varje ändring i kurskatalogen:   node skript/bygg-seo.mjs
// Committa sedan kurser/, sitemap.xml och robots.txt.

import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const ROT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SAJT = 'https://nordicagiracademy.se';
const IDAG = new Date().toISOString().slice(0, 10);
const MOMS = 1.25; // samma som api/create-checkout-session.js

// ---- 1. Läs kurskatalogen ur index.html -------------------------------------------
const html = fs.readFileSync(path.join(ROT, 'index.html'), 'utf8');
const start = html.indexOf('const CATS=');
const slut = html.indexOf('\nlet activeFilter', start); // katalogen slutar där sidans logik börjar
if (start < 0 || slut < start) throw new Error('Hittar inte kurskatalogen (CATS … DETAILS) i index.html');
const katalog = vm.runInNewContext(
  html.slice(start, slut) + ';({CATS,COURSES,KURSORDNING,DETAILS})', {}
);
const { CATS, COURSES, KURSORDNING, DETAILS } = katalog;
const ordning = (id) => { const i = KURSORDNING.indexOf(id); return i < 0 ? 999 : i; };
const kurser = [...COURSES].sort((a, b) => ordning(a.id) - ordning(b.id));
const perId = Object.fromEntries(kurser.map((c) => [c.id, c]));
const fel = kurser.filter((c) => !DETAILS[c.id]).map((c) => c.id);
if (fel.length) throw new Error('Kurser utan DETAILS i index.html: ' + fel.join(', '));

// ---- 2. Hjälpfunktioner ----------------------------------------------------------
const eh = (s) => String(s ?? '').replace(/[&<>"']/g, (t) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[t]));
const kr = (n, en) => n.toLocaleString('sv-SE', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 }).replace(/ /g, ' ') + (en ? ' SEK' : ' kr');
const inklMoms = (p) => Math.round(p * MOMS * 100) / 100; // exakt det Stripe debiterar
const origOf = (c) => c.orig || c.price;
const arEngelsk = (c) => c.cat === 'english';
const sida = (c) => `${SAJT}/kurser/${c.id}.html`;
const kopLank = (c) => `${SAJT}/#kurs/${c.id}`;
// "ca 3–4 tim" / "approx. 2 h" -> PT4H (övre gränsen)
const arbetstid = (dur) => { const t = String(dur).match(/\d+/g); return t ? `PT${Math.max(...t.map(Number))}H` : undefined; };
const tid = (c) => arEngelsk(c) ? c.dur : String(c.dur).replace(/^ca /, 'ca ');
const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');

const T = {
  sv: {
    lang: 'sv', online: 'Distanskurs', exkl: 'exkl. moms', inkl: 'inkl. moms', ord: 'ordinarie',
    prisrad: 'Kort, Klarna eller faktura (30 dagar för företag).',
    cert: 'Personligt certifikat efter godkänt prov — giltigt 5 år, QR-verifierbart, skickas per mejl.',
    enhet: 'Mobil, platta och dator', kop: 'Till kursen och köp →', vem: 'Vem passar kursen för?',
    mal: 'Efter kursen kan du', inneh: 'Kursinnehåll', faq: 'Vanliga frågor', alla: (n) => `← Alla ${n} kurser`,
    sprak: (l) => `🇬🇧 Kursen finns även på engelska: <a href="${l}">läs mer</a>`,
    villkor: 'Köpvillkor', integritet: 'Integritetspolicy', del: 'En del av Nordic Agir AB',
    titel: (c) => `${c.title} | ${kr(c.price)} — distanskurs med certifikat`,
    cred: 'Certifikat, giltigt 5 år',
    fragor: (c) => [
      ['Vad kostar kursen?', `Just nu ${kr(c.price)} exkl. moms (${kr(inklMoms(c.price))} inkl. 25 % moms), ordinarie pris ${kr(origOf(c))}. Betala med kort, Klarna eller faktura (30 dagar för företag).`],
      ['Hur lång är kursen?', `${tid(c).replace(/^ca/, 'Cirka')} — helt i din egen takt, pausa och fortsätt när du vill. Tillgången till kursen gäller i minst tolv månader.`],
      ['Får jag ett certifikat eller intyg?', 'Ja. Efter godkänt kunskapsprov får du ett personligt certifikat per mejl, giltigt i fem år, med QR-kod som arbetsgivare kan skanna för att kontrollera äktheten. Du gör om provet så många gånger du behöver utan extra kostnad.'],
      ['Är kursen på distans?', 'Ja, helt online — mobil, surfplatta eller dator. Du startar direkt efter köpet, det finns ingen schemalagd kurstid.'],
      ['Kan vi beställa till flera anställda?', 'Ja — lägg flera deltagare i samma beställning och betala mot faktura (30 dagar). För större grupper eller ramavtal ger vi paketpris: mejla academy@nordicagir.se.'],
    ],
  },
  en: {
    lang: 'en', online: 'Online course · In English', exkl: 'excl. VAT', inkl: 'incl. VAT', ord: 'regular price',
    prisrad: 'Card, Klarna or invoice (30 days for companies).',
    cert: 'Personal certificate after a passed exam — valid 5 years, QR-verifiable, sent by email.',
    enhet: 'Phone, tablet and computer', kop: 'Go to course and buy →', vem: 'Who is this course for?',
    mal: 'After the course you will be able to', inneh: 'Course content', faq: 'Frequently asked questions', alla: (n) => `← All ${n} courses`,
    sprak: (l) => `🇸🇪 Kursen finns även på svenska: <a href="${l}" hreflang="sv" lang="sv">läs mer</a>`,
    villkor: 'Terms of purchase', integritet: 'Privacy policy', del: 'Part of Nordic Agir AB',
    titel: (c) => `${c.title} | ${kr(c.price, 1)} — online course with certificate`,
    cred: 'Certificate, valid 5 years',
    fragor: (c) => [
      ['What does the course cost?', `Currently ${kr(c.price, 1)} excl. VAT (${kr(inklMoms(c.price), 1)} incl. 25% VAT), regular price ${kr(origOf(c), 1)}. Pay by card, Klarna or invoice (30 days for companies).`],
      ['How long does it take?', `${String(c.dur).replace(/^approx\./, 'About')}, entirely at your own pace — pause and resume whenever you like. Access to the course lasts at least twelve months.`],
      ['Do I get a certificate?', 'Yes. After passing the final exam you receive a personal certificate by email, valid for five years, with a QR code employers can scan to verify it. You can retake the exam as many times as you need at no extra cost.'],
      ['Is the course fully online?', 'Yes, 100% online and entirely in English — phone, tablet or computer. You start immediately after purchase; there are no scheduled sessions.'],
      ['Can we order for several employees?', 'Yes — add several participants to one order and pay by invoice (30 days). For larger groups or framework agreements we offer volume pricing: email academy@nordicagir.se.'],
    ],
  },
};

const STIL = `body{font-family:-apple-system,Segoe UI,Arial,sans-serif;margin:0;color:#232122;line-height:1.65;background:#fff;overflow-wrap:break-word;hyphens:auto}
a{color:#0077AD}header{background:#232122;color:#fff;padding:14px 22px;font-weight:700}
header a{color:#fff;text-decoration:none}header span{color:#00ADEF}
main{max-width:860px;margin:0 auto;padding:28px 22px 60px}
h1{font-size:1.9em;line-height:1.25;margin:.2em 0}h2{margin-top:1.6em;font-size:1.25em}h3{font-size:1.05em;margin-bottom:.2em}
.sub{color:#5a5757;font-size:1.05em}
.sprak{background:#f5f9fb;padding:10px 14px;font-size:.95em}
.prisruta{background:#f5f9fb;border-left:5px solid #00ADEF;padding:16px 20px;margin:20px 0}
.prisruta b{font-size:1.5em;color:#00537A}.gammalt{text-decoration:line-through;color:#767373}
.cta{display:inline-block;background:#0077AD;color:#fff;padding:13px 26px;font-weight:700;text-decoration:none;margin:8px 0}
ul{padding-left:22px}li{margin:5px 0}
.modul{border-left:3px solid #ddd;padding:6px 14px;margin:10px 0}.modul b{display:block}
.fakta{display:flex;gap:10px 26px;flex-wrap:wrap;font-size:.95em;color:#5a5757;margin:14px 0}
footer{background:#f3f2ef;padding:26px 22px;font-size:.88em;color:#5a5757;margin-top:50px}
footer a{color:#5a5757}`;

const leverantor = {
  '@type': 'Organization', name: 'Nordic Agir Academy', url: SAJT, logo: `${SAJT}/apple-touch-icon.png`,
  parentOrganization: { '@type': 'Organization', name: 'Nordic Agir AB', taxID: '559516-5373' },
};

const sidhuvud = (t) => `<header><a href="${SAJT}">Nordic <span>Agir</span> Academy</a></header>`;
const sidfot = (t) => `<footer>Nordic Agir Academy · ${t.del} · Org.nr 559516-5373 · Anläggarvägen 34, Handen<br>
academy@nordicagir.se · 073-912 97 89 · <a href="${SAJT}/#kopvillkor">${t.villkor}</a> · <a href="${SAJT}/#integritetspolicy">${t.integritet}</a></footer>`;

// ---- 3. En sida per kurs --------------------------------------------------------
function kurssida(c) {
  const t = arEngelsk(c) ? T.en : T.sv;
  const d = DETAILS[c.id];
  const tvilling = perId[c.en || c.sv];
  const fragor = t.fragor(c);
  const kategori = arEngelsk(c) ? t.online : `${CATS[c.cat]?.name || ''} · ${t.online}`;
  const alt = tvilling
    ? `<link rel="alternate" hreflang="${t.lang}" href="${sida(c)}">\n<link rel="alternate" hreflang="${arEngelsk(c) ? 'sv' : 'en'}" href="${sida(tvilling)}">\n`
    : '';
  const kurs = {
    '@context': 'https://schema.org', '@type': 'Course', name: c.title, description: c.desc,
    provider: leverantor, url: sida(c), inLanguage: t.lang, educationalCredentialAwarded: t.cred,
    teaches: d.goals,
    offers: {
      '@type': 'Offer', price: String(c.price), priceCurrency: 'SEK', url: kopLank(c), category: 'Paid',
      availability: 'https://schema.org/InStock',
      priceSpecification: { '@type': 'UnitPriceSpecification', price: c.price, priceCurrency: 'SEK', valueAddedTaxIncluded: false },
    },
    hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'Online', courseWorkload: arbetstid(c.dur) },
  };
  const faq = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: fragor.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
  return `<!DOCTYPE html>
<html lang="${t.lang}">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${eh(t.titel(c))}</title>
<meta name="description" content="${eh(c.desc)}">
<link rel="canonical" href="${sida(c)}">
${alt}<meta property="og:title" content="${eh(c.title)}">
<meta property="og:description" content="${eh(c.desc)}">
<meta property="og:url" content="${sida(c)}">
<meta property="og:type" content="website">
<meta property="og:image" content="${SAJT}/og-image.png">
<link rel="icon" href="${SAJT}/favicon.png">
<script type="application/ld+json">${json(kurs)}</script>
<script type="application/ld+json">${json(faq)}</script>
<style>${STIL}</style>
</head>
<body>
${sidhuvud(t)}
<main>
<p class="sub">${eh(kategori)}</p>
<h1>${eh(c.title)}</h1>
<p class="sub">${eh(c.desc)}</p>
${tvilling ? `<p class="sprak">${t.sprak(`${tvilling.id}.html`)}</p>\n` : ''}<div class="fakta"><span>⏱ ${eh(tid(c))}</span><span>🎓 ${t.cert}</span><span>📱 ${t.enhet}</span></div>
<div class="prisruta"><b>${kr(c.price, arEngelsk(c))}</b> ${t.exkl} &nbsp;·&nbsp; ${kr(inklMoms(c.price), arEngelsk(c))} ${t.inkl}${origOf(c) > c.price ? ` &nbsp;·&nbsp; <span class="gammalt">${kr(origOf(c), arEngelsk(c))}</span> ${t.ord}` : ''}<br><span style="font-size:.9em">${t.prisrad}</span></div>
<a class="cta" href="${kopLank(c)}">${t.kop}</a>
<h2>${t.vem}</h2><p>${eh(d.audience)}</p>
<h2>${t.mal}</h2><ul>${d.goals.map((g) => `<li>${eh(g)}</li>`).join('')}</ul>
<h2>${t.inneh}</h2>${d.modules.map((m) => `<div class="modul"><b>${eh(m.t ?? m.title ?? m[0])}</b>${eh(m.d ?? m.desc ?? m[1] ?? '')}</div>`).join('')}
<h2>${t.faq}</h2>${fragor.map(([q, a]) => `<h3>${eh(q)}</h3><p>${eh(a)}</p>`).join('')}
<p><a class="cta" href="${kopLank(c)}">${t.kop}</a></p>
<p><a href="${SAJT}/kurser/">${t.alla(kurser.length)}</a></p>
</main>
${sidfot(t)}
</body></html>
`;
}

// ---- 4. Översikten kurser/index.html -------------------------------------------
function oversikt() {
  const lagst = Math.min(...kurser.map((c) => c.price));
  const grupper = Object.keys(CATS)
    .map((k) => [k, kurser.filter((c) => c.cat === k)])
    .filter(([, l]) => l.length);
  const lista = {
    '@context': 'https://schema.org', '@type': 'ItemList', name: 'Kurser hos Nordic Agir Academy',
    numberOfItems: kurser.length,
    itemListElement: kurser.map((c, i) => ({ '@type': 'ListItem', position: i + 1, url: sida(c), name: c.title })),
  };
  return `<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Alla kurser och priser | ${kurser.length} distanskurser för bygg och anläggning — Nordic Agir Academy</title>
<meta name="description" content="${kurser.length} distanskurser med certifikat för bygg- och anläggningsbranschen, varav ${kurser.filter(arEngelsk).length} på engelska. Plugga i egen takt, priser från ${kr(lagst)} exkl. moms.">
<link rel="canonical" href="${SAJT}/kurser/">
<meta property="og:title" content="Alla kurser och priser — Nordic Agir Academy">
<meta property="og:url" content="${SAJT}/kurser/">
<meta property="og:image" content="${SAJT}/og-image.png">
<link rel="icon" href="${SAJT}/favicon.png">
<script type="application/ld+json">${json(lista)}</script>
<style>${STIL}</style>
</head>
<body>
${sidhuvud(T.sv)}
<main>
<h1>${kurser.length} distanskurser med certifikat för bygg och anläggning</h1>
<p class="sub">Certifikat giltigt i fem år efter godkänt kunskapsprov. Plugga i egen takt — start direkt efter köp. Betala med kort, Klarna eller faktura. Priser från ${kr(lagst)} exkl. moms.</p>
${grupper.map(([k, l]) => `<h2${k === 'english' ? ' lang="en"' : ''}>${eh(CATS[k].name)}</h2><ul>${l.map((c) => `<li><a href="${c.id}.html">${eh(c.title)}</a> — ${kr(c.price)} exkl. moms</li>`).join('')}</ul>`).join('\n')}
<p><a class="cta" href="${SAJT}">Till kursbutiken →</a></p>
</main>
${sidfot(T.sv)}
</body></html>
`;
}

// ---- 5. Skriv filerna -----------------------------------------------------------
const MAPP = path.join(ROT, 'kurser');
fs.rmSync(MAPP, { recursive: true, force: true }); // borttagna kurser ska inte ligga kvar
fs.mkdirSync(MAPP);
for (const c of kurser) fs.writeFileSync(path.join(MAPP, `${c.id}.html`), kurssida(c));
fs.writeFileSync(path.join(MAPP, 'index.html'), oversikt());

const adresser = [`${SAJT}/`, `${SAJT}/kurser/`, ...kurser.map(sida)];
fs.writeFileSync(path.join(ROT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${adresser.map((u) => `  <url><loc>${u}</loc><lastmod>${IDAG}</lastmod></url>`).join('\n')}
</urlset>
`);

const robotar = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User',
  'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Bingbot', 'CCBot', 'Amazonbot', 'meta-externalagent'];
fs.writeFileSync(path.join(ROT, 'robots.txt'), `# Nordic Agir Academy — alla seriösa robotar är välkomna, även AI-assistenter.
# Genererad av skript/bygg-seo.mjs.
User-agent: *
Allow: /
Disallow: /api/

${robotar.map((r) => `User-agent: ${r}\nAllow: /\nDisallow: /api/\n`).join('\n')}
Sitemap: ${SAJT}/sitemap.xml
`);

console.log(`Klart: ${kurser.length} kurssidor (${kurser.filter(arEngelsk).length} på engelska), kurser/index.html, sitemap.xml (${adresser.length} adresser), robots.txt`);
