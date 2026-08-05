// api/admin-enroll.js — v3
// Manuell tilldelning: flera kurser × antal platser × deltagare, med avtalade priser.
// Skapar/återanvänder konton, mejlar varje deltagare inloggning, mejlar beställaren
// orderbekräftelse (fakturatyp) och registrerar allt med pris för fakturaunderlaget.

const SUPA = (process.env.SUPABASE_URL || '')
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/+$/, '');
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE = process.env.SITE_URL || 'https://nordicagiracademy.se';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body || {};
    const { token, type, company } = body;
    const isPaid = type === 'faktura';
    const buyerName = (body.buyerName || '').trim().slice(0, 120);
    const buyerEmail = (body.buyerEmail || '').trim().toLowerCase();

    // Normalisera: nya formatet (rows) eller gamla (name/email/courses)
    let rows = [];
    if (Array.isArray(body.rows) && body.rows.length) {
      rows = body.rows;
    } else if (body.name && body.email && Array.isArray(body.courses)) {
      rows = body.courses.map((cid) => ({
        courseId: cid, price: null,
        participants: [{ name: body.name, pnr: body.pnr || '', email: body.email }],
      }));
    }
    if (!token || !rows.length) return res.status(400).json({ error: 'Ofullständig begäran' });

    const platser = rows.reduce((s, r) => s + (r.participants || []).length, 0);
    if (!platser || platser > 60) return res.status(400).json({ error: 'Ogiltigt antal deltagare' });
    for (const r of rows)
      for (const p of r.participants || [])
        if (!(p.name || '').trim() || !(p.email || '').includes('@'))
          return res.status(400).json({ error: 'Alla deltagare behöver namn och giltig e-post' });

    // 1) Verifiera administratören
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

    // 2) Kurstitlar
    const ids = [...new Set(rows.map((r) => r.courseId))];
    const cRes = await fetch(
      `${SUPA}/rest/v1/courses?id=in.(${ids.map(encodeURIComponent).join(',')})&select=id,title`,
      { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }
    );
    const found = cRes.ok ? await cRes.json() : [];
    const titleOf = (cid) => (found.find((c) => c.id === cid) || {}).title;
    if (rows.some((r) => !titleOf(r.courseId)))
      return res.status(400).json({ error: 'Okänd kurs vald — kontrollera courses-tabellen' });

    // 3) Konton per unik deltagarmejl
    const konton = {}; // email -> {isNew, password}
    for (const em of [...new Set(rows.flatMap((r) => r.participants.map((p) => p.email.toLowerCase())))]) {
      const password = 'NAA-' + Math.random().toString(36).slice(2, 8) + '-' + Math.floor(10 + Math.random() * 89);
      const createRes = await fetch(`${SUPA}/auth/v1/admin/users`, {
        method: 'POST',
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: em, password, email_confirm: true }),
      });
      if (createRes.ok) konton[em] = { isNew: true, password };
      else {
        const t = await createRes.text().catch(() => '');
        if (!/already|registered|exists/i.test(t)) {
          console.error('KONTOFEL', createRes.status, t);
          return res.status(502).json({ error: 'Konto kunde inte skapas för ' + em });
        }
        konton[em] = { isNew: false, password: null };
      }
    }

    // 4) Registrera raderna
    const orderRef = (isPaid ? 'FAKT-' : 'GRATIS-') + Date.now().toString(36).toUpperCase();
    const insRows = [];
    for (const r of rows)
      for (const p of r.participants)
        insRows.push({
          order_ref: orderRef,
          buyer_name: (buyerName || company || 'Nordic Agir Academy').slice(0, 120),
          buyer_company: isPaid ? (company || 'Fakturaorder').slice(0, 120) : 'Kostnadsfri tilldelning',
          buyer_email: buyerEmail || 'academy@nordicagir.se',
          buyer_type: 'foretag',
          course_id: r.courseId,
          name: p.name.trim().slice(0, 120),
          personnummer: (p.pnr || '').slice(0, 20),
          email: p.email.toLowerCase(),
          status: 'ej',
          price: isPaid && r.price != null ? Number(r.price) : null,
        });
    const ins = await fetch(`${SUPA}/rest/v1/enrollments`, {
      method: 'POST',
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(insRows),
    });
    if (!ins.ok) {
      const t = await ins.text().catch(() => '');
      console.error('REGISTRERINGSFEL', ins.status, t);
      return res.status(502).json({ error: 'Kurserna kunde inte registreras' });
    }

    // 5) Mejl
    if (process.env.RESEND_API_KEY) {
      const send = (msg) =>
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: 'Nordic Agir Academy <academy@nordicagir.se>', ...msg }),
        }).catch(() => {});

      // Välkomstmejl per deltagare (aldrig priser här)
      const perPerson = {};
      for (const r of rows)
        for (const p of r.participants) {
          const em = p.email.toLowerCase();
          (perPerson[em] = perPerson[em] || { name: p.name, kurser: [] }).kurser.push(titleOf(r.courseId));
        }
      for (const [em, info] of Object.entries(perPerson)) {
        const k = konton[em];
        const list = info.kurser.map((t) => `<li style="margin:4px 0"><b>${t}</b></li>`).join('');
        const loginBlock = k.isNew
          ? `<p>Dina inloggningsuppgifter:</p><p style="background:#f5f4f1;padding:14px 16px;font-size:15px"><b>E-post:</b> ${em}<br><b>Lösenord:</b> ${k.password}</p><p style="font-size:13px;color:#666">Byt gärna lösenord efter första inloggningen via ”Glömt lösenordet?”.</p>`
          : `<p>Du loggar in med din e-postadress <b>${em}</b> och ditt befintliga lösenord. Glömt? Klicka ”Glömt lösenordet?” på inloggningssidan.</p>`;
        await send({
          to: [em],
          bcc: process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL] : undefined,
          subject: isPaid ? 'Välkommen till din utbildning — Nordic Agir Academy 🎓'
                          : `Du har fått tillgång till ${info.kurser.length > 1 ? info.kurser.length + ' kurser' : 'en kurs'} — Nordic Agir Academy 🎁`,
          html: `<h2>Hej ${info.name.split(' ')[0]}!</h2>
            <p>${isPaid ? (company ? `<b>${company}</b> har beställt följande utbildning till dig:` : 'Här är din utbildning från Nordic Agir Academy:') : 'Nordic Agir Academy har gett dig kostnadsfri tillgång till:'}</p>
            <ul>${list}</ul>${loginBlock}
            <p><a href="${SITE}/#minasidor" style="display:inline-block;background:#00ADEF;color:#fff;padding:12px 22px;text-decoration:none;font-weight:bold">Logga in och börja plugga →</a></p>
            <p>Kurserna gör du i din egen takt. Efter godkänt kunskapsprov skickas ditt personliga certifikat per mejl — giltigt i fem år.</p>
            <p>Frågor? Svara på det här mejlet.<br>Varma hälsningar,<br><b>Nordic Agir Academy</b></p>`,
        });
      }

      // Orderbekräftelse till beställaren (fakturatyp) — med era avtalade priser
      if (isPaid && buyerEmail.includes('@')) {
        let exkl = 0;
        const prisRader = rows.map((r) => {
          const rad = r.participants.length + ' × ' + titleOf(r.courseId) +
            (r.price != null ? ` — à ${Number(r.price).toLocaleString('sv-SE')} kr` : '');
          exkl += (r.price || 0) * r.participants.length;
          return `<li style="margin:4px 0">${rad}</li>`;
        }).join('');
        const inkl = Math.round(exkl * 1.25 * 100) / 100;
        await send({
          to: [buyerEmail],
          bcc: process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL] : undefined,
          subject: `Orderbekräftelse ${orderRef} — Nordic Agir Academy`,
          html: `<h2>Tack för er beställning${buyerName ? ', ' + buyerName.split(' ')[0] : ''}!</h2>
            <p>Vi har registrerat er beställning för <b>${company}</b> och alla deltagare har fått sina inloggningsuppgifter per mejl.</p>
            <ul>${prisRader}</ul>
            <p><b>Summa: ${exkl.toLocaleString('sv-SE')} kr exkl. moms · ${inkl.toLocaleString('sv-SE')} kr inkl. moms</b><br>
            Faktura skickas separat (30 dagars betalningsvillkor). Ordernummer: <b>${orderRef}</b> — ange det gärna vid frågor.</p>
            <p>Varma hälsningar,<br><b>Nordic Agir Academy</b><br>academy@nordicagir.se · 073-912 97 89<br>En del av Nordic Agir AB · Org.nr 559516-5373</p>`,
        });
      }
    }

    console.log((isPaid ? 'FAKTURA' : 'GRATIS') + ' tilldelning:', orderRef, platser + ' platser,', ids.join(','));
    return res.status(200).json({ ok: true, orderRef, participants: platser });
  } catch (err) {
    console.error('admin-enroll:', err.message);
    return res.status(500).json({ error: 'Något gick fel' });
  }
}
