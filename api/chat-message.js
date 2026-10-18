// api/chat-message.js
// Tar emot frågor från sajtens chatt och mejlar dem till er.
// Svara på mejlet så går svaret direkt till besökaren (reply-to är satt).

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, email, message, website, historik } = req.body || {};

    // Spamskydd: dolt fält som bara robotar fyller i
    if (website) return res.status(200).json({ ok: true });

    const from = (email || '').trim().toLowerCase();
    const msg = (message || '').trim();
    if (!from.includes('@') || from.length > 200 || !msg || msg.length > 2000) {
      return res.status(400).json({ error: 'Ogiltig förfrågan' });
    }
    if (!process.env.RESEND_API_KEY) return res.status(500).json({ error: 'Mejl är inte konfigurerat' });

    const clean = (s) => String(s || '').replace(/</g, '&lt;').slice(0, 2000);

    // Hela samtalet i chatten — så att frågan syns även om besökaren bara skrev sin
    // e-postadress i formuläret.
    const samtal = (Array.isArray(historik) ? historik : [])
      .slice(-30)
      .filter((h) => h && typeof h.text === 'string' && h.text.trim())
      .map((h) => `<tr><td style="padding:4px 10px 4px 0;vertical-align:top;color:#888;white-space:nowrap">${h.who === 'user' ? 'Besökaren' : 'Chatten'}</td><td style="padding:4px 0;${h.who === 'user' ? 'font-weight:bold' : 'color:#555'}">${clean(h.text.slice(0, 500))}</td></tr>`)
      .join('');

    const send = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Nordic Agir Academy <academy@nordicagir.se>',
        to: [process.env.ADMIN_EMAIL || 'academy@nordicagir.se'],
        reply_to: from,
        subject: `💬 Ny fråga från chatten — ${clean(name) || from}`,
        html: `<h2>Ny fråga via chatten på sajten</h2>
          <p><b>Namn:</b> ${clean(name) || '—'}<br>
          <b>E-post:</b> ${clean(from)}</p>
          <p style="background:#f5f4f1;padding:14px 16px;border-left:3px solid #00ADEF;font-size:15px">${clean(msg).replace(/\n/g, '<br>')}</p>
          ${samtal ? `<h3 style="margin-top:22px">Hela samtalet i chatten</h3><table style="font-size:14px;border-collapse:collapse">${samtal}</table>` : ''}
          <p style="color:#888;font-size:13px">Svara på det här mejlet så går svaret direkt till besökaren.</p>`,
      }),
    });

    if (!send.ok) {
      console.error('CHATTMEJLFEL', send.status, await send.text().catch(() => ''));
      return res.status(502).json({ error: 'Kunde inte skicka' });
    }

    console.log('CHATTFRÅGA vidarebefordrad från', from);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('chat-message:', err.message);
    return res.status(500).json({ error: 'Något gick fel' });
  }
}
