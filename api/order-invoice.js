
// api/order-invoice.js
// FAKTURAKÖP — GRANSKNINGSFLÖDE (inget delas ut automatiskt!):
// 1) Beställningen registreras i systemet med status "vantar"
// 2) Ni får en notis: granska & godkänn i adminportalen
// 3) Kunden får "vi behandlar er beställning" — INGA inloggningar ännu
// Först vid ert godkännande (api/approve-invoice.js) skapas konton och mejl skickas.
 
const SUPA = (process.env.SUPABASE_URL || '')
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/+$/, '');
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MOMS = 1.25;
 
// Kurskatalog: id -> { titel, pris exkl. moms } — håll i synk med create-checkout-session.js
const KURSER = {
  'anbud':       { title: 'Analysera och kvalitetssäkra offentliga anbud', price: 795 },
  'lou-praktik': { title: 'LOU i praktiken — offentlig upphandling', price: 1495 },
  'luf-praktik': { title: 'LUF i praktiken — upphandling inom försörjningssektorerna', price: 1395 },
  'ejur':        { title: 'Entreprenadjuridik — AB 04, ABT 06 och ABK 09', price: 2195 },
  'ab-abt':      { title: 'AB 04 och ABT 06 — standardavtalen i bygg', price: 1495 },
  'abk':         { title: 'ABK 09 — avtal och ansvar i konsultuppdrag', price: 995 },
  'ata':         { title: 'ÄTA-hantering — från teori till praktik', price: 995 },
  'lyft':        { title: 'Säkra lyft — riskbedömning och utrustning', price: 795 },
  'bas':         { title: 'BAS-P och BAS-U — säkert byggprojekt från start', price: 1495 },
  'apv':         { title: 'Arbete på väg — APV Steg 1 (1.1, 1.2, 1.3)', price: 995 },
  'ama-hus':     { title: 'AMA Hus — från kod till kvalitet', price: 1495 },
  'ama-anl':     { title: 'AMA Anläggning — kvalitet på bygget', price: 1495 },
  'kma':         { title: 'KMA i praktiken — bygg och anläggning', price: 1495 },
  'pl':          { title: 'Projektledning — från start till mål', price: 995 },
  'prl':         { title: 'Projekteringsledning i bygg- och anläggningsprojekt', price: 995 },
  'tid':         { title: 'Tidsplanering i byggprojekt — från plan till produktion', price: 995 },
  'kalk':        { title: 'Kalkylering för entreprenader — från anbud till vinst', price: 995 },
};
 
 
async function sendMail(payload) {
  if (!process.env.RESEND_API_KEY) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Nordic Agir Academy <academy@nordicagir.se>', ...payload }),
  }).catch((e) => console.error('MEJLFEL (faktura):', e.message));
}
 
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
 
  try {
    const { buyer, items } = req.body || {};
    if (!buyer || !buyer.email || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: 'Ofullständig beställning' });
    }
    const participants = items.flatMap((it) =>
      (it.participants || []).map((p) => ({ ...p, courseId: it.courseId }))
    );
    if (!participants.length || participants.length > 60) {
      return res.status(400).json({ error: 'Inga deltagare i beställningen' });
    }
 
    // Kurstitlar + priser ur serverns priskatalog (samma källa som kortkassan)
    const courseOf = KURSER;
    const okand = [...new Set(participants.map((p) => p.courseId))].filter((c) => !courseOf[c]);
    if (okand.length) return res.status(400).json({ error: 'Okänd kurs: ' + okand.join(', ') });
 
    const orderRef = 'FAKT-' + Date.now().toString(36).toUpperCase();
    const rows = participants
      .filter((p) => (p.email || '').includes('@') && courseOf[p.courseId])
      .map((p) => ({
        order_ref: orderRef,
        buyer_name: buyer.name || '',
        buyer_company: buyer.company || '',
        buyer_email: (buyer.email || '').toLowerCase(),
        course_id: p.courseId,
        name: p.name || '',
        personnummer: (p.pnr || '').slice(0, 20),
        email: (p.email || '').trim().toLowerCase(),
        status: 'vantar', // väntar på ert godkännande — syns inte i någon portal
      }));
    if (!rows.length) return res.status(400).json({ error: 'Inga giltiga deltagare' });
 
    const ins = await fetch(`${SUPA}/rest/v1/enrollments`, {
      method: 'POST',
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(rows),
    });
    if (!ins.ok) {
      const t = await ins.text().catch(() => '');
      console.error('REGISTRERINGSFEL (faktura)', ins.status, t);
      return res.status(502).json({ error: 'Beställningen kunde inte registreras' });
    }
 
    const exkl = rows.reduce((s, r) => s + Number(courseOf[r.course_id].price || 0), 0);
    const inkl = Math.round(exkl * MOMS * 100) / 100;
    const sumRows = rows.map((r) => `<tr><td style="padding:5px 10px;border-bottom:1px solid #eee">${courseOf[r.course_id].title}</td><td style="padding:5px 10px;border-bottom:1px solid #eee">${r.name}</td></tr>`).join('');
 
    // Kundens bekräftelse — utan inloggningar
    await sendMail({
      to: [(buyer.email || '').toLowerCase()],
      subject: `Vi har tagit emot er beställning ${orderRef} — Nordic Agir Academy`,
      html: `<h2>Tack för er beställning!</h2>
        <p>Ordernummer: <b>${orderRef}</b> · Betalsätt: <b>faktura, 30 dagar</b></p>
        <table style="border-collapse:collapse;font-size:14px"><tr><th style="text-align:left;padding:5px 10px">Kurs</th><th style="text-align:left;padding:5px 10px">Deltagare</th></tr>${sumRows}</table>
        <p>Summa: <b>${exkl.toLocaleString('sv-SE')} kr exkl. moms</b> (${inkl.toLocaleString('sv-SE')} kr inkl. moms)</p>
        <p>Vi behandlar nu beställningen. <b>Inom kort får varje deltagare sina inloggningsuppgifter per mejl</b>, och fakturan skickas separat med 30 dagars betalningsvillkor.</p>
        <p>Frågor? Svara på det här mejlet.<br><b>Nordic Agir Academy</b> · en del av Nordic Agir AB · Org.nr 559516-5373</p>`,
    });
 
    // Er gransknings-notis
    if (process.env.ADMIN_EMAIL) {
      await sendMail({
        to: [process.env.ADMIN_EMAIL],
        subject: `🧾 GRANSKA: ny fakturaorder ${orderRef} — ${buyer.company || buyer.name} (${inkl.toLocaleString('sv-SE')} kr)`,
        html: `<h3>Ny fakturaorder väntar på ert godkännande</h3>
          <p><b>${buyer.company || ''}</b> · Org.nr ${buyer.orgnr || '—'}<br>
          ${buyer.name} · ${buyer.email} · ${buyer.phone || ''}<br>
          Fakturaadress/märkning: ${buyer.invoice || '—'}</p>
          <table style="border-collapse:collapse;font-size:14px"><tr><th style="text-align:left;padding:5px 10px">Kurs</th><th style="text-align:left;padding:5px 10px">Deltagare</th></tr>${sumRows}</table>
          <p><b>${rows.length} deltagarplats(er)</b> · ${exkl.toLocaleString('sv-SE')} kr exkl. moms · <b>${inkl.toLocaleString('sv-SE')} kr inkl. moms</b></p>
          <p>⚠️ Inga konton har skapats och inga inloggningar har skickats.<br>
          👉 <b>Granska och godkänn:</b> Adminportalen → Beställningar → <b>🧾 Godkänn order</b> — först då mejlas inloggningarna och ni skickar fakturan.</p>`,
      });
    }
 
    console.log('FAKTURAORDER (väntar)', orderRef, rows.length, 'platser,', exkl, 'kr exkl');
    return res.status(200).json({ ok: true, orderRef });
  } catch (err) {
    console.error('order-invoice:', err.message);
    return res.status(500).json({ error: 'Något gick fel' });
  }
}
 
