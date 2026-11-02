// Generates Umeå tour audio with ElevenLabs into public/audio/Umea/ (English) and
// public/audio/Umea/de/ (German), see src/tours/umea.ts and src/tours/umea.de.ts.
// Run: npm run audio:umea   (reads ELEVENLABS_API_KEY from .env.local)
// Existing files are skipped so credits are not spent twice. --force regenerates them;
// add file names to regenerate only those, e.g. `npm run audio:umea -- --force 08_Stop4_Radhustorget.mp3`.
//
// Voice, model and settings match the original English recordings (ElevenLabs history,
// September 2026), so both languages sound like the same Elin. Change them only for all files at once.

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const AUDIO_DIR = new URL("../public/audio/Umea/", import.meta.url);
const VOICE_ID = "cpem3N5MtM55uEhRFyBJ"; // "Elin Lindqvist"
const MODEL_ID = "eleven_multilingual_v2";
const VOICE_SETTINGS = { stability: 0.5, similarityBoost: 0.75, style: 0, speed: 1, useSpeakerBoost: true };

const args = process.argv.slice(2);
const force = args.includes("--force");
const onlyFiles = args.filter((a) => a.endsWith(".mp3"));

// Only the English segments that were rewritten after the original recording are listed here;
// the other English files were generated in the ElevenLabs web app.
const en = {
  "08_Stop4_Radhustorget.mp3": `We're standing at Rådhustorget — the historic heart of Umeå. This Town Hall was finished in 1890, right after the great fire, designed by the city's own architect, Fredrik Olaus Lindström. Here's a detail I like: after the fire, the city wasn't taking any more chances with timber. Lindström built this one in stone — solid, fireproof, and a clear sign that Umeå had learned from the flames. Lindström, by the way, wasn't done with this square. He also designed the church you'll see in a couple of minutes. Same architect, same fire, two of the city's most recognizable buildings.`,
};

