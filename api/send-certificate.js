// api/send-certificate.js
// Mejlar ett certifikat (PDF) till deltagaren från academy@nordicagir.se.
// Endast inloggade administratörer (admins-tabellen) kan använda funktionen.
// Miljövariabler som används: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, ADMIN_EMAIL

export const config = { api: { bodyParser: { sizeLimit: '8mb' } } };

const SUPA = (process.env.SUPABASE_URL || '')
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/+$/, '');
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { token, to, name, course, certId, pdf } = req.body || {};

    if (!token || !to || !pdf) return res.status(400).json({ error: 'Ofullständig begäran' });
    if (!SUPA || !SUPA_KEY) return res.status(500).json({ error: 'Supabase är inte konfigurerat' });
    if (!process.env.RESEND_API_KEY) return res.status(500).json({ error: 'Resend är inte konfigurerat' });

    // 1) Verifiera att anroparen är inloggad
    const userRes = await fetch(`${SUPA}/auth/v1/user`, {
      headers: { apikey: SUPA_KEY, Authorization: `Bearer ${token}` },
    });
    if (!userRes.ok) return res.status(401).json({ error: 'Ogiltig inloggning' });
    const user = await userRes.json();
    const email = (user.email || '').toLowerCase();

    // 2) Verifiera adminbehörighet
    const admRes = await fetch(`${SUPA}/rest/v1/admins?email=eq.${encodeURIComponent(email)}&select=email`, {
      headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
    });
    const adm = admRes.ok ? await admRes.json() : [];
    if (!adm.length) return res.status(403).json({ error: 'Kontot saknar adminbehörighet' });

    // 3) Skicka certifikatet
    const firstName = (name || '').split(' ')[0] || 'deltagare';
    const fileName = `Certifikat-${(certId || 'NAA').replace(/[^A-Za-z0-9-]/g, '')}.pdf`;

    const mail = {
      from: 'Nordic Agir Academy <academy@nordicagir.se>',
      to: [to],
      subject: `Ditt certifikat — ${course || 'Nordic Agir Academy'}`,
      html: `<p>Hej ${firstName}!</p>
        <p>Grattis till godkänd kurs! Här kommer ditt certifikat för
        <b>${course || 'din kurs'}</b> som bifogad PDF.</p>
        <p>Certifikatet är giltigt i fem år från examensdatumet.
        Spara det gärna digitalt — och hör av dig om du behöver en ny kopia.</p>
        <p>Varma gratulationer,<br>Nordic Agir Academy</p>`,
      attachments: [{ filename: fileName, content: pdf }],
    };
    if (process.env.ADMIN_EMAIL) mail.bcc = [process.env.ADMIN_EMAIL];

    const send = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(mail),
    });

    if (!send.ok) {
      const t = await send.text().catch(() => '');
      console.error('CERTMEJLFEL', send.status, t);
      return res.status(502).json({ error: 'Mejlet kunde inte skickas' });
    }

    console.log('CERTIFIKAT mejlat till', to, fileName);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('send-certificate:', err.message);
    return res.status(500).json({ error: 'Något gick fel' });
  }
}
