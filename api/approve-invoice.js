// api/approve-invoice.js
// ETT-KLICKS-GODKÄNNANDE av fakturaorder (endast administratörer):
// skapar konton för alla deltagare, mejlar inloggningar, aktiverar kurserna
// (status vantar -> ej) och skickar orderbekräftelse + fakturabesked till köparen.

const SUPA = (process.env.SUPABASE_URL || '')
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/+$/, '');
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE = process.env.SITE_URL || 'https://nordicagiracademy.se';
const MOMS = 1.25;

// Kurskatalog: id -> { titel, pris exkl. moms } — håll i synk med create-checkout-session.js
const KURSER = {
  'bas-en':      { title: 'BAS-P and BAS-U — Swedish Construction Coordination (in English)', price: 1495 },
  'byggpl':      { title: 'Byggprojektledning — projektledarens roll och ansvar', price: 995 },
  'mer':         { title: 'MER Anläggning — mät- och ersättningsregler för anläggningsarbeten', price: 1495 },
  'schakt':      { title: 'Säker schakt — schaktarbete och schaktansvar', price: 995 },
  'inst':        { title: 'Installationssamordning i byggprojekt', price: 1495 },
  'fall':        { title: 'Fallskydd — arbete på höjd', price: 795 },
  'bim':         { title: 'BIM — byggnadsinformationsmodellering i produktionen', price: 995 },
  'ama-af':      { title: 'AMA AF — administrativa föreskrifter för entreprenader', price: 1495 },
  'ramavtal':    { title: 'Ramavtal och avrop i offentlig upphandling', price: 1395 },
  'ritning':     { title: 'Ritningsläsning i byggprojekt', price: 995 },
  'anbud':       { title: 'Anbudsarbete i offentlig upphandling — analys och kvalitetssäkring', price: 795 },
  'lou-praktik': { title: 'LOU — Lagen om offentlig upphandling', price: 1495 },
  'luf-praktik': { title: 'LUF — Lagen om upphandling inom försörjningssektorerna', price: 1395 },
  'ejur':        { title: 'Entreprenadjuridik — AB 04, ABT 06 och ABK 09', price: 2195 },
  'ab-abt':      { title: 'AB 04 och ABT 06 — standardavtal för entreprenader', price: 1495 },
  'abk':         { title: 'ABK 09 — Allmänna bestämmelser för konsultuppdrag', price: 995 },
  'ata':         { title: 'ÄTA-arbeten — ändrings-, tilläggs- och avgående arbeten', price: 995 },
  'lyft':        { title: 'Säkra lyft — lastkoppling, signalering och riskbedömning', price: 795 },
  'bas':         { title: 'BAS-P och BAS-U — byggarbetsmiljösamordning', price: 1495 },
  'apv':         { title: 'Arbete på väg — APV Steg 1 (1.1, 1.2, 1.3)', price: 995 },
  'ama-hus':     { title: 'AMA Hus — allmän material- och arbetsbeskrivning för husbyggnad', price: 1495 },
  'ama-anl':     { title: 'AMA Anläggning — allmän material- och arbetsbeskrivning för anläggning', price: 1495 },
  'kma':         { title: 'KMA — kvalitet, miljö och arbetsmiljö i bygg och anläggning', price: 1495 },
  'pl':          { title: 'Projektledning i bygg- och anläggningsprojekt', price: 995 },
  'prl':         { title: 'Projekteringsledning i bygg- och anläggningsprojekt', price: 995 },
  'tid':         { title: 'Tidsplanering i byggprojekt', price: 995 },
  'kalk':        { title: 'Kalkylering för entreprenader — anbuds- och produktionskalkyl', price: 995 },
};


