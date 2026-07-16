// api/admin-enroll.js
// Ger kostnadsfri kurstillgång: skapar/återanvänder konto, registrerar valda kurser
// och mejlar deltagaren inloggningsuppgifter. Endast administratörer.

const SUPA = (process.env.SUPABASE_URL || '')
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/+$/, '');
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE = process.env.SITE_URL || 'https://nordicagiracademy.se';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { token, name, email, pnr, courses } = req.body || {};
    const to = (email || '').trim().toLowerCase();

    if (!token || !name || !to.includes('@') || !Array.isArray(courses) || !courses.length) {
      return res.status(400).json({ error: 'Ofullständig begäran' });
    }
    if (courses.length > 20) return res.status(400).json({ error: 'För många kurser' });

    // 1) Verifiera att anroparen är inloggad administratör
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

    // 2) Skapa konto — eller upptäck att det redan finns
    const password =
      'NAA-' + Math.random().toString(36).slice(2, 8) + '-' + Math.floor(10 + Math.random() * 89);
    let isNew = false;
    const createRes = await fetch(`${SUPA}/auth/v1/admin/users`, {
      method: 'POST',
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: to, password, email_confirm: true }),
    });
    if (createRes.ok) {
      isNew = true;
    } else {
      const t = await createRes.text().catch(() => '');
      if (!/already|registered|exists/i.test(t)) {
        console.error('KONTOFEL (gratis)', createRes.status, t);
        return res.status(502).json({ error: 'Kontot kunde inte skapas' });
      }
      // fanns redan — inget lösenord ändras
    }

    // 3) Hämta kursnamnen
    const idList = courses.map((c) => encodeURIComponent(c)).join(',');
    const cRes = await fetch(`${SUPA}/rest/v1/courses?id=in.(${idList})&select=id,title`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });
    const found = cRes.ok ? await cRes.json() : [];
    if (!found.length) return res.status(400).json({ error: 'Inga giltiga kurser valda' });

    // 4) Registrera kurserna
    const orderRef = 'GRATIS-' + Date.now().toString(36).toUpperCase();
    const rows = found.map((c) => ({
      order_ref: orderRef,
      buyer_name: 'Nordic Agir Academy',
      buyer_company: 'Kostnadsfri tilldelning',
      buyer_email: 'academy@nordicagir.se',
      course_id: c.id,
      name,
      personnummer: (pnr || '').slice(0, 20),
      email: to,
      status: 'ej',
    }));
    const ins = await fetch(`${SUPA}/rest/v1/enrollments`, {
      method: 'POST',
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(rows),
    });
    if (!ins.ok) {
      const t = await ins.text().catch(() => '');
      console.error('REGISTRERINGSFEL (gratis)', ins.status, t);
      return res.status(502).json({ error: 'Kurserna kunde inte registreras' });
    }

    // 5) Välkomstmejl
    if (process.env.RESEND_API_KEY) {
      const firstName = name.split(' ')[0];
      const list = found.map((c) => `<li style="margin:4px 0"><b>${c.title}</b></li>`).join('');
      const loginBlock = isNew
        ? `<p>Dina inloggningsuppgifter:</p>
           <p style="background:#f5f4f1;padding:14px 16px;font-size:15px">
           <b>E-post:</b> ${to}<br><b>Lösenord:</b> ${password}</p>
           <p style="font-size:13px;color:#666">Byt gärna lösenord efter första inloggningen via ”Glömt lösenordet?”.</p>`
        : `<p>Du loggar in med din e-postadress <b>${to}</b> och ditt befintliga lösenord.
           Har du glömt det? Klicka på <b>”Glömt lösenordet?”</b> på inloggningssidan så får du ett nytt via mejl.</p>`;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Nordic Agir Academy <academy@nordicagir.se>',
          to: [to],
          bcc: process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL] : undefined,
          subject: `Du har fått tillgång till ${found.length > 1 ? found.length + ' kurser' : 'en kurs'} — Nordic Agir Academy 🎁`,
          html: `<h2>Hej ${firstName}!</h2>
            <p>Nordic Agir Academy har gett dig kostnadsfri tillgång till:</p>
            <ul>${list}</ul>
            ${loginBlock}
            <p><a href="${SITE}/#minasidor" style="display:inline-block;background:#00ADEF;color:#fff;padding:12px 22px;text-decoration:none;font-weight:bold">Logga in och börja plugga →</a></p>
            <p>Kurserna gör du i din egen takt. Efter godkänt kunskapsprov skickas ditt personliga certifikat per mejl — giltigt i fem år.</p>
            <p>Frågor? Svara på det här mejlet så hjälper vi dig.<br>Varma hälsningar,<br><b>Nordic Agir Academy</b></p>`,
        }),
      });
    }

    console.log('GRATIS tilldelning:', to, found.map((c) => c.id).join(','), isNew ? '(nytt konto)' : '(befintligt konto)');
    return res.status(200).json({ ok: true, created: isNew, courses: found.length });
  } catch (err) {
    console.error('admin-enroll:', err.message);
    return res.status(500).json({ error: 'Något gick fel' });
  }
}
