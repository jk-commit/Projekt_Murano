# Walking texts: theme bridges & fillers

Pilot v1 · English · play on the way between two POIs · no directions (the map shows the way)

## Rules for the app

Same rules as Barcelona:

1. **After each POI** the app checks the theme group of the last and the next POI (table below).
2. If a matching **bridge** (B…) exists, it plays about 10 s after the user starts walking. Each bridge at most once per tour.
3. If there is no bridge, or it has already played, **and** the walk is longer than 150 m: play a filler (F…) that hasn't played yet.
4. Walk shorter than 150 m: play nothing. The next POI's approach is enough.
5. **F06** is location-triggered: plays the first time the user crosses the Münsterbrücke, in either direction.
6. If the next POI's approach starts, a running filler fades out.

### Theme groups

| Group | Meaning | POIs |
|---|---|---|
| ROM | Romans and the hilltop | P01 |
| GASSE | Medieval lanes and crafts | P02, P04, P11 |
| KIRCHE | Churches and the Reformation | P03, P06, P08 |
| GELD | Money and trade | P05 |
| ZUNFT | Town hall and guilds | P09 |
| DADA | Exiles and art revolution | P10 |
| MODERN | 19th-century Zurich: lake, railway, university | P07, P12 |

### Which bridge when

| Bridge | From → To | Duration |
|---|---|---|
| B01 | ROM → any | ~18 s |
| B02 | GASSE → KIRCHE | ~18 s |
| B03 | KIRCHE → GELD | ~18 s |
| B04 | GELD → MODERN or KIRCHE | ~18 s |
| B05 | MODERN → KIRCHE or ZUNFT | ~18 s |
| B06 | KIRCHE → ZUNFT | ~15 s |
| B07 | ZUNFT → DADA or GASSE | ~15 s |
| B08 | DADA → GASSE | ~15 s |
| B09 | GASSE → MODERN | ~18 s |
| B10 | any → ROM | ~15 s |

---

## Bridges

### B01 — ROM → any (~18 s)

From the Roman hilltop, we're heading down into the medieval city. After the Romans left, Zurich grew slowly around two big churches and a river full of boats. By the Middle Ages, it was a busy little trading town with very strong opinions.

### B02 — GASSE → KIRCHE (~18 s)

Next, one of the big churches. In Zurich, churches aren't just about faith. They're about power, money and a few rather stubborn reformers. You'll see what I mean.

### B03 — KIRCHE → GELD (~18 s)

From God to money. It's a short walk in Zurich, in every sense. When the Reformation closed the monasteries, the city got richer. A few centuries later, it became one of the banking capitals of the world.

### B04 — GELD → MODERN or KIRCHE (~18 s)

Leaving the banks behind. Fun fact: much of this part of town was built in the 19th century, when Zurich went from a sleepy old town to a modern city with railways, promenades and very big ambitions.

### B05 — MODERN → KIRCHE or ZUNFT (~18 s)

We're heading back into the old town now. Watch how the streets get narrower and the houses older with every step. It's like walking back in time, just with better coffee.

### B06 — KIRCHE → ZUNFT (~15 s)

From the church to the people who really ran the city: the guilds. Bakers, butchers, boatmen. In Zurich, the craftsmen once had more say than the nobles.

### B07 — ZUNFT → DADA or GASSE (~15 s)

Now we go up into the narrow lanes. In the First World War, these streets were full of refugees, artists and revolutionaries. One of them became very, very famous.

### B08 — DADA → GASSE (~15 s)

From art revolution to a different kind of revolution: food and drink. We're heading into the part of town where Zurich goes out.

### B09 — GASSE → MODERN (~18 s)

Leaving the old lanes behind. Next comes the Zurich of the 1800s: trains, trams and a university that produced more Nobel Prize winners than most countries.

### B10 — any → ROM (~15 s)

Now we're climbing to the very beginning: the hill where Zurich started, more than two thousand years ago. Bit of a climb. Worth it.

---

## Fillers

*Each once per tour. Order as needed; F06 is location-triggered.*

### F01 — Fountains (C19-05, ~30 s)

See that fountain? Drink from it! Zurich has more than twelve hundred public fountains, and almost all of them have fresh drinking water. Some are fed by springs in the hills that have been used since the 1400s. So keep your money for coffee. Water in Zurich is free, cold, and on every corner.

### F02 — Basel vs Zurich (persona, SOC-04, ~40 s)

You should know: I grew up in Basel. And between Basel and Zurich there's a friendly rivalry. Mostly friendly. Basel thinks Zurich is all money and no culture. Zurich thinks Basel is a small town with a big ego. Basel has the best carnival in Switzerland. Zurich has the banks. Basel has the better football fans, I'm told. Zurich has the lake. And me? I live here now, I love it here, and every time I go home to Basel, I pretend I don't.

### F03 — Peter's kitchen years (persona, ~40 s)

Before I became a guide, I spent years in a Michelin-starred kitchen here. Sixteen-hour days, a chef shouting in three languages, and plates so perfect you were scared to eat them. I learned two things. One: good food is mostly good ingredients and patience. Two: never, ever argue with a chef holding a knife. These days, I just tell people where to eat. Much less shouting.

### F04 — Swiss German (POL-02, ~30 s)

If you hear people talking around you and think, "That doesn't sound like the German I learned," you're right. People here speak Swiss German, Tsew-ree-tewtsh. It's spoken, not really written. Even Germans struggle with it. Two words to get you through the day: Grew-etsi, for hello, and Merci, for thank you. Yes, Merci. We borrowed it from the French and never gave it back.

### F05 — Zurich wine (persona, ~30 s)

Something most visitors don't know: Zurich makes wine. There are vineyards right around the lake, and even inside the city limits. Mostly fresh white wines and some light reds. As a chef I'll tell you: try a local white with a fish from the lake. That's a Zurich lunch done right.

### F06 — Münsterbrücke & Hans Waldmann (location-triggered, MED-07, ~30 s)

*Trigger: 47.369900, 8.542700 (Münsterbrücke), radius 30 m.*

You're on the Münsterbrücke, between the two big churches. The man on the horse at the end of the bridge is Hans Waldmann. In the 1400s he was a war hero and Zurich's mayor, and one of the most powerful men in the country. He made a lot of enemies, and in 1489 the city put him on trial and executed him. Zurich gave him a statue anyway, but only in 1937. Better late than never.

---

## To verify

- F01: number of fountains (over 1,200, city source: about 1,280).
- F06: Waldmann execution 1489 and statue 1937.
- B09: "more Nobel Prize winners than most countries" (ETH): rephrase or verify the count.
- F02: rivalry jokes are persona humour; check they don't single out a specific club or group in a way you dislike.
