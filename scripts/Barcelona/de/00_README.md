# Barcelona Audio Tour – Pilot (12 POIs)

Pilot v1 · Guide: Carlos (Barcelona) · Sprache: Deutsch · Cluster: Barri Gòtic & El Born · Stand 7. November 2026

Dieser Ordner enthält die Inhalte für die erste Barcelona-Tour mit **freiem Startpunkt**. Die App stellt die Route dynamisch aus diesen Bausteinen zusammen. Es gibt keine feste Reihenfolge und kein Skript pro POI-Paar.

## Dateien

| Datei | Inhalt |
|---|---|
| `00_README.md` | Dieses Dokument: Aufbau, Regeln, Koordinaten, JSON, offene Punkte |
| `01_Carlos_Intro_und_Systemtexte.md` | Guide-Vorstellung, Start-Intro, Outro, Systemtexte (Abschweifen, nahe POIs, Sicherheit, zum Startpunkt führen) |
| `P01_…` bis `P12_…` | Ein File pro POI: Koordinaten, Topic-Tags, Anfahrt, Kerntext mit Topic-Bausteinen |
| `20_Verbindungen.md` | Themen-Brücken (B01–B08) und Füller (F01–F06) für die Wege zwischen den POIs |
| `Barcelona_Topic_List` | Liegt als Doc in Claude: alle Topic-IDs (ANT-02, ARC-05 …) und der Filter für sensible Themen |

## Wie ein POI-Skript aufgebaut ist

Jede POI-Datei hat dieselben Abschnitte:

1. **Metadaten-Tabelle:** ID, Koordinaten, Radius, geschätzte Dauer, Topic-Tags, Flags, nahe POIs.
2. **🔊 ANFAHRT** (ca. 10–15 s): Spielt beim Betreten eines äußeren Radius. Funktioniert aus jeder Richtung und sagt, worauf der Nutzer achten soll. Kein „links/rechts“.
3. **📍 KERN** (60–90 s gesamt): Fester Text plus **Topic-Bausteine**.
4. **Ende ohne Wegbeschreibung:** Die Richtung zum nächsten Stopp zeigt die Karte. Danach spielt die App eine Brücke oder einen Füller aus `20_Verbindungen.md`.

### Topic-Bausteine (told-once)

Ein Baustein sieht so aus:

```
[[ANT-02 FULL]]
… ausführliche Erklärung (erste Erwähnung auf der Tour) …
[[ANT-02 CALLBACK]]
… kurzer Rückverweis, wenn das Thema schon erzählt wurde …
[[/ANT-02]]
```

Regel für die App:

- Topic **noch nicht erzählt** → `FULL` abspielen, Topic-ID im Registry des Nutzers speichern.
- Topic **schon erzählt** → `CALLBACK` abspielen.
- Callbacks nennen den früheren Ort bewusst nicht beim Namen („vorhin“, „vorhin bei den römischen Mauern“), weil die Reihenfolge variiert.
- **Fester Text kann auch einführen:** Steht ein Topic unter „Führt ein“, hat aber keinen Baustein (z. B. ANT-10 in P11), registriert die App das Topic nach dem Abspielen des Kerns trotzdem als erzählt.
- Ein CALLBACK-Baustein ohne vorheriges FULL wird einfach übersprungen.
- Länge (gemessen, 140 Wörter/Minute): mit allen FULL-Versionen 65–86 s. Wenn ein POI nur noch Callbacks spielt, wird er kürzer (42–74 s). Das ist gewollt: Wer schon viel gehört hat, bekommt keinen aufgeblähten Text.

### Tags

- **Führt ein:** Topics, für die diese Datei eine FULL-Version hat.
- **Ruft zurück:** Topics, die nur als Callback vorkommen (falls schon erzählt; sonst wird der Satz weggelassen).
- **Flags:** `S` = sensibles Thema (Filterregeln der Topic-Liste gelten auch für Q&A an diesem Ort). `V` = Fakt mit Ablaufdatum, vor Aufnahme prüfen.

## Regeln, die für alle Skripte gelten

