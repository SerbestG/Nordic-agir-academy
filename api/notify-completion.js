// api/notify-completion.js
// När en deltagare klarar provet mejlas ni så certifikatet kan skickas ut.
// Deltagarens inloggning verifieras så att bara äkta slutföranden ger notiser.

const SUPA = (process.env.SUPABASE_URL || '')
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/+$/, '');
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { token, rowId } = req.body || {};
    if (!token || !rowId) return res.status(400).json({ error: 'Ofullständig begäran' });

    // 1) Vem är inloggad?
    const userRes = await fetch(`${SUPA}/auth/v1/user`, {
      headers: { apikey: SUPA_KEY, Authorization: `Bearer ${token}` },
    });
    if (!userRes.ok) return res.status(401).json({ error: 'Ogiltig inloggning' });
    const user = await userRes.json();
    const email = (user.email || '').toLowerCase();

    // 2) Hämta registreringen och kontrollera att den tillhör den inloggade
    const r = await fetch(
      `${SUPA}/rest/v1/enrollments?id=eq.${encodeURIComponent(rowId)}&select=id,name,email,status,course_id,buyer_company,courses(title)&limit=1`,
      { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` } }
    );
    const rows = r.ok ? await r.json() : [];
    if (!rows.length) return res.status(404).json({ error: 'Registreringen hittades inte' });
    const row = rows[0];
    if ((row.email || '').toLowerCase() !== email) return res.status(403).json({ error: 'Fel konto' });

    // 3) Mejla er
    if (process.env.RESEND_API_KEY) {
      const adminUrl = (process.env.SITE_URL || '') + '/#admin';
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Nordic Agir Academy <academy@nordicagir.se>',
          to: [process.env.ADMIN_EMAIL || 'info@nordicagir.se'],
          subject: `🎓 Kurs slutförd — ${row.name} (${row.courses?.title || row.course_id})`,
          html: `<h2>Dags att skicka ett certifikat!</h2>
            <p><b>${row.name}</b> (${row.email})${row.buyer_company ? ' · ' + row.buyer_company : ''}
            har precis slutfört kursen med godkänt resultat:</p>
            <p style="font-size:17px"><b>${row.courses?.title || row.course_id}</b></p>
            <p>Gå till <a href="${adminUrl}">adminportalen</a> → fliken <b>Certifikat</b> →
            välj deltagaren → <b>📧 Mejla certifikatet</b>. Klart på en minut.</p>
            <p style="color:#888;font-size:13px">Detta är en automatisk notis från Nordic Agir Academy.</p>`,
        }),
      });
      console.log('NOTIS skickad: kurs slutförd av', row.email, row.course_id);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('notify-completion:', err.message);
    return res.status(500).json({ error: 'Något gick fel' });
  }
}
