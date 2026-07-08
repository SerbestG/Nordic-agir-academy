// api/stripe-webhook.js
// När en betalning genomförs (checkout.session.completed):
//   1. Ett konto skapas för varje deltagare i Supabase (om det inte redan finns)
//   2. En kursregistrering läggs in per deltagare och kurs
//   3. Deltagaren mejlas sina inloggningsuppgifter till portalen
//   4. Ni mejlas orderdetaljerna
//
// Miljövariabler som behövs: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY (för mejl), SITE_URL, ADMIN_EMAIL

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
export const config = { api: { bodyParser: false } };

async function rawBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}

async function sendMail(to, subject, html) {
  if (!process.env.RESEND_API_KEY) { console.log('[MEJL]', to, subject); return; }
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Nordic Agir Academy <academy@nordicagir.se>', to: [to], subject, html }),
  });
}

const SUPA = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supaHeaders = {
  apikey: SUPA_KEY,
  Authorization: `Bearer ${SUPA_KEY}`,
  'Content-Type': 'application/json',
};

function genPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// Skapa (eller hitta) en användare. Returnerar lösenordet om kontot är nytt, annars null.
async function ensureUser(email) {
  const password = genPassword();
  const res = await fetch(`${SUPA}/auth/v1/admin/users`, {
    method: 'POST',
    headers: supaHeaders,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  if (res.ok) return password;          // nytt konto
  return null;                          // fanns redan — behåller sitt lösenord
}

async function insertEnrollment(row) {
  await fetch(`${SUPA}/rest/v1/enrollments`, {
    method: 'POST',
    headers: { ...supaHeaders, Prefer: 'return=minimal' },
    body: JSON.stringify(row),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  let event;
  try {
    const body = await rawBody(req);
    event = stripe.webhooks.constructEvent(body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send('Ogiltig signatur');
  }

  if (event.type === 'checkout.session.completed') {
    const s = event.data.object;

    let pJson = '';
    for (let i = 0; s.metadata['participants_' + i] !== undefined; i++) pJson += s.metadata['participants_' + i];
    let participants = [];
    try { participants = JSON.parse(pJson || '[]'); } catch (_) {}

    const portalUrl = (process.env.SITE_URL || '') + '/#minasidor';

    for (const p of participants) {
      let newPassword = null;
      if (SUPA && SUPA_KEY) {
        newPassword = await ensureUser(p.e);
        await insertEnrollment({
          order_ref: s.id,
          buyer_name: s.metadata.buyer_name || '',
          buyer_company: s.metadata.buyer_company || '',
          buyer_email: s.customer_email || '',
          course_id: p.k,
          name: p.n,
          email: p.e,
          status: 'ej',
        });
      }
      await sendMail(
        p.e,
        'Dina inloggningsuppgifter — Nordic Agir Academy',
        `<p>Hej ${p.n.split(' ')[0]}!</p>
         <p>Välkommen till Nordic Agir Academy — din kurs är redo att påbörjas.</p>
         <p><b>Så loggar du in:</b><br>
         Gå till <a href="${portalUrl}">${portalUrl}</a><br>
         E-post: <b>${p.e}</b><br>
         ${newPassword
           ? `Lösenord: <b>${newPassword}</b><br><i>Byt gärna lösenordet efter första inloggningen.</i>`
           : `Lösenord: samma som tidigare — använd ”Glömt lösenord?” på inloggningssidan om du behöver ett nytt.`}</p>
         <p>I portalen ser du dina kurser, gör dem i din egen takt och följer din status.
         Provet kan du göra om så många gånger du behöver, och när du är godkänd får du
         ditt certifikat — giltigt i fem år.</p>
         <p>Frågor? Svara på det här mejlet så hjälper vi dig.<br>Nordic Agir Academy</p>`
      );
    }

    const kr = (s.amount_total / 100).toLocaleString('sv-SE');
    await sendMail(
      process.env.ADMIN_EMAIL || 'info@nordicagir.se',
      `Ny kursbeställning — ${s.metadata.buyer_name || s.customer_email} (${kr} kr)`,
      `<h2>Ny betald beställning</h2>
       <p><b>Beställare:</b> ${s.metadata.buyer_name || '-'} · ${s.metadata.buyer_company || '-'}<br>
       <b>E-post:</b> ${s.customer_email}<br><b>Summa:</b> ${kr} kr inkl. moms<br>
       <b>Stripe-referens:</b> ${s.id}</p>
       <h3>Deltagare (konton skapade automatiskt)</h3>
       <ul>${participants.map((p) => `<li>${p.n} (${p.e}) — kurs: ${p.k}</li>`).join('')}</ul>
       <p>Följ deltagarnas status i adminportalen.</p>`
    );
  }

  res.status(200).json({ received: true });
}
