// skript/guider.mjs — innehållet i guidesidorna (/guider/*.html).
//
// Varje guide svarar på EN fråga som folk ställer till Google och AI-assistenter, och leder
// till rätt kurs. Priser och kurslängder hämtas ur kurskatalogen (k = kurserna efter id),
// så att guiden aldrig visar ett annat pris än butiken.
//
// Regler för texten: bara sådant som går att belägga. Inga konkurrentpriser, inga
// lagparagrafer vi inte är säkra på, inga löften å myndighetens vägnar. Hellre «fråga
// beställaren» än en gissning.

export function guider({ k, kr, inklMoms, tid }) {
  const pris = (id, en) => k[id] ? `${kr(k[id].price, en)} ${en ? 'excl. VAT' : 'exkl. moms'}` : '';
  return [
    // ---------------------------------------------------------------------------------
    {
      slug: 'vem-behover-apv-utbildning', lang: 'sv', kurser: ['apv', 'apv-en'],
      titel: 'Vem behöver APV-utbildning? Arbete på väg steg 1 förklarat',
      h1: 'Vem behöver APV-utbildning?',
      beskrivning: 'Arbete på väg (APV) steg 1 — vem som behöver delarna 1.1, 1.2 och 1.3, vad kursen tar upp och hur du läser den på distans.',
      kort: `Alla som arbetar på eller vid väg där Trafikverket ställer kompetenskrav behöver dokumenterad grundkompetens — APV steg 1. Vår kurs täcker hela steg 1 (1.1, 1.2 och 1.3) på distans för ${pris('apv')}.`,
      delar: [
        ['Vad är APV steg 1?', `<p>Arbete på väg (APV) är Trafikverkets krav på kompetens för den som arbetar på vägarbetsplatser. Steg 1 är grundkompetensen och består av tre delar:</p>
<table><tr><th>Del</th><th>För vem</th></tr>
<tr><td>1.1 Allmän grundkompetens</td><td>Alla som vistas och arbetar på vägarbetsplatsen: regelverket, skyddsanordningar, zonindelning och personlig skyddsutrustning.</td></tr>
<tr><td>1.2 Förare av väghållningsfordon</td><td>Den som kör väghållnings-, service- eller arbetsfordon på och vid vägen.</td></tr>
<tr><td>1.3 Vägarbete nära trafik</td><td>Den som utför själva vägarbetet intill passerande trafik, inklusive tillfällig utmärkning.</td></tr></table>`],
        ['Gäller det bara Trafikverkets vägar?', '<p>Kraven kommer från Trafikverket och gäller i deras uppdrag. Kommuner och andra väghållare kan ställa egna eller liknande krav i sina upphandlingar. Fråga alltid beställaren vilken kompetens som krävs i just ditt uppdrag.</p>'],
        ['Varför finns kraven?', '<p>En vägarbetsplats är en arbetsplats där trafiken passerar några meter bort. Kraven finns för att alla på platsen ska förstå riskerna, använda rätt skydd och märka ut arbetet så att både arbetare och trafikanter klarar sig.</p>'],
        ['Läs APV steg 1 på distans', `<p>Vår kurs går helt online, ${k.apv ? tid(k.apv) : ''}, och tar upp alla tre delarna — du behöver inte välja. Den avslutas med ett kunskapsprov med obegränsade omprov, och godkända deltagare får ett personligt certifikat som gäller i fem år, med QR-kod för kontroll. Pris: ${pris('apv')} per deltagare (${k.apv ? kr(inklMoms(k.apv.price)) : ''} inkl. moms).</p>${k['apv-en'] ? `<p>Kursen finns även på engelska för utländsk arbetskraft: ${pris('apv-en', 1)}.</p>` : ''}`],
      ],
      fragor: [
        ['Vem behöver APV-utbildning?', 'Alla som arbetar på eller vid väg där Trafikverket ställer kompetenskrav. Vilken del av steg 1 som krävs beror på din roll: 1.1 för alla på vägarbetsplatsen, 1.2 för förare av väghållningsfordon och 1.3 för den som utför vägarbetet nära trafik.'],
        ['Måste jag läsa alla tre delarna?', 'Det beror på din roll och på beställarens krav. Vår kurs täcker alla tre delarna i samma kurs, så du har hela steg 1 oavsett vad uppdraget kräver.'],
        ['Kan man läsa APV steg 1 på distans?', 'Ja. Vår kurs går helt online i din egen takt och avslutas med ett kunskapsprov som du kan göra om utan extra kostnad.'],
        ['Vad kostar APV-utbildningen?', `Hos oss ${pris('apv')} per deltagare, med prov och certifikat inräknat.`],
      ],
    },
    // ---------------------------------------------------------------------------------
    {
      slug: 'skillnad-ab-04-abt-06', lang: 'sv', kurser: ['ab-abt', 'ejur', 'abk', 'ab-abt-en'],
      titel: 'Skillnaden mellan AB 04 och ABT 06 — utförande- eller totalentreprenad',
      h1: 'Vad är skillnaden mellan AB 04 och ABT 06?',
      beskrivning: 'AB 04 används vid utförandeentreprenad och ABT 06 vid totalentreprenad. Så skiljer de sig åt — och var ABK 09 kommer in.',
      kort: 'Kort svar: AB 04 används när beställaren står för projekteringen och entreprenören bygger enligt beställarens handlingar (utförandeentreprenad). ABT 06 används när entreprenören står för både projektering och utförande (totalentreprenad).',
      delar: [
        ['Sida vid sida', `<table><tr><th></th><th>AB 04</th><th>ABT 06</th></tr>
<tr><td>Form</td><td>Utförande&shy;entreprenad</td><td>Total&shy;entreprenad</td></tr>
<tr><td>Projekterar</td><td>Beställaren, som tar fram handlingarna</td><td>Entreprenören, utifrån beställarens krav</td></tr>
<tr><td>Fel i hand&shy;lingarna</td><td>Huvudsakligen beställarens risk</td><td>Entreprenören svarar för sin egen projektering</td></tr>
<tr><td>Frihet</td><td>Bygger som det är beskrivet</td><td>Väljer lösningar inom de krav som ställts — ofta med funktionsansvar</td></tr></table>`],
        ['Vad har de gemensamt?', '<p>Avtalen är uppbyggda på samma sätt och reglerar samma frågor: omfattning, utförande, organisation, tider, ansvar, ekonomi, besiktning, hävning och tvister. Mycket av regleringen — till exempel underrättelser, ÄTA-arbeten och slutbesiktning — fungerar likartat. Skillnaderna sitter främst i vem som bär ansvaret för projekteringen.</p>'],
        ['Var kommer ABK 09 in?', '<p>ABK 09 är inget entreprenadavtal. Det gäller konsultuppdrag — till exempel när en arkitekt eller konstruktör projekterar åt beställaren. I en utförandeentreprenad anlitar beställaren ofta konsulter enligt ABK 09 och en entreprenör enligt AB 04.</p>'],
        ['Standardavtal är inte lag', '<p>AB 04, ABT 06 och ABK 09 gäller bara när parterna har kommit överens om dem, och parterna kan avtala om avvikelser. Läs därför alltid kontraktet och de administrativa föreskrifterna — och kontrollera vilken version av standardavtalet som anges. Det är det ni har skrivit under som gäller.</p>'],
      ],
      fragor: [
        ['Vad är skillnaden mellan AB 04 och ABT 06?', 'AB 04 används vid utförandeentreprenad där beställaren står för projekteringen. ABT 06 används vid totalentreprenad där entreprenören står för både projektering och utförande.'],
        ['Vilket avtal gäller i mitt projekt?', 'Det som anges i kontraktet. Standardavtalen gäller bara när parterna har avtalat om dem, ofta med avvikelser i de administrativa föreskrifterna.'],
        ['Gäller ABK 09 för entreprenörer?', 'Nej. ABK 09 gäller konsultuppdrag, till exempel projektering, inte entreprenader.'],
        ['Hur lär jag mig avtalen?', `Kursen «AB 04 och ABT 06» kostar ${pris('ab-abt')} och går igenom båda avtalen sida vid sida. Vill du även ha ABK 09 finns kursen «Entreprenadjuridik» för ${pris('ejur')}.`],
      ],
    },
    // ---------------------------------------------------------------------------------
    {
      slug: 'vad-ar-ata-arbete', lang: 'sv', kurser: ['ata', 'ejur', 'ata-en'],
      titel: 'Vad är ÄTA-arbete? Ändrings-, tilläggs- och avgående arbeten',
      h1: 'Vad räknas som ÄTA-arbete?',
      beskrivning: 'ÄTA står för ändrings-, tilläggs- och avgående arbeten. Så känner du igen dem, underrättar i tid och dokumenterar så att du får betalt.',
      kort: 'ÄTA står för ändrings-, tilläggs- och avgående arbeten — arbeten som skiljer sig från det som avtalades från början. Den viktigaste regeln i praktiken: underrätta beställaren innan du utför arbetet, annars riskerar du att inte få betalt.',
      delar: [
        ['De tre sorterna', `<table><tr><th>Typ</th><th>Vad det är</th></tr>
<tr><td>Ändringsarbete</td><td>Arbetet ska göras på ett annat sätt, i en annan omfattning eller av annan art än vad kontraktet anger.</td></tr>
<tr><td>Tilläggsarbete</td><td>Arbete som läggs till utöver kontraktet men hänger ihop med det.</td></tr>
<tr><td>Avgående arbete</td><td>Arbete som stryks ur kontraktet.</td></tr></table>`],
        ['Likställda ÄTA — de som många missar', '<p>Standardavtalen likställer vissa situationer med ÄTA även om ingen har beställt något, till exempel när beställarens handlingar visar sig vara felaktiga eller när myndighetskrav ändras efter anbudet. Den som inte känner till det jobbar ofta gratis.</p>'],
        ['Underrätta i tid', '<p>Anser du att ett arbete är ÄTA ska du underrätta beställaren innan du utför det. Gör det skriftligt, till rätt person, och beskriv vad som ändras och varför. Utförs arbetet utan underrättelse kan rätten till ersättning gå förlorad, helt eller delvis. Kontrollera vad ert kontrakt och de administrativa föreskrifterna säger om form och mottagare.</p>'],
        ['Dokumentera medan jobbet pågår', '<p>Dagbok, foton, mejl och mötesprotokoll är bevisningen om det blir diskussion. Det som dokumenteras samma dag är värt mer än det som rekonstrueras efteråt.</p>'],
      ],
      fragor: [
        ['Vad betyder ÄTA?', 'Ändrings-, tilläggs- och avgående arbeten — arbeten som avviker från det som ursprungligen avtalades i entreprenaden.'],
        ['Måste ÄTA beställas skriftligt?', 'Det beror på kontraktet. Underrätta alltid skriftligt innan arbetet utförs och spara beställningen, så står du stadigt om det blir diskussion.'],
        ['Vad händer om jag inte underrättar?', 'Då riskerar du att förlora rätten till ersättning för arbetet, helt eller delvis.'],
        ['Var lär jag mig hantera ÄTA?', `Kursen «ÄTA-arbeten» kostar ${pris('ata')} och tar upp underrättelser, dokumentation, prissättning och vad du gör när det blir oenighet.`],
      ],
    },
    // ---------------------------------------------------------------------------------
    {
      slug: 'bas-p-bas-u-in-english', lang: 'en', kurser: ['bas-en', 'bas'],
      titel: 'BAS-P and BAS-U in English — Swedish construction coordination explained',
      h1: 'BAS-P and BAS-U: what foreign contractors need to know',
      beskrivning: 'Every Swedish construction project needs a BAS-P and a BAS-U. What the roles mean, who appoints them and how to train in English online.',
      kort: `Under Swedish work environment law, the client (byggherre) must appoint a construction work environment coordinator for planning and design (BAS-P) and one for execution (BAS-U) on every construction project. Our online course covers both roles entirely in English for ${pris('bas-en', 1)}.`,
      delar: [
        ['The two roles', `<table><tr><th>Role</th><th>What it covers</th></tr>
<tr><td>BAS-P</td><td>Coordinates the work environment during planning and design, and makes sure a work environment plan (arbetsmiljöplan) is drawn up before the site is established.</td></tr>
<tr><td>BAS-U</td><td>Coordinates the work environment during execution: keeps the plan up to date, coordinates contractors on site and follows up that the rules are followed.</td></tr></table>`],
        ['Who is responsible?', '<p>The client (byggherre) is responsible for appointing BAS-P and BAS-U. The client can take on the roles itself or hand them over to someone with the right training, experience and competence — often the main contractor. Each employer remains responsible for its own workers.</p>'],
        ['Is a specific course required?', '<p>Swedish law does not name a specific course or provider. It requires the coordinator to have the training, experience and competence the assignment needs. A course with a certificate is a practical way to show and document that training to your client.</p>'],
        ['Train online, in English', `<p>Our course covers the Swedish system, both roles, the work environment plan, documentation and liability, and working with Swedish clients and Arbetsmiljöverket. It is entirely online, ${k['bas-en'] ? k['bas-en'].dur : ''}, at your own pace, with an online exam (unlimited attempts) and a personal certificate valid for five years. Price: ${pris('bas-en', 1)} per participant.</p>`],
      ],
      fragor: [
        ['What are BAS-P and BAS-U?', 'They are the construction work environment coordinators required on Swedish construction projects: BAS-P for planning and design, BAS-U for execution.'],
        ['Who has to appoint BAS-P and BAS-U?', 'The client (byggherre). The client can hand the roles over to a competent person, often the main contractor.'],
        ['Can I take the BAS course in English?', `Yes. Our course is held entirely in English and online. It costs ${pris('bas-en', 1)} per participant.`],
        ['How long is the certificate valid?', 'Five years from the exam date. It has a QR code your client can scan to verify it.'],
      ],
    },
  ];
}
