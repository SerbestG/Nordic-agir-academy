# Nordic Agir Academy — driftsättning med Stripe

Så här får ni butiken live med riktiga betalningar (kort, Swish, Klarna) på ca 30 minuter.

## Vad som finns i paketet

```
index.html                        ← hela butiken + adminportal (frontend)
api/create-checkout-session.js   ← skapar Stripe-betalning från kundvagnen
api/stripe-webhook.js             ← tar emot "betalning klar" och skickar mejl
api/order-invoice.js              ← tar emot fakturabeställningar och mejlar er
package.json
```

## Steg 1 — Lägg upp koden på Vercel (gratis)

1. Skapa ett konto på **vercel.com** (logga gärna in med GitHub).
2. Lägg denna mapp i ett GitHub-repo och klicka **Import Project** i Vercel,
   eller installera Vercel CLI och kör `vercel` i mappen.
3. Vercel serverar `index.html` som sajt och mappen `api/` blir automatiskt
   serverfunktioner. Inget mer behövs.

## Steg 2 — Hämta era Stripe-nycklar

1. Logga in på **dashboard.stripe.com**.
2. Gå till **Developers → API keys** och kopiera er **Secret key**
   (börja med testnyckeln `sk_test_...` — byt till `sk_live_...` när allt funkar).

## Steg 3 — Skapa webhooken

1. I Stripe: **Developers → Webhooks → Add endpoint**.
2. URL: `https://ER-DOMÄN.vercel.app/api/stripe-webhook`
3. Välj händelsen **checkout.session.completed**.
4. Kopiera **Signing secret** (`whsec_...`).

## Steg 4 — Miljövariabler i Vercel

I Vercel: **Project → Settings → Environment Variables**, lägg till:

| Namn | Värde |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_...` (senare `sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` från steg 3 |
| `SITE_URL` | `https://ER-DOMÄN.vercel.app` (eller er egen domän) |
| `RESEND_API_KEY` | *(valfritt men rekommenderat — se steg 6)* |
| `ADMIN_EMAIL` | `info@nordicagir.se` |

Deploya om efter att variablerna lagts in.

## Steg 5 — Aktivera Swish och Klarna

I Stripe: **Settings → Payment methods**. Slå på **Swish** och **Klarna**
(kort och Apple/Google Pay är på som standard). De dyker då upp automatiskt
i kassan — ingen kodändring behövs. Swish kräver att bolaget är registrerat
i Sverige, vilket ni är.

## Steg 6 — E-postutskick (Resend)

1. Skapa gratiskonto på **resend.com**.
2. Verifiera domänen **nordicagir.se** (de visar exakt vilka DNS-poster som ska in).
3. Skapa en API-nyckel och lägg den som `RESEND_API_KEY` i Vercel.

Då skickas automatiskt: internt ordermejl till er, välkomstmejl till varje
deltagare, och bekräftelse vid fakturaköp. Utan nyckel loggas mejlen bara
i Vercels loggar (bra för test).

## Steg 7 — Testa!

1. Öppna sajten, lägg en kurs i kundvagnen och gå till kassan.
2. Välj **Betala direkt** — du skickas till Stripes betalsida.
3. Testkort: `4242 4242 4242 4242`, valfritt datum framåt och valfri CVC.
4. Efter betalning skickas du tillbaka med bekräftelse, och webhooken
   syns under **Developers → Webhooks** i Stripe.
5. Testa även **Faktura 30 dagar** — ni ska få ett mejl med ordern.

När allt funkar: byt till live-nycklar och peka er riktiga domän
(t.ex. academy.nordicagir.se) till Vercel-projektet.

## Bra att veta

- **Moms:** vid direktbetalning läggs 25 % moms på automatiskt (konstanten
  `MOMS` i `create-checkout-session.js`). Fakturapriser anges exkl. moms
  och momsen läggs på i er fakturering som vanligt.
- **Priser** ändras på TVÅ ställen: kurslistan i `index.html` (visning) och
  `COURSES` i `api/create-checkout-session.js` (det som faktiskt debiteras).
  Serverns lista är alltid den som gäller.
- **Kvitto:** Stripe skapar automatiskt kvitto/faktura-PDF till kunden
  (`invoice_creation` är påslaget).
- **Adminportalen** (`#admin`) kör fortfarande med demodata i webbläsaren.
  Beställningarna finns på riktigt i Stripe Dashboard + era ordermejl.
  Nästa naturliga steg är en liten databas (t.ex. Supabase) så att portalen
  visar riktiga ordrar, deltagarstatus och certifikatregister — säg till
  så bygger vi det.
- **Byt demo-lösenordet** till adminportalen innan lansering (söker ni på
  `agir2026` i index.html hittar ni det).
