// api/order-invoice.js
// Tar emot beställningar med betalsätt "Faktura 30 dagar" och mejlar dem till er
// så att ni kan fakturera via Fortnox/Visma och lägga upp deltagarna.

async function sendMail(to, subject, html) {
  if (!process.env.RESEND_API_KEY) {
    console.log('[MEJL – ingen RESEND_API_KEY satt]', to, subject);
    return;
  }
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Nordic Agir Academy <academy@nordicagir.se>',
      to: [to],
      subject,
      html,
    }),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { buyer, items, total } = req.body;
    if (!buyer?.email || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Ogiltig beställning' });
    }

    const rows = items
      .map(
        (it) =>
          `<li><b>${it.courseId}</b> × ${it.participants?.length || it.qty || 1}<ul>` +
          (it.participants || []).map((p) => `<li>${p.name} (${p.email})</li>`).join('') +
          `</ul></li>`
      )
      .join('');

    // Internt mejl till er
    await sendMail(
      process.env.ADMIN_EMAIL || 'info@nordicagir.se',
      `Fakturabeställning — ${buyer.name} (${(total || 0).toLocaleString('sv-SE')} kr exkl. moms)`,
      `<h2>Ny beställning mot faktura (30 dagar)</h2>
       <p><b>Beställare:</b> ${buyer.name} · ${buyer.company || '-'}<br>
       <b>E-post:</b> ${buyer.email}<br>
       <b>Telefon:</b> ${buyer.phone || '-'}<br>
       <b>Fakturaadress/referens:</b> ${buyer.invoice || '-'}<br>
       <b>Summa:</b> ${(total || 0).toLocaleString('sv-SE')} kr exkl. moms</p>
       <h3>Kurser och deltagare</h3><ul>${rows}</ul>
       <p>Fakturera kunden och lägg upp deltagarna i kursplattformen.</p>`
    );

    // Bekräftelse till beställaren
    await sendMail(
      buyer.email,
      'Vi har tagit emot din beställning — Nordic Agir Academy',
      `<p>Hej ${buyer.name.split(' ')[0]}!</p>
       <p>Tack för din beställning. Fakturan skickas inom kort med 30 dagars betalvillkor,
       och varje deltagare får sina inloggningsuppgifter via e-post.</p>
       <p>Frågor? Svara på det här mejlet så hjälper vi dig.</p>
       <p>Vänliga hälsningar<br>Nordic Agir Academy</p>`
    );

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('order-invoice:', err.message);
    return res.status(500).json({ error: 'Kunde inte ta emot beställningen' });
  }
}
