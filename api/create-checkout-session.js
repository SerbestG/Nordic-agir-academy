// api/create-checkout-session.js
// Skapar en Stripe Checkout-session från kundvagnen.
// Priserna definieras HÄR på servern — aldrig i webbläsaren — så att ingen kan manipulera dem.

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Moms: kurspriserna i katalogen är exkl. moms. Vid betalning läggs 25 % på.
const MOMS = 1.25;

// Kurskatalog: id -> { titel, pris i kr exkl. moms }
// OBS: håll denna i synk med kurslistan i index.html när priser ändras.
const COURSES = {
  'anbud':       { title: 'Analysera och kvalitetssäkra offentliga anbud', price: 795 },
  'lou-praktik': { title: 'LOU i praktiken — offentlig upphandling', price: 1495 },
  'luf-praktik': { title: 'LUF i praktiken — upphandling inom försörjningssektorerna', price: 1395 },
  'ejur':        { title: 'Entreprenadjuridik — AB 04, ABT 06 och ABK 09', price: 2195 },
  'ab-abt':      { title: 'AB 04 och ABT 06 — standardavtalen i bygg', price: 1495 },
  'abk':         { title: 'ABK 09 — avtal och ansvar i konsultuppdrag', price: 995 },
  'ata':         { title: 'ÄTA-hantering — från teori till praktik', price: 995 },
  'lyft':        { title: 'Säkra lyft — riskbedömning och utrustning', price: 795 },
  'bas':         { title: 'BAS-P och BAS-U — säkert byggprojekt från start', price: 1495 },
  'apv':         { title: 'Arbete på väg — APV Steg 1 (1.1, 1.2, 1.3)', price: 995 },
  'ama-hus':     { title: 'AMA Hus — från kod till kvalitet', price: 1495 },
  'ama-anl':     { title: 'AMA Anläggning — kvalitet på bygget', price: 1495 },
  'kma':         { title: 'KMA i praktiken — bygg och anläggning', price: 1495 },
  'pl':          { title: 'Projektledning — från start till mål', price: 995 },
  'prl':         { title: 'Projekteringsledning i bygg- och anläggningsprojekt', price: 995 },
  'tid':         { title: 'Tidsplanering i byggprojekt — från plan till produktion', price: 995 },
  'kalk':        { title: 'Kalkylering för entreprenader — från anbud till vinst', price: 995 },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { buyer, items } = req.body;

    if (!buyer?.email || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Ogiltig beställning' });
    }

    const line_items = items.map((it) => {
      const c = COURSES[it.courseId];
      if (!c) throw new Error('Okänd kurs: ' + it.courseId);
      const qty = Math.max(1, Math.min(100, parseInt(it.qty, 10) || it.participants?.length || 1));
      return {
        quantity: qty,
        price_data: {
          currency: 'sek',
          unit_amount: Math.round(c.price * MOMS * 100), // öre, inkl. 25 % moms
          product_data: {
            name: c.title,
            description: 'Distanskurs · Nordic Agir Academy · inkl. 25 % moms',
          },
        },
      };
    });

    const participants = items.flatMap((it) =>
      (it.participants || []).map((p) => ({ k: it.courseId, n: p.name, e: p.email, pn: p.pnr || '' }))
    );
    const metadata = {
      buyer_name: (buyer.name || '').slice(0, 400),
      buyer_company: (buyer.company || '').slice(0, 400),
      buyer_orgnr: (buyer.orgnr || '').slice(0, 100),
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
      metadata,
      success_url: `${siteUrl}/?betalning=klar&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/?betalning=avbruten`,
      locale: 'sv',
      billing_address_collection: 'auto',
      invoice_creation: { enabled: true },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('create-checkout-session:', err.message);
    return res.status(500).json({ error: 'Kunde inte skapa betalsession' });
  }
}
