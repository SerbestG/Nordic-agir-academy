// api/certifikat-vantar.js — skyddsnätet för certifikaten.
// Körs varje morgon av Vercels schemaläggare (vercel.json → crons). Hittar deltagare som
// är klara men inte har fått sitt certifikat och mejlar listan till admin. Klarnotisen
// skickas från deltagarens webbläsare och kan utebli; den här körningen beror inte på den.

const SUPA = (process.env.SUPABASE_URL || '')
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/+$/, '');
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const eh = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default async function handler(req, res) {
  const ua = String(req.headers['user-agent'] || '');
  const auth = String(req.headers.authorization || '');
  const franSchema = ua.startsWith('vercel-cron') || (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`);
  if (!franSchema) return res.status(401).json({ error: 'Ej behörig' });
  if (!SUPA || !SUPA_KEY) return res.status(500).json({ error: 'Supabase är inte konfigurerat' });

  try {
    const r = await fetch(
      `${SUPA}/rest/v1/enrollments?status=eq.klar&cert_sent=is.null&select=id,name,email,course_id,cert_date,buyer_company,courses(title)&order=cert_date.asc`,
      { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` } }
    );
    if (!r.ok) throw new Error('Kunde inte läsa registreringarna: ' + r.status);
    const rader = await r.json();
    if (!rader.length) {
      console.log('CERTIFIKAT VÄNTAR: inga');
      return res.status(200).json({ vantar: 0 });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('CERTIFIKAT VÄNTAR:', rader.length, 'st, men RESEND_API_KEY saknas');
      return res.status(500).json({ error: 'Resend är inte konfigurerat' });
    }
    const adminUrl = (process.env.SITE_URL || 'https://www.nordicagiracademy.se') + '/#admin';
    const lista = rader.map((x) => `<li><b>${eh(x.name || x.email)}</b> (${eh(x.email)})${x.buyer_company ? ' · ' + eh(x.buyer_company) : ''}<br>
      ${eh(x.courses?.title || x.course_id)} · klar ${eh(x.cert_date || 'okänt datum')}</li>`).join('');
    const mejl = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Nordic Agir Academy <academy@nordicagir.se>',
        to: [process.env.ADMIN_EMAIL || 'academy@nordicagir.se'],
        subject: `${rader.length} deltagare väntar på sitt certifikat`,
        html: `<h2>Certifikat att skicka</h2>
          <p>De här deltagarna har klarat kursen men har inte fått sitt certifikat:</p>
          <ul>${lista}</ul>
          <p>Gå till <a href="${adminUrl}">adminportalen</a> → fliken <b>Certifikat</b> → välj deltagaren →
          <b>📧 Mejla certifikatet</b>.</p>
          <p style="color:#888;font-size:13px">Automatisk påminnelse från Nordic Agir Academy, varje morgon så länge någon väntar.</p>`,
      }),
    });
    if (!mejl.ok) {
      console.error('CERTIFIKAT VÄNTAR: mejlet gick inte iväg', mejl.status, await mejl.text().catch(() => ''));
      return res.status(502).json({ error: 'Påminnelsen kunde inte mejlas' });
    }
    console.log('CERTIFIKAT VÄNTAR: påminnelse skickad om', rader.length, 'deltagare');
    return res.status(200).json({ vantar: rader.length });
  } catch (err) {
    console.error('certifikat-vantar:', err.message);
    return res.status(500).json({ error: 'Något gick fel' });
  }
}