const de = {
  "01_Intro.mp3": `Hej und willkommen in Umeå! Ich bin Elin. Ich bin hier aufgewachsen, ich erforsche beruflich Pflanzen an der Universität Umeå, und in meiner Freizeit versuche ich zu erklären, warum diese Stadt so aussieht, wie sie aussieht.

Fangen wir damit an, warum es hier überhaupt eine Stadt gibt. Umeå liegt genau dort, wo der Fluss Ume in den Bottnischen Meerbusen mündet, ein natürlicher Hafen. Im Jahr 1622 verlieh König Gustav II. Adolf dieser Siedlung die Stadtrechte, vor allem, um den Handel zu kontrollieren, der hier durchlief. Mehr als 250 Jahre lang wuchs sie als ruhige Holzstadt, bis zum 25. Juni 1888.

An diesem Tag brach in einer Brauerei im Osten der Stadt ein Feuer aus. Starke Winde trugen es durch den gesamten östlichen Stadtteil, die Werften und die Insel Ön. Innerhalb eines einzigen Nachmittags verloren rund 2.300 der etwa 3.000 Einwohnerinnen und Einwohner Umeås ihr Zuhause.

Was danach geschah, ist der Grund, warum du heute so oft den Beinamen „Björkarnas Stad“ hörst, die Stadt der Birken. Die Stadt verbreiterte ihre Straßen, damit sie als Brandschneisen zwischen den Gebäuden dienen, und entschied sich 1892 dafür, Birken entlang der Straßen zu pflanzen. Und das ist nicht nur hübsch: Birkenholz und Birkenlaub enthalten mehr Feuchtigkeit und brennen deutlich schlechter als harzreiche Nadelbäume, sodass eine Birkenreihe ein Feuer tatsächlich bremsen kann. Es dauerte etwa sechs oder sieben Jahre, das Stadtzentrum wieder aufzubauen, in dem du jetzt stehst.

Heute gehen wir von diesem Park am Fluss durch die Altstadt und enden an einem Museum mit einer der schönsten Aussichten der Stadt. Los geht's.`,

  "02_Stop1_Broparken.mp3": `Da sind wir also im Broparken, und wenn er dir lebendiger als historisch vorkommt, dann ist das genau der Punkt. Das ist Umeås moderner Stadtpark: Skater nutzen den „Sparken“ unter der Brücke, Leute machen Parkour an den Mauern, und im Sommer gibt es Pop-up-Märkte, und die halbe Stadt sonnt sich auf der Wiese. Das ist ein guter Kontrast zu dem, was als Nächstes kommt, denn fast alles östlich von hier hat eine viel ältere Geschichte, die mit einem Feuer beginnt. 1888 brannte das größtenteils hölzerne Umeå bis auf die Grundmauern nieder. Dieses eine Ereignis hat fast jedes Gebäude geprägt, das wir heute sehen werden.`,

  "03_Walk_to_Stop_2.mp3": `Geh auf dem Uferweg, der Västra Strandgatan, nach Osten in Richtung Kulturväven. Nach ein paar Minuten siehst du seine markante gestreifte Fassade am Flussufer.`,

  "04_Stop2_Vaven.mp3": `Dieses Gebäude heißt Väven, „das Gewebe“, und wenn du das weißt, ergibt die gestreifte Fassade viel mehr Sinn. Es wurde im November 2014 eröffnet, im selben Jahr, in dem Umeå Europäische Kulturhauptstadt war, und kostete rund 700 Millionen Kronen. Im Inneren verwebt es tatsächlich eine Bibliothek, ein Frauengeschichtsmuseum, ein Theater, ein Kino und ein Hotel unter einem Dach. Und schau dir die Fassade genau an: helle und dunkle Streifen, die an Birkenrinde erinnern sollen. Erinnerst du dich an das Feuer, von dem ich erzählt habe? Nach 1888 pflanzte die Stadt überall Birken, um zu verhindern, dass sich künftige Brände ausbreiten, und 130 Jahre später greifen Architekten das immer noch auf.`,

  "05_Walk_to_Stop_3.mp3": `Bieg in die Storgatan ein. Das Stora Hotellet liegt direkt nebenan, nur ein paar Schritte vom Haupteingang des Väven entfernt.`,

  "06_Stop3_StoraHotellet.mp3": `Das ist das Stora Hotellet, erbaut 1895 und finanziert von der örtlichen Seemannsmission. Damals erfüllte dieses Gebäude eine doppelte Funktion: teils Hotel, teils Missionsbüro. Und die Gäste waren eine seltsame Mischung: Die bessere Gesellschaft und sogar Königliche teilten sich die Räume mit Schiffskapitänen und Matrosen, die frisch aus dem Hafen kamen. Dieser Kontrast ist bis heute das ganze Designkonzept; das Hotel wurde um 2013 mit einem stolz maritimen Thema renoviert, Samt neben Segeltuch. Das Restaurant im Erdgeschoss, Gotthard's Krog, ist nach dem allerersten Besitzer des Hotels benannt, Gotthard Zetterberg. Merk dir das für die Frage, wo du heute zu Abend essen willst.`,

  "07_Walk_to_Stop_4.mp3": `Geh noch einen kurzen Block weiter bis zum Rådhustorget. Das Rathaus aus rotem Backstein am Platz kannst du nicht übersehen.`,

  "08_Stop4_Radhustorget.mp3": `Wir stehen am Rådhustorget, dem historischen Herzen Umeås. Dieses Rathaus wurde 1890 fertiggestellt, direkt nach dem großen Brand, entworfen vom Stadtarchitekten Fredrik Olaus Lindström. Ein Detail, das ich mag: Nach dem Brand wollte die Stadt kein Risiko mehr mit Holz eingehen. Lindström baute dieses Rathaus aus Stein, solide und feuerfest, ein klares Zeichen, dass Umeå aus dem Feuer gelernt hatte. Lindström war übrigens noch nicht fertig mit diesem Platz. Er entwarf auch die Kirche, die du gleich sehen wirst. Derselbe Architekt, derselbe Brand, zwei der bekanntesten Gebäude der Stadt.`,

  "09_Walk_to_Stop_5.mp3": `Geh die Rådhusesplanaden hinunter zum Fluss und folge dann dem Uferweg nach Osten. Auf der linken Seite taucht bald der Kirchturm auf.`,

  "10_Stop5_Stadskyrka.mp3": `Das ist Umeås Stadtkirche, und es ist die dritte Kirche, die genau an dieser Stelle steht. Die erste war eine einfache Holzkirche von 1646. Diese hier, die du gerade vor dir siehst, wurde zwischen 1892 und 1894 gebaut, wieder von Fredrik Olaus Lindström. Ja, derselbe Architekt wie beim Rathaus. Sie wurde am 2. Dezember 1894 geweiht, am ersten Adventssonntag jenes Jahres. Backstein mit Steinfundament, und ganz klar als Aussage gedacht: Dieses Mal bauen wir etwas, das hält. Bisher hat es das getan.`,

  "11_Walk_to_Stop_6.mp3": `Geh direkt hinter der Kirche in den Park. Jetzt bist du im Vänortsparken, auch bekannt als Twintowns Park.`,

  "12_Stop6_TwintownsPark.mp3": `Willkommen im Vänortsparken, dem Twintowns Park. Er ist eigentlich älter, als er aussieht: 1858 von Umeås Gartengesellschaft angelegt und dann, wie fast alles andere auf diesem Rundgang, beim Brand von 1888 zerstört. Seine heutige Gestalt und seinen heutigen Namen bekam er 1985 nach einer großen Umgestaltung, die den kleinen künstlichen Bach hinzufügte, den du dort plätschern hörst. Der Name kommt von Umeås sechs Partnerstädten; für jede von ihnen gibt es im Park einen eigenen Bereich. Eine ruhige, grüne Pause vor unserem letzten Stopp, der ein ganzes Stück entfernt ist, also nimm dir Zeit.`,

  "13_Walk_to_Stop_7.mp3": `Geh zurück zum Uferweg und folge ihm über die Östra Strandgatan nach Osten, hinüber zum Umeå Arts Campus. Vor dir am Fluss taucht bald die hohe Holzfassade des Bildmuseet auf.`,

  "14_Stop7_Bildmuseet_and_Outro.mp3": `Und da sind wir, das Bildmuseet, das Museum für visuelle Kunst, und unser Ziel. Es wurde schon 1981 gegründet, aber dieses Gebäude ist viel jünger: Es wurde am 19. Mai 2012 für die Öffentlichkeit eröffnet, sieben Stockwerke holzverkleidete Architektur des dänischen Büros Henning Larsen Architects in Zusammenarbeit mit White Arkitekter, übrigens dasselbe Team, das hinter der Fassade von Väven steht. Die Verkleidung besteht aus Lärche und verwittert langsam zu einem Silbergrau, mit Blick direkt auf den Fluss Ume.

Denk an den Bogen, den wir gerade gelaufen sind. Ein Handelsplatz an einer Flussmündung, 1622 mit Stadtrechten versehen. 1888 an einem Nachmittag fast vollständig niedergebrannt. Gezielt wieder aufgebaut, mit breiten Straßen und Tausenden von Birken als Schutz. Und jetzt, am Ufer desselben Flusses, eine Stadt, die sich zur Europäischen Kulturhauptstadt entwickelt hat und eines ihrer Wahrzeichen aus, du hast es erraten, wieder Holz gebaut hat. Dasselbe Material, derselbe Fluss, ein völlig anderer Grund. So ist Umeå: Es baut immer wieder mit dem, was es fast zerstört hätte, nur jedes Mal klüger.

Tack för idag. Danke, dass du mit mir gegangen bist.`,
};

const client = new ElevenLabsClient();

for (const [subdir, segments] of [["", en], ["de/", de]]) {
  const outDir = new URL(subdir, AUDIO_DIR);
  mkdirSync(outDir, { recursive: true });

  for (const [file, text] of Object.entries(segments)) {
    const target = new URL(file, outDir);
    if (onlyFiles.length > 0 && !onlyFiles.includes(file)) continue;
    if (existsSync(target) && !force) {
      console.log(`skip  ${subdir}${file} (exists)`);
      continue;
    }
    const audio = await client.textToSpeech.convert(VOICE_ID, {
      text,
      modelId: MODEL_ID,
      voiceSettings: VOICE_SETTINGS,
      outputFormat: "mp3_44100_128",
    });
    writeFileSync(target, Buffer.from(await new Response(audio).arrayBuffer()));
    console.log(`wrote ${subdir}${file} (${text.length} chars)`);
  }
}
