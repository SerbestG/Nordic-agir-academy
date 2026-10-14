// api/indexnow.js — talar om för Bing (och därmed ChatGPT:s webbsök), Yandex m.fl. vilka
// sidor som är nya eller ändrade, via IndexNow (indexnow.org). Annars får vi vänta tills
// sökmotorn själv råkar komma förbi.
//
// Körs automatiskt varje morgon av Vercels schemaläggare (vercel.json → crons) och skickar
// då sidorna i sitemap.xml vars lastmod är högst två dygn gammal — alltså det som
// publicerats sedan sist. Manuellt: /api/indexnow?nyckel=<NYCKEL>&alla=1 skickar alla sidor.
//
// Nyckeln är inte hemlig: IndexNow kräver att den ligger publikt i /<NYCKEL>.txt så att
// sökmotorn kan se att anmälan kommer från sajtens ägare.

const NYCKEL = '8739a6963c243f02e980536010cd8d2d';
const VARD = 'www.nordicagiracademy.se';
const SAJT = `https://${VARD}`;

export default async function handler(req, res) {
  const ua = String(req.headers['user-agent'] || '');
  const auth = String(req.headers.authorization || '');
  const fran_schema = ua.startsWith('vercel-cron') || (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`);
  if (!fran_schema && req.query?.nyckel !== NYCKEL) return res.status(401).json({ error: 'Ej behörig' });

  try {
    const r = await fetch(`${SAJT}/sitemap.xml`, { headers: { 'cache-control': 'no-cache' } });
    if (!r.ok) throw new Error('Kunde inte läsa sitemap.xml: ' + r.status);
    const xml = await r.text();
    const sidor = [...xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>(?:\s*<lastmod>([^<]+)<\/lastmod>)?/g)]
      .map((m) => ({ url: m[1].trim(), lastmod: m[2] ? new Date(m[2]) : null }));

    const alla = req.query?.alla === '1';
    const grans = Date.now() - 2 * 24 * 3600 * 1000;
    const urlList = sidor
      .filter((s) => alla || (s.lastmod && s.lastmod.getTime() >= grans))
      .map((s) => s.url)
      .filter((u) => u.startsWith(SAJT))
      .slice(0, 10000);

    if (!urlList.length) return res.status(200).json({ skickade: 0, meddelande: 'Inga nya eller ändrade sidor' });

    const svar = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: VARD, key: NYCKEL, keyLocation: `${SAJT}/${NYCKEL}.txt`, urlList }),
    });
    // 200 och 202 betyder mottaget; 403/422 betyder att nyckeln eller adresserna inte godtogs
    return res.status(svar.ok ? 200 : 502).json({ skickade: urlList.length, indexnow: svar.status });
  } catch (err) {
    console.error('indexnow:', err.message);
    return res.status(500).json({ error: 'IndexNow misslyckades' });
  }
}