- **Länge:** 60–90 s pro POI-Kern, ca. 140 Wörter pro Minute.
- **Aussprache:** Katalanische Namen stehen im Sprechtext bereits in Lautschrift für ElevenLabs (z. B. „Plassa Sant Schaume“). Die Liste unten zeigt Original → Ersatz. **Nicht getestet**, bitte die riskantesten Wörter einzeln generieren.
- **Sensible Themen:** Fakten klar benennen, aktuelle Politik nicht kommentieren, keine Meinung des Guides zu Unabhängigkeit, Parteien oder Monarchie.
- **Gewalt:** Keine grafischen Details, Respekt vor den Opfern. Bei P04 (Sant Felip Neri) macht Carlos keine Witze.
- **Persona:** Carlos ist witzig, aber die Witze kommen aus seiner Biografie (Ex-Torero, Weinkenner, Nachtmensch) und nie auf Kosten von Opfern oder Gruppen.
- **Faktencheck:** Macht euer Team. Die Punkte, bei denen ich unsicher bin, stehen unter „Zu prüfen“.

## Koordinaten & Geofencing

*Koordinaten WGS84, aus meinem Wissen geschätzt, **nicht vermessen**. Vor dem Build in Mapbox/OSM prüfen und auf den Standpunkt verschieben, von dem man das Objekt sieht. Abstände Luftlinie.*

| ID | Station | Lat | Lng | Radius Kern | Radius Anfahrt | Nahe POIs (< 130 m) |
|---|---|---|---|---|---|---|
| P01 | Plaça Nova (Römertor & Picasso-Fries) | 41.384230 | 2.175690 | 20 m | 45 m | P02 (53 m), P04 (124 m) |
| P02 | Kathedrale (Plaça de la Seu) | 41.383950 | 2.176200 | 25 m | 50 m | P01 (53 m), P03 (88 m), P07 (120 m) |
| P03 | Carrer del Bisbe / Pont del Bisbe | 41.383270 | 2.176750 | 15 m | 35 m | P02 (88 m), P06 (72 m), P07 (75 m) |
| P04 | Plaça de Sant Felip Neri | 41.383400 | 2.174700 | 20 m | 40 m | P05 (88 m), P01 (124 m) |
| P05 | El Call (Sinagoga Major, Carrer de Marlet) | 41.382650 | 2.174350 | 15 m | 35 m | P04 (88 m) |
| P06 | Plaça de Sant Jaume | 41.382650 | 2.177000 | 30 m | 55 m | P03 (72 m), P07 (113 m) |
| P07 | Temple d'August (Carrer del Paradís 10) | 41.383580 | 2.177550 | 15 m | 35 m | P08 (73 m), P03 (75 m), P06 (113 m), P02 (120 m) |
| P08 | Plaça del Rei | 41.384200 | 2.177850 | 20 m | 40 m | P07 (73 m) |
| P09 | Plaça Reial | 41.380100 | 2.175300 | 35 m | 60 m | – |
| P10 | Carrer de Montcada (Museu Picasso) | 41.385200 | 2.180800 | 20 m | 45 m | – |
| P11 | Santa Maria del Mar | 41.383750 | 2.181950 | 30 m | 55 m | – |
| P12 | El Born Centre de Cultura i Memòria | 41.385600 | 2.183900 | 35 m | 60 m | – |

**Achtung, enge Paare:** P01↔P02 liegen nur 53 m auseinander, P07↔P08 und P03↔P06/P07 gut 70 m. Hier greift die Regel „nahe POIs“: Kern startet nur, wenn der Nutzer im Kernradius ist **und** ca. 5 s steht (Geschwindigkeit nahe 0). Vorher spielt der Systemtext S-NAH aus `01_Carlos_Intro_und_Systemtexte.md`.

## JSON (für den Build)

