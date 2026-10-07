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
    // ---------------------------------------------------------------------------------
    {
      slug: 'skillnad-bas-p-bas-u', lang: 'sv', kurser: ['bas', 'bas-en'],
      titel: 'Skillnaden mellan BAS-P och BAS-U — byggarbetsmiljösamordnarens två roller',
      h1: 'Vad är skillnaden mellan BAS-P och BAS-U?',
      beskrivning: 'BAS-P samordnar arbetsmiljön under planering och projektering, BAS-U under utförandet. Så skiljer sig rollerna åt och vem som utser dem.',
      kort: 'Kort svar: BAS-P samordnar arbetsmiljön medan projektet planeras och projekteras. BAS-U tar över när bygget utförs. Byggherren ska se till att båda rollerna finns i varje byggprojekt — de kan innehas av samma person eller av olika.',
      delar: [
        ['Sida vid sida', `<table><tr><th></th><th>BAS-P</th><th>BAS-U</th></tr>
<tr><td>Står för</td><td>Planering och projektering</td><td>Utförande</td></tr>
<tr><td>När</td><td>Innan bygget startar</td><td>Medan bygget pågår</td></tr>
<tr><td>Arbets&shy;miljöplanen</td><td>Ser till att den upprättas innan arbetsplatsen etableras</td><td>Håller den aktuell och ser till att den följs</td></tr>
<tr><td>Typiska uppgifter</td><td>Samordnar projektörerna så att risker konstrueras bort och dokumenterar det som behövs för senare arbeten</td><td>Samordnar entreprenörerna på plats, ser till att arbetena inte skapar risker för varandra och följer upp att reglerna efterlevs</td></tr></table>`],
        ['Vem utser BAS-P och BAS-U?', '<p>Byggherren — den som låter utföra byggarbetet. Byggherren kan ta rollerna själv eller överlåta dem till någon annan, ofta en konsult för BAS-P och huvudentreprenören för BAS-U. Den som utses ska ha den utbildning, erfarenhet och kompetens som uppdraget kräver. Varje arbetsgivare har fortfarande ansvar för sina egna anställda.</p>'],
        ['Kan samma person vara både BAS-P och BAS-U?', '<p>Ja. Det är vanligt i mindre projekt. Det viktiga är att båda skedena täcks och att den som har rollen har tid och mandat att samordna.</p>'],
        ['Läs båda rollerna i samma kurs', `<p>Vår kurs tar upp både BAS-P och BAS-U — rollerna, arbetsmiljöplanen, samordningen och vad som händer när något går fel. Den går helt online, ${k.bas ? tid(k.bas) : ''}, och kostar ${pris('bas')} per deltagare med prov och certifikat inräknat.</p>`],
      ],
      fragor: [
        ['Vad gör en BAS-P?', 'BAS-P samordnar arbetsmiljöarbetet under planering och projektering och ser till att en arbetsmiljöplan upprättas innan arbetsplatsen etableras.'],
        ['Vad gör en BAS-U?', 'BAS-U samordnar arbetsmiljöarbetet under utförandet: håller arbetsmiljöplanen aktuell, samordnar entreprenörerna och följer upp att reglerna efterlevs.'],
        ['Måste det vara två olika personer?', 'Nej. Samma person kan ha båda rollerna, så länge båda skedena täcks.'],
        ['Behöver man gå två kurser?', `Inte hos oss. Kursen «BAS-P och BAS-U» täcker båda rollerna och kostar ${pris('bas')}.`],
      ],
    },
    // ---------------------------------------------------------------------------------
    {
      slug: 'utbildning-arbete-pa-hojd', lang: 'sv', kurser: ['fall'],
      titel: 'Krävs utbildning för arbete på höjd? Fallskydd förklarat',
      h1: 'Krävs utbildning för arbete på höjd?',
      beskrivning: 'Arbetsgivaren ska se till att den som arbetar på höjd har tillräckliga kunskaper. Vad det innebär, skyddens rangordning och hur du läser fallskydd på distans.',
      kort: `Arbetsgivaren ska se till att den som arbetar på höjd har tillräckliga kunskaper om riskerna och om skydden som används. Fall är en av byggbranschens vanligaste dödsorsaker. Vår distanskurs i fallskydd kostar ${pris('fall')}.`,
      delar: [
        ['Vem behöver kunna fallskydd?', '<p>Alla som arbetar eller leder arbete på höjd: på tak, vid fasader och montage, från ställning eller lift, vid service och besiktning. Fallolyckor händer inte bara på hög höjd — även låga höjder och svaga ytor som takfönster och plåttak är farliga.</p>'],
        ['Skyddens rangordning', `<p>Arbetsmiljöreglerna bygger på en tydlig ordning:</p>
<table><tr><th>Ordning</th><th>Åtgärd</th></tr>
<tr><td>Först</td><td>Undvik höjdarbetet om det går, till exempel genom att förtillverka på marken.</td></tr>
<tr><td>Sedan</td><td>Kollektiva skydd som skyddar alla: räcken, skyddsnät, ställningar.</td></tr>
<tr><td>Sist</td><td>Personlig fallskyddsutrustning, som sele och falldämpare.</td></tr></table>`],
        ['Vad ingår i en bra fallskyddsutbildning?', '<p>Att skilja fallhindrande, positionerande och fallstoppande system, att kontrollera och kassera utrustning, förankringspunkter och fallfaktor, behovet av fri höjd under den som faller — och räddningsplanen, eftersom den som hänger i selen behöver komma ner snabbt.</p>'],
        ['Andra utbildningskrav kan tillkomma', '<p>Ställningsbyggnad och arbete med mobila arbetsplattformar (lift) har egna utbildningskrav. Fallskyddsutbildningen ersätter inte dem. Fråga din arbetsgivare eller beställare vad som krävs i ditt uppdrag.</p>'],
      ],
      fragor: [
        ['Krävs utbildning för arbete på höjd?', 'Arbetsgivaren ska se till att den som arbetar på höjd har tillräckliga kunskaper om riskerna och skydden. En dokumenterad utbildning är ett sätt att visa det.'],
        ['Räcker det med sele?', 'Nej. Personlig fallskyddsutrustning är sista utvägen. Först ska höjdarbetet undvikas eller kollektiva skydd som räcken och nät användas.'],
        ['Ersätter fallskyddskursen liftutbildning?', 'Nej. Lift och ställning har egna utbildningskrav.'],
        ['Vad kostar fallskyddskursen?', `${pris('fall')} per deltagare, på distans, med prov och certifikat som gäller i fem år.`],
      ],
    },
    // ---------------------------------------------------------------------------------
    {
      slug: 'signalman-lastkoppling-lyft', lang: 'sv', kurser: ['lyft', 'lyft-en'],
      titel: 'Signalman och lastkoppling — vad krävs vid lyft på bygget?',
      h1: 'Vad gör en signalman och vad krävs vid lyft?',
      beskrivning: 'Signalmannen är kranförarens ögon. Vad rollen innebär, vem som kopplar last, och vilken kunskap arbetsmiljöreglerna kräver vid lyft.',
      kort: `Signalmannen dirigerar kranföraren när föraren inte själv ser lasten, och lastkopplaren fäster lasten med rätt redskap. Båda ska ha den kunskap som arbetet kräver. Vår kurs Säkra lyft kostar ${pris('lyft')}.`,
      delar: [
        ['Rollerna vid ett lyft', `<table><tr><th>Roll</th><th>Uppgift</th></tr>
<tr><td>Lastkopplare</td><td>Väljer och kontrollerar lyftredskap, bedömer vikt och tyngdpunkt och kopplar lasten säkert.</td></tr>
<tr><td>Signalman</td><td>Är kranförarens ögon och dirigerar lyftet med överenskomna tecken eller radio.</td></tr>
<tr><td>Kranförare</td><td>Manövrerar kranen. Har egna utbildnings- och tillståndskrav beroende på krantyp.</td></tr>
<tr><td>Arbetsledning</td><td>Planerar lyftet, ser till att riskerna är bedömda och att rätt personer gör rätt sak.</td></tr></table>`],
        ['Vad kräver reglerna?', '<p>Arbetsgivaren ska se till att den som deltar i lyft har tillräckliga kunskaper för uppgiften, och att lyftredskapen är lämpliga, märkta och kontrollerade. För vissa maskiner, som kranar, finns dessutom särskilda krav på utbildning och tillstånd för föraren. Fråga beställaren eller arbetsgivaren vad som gäller i ditt uppdrag.</p>'],
        ['Planera lyftet', '<p>Ett säkert lyft börjar innan kroken går upp: vikt och tyngdpunkt, vinklar och redskapets kapacitet, omgivning och var människor befinner sig. Tre minuters riskbedömning är det som skiljer rutin från olycka.</p>'],
        ['Säkra lyft på distans', `<p>Kursen tar upp regler och ansvar, lyftredskap och daglig kontroll, planering och riskbedömning, koppling och signalering. ${k.lyft ? tid(k.lyft) : ''}, ${pris('lyft')}.${k['lyft-en'] ? ` Finns även på engelska: ${pris('lyft-en', 1)}.` : ''}</p>`],
      ],
      fragor: [
        ['Vad gör en signalman?', 'Signalmannen dirigerar kranföraren när föraren inte själv ser lasten, med standardiserade tecken eller radio.'],
        ['Krävs utbildning för att koppla last?', 'Arbetsgivaren ska se till att den som kopplar last har tillräckliga kunskaper. En dokumenterad utbildning är ett sätt att visa det.'],
        ['Ger kursen behörighet att köra kran?', 'Nej. Kranförare har egna utbildnings- och tillståndskrav. Kursen gäller lastkoppling, signalering och planering av lyft.'],
        ['Vad kostar Säkra lyft?', `${pris('lyft')} per deltagare, med prov och certifikat.`],
      ],
    },
    // ---------------------------------------------------------------------------------
    {
      slug: 'vinna-offentlig-upphandling', lang: 'sv', kurser: ['anbud', 'lou-praktik', 'ramavtal', 'luf-praktik'],
      titel: 'Hur vinner man en offentlig upphandling? Anbudsarbete steg för steg',
      h1: 'Hur vinner man en offentlig upphandling?',
      beskrivning: 'De vanligaste skälen till att anbud förkastas, hur utvärderingsmodellerna fungerar och vad du kan göra under anbudstiden för att öka chansen.',
      kort: 'Kort svar: uppfyll varje skall-krav, förstå utvärderingsmodellen innan du sätter priset, ställ frågor under anbudstiden och granska anbudet noga innan inlämning. Många anbud förlorar inte på pris utan på formalia.',
      delar: [
        ['1. Läs underlaget som en upphandlare', '<p>Skilj på <b>skall-krav</b> — som måste uppfyllas för att anbudet ens ska prövas — och <b>utvärderingskriterier</b>, som ger poäng. Ett missat skall-krav fäller anbudet oavsett pris. En enkel kravmatris, där varje krav kopplas till svar, bevis och ansvarig person, gör att inget missas.</p>'],
        ['2. Förstå utvärderingsmodellen', '<p>Upphandlaren utvärderar antingen på pris eller på bästa förhållande mellan pris och kvalitet. Med kvalitetskriterier kan ett dyrare anbud vinna — men bara om kvaliteten beskrivs så att utvärderaren kan ge poäng för den. Räkna på modellen innan du sätter priset.</p>'],
        ['3. Ställ frågor under anbudstiden', '<p>Är något otydligt: fråga. Svaren går ut till alla anbudsgivare, så formulera frågan så att den förbättrar underlaget utan att avslöja din strategi.</p>'],
        ['4. Slutgranska före inlämning', '<p>Formalia, underskrifter, bilagor och referenser. De vanligaste skälen till att anbud förkastas är fel som hade gått att upptäcka med en checklista.</p>'],
        ['5. Efter tilldelningen', '<p>Har du förlorat och tror att något gått fel finns en möjlighet att begära överprövning hos förvaltningsrätten. Det finns korta tidsfrister, så agera snabbt och bedöm om det är värt det.</p>'],
      ],
      fragor: [
        ['Varför förkastas anbud?', 'Oftast för att ett skall-krav inte är uppfyllt eller för att formalia saknas — inte för priset.'],
        ['Vinner alltid lägsta pris?', 'Nej. Upphandlaren kan utvärdera på bästa förhållande mellan pris och kvalitet, och då kan ett dyrare anbud vinna.'],
        ['Får man ställa frågor under anbudstiden?', 'Ja. Svaren delas med alla anbudsgivare.'],
        ['Var lär jag mig anbudsarbete?', `Kursen «Anbudsarbete» kostar ${pris('anbud')} och fokuserar på att granska och kvalitetssäkra anbudet. Kursen «LOU» för ${pris('lou-praktik')} går djupare i utvärderingsmodeller, kvalificering och överprövning.`],
      ],
    },
    // ---------------------------------------------------------------------------------
    {
      slug: 'skillnad-ama-mer', lang: 'sv', kurser: ['ama-anl', 'mer', 'ama-hus', 'ama-af'],
      titel: 'Vad är skillnaden mellan AMA och MER? Beskrivning och mätregler',
      h1: 'Vad är skillnaden mellan AMA och MER?',
      beskrivning: 'AMA beskriver hur arbetet ska utföras, MER hur det mäts och ersätts. Så hänger AMA Anläggning, MER, AMA Hus och AMA AF ihop.',
      kort: 'Kort svar: AMA beskriver vilka material och vilket utförande som gäller. MER (mät- och ersättningsregler) bestämmer hur mängderna i mängdförteckningen mäts och vad som ingår i ersättningen. AMA svarar på «hur ska det byggas?», MER på «hur mycket och vad får jag betalt för?».',
      delar: [
        ['AMA-familjen', `<table><tr><th>Del</th><th>Vad den gör</th></tr>
<tr><td>AMA Hus / AMA Anläggning</td><td>Referenstexter för material och utförande som den tekniska beskrivningen hänvisar till med koder.</td></tr>
<tr><td>MER</td><td>Regler för hur mängder mäts och vad à-priset ska täcka. Används med mängdförteckning, särskilt inom anläggning.</td></tr>
<tr><td>AMA AF</td><td>De administrativa föreskrifterna: anbudskrav, tider, viten, försäkringar, möten.</td></tr></table>`],
        ['Varför MER avgör ersättningen', '<p>I ett mängdkontrakt får entreprenören betalt per mängd. MER avgör om en mängd mäts teoretiskt eller som utförd, vilka mängder som är reglerbara och vad som ingår i à-priset. Två kalkylatorer som läser MER olika kommer fram till olika anbudssummor — och olika ersättning när jobbet regleras.</p>'],
        ['Koderna drar med sig text', '<p>När beskrivningen hänvisar till en AMA-kod gäller även text på överliggande nivåer (pyramidregeln). Den som bara läser den egna koden missar ofta krav.</p>'],
        ['Avtalet bestämmer', '<p>AMA och MER blir avtalsinnehåll när handlingarna hänvisar till dem, och projektets egna föreskrifter kan gå före. Kontrollera alltid handlingarnas rangordning och vilka utgåvor som anges.</p>'],
      ],
      fragor: [
        ['Vad betyder AMA?', 'Allmän material- och arbetsbeskrivning — referenstexter för material och utförande som tekniska beskrivningar hänvisar till.'],
        ['Vad betyder MER?', 'Mät- och ersättningsregler — reglerna för hur mängder i mängdförteckningen mäts och vad ersättningen omfattar.'],
        ['Behöver jag kunna båda?', 'Inom mark och anläggning, ja: AMA styr utförandet och MER styr ekonomin.'],
        ['Var lär jag mig AMA och MER?', `«AMA Anläggning» kostar ${pris('ama-anl')} och «MER Anläggning» ${pris('mer')}. För husbyggnad finns «AMA Hus» för ${pris('ama-hus')}.`],
      ],
    },
    // ---------------------------------------------------------------------------------
    {
      slug: 'apv-course-in-english', lang: 'en', kurser: ['apv-en', 'apv'],
      titel: 'APV course in English — working on Swedish roads',
      h1: 'Working on Swedish roads: the APV course in English',
      beskrivning: 'Trafikverket requires basic competence (APV Step 1) for road work. What steps 1.1, 1.2 and 1.3 cover, and how to train online in English.',
      kort: `To work on or beside roads where Trafikverket (the Swedish Transport Administration) sets competence requirements, you need documented basic competence: APV Step 1. Our online course covers all of Step 1 entirely in English for ${pris('apv-en', 1)}.`,
      delar: [
        ['What is APV Step 1?', `<p>APV (Arbete på väg — work on roads) is Trafikverket's competence requirement for road work sites. Step 1 is the basic level and has three parts:</p>
<table><tr><th>Part</th><th>For whom</th></tr>
<tr><td>1.1 General basic competence</td><td>Everyone present and working on the road work site.</td></tr>
<tr><td>1.2 Drivers of road maintenance vehicles</td><td>Those driving maintenance, service or works vehicles on and beside the road.</td></tr>
<tr><td>1.3 Road works close to traffic</td><td>Those carrying out the work next to passing traffic, including temporary signage.</td></tr></table>`],
        ['Does it apply to all roads?', '<p>The requirements come from Trafikverket and apply to their assignments. Municipalities and other road authorities may set similar requirements in their contracts. Always ask your client which competence the assignment requires.</p>'],
        ['Train online, in English', `<p>Our course covers all three parts, so you do not have to choose. It is online, ${k['apv-en'] ? k['apv-en'].dur : ''}, at your own pace, with an online exam (unlimited attempts) and a personal certificate valid for five years. Price: ${pris('apv-en', 1)} per participant.</p>`],
      ],
      fragor: [
        ['Who needs APV training in Sweden?', 'Everyone working on or beside roads where Trafikverket sets competence requirements. Which part of Step 1 applies depends on your role.'],
        ['Can I take APV Step 1 in English?', `Yes. Our course is held entirely in English and online, for ${pris('apv-en', 1)}.`],
        ['Do I need all three parts?', 'It depends on your role and your client. Our course covers all three, so you are covered either way.'],
        ['How long is the certificate valid?', 'Our certificate is valid for five years from the exam date and has a QR code for verification.'],
      ],
    },
  ];
}
