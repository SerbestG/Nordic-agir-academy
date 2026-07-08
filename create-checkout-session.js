// api/create-checkout-session.js
// Skapar en Stripe Checkout-session från kundvagnen.
// Priserna definieras HÄR på servern — aldrig i webbläsaren — så att ingen kan manipulera dem.

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Moms: kurspriserna i katalogen är exkl. moms. Vid direktbetalning läggs 25 % på.
// Sätt till 1 om ni istället aktiverar Stripe Tax eller vill hantera moms på annat sätt.
const MOMS = 1.25;

// Kurskatalog: id -> { titel, pris i kr exkl. moms }
// OBS: håll denna i synk med kurslistan i index.html när priser ändras.
const COURSES = {
  'lou-grund':   { title: 'Grunderna i offentlig upphandling och LOU', price: 4900 },
  'lou-praktik': { title: 'LOU i praktiken', price: 5900 },
  'luf-praktik': { title: 'LUF i praktiken', price: 5900 },
  'ejur':        { title: 'Entreprenadjuridik — AB 04, ABT 06 och ABK 09', price: 7900 },
  'ab-abt':      { title: 'AB 04 och ABT 06', price: 5900 },
  'abk':         { title: 'ABK 09', price: 4900 },
  'ata':         { title: 'ÄTA-hantering', price: 4900 },
  'lyft':        { title: 'Säkra lyft', price: 1900 },
  'bas':         { title: 'BAS-P och BAS-U', price: 3900 },
  'apv':         { title: 'APV steg 1', price: 1900 },
  'ama-hus':     { title: 'AMA Hus', price: 4900 },
  'ama-anl':     { title: 'AMA Anläggning', price: 4900 },
  'kma':         { title: 'KMA', price: 3900 },
  'pl':          { title: 'Projektledning', price: 5900 },
  'prl':         { title: 'Projekteringsledning', price: 5900 },
  'tid':         { title: 'Tidsplanering i byggprojekt', price: 3900 },
  'kalk':        { title: 'Kalkylering för entreprenader', price: 4900 },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { buyer, items } = req.body;

    if (!buyer?.email || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Ogiltig beställning' });
    }

    // Bygg Stripes radposter från serverns prislista
    const line_items = items.map((it) => {
      const c = COURSES[it.courseId];
      if (!c) throw new Error('Okänd kurs: ' + it.courseId);
      const qty = Math.max(1, Math.min(100, parseInt(it.qty, 10) || it.participants?.length || 1));
      return {
        quantity: qty,
        price_data: {
          currency: 'sek',
          unit_amount: Math.round(c.price * MOMS * 100), // öre, inkl. moms
          product_data: {
            name: c.title,
            description: 'Distanskurs · Nordic Agir Academy · inkl. 25 % moms',
          },
        },
      };
    });

    // Deltagarna följer med som metadata så att webhooken kan skicka ut inloggningar.
    // (Stripe tillåter max 500 tecken per metadatafält — därför delas listan upp vid behov.)
    const participants = items.flatMap((it) =>
      (it.participants || []).map((p) => ({ k: it.courseId, n: p.name, e: p.email }))
    );
    const metadata = {
      buyer_name: (buyer.name || '').slice(0, 400),
      buyer_company: (buyer.company || '').slice(0, 400),
      buyer_phone: (buyer.phone || '').slice(0, 100),
      buyer_invoice: (buyer.invoice || '').slice(0, 400),
    };
    const pJson = JSON.stringify(participants);
    for (let i = 0; i * 450 < pJson.length && i < 40; i++) {
      metadata['participants_' + i] = pJson.slice(i * 450, (i + 1) * 450);
    }

    const siteUrl = process.env.SITE_URL || `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      customer_email: buyer.email,
      // Betalmetoder (kort, Swish, Klarna, Apple/Google Pay) styrs i Stripe Dashboard:
      // Settings → Payment methods. Aktivera Swish och Klarna där så dyker de upp här automatiskt.
      metadata,
      success_url: `${siteUrl}/?betalning=klar&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/?betalning=avbruten`,
      locale: 'sv',
      billing_address_collection: 'auto',
      invoice_creation: { enabled: true }, // Stripe skapar kvitto/faktura-PDF till kunden
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('create-checkout-session:', err.message);
    return res.status(500).json({ error: 'Kunde inte skapa betalsession' });
  }
}