```json
{ "city": "barcelona", "guide": "carlos-bcn", "language": "de",
  "pois": [
  {"id":"P01","name":"Plaça Nova","lat":41.38423,"lng":2.17569,"r":20,"rApproach":45,"introduces":["ANT-02","ART-01"],"callbacks":[],"flags":[]},
  {"id":"P02","name":"Kathedrale","lat":41.38395,"lng":2.1762,"r":25,"rApproach":50,"introduces":["ARC-02","ANT-15"],"callbacks":[],"flags":["V"]},
  {"id":"P03","name":"Pont del Bisbe","lat":41.38327,"lng":2.17675,"r":15,"rApproach":35,"introduces":["ARC-02"],"callbacks":[],"flags":[]},
  {"id":"P04","name":"Plaça de Sant Felip Neri","lat":41.3834,"lng":2.1747,"r":20,"rApproach":40,"introduces":["C20-05","C20-06"],"callbacks":[],"flags":["S"]},
  {"id":"P05","name":"El Call","lat":41.38265,"lng":2.17435,"r":15,"rApproach":35,"introduces":["ANT-11"],"callbacks":["ANT-02"],"flags":["S","V"]},
  {"id":"P06","name":"Plaça de Sant Jaume","lat":41.38265,"lng":2.177,"r":30,"rApproach":55,"introduces":["POL-03","ANT-12","SOC-01"],"callbacks":[],"flags":["S"]},
  {"id":"P07","name":"Temple d'August","lat":41.38358,"lng":2.17755,"r":15,"rApproach":35,"introduces":["ANT-02"],"callbacks":[],"flags":["V"]},
  {"id":"P08","name":"Plaça del Rei","lat":41.3842,"lng":2.17785,"r":20,"rApproach":40,"introduces":["ANT-07","ARC-01","ANT-14"],"callbacks":[],"flags":["S"]},
  {"id":"P09","name":"Plaça Reial","lat":41.3801,"lng":2.1753,"r":35,"rApproach":60,"introduces":["ARC-05","EMD-07"],"callbacks":[],"flags":["V"]},
  {"id":"P10","name":"Carrer de Montcada","lat":41.3852,"lng":2.1808,"r":20,"rApproach":45,"introduces":["ART-01","ANT-09"],"callbacks":[],"flags":["V"]},
  {"id":"P11","name":"Santa Maria del Mar","lat":41.38375,"lng":2.18195,"r":30,"rApproach":55,"introduces":["ARC-01","ANT-10"],"callbacks":["EMD-03"],"flags":["S"]},
  {"id":"P12","name":"El Born CCM","lat":41.3856,"lng":2.1839,"r":35,"rApproach":60,"introduces":["EMD-03","EMD-04"],"callbacks":["ANT-10"],"flags":["S"]}
  ]
}
```

*Hinweis: Die Felder `introduces`/`callbacks` entsprechen den Bausteinen in den POI-Dateien. Wenn ihr ein Skript ändert, die Tags hier mitziehen.*

## Aussprache-Ersetzungen (im Sprechtext bereits angewendet)

*Nicht getestet. Am riskantesten: Schaume, Scheneralitat, Kalj, Tinelj, Mureres, Siutadelja, Bastaschos, E-ulalia. Bitte einzeln generieren und anhören.*

| Original | Im Skript | Warum |
|---|---|---|
| Plaça | Plassa | ç = ss |
| Plaça de Sant Jaume | Plassa de Sant Schaume | katalanisches J = weiches „sch“ |
| Plaça del Rei | Plassa del Räi | |
| Plaça Reial | Plassa Re-jal | |
| Generalitat | Scheneralitat | G vor e = weiches „sch“ |
| Ajuntament | Aschuntament | |
| Barri Gòtic | Barri Gotik | |
| Bàrcino | Barkino | lateinische Aussprache, für deutsche Ohren klarer |
| Call | Kalj | ll = „lj“, sonst englisch „Call“ |
| Saló del Tinell | Salo del Tinelj | |
| Santa Eulàlia | Santa E-ulalia | sonst deutsch „Oilalia“ |
| Carrer | Karrer | |
| Montcada | Monkada | |
| bastaixos | Bastaschos | x = „sch“ |
| Fossar de les Moreres | Fossar de les Mureres | unbetontes o = u |
| Ciutadella | Siutadelja | |
| Diada | Di-ada | |
| Llotja | Ljodscha | |
| Joan | Schuan | |
| Josep Tarradellas | Schusep Tarradeljas | |
| Francesc Macià | Franssesk Massia | |
| Lluís Companys | Ljuis Kompanjs | |
| Ja sóc aquí | Scha sok aki | |
| Joan Rubió i Bellver | Schuan Rubio i Beljwer | |
| Carl Nesjar | Karl Nessjar | |
| Manuel Girona | Manuel Schirona | |
| castells | Kastelljs | |
| pa amb tomàquet | pa am tumaket | |
| Mercè | Mersse | |
| UNESCO | Unesko | sonst buchstabiert |
| Montjuïc | Montschuik | |
| Plaça d'Espanya | Plassa d'Espanja | |
| Gràcies | Gràssies | |
| muntanya | muntanja | |
| fer el vermut | fer el wermut | |