async function sendMail(payload) {
  if (!process.env.RESEND_API_KEY) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Nordic Agir Academy <academy@nordicagir.se>', ...payload }),
  }).catch((e) => console.error('MEJLFEL (godkännande):', e.message));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { token, orderRef } = req.body || {};
    if (!token || !orderRef || !/^FAKT-[A-Z0-9]+$/.test(orderRef)) {
      return res.status(400).json({ error: 'Ogiltig begäran' });
    }

    // 1) Adminkontroll
    const userRes = await fetch(`${SUPA}/auth/v1/user`, {
      headers: { apikey: KEY, Authorization: `Bearer ${token}` },
    });
    if (!userRes.ok) return res.status(401).json({ error: 'Ogiltig inloggning' });
    const caller = await userRes.json();
    const admRes = await fetch(
      `${SUPA}/rest/v1/admins?email=eq.${encodeURIComponent((caller.email || '').toLowerCase())}&select=email`,
      { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }
    );
    const adm = admRes.ok ? await admRes.json() : [];
    if (!adm.length) return res.status(403).json({ error: 'Kontot saknar adminbehörighet' });

    // 2) Hämta orderns väntande rader
    const rRes = await fetch(
      `${SUPA}/rest/v1/enrollments?order_ref=eq.${encodeURIComponent(orderRef)}&status=eq.vantar&select=*`,
      { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }
    );
    const rows = rRes.ok ? await rRes.json() : [];
    if (!rows.length) return res.status(404).json({ error: 'Inga väntande rader på den ordern' });

    const courseOf = KURSER; // serverns priskatalog — samma källa som kortkassan
    const buyer = { name: rows[0].buyer_name, company: rows[0].buyer_company, email: rows[0].buyer_email };

    // 3) Konton + välkomstmejl per unik deltagare
    const byEmail = {};
    for (const r of rows) {
      (byEmail[r.email] = byEmail[r.email] || { name: r.name, courses: [] }).courses.push(
        courseOf[r.course_id]?.title || r.course_id
      );
    }
    let sent = 0;
    for (const [to, info] of Object.entries(byEmail)) {
      const password =
        'NAA-' + Math.random().toString(36).slice(2, 8) + '-' + Math.floor(10 + Math.random() * 89);
      let isNew = false;
      const createRes = await fetch(`${SUPA}/auth/v1/admin/users`, {
        method: 'POST',
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: to, password, email_confirm: true }),
      });
      if (createRes.ok) isNew = true;
      else {
        const t = await createRes.text().catch(() => '');
        if (!/already|registered|exists/i.test(t)) {
          console.error('KONTOFEL (godkännande)', to, createRes.status, t);
          continue;
        }
      }
      const first = (info.name || '').split(' ')[0] || 'där';
      const list = info.courses.map((t) => `<li style="margin:4px 0"><b>${t}</b></li>`).join('');
      const loginBlock = isNew
        ? `<p>Dina inloggningsuppgifter:</p>
           <p style="background:#f5f4f1;padding:14px 16px;font-size:15px"><b>E-post:</b> ${to}<br><b>Lösenord:</b> ${password}</p>
           <p style="font-size:13px;color:#666">Byt gärna lösenord efter första inloggningen via ”Glömt lösenordet?”.</p>`
        : `<p>Du loggar in med din e-postadress <b>${to}</b> och ditt befintliga lösenord. Glömt det? Använd <b>”Glömt lösenordet?”</b> på inloggningssidan.</p>`;
      await sendMail({
        to: [to],
        subject: `Välkommen till din utbildning — Nordic Agir Academy 🎓`,
        html: `<h2>Hej ${first}!</h2>
          <p>${buyer.company ? `<b>${buyer.company}</b> har beställt följande utbildning till dig:` : 'Här är din utbildning från Nordic Agir Academy:'}</p>
          <ul>${list}</ul>
          ${loginBlock}
          <p><a href="${SITE}/#minasidor" style="display:inline-block;background:#00ADEF;color:#fff;padding:12px 22px;text-decoration:none;font-weight:bold">Logga in och börja plugga →</a></p>
          <p>Kursen gör du i din egen takt. Efter godkänt kunskapsprov mejlas ditt personliga certifikat — giltigt i fem år.</p>
          <p>Varma hälsningar,<br><b>Nordic Agir Academy</b></p>`,
      });
      sent++;
    }

    // 4) Aktivera raderna
    const upd = await fetch(
      `${SUPA}/rest/v1/enrollments?order_ref=eq.${encodeURIComponent(orderRef)}&status=eq.vantar`,
      {
        method: 'PATCH',
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ status: 'ej' }),
      }
    );
    if (!upd.ok) console.error('AKTIVERINGSFEL', upd.status, await upd.text().catch(() => ''));

    // 5) Köparens bekräftelse + fakturabesked
    const exkl = rows.reduce((s, r) => s + Number(courseOf[r.course_id]?.price || 0), 0);
    const inkl = Math.round(exkl * MOMS * 100) / 100;
    await sendMail({
      to: [buyer.email],
      bcc: process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL] : undefined,
      subject: `Er order ${orderRef} är godkänd — Nordic Agir Academy`,
      html: `<h2>Ordern är godkänd!</h2>
        <p>Alla deltagare (${rows.length} platser) har nu fått sina inloggningsuppgifter per mejl och kan börja direkt.</p>
        <p>Fakturan på <b>${inkl.toLocaleString('sv-SE')} kr inkl. moms</b> (${exkl.toLocaleString('sv-SE')} kr exkl.) skickas separat med 30 dagars betalningsvillkor.</p>
        <p>Frågor? Svara på det här mejlet.<br><b>Nordic Agir Academy</b> · en del av Nordic Agir AB · Org.nr 559516-5373</p>`,
    });

    console.log('GODKÄND fakturaorder', orderRef, '—', sent, 'deltagare mejlade');
    return res.status(200).json({ ok: true, participants: Object.keys(byEmail).length, rows: rows.length });
  } catch (err) {
    console.error('approve-invoice:', err.message);
    return res.status(500).json({ error: 'Något gick fel' });
  }
}