## Offene Punkte & Entscheidungen für euch

1. **Persona „Ex-Torero“ in Barcelona.** Katalonien hat den Stierkampf 2010 per Parlamentsbeschluss verboten; die letzte Corrida in Barcelona war 2011. Das Verfassungsgericht hat das Verbot 2016 aufgehoben, in Barcelona finden trotzdem keine mehr statt (bitte prüfen, V). Das Thema ist hier zugleich Tierschutz- und Identitätsfrage. Ich habe die Torero-Vergangenheit deshalb nur selbstironisch und neutral eingebaut (Füller F03, ein Satz im Intro). Wenn ihr sie ganz rausnehmen wollt: Intro-Satz und F03 streichen, sonst ändert sich nichts.
2. **Name:** Der Barcelona-Guide heißt Carlos (entschieden am 7. 11. 2026), damit es keine Verwechslung mit Marco (Zürich) gibt.
3. **Zweiter Weltkrieg als Leidenschaft.** Spanien war im Zweiten Weltkrieg nicht Kriegspartei. Ich nutze die Leidenschaft nur einmal, wo sie historisch passt: Der Spanische Bürgerkrieg gilt als „Generalprobe“ für den Luftkrieg (P04). Mehr ergibt Barcelona im Pilotgebiet nicht her, ohne zu konstruieren.
4. **Weg-Logik:** Die Dateien enthalten bewusst keine Wegbeschreibungen. Die Richtung kommt von der Karte. Wenn ihr wie in Hamburg gesprochene Richtungen wollt, muss das die App dynamisch erzeugen (z. B. aus Mapbox Directions).

## Zu prüfen (Faktencheck)

- P01: Jahr und Ausführung des Picasso-Frieses (Entwurf Picasso, ausgeführt von Carl Nesjar, um 1960–1962). Brossas „Barcino“-Buchstaben auf der Plaça Nova (1994).
- P02: Finanzierung der Fassade durch Manuel Girona; Bauzeit Fassade (ab 1887) und Kuppel/Turm (bis 1913); Sardana-Zeiten vor der Kathedrale (V).
- P05: Die Identifizierung der „Sinagoga Major“ in Carrer de Marlet ist unter Historikern umstritten; der Text sagt deshalb „gilt als“.
- P07: Säulenhöhe ca. 9 m; der Mühlstein am Eingang Carrer del Paradís 10 markiert den Mons Taber.
- P08: Bauzeit Saló del Tinell (um 1359–1370) und Spannweite der Bögen (ca. 17 m).
- P09: Gaudís Laternen 1878/79 als einer seiner ersten städtischen Aufträge; Bau des Platzes ab 1848 auf dem Gelände eines Kapuzinerklosters. Das Zitat „Genie oder Verrückter“ wird Elies Rogent zugeschrieben, ist aber nicht sicher belegt (deshalb „soll“).
- P10: Museu Picasso eröffnet 1963; anfangs offiziell unter anderem Namen (Sabartés-Sammlung) wegen des Franco-Regimes – bitte bestätigen. Schenkung Picassos 1970.
- P11: Brand 1936 (Dauer „elf Tage“ wird oft genannt, nicht gesichert, deshalb weggelassen).
- P12: Eröffnung Born CCM 2013; Ausgrabung ab 2002 beim geplanten Bibliotheksbau.
- F03: Daten zum Stierkampfverbot (2010 / 2011 / 2016).
