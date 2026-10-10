# Marco – Technische Dokumentation

**Stand:** 10.10.2026 · Commit `936c659` auf `main` · Repo: `github.com/RaBaKa4142/letsgetthebag`

Diese Doku beschreibt den Ist-Zustand der App als Grundlage für die Planung der technischen Strategie. Fakten, die aus dem Code belegt sind, stehen ohne Zusatz. Annahmen und ungeklärte Punkte sind als **offen** markiert.

---

## 1. Was die App ist

„Marco“ ist eine mobile Web-App (SPA) für audio-geführte Stadttouren. Ein Nutzer:

1. meldet sich mit E-Mail und Passwort an,
2. wählt auf der Landing Page eine Tour,
3. hört auf der Startseite der Tour eine Vorstellung des Guides,
4. geht die Tour auf einer Mapbox-Karte ab. Pro Stopp spielt eine Folge von Audiodateien,
5. kann dem Guide per Mikrofon Fragen stellen („Ask Guide“). Ein LLM antwortet, und die Antwort wird per Sprachsynthese vorgelesen.

**Aktuelle Touren**

| ID | Tour | POIs | Sprache | Guide |
|---|---|---|---|---|
| `zurich` | Zurich Altstadt | 7 | Englisch | Marco |
| `kitzingen` | Kitzingen Altstadt | 5 | Deutsch | Stefanie |
| `umea` | Umeå City Tour | 7 | Englisch | Elin |

**Wichtig: Es gibt noch kein echtes GPS-Tracking.** Der Fortschritt läuft über den Button „Next Stop“, der den Nutzer simuliert zum nächsten Punkt bewegt. Die Startseite verspricht „GPS-guided“ und bittet um Standortfreigabe, das ist aber noch nicht umgesetzt. Der Standort wird nur auf der Landing Page abgefragt, um die nächstgelegene Tour hervorzuheben („Near you!“).

---

## 2. Tech-Stack

| Bereich | Technologie |
|---|---|
| Frontend | React 18, TypeScript 5, Vite 5 |
| Styling | Tailwind CSS 3, Icons: `lucide-react`, Schrift: Inter (Google Fonts) |
| Karte | `mapbox-gl` 3 (Style `streets-v12`), Mapbox Directions API (Profil *walking*) |
| Auth | Supabase Auth (E-Mail + Passwort) über `@supabase/supabase-js` 2 |
| Backend | eine Supabase Edge Function (Deno): `ask-marco` |
| KI | ElevenLabs Speech-to-Text (`scribe_v1`), Anthropic Claude (`claude-sonnet-4-6`), ElevenLabs Text-to-Speech (`eleven_multilingual_v2`) |
| Audio-Hosting | MP3-Dateien über `raw.githubusercontent.com` (siehe Abschnitt 6) |
| Code-Qualität | ESLint 9 und `tsc --noEmit`. Keine Tests, keine CI |

Es gibt keinen eigenen Server und keinen Router (die Navigation läuft über React-State) und keine eigene Datenbank.

---

## 3. Architektur

```
Browser (React SPA)
 ├─ Supabase Auth ──────────────── Login / Registrierung / Passwort-Reset
 ├─ Mapbox GL + Directions API ─── Karte, Fußweg-Route (öffentlicher pk.-Token)
 ├─ raw.githubusercontent.com ──── Tour-Audiodateien (MP3)
 └─ Supabase Edge Function "ask-marco"  (nur mit gültigem User-JWT)
       ├─ ElevenLabs STT   (Frage → Text)
       ├─ Anthropic Claude (Text → Antwort im Charakter des Guides)
       └─ ElevenLabs TTS   (Antwort → MP3, zurück an den Browser)
```

### 3.1 Code-Struktur (`src/`)

```
src/
  App.tsx                 Auth-Gate + Navigation (landing → start → tour)
  main.tsx                Einstieg, ErrorBoundary
  theme.ts                Farbkonstanten (ORANGE #FF5A1F)
  lib/supabase.ts         Supabase-Client, liest VITE_SUPABASE_URL / _ANON_KEY
  tours/
    types.ts              Datenmodell Tour / Stop
    zurich.ts, kitzingen.ts, umea.ts   Tourdaten (reine Daten)
    index.ts              Registry: tours[], getTour(id), poiStops(tour)
  hooks/
    useTourEngine.ts      Tour-Ablauf (Intro, Next Stop, Timer-Trigger, Abschluss)
    useAudioPlayer.ts     Playlist-Player (3 s Pause zwischen Tracks)
    useAuth.ts            Session + Passwort-Recovery-Status
    useToast.ts
  components/
    LandingPage, TourCard             Tourübersicht, Suche, „Near you!“
    TourStartScreen                   Tour-Detail + Guide-Vorstellung
    TourView                          Tour-Layout, setzt alles zusammen
    TourMap                           Mapbox-Karte, Marker, verbleibende Route
    TourTopBar, AudioDrawer, NextStopButton, Toast, TourCompleteOverlay
    AskGuide                          Mikrofon → Edge Function → Wiedergabe
    AuthScreen                        Anmelden / Registrieren / Passwort
    AboutModal, MissionModal
supabase/
  config.toml                         verify_jwt für ask-marco
  functions/ask-marco/index.ts        Edge Function
```

### 3.2 Tour-Datenmodell

Touren sind reine Daten. Die gesamte Logik steckt in einer gemeinsamen Engine. Kern des Modells (`src/tours/types.ts`):

- **Tour**: `id`, Texte (Titel, Region, Beschreibung, Dauer, Sprache), `heroImage`, `searchTerms`, `center` (Kartenmitte und Startposition), `intro` (Audio-Playlist), `guide` (`name`, `introAudio`, `askEnabled`), `stops[]`, `completeText`, `shareText`.
- **Stop**:
  - Grundfelder: `id`, `type` (`poi` | `walk`), `name`, `position?`, `markerNumber?`
  - `audio: string[]` (Playlist)
  - `walkHint?`, z. B. „~3 min walk to …“
  - `trigger?`: Der Stopp spielt automatisch nach einem Timer, sobald ein anderer Stopp zu Ende ist. Genutzt wird das in Kitzingen für `walk_4`.

**Neue Tour anlegen:**
1. Datei in `src/tours/` anlegen.
2. Die Tour in `tours/index.ts` eintragen.
3. Einen Eintrag in `TOURS` der Edge Function ergänzen, damit Ask Guide funktioniert.

### 3.3 Tour-Ablauf (`useTourEngine`)

1. Beim Öffnen der Tour spielt das Intro. Der Schritt steht auf −1.
2. „Next Stop“ geht einen Schritt weiter, setzt die Position (falls vorhanden) und spielt das Audio des Stopps. Liegt als Nächstes ein POI, kommt ein Toast: „You're getting close to …“.
3. Timer-Stopps werden beim Durchklicken nur übersprungen. Ihr Timer startet, wenn das Audio des Bezugsstopps endet.
4. Die Tour ist abgeschlossen, wenn der letzte POI ausgelöst ist und kein Audio mehr läuft. Dann erscheint das Overlay mit Teilen-Button und Sternebewertung.
5. Beim Verlassen der Tour werden Audio und Timer gestoppt.

Die Karte zeigt die Route als Fußweg über die Mapbox Directions API. Wenn diese nicht antwortet, zeigt sie gerade Linien. Angezeigt wird jeweils nur der Teil der Route, der noch vor dem Nutzer liegt.

---

## 4. Wie wir Supabase nutzen

**Projekt:** `Projekt_Murano`, Ref `tetgehymgvwkkxlmyksj`, Region `eu-west-1`

Supabase wird aktuell für genau **zwei Dinge** genutzt: **Auth** und **eine Edge Function**. Die Postgres-Datenbank, Storage, Realtime und RLS-Policies sind noch ungenutzt. Es gibt keine eigenen Tabellen.

### 4.1 Auth

- Methode: nur E-Mail + Passwort. OAuth, Magic Link und anonyme Nutzer sind aus.
- Registrierung mit Bestätigungs-Mail (`mailer_autoconfirm: false`).
- Passwort-Reset über einen Mail-Link. Die App erkennt das Event `PASSWORD_RECOVERY` und zeigt dann „Neues Passwort setzen“.
- **Die gesamte App liegt hinter dem Login.** Ohne Session sieht man nur den `AuthScreen`.
- Session-Handling übernimmt `supabase-js` (localStorage, automatischer Token-Refresh).
- **Offen:**
  - Unter Auth → URL Configuration müssen Site URL und Redirect-URLs (inkl. `http://localhost:5173`) gesetzt sein, sonst funktionieren die Mail-Links nicht.
  - Ohne eigenes SMTP nutzt Supabase seinen Standard-Mailversand, der ein sehr niedriges Stundenlimit hat. Vor einem öffentlichen Launch sollte ein eigener SMTP-Anbieter eingerichtet werden.

### 4.2 Edge Function `ask-marco`

- **Endpoint:** `POST {SUPABASE_URL}/functions/v1/ask-marco`
- **Request:** `multipart/form-data` mit den Feldern
  - `audio`: Aufnahme als webm, max. 10 MB
  - `tourId`: `zurich` | `kitzingen` | `umea`
  - `poiLabel`: der aktuelle Ort, max. 80 Zeichen
- **Response:** `audio/mpeg`. Im Fehlerfall JSON `{ error, stage }`, wobei `stage` einer dieser Werte ist: `auth`, `input`, `tour`, `stt`, `claude`, `tts`, `config`.
- **Absicherung:**
  1. `verify_jwt = true`: Der Supabase-Gateway verlangt ein JWT.
  2. Die Function prüft zusätzlich über `/auth/v1/user`, ob das Token einem echten User gehört. Der öffentliche Anon-Key allein wird abgelehnt.
  3. Nur bekannte `tourId`s sind erlaubt. Den System-Prompt baut der Server aus der `TOURS`-Map, der Client kann keinen eigenen Prompt einschleusen.
- **Secrets** (nur in Supabase, nie im Frontend):
  - `ANTHROPIC_API_KEY`
  - `ELEVENLABS_API_KEY`
  - `ELEVENLABS_VOICE_ID`
  - optional `CLAUDE_MODEL`
- **Latenz:** gemessen etwa 14 s pro Frage. Die drei externen Aufrufe laufen nacheinander, gestreamt wird nicht.
- **Bekannte Einschränkungen:**
  - Alle Guides sprechen mit **derselben ElevenLabs-Stimme**. Es gibt nur eine `VOICE_ID`, keine eigene pro Guide.
  - Ask Guide hat kein Gedächtnis: Jede Frage ist eine einzelne Anfrage ohne Gesprächsverlauf.
  - Es gibt kein Rate-Limit und kein Kostenlimit pro User. Jeder registrierte Account kann unbegrenzt Fragen stellen.
  - Fragen und Antworten werden nicht gespeichert, es gibt also kein Logging für Analyse oder Qualitätskontrolle.

### 4.3 Deployment und Verwaltung

- Die Homebrew-Version der Supabase-CLI stürzt auf dem Entwickler-Mac ab. Deshalb wird `npx supabase@latest …` verwendet.
- Deploy: `npx supabase@latest functions deploy ask-marco --project-ref tetgehymgvwkkxlmyksj --use-api`
- Secrets setzen: `npx supabase@latest secrets set --project-ref tetgehymgvwkkxlmyksj KEY=wert`
- Function-Deploys laufen manuell. Es gibt keine CI und keine getrennten Umgebungen (Staging/Prod).

---

## 5. Wie Bolt aktuell genutzt wird

**Herkunft:** Die App ist in **bolt.new** entstanden (Bolt-Projekt `sb1-xvzkraqw`, verlinkt im README). Hinweise darauf im Repo:

- `.bolt/config.json` mit dem Template `bolt-vite-react-ts`.
- `.bolt/prompt`: der Projekt-Prompt für Bolt (schöne, produktionsreife Designs; Tailwind und lucide-react; keine zusätzlichen UI-Pakete).
- Commits `init` und `Start repository` vom 15.09.2026 (Account RaBaKa4142): Export des Bolt-Projekts nach GitHub.
- `index.html` verwendet als OG-Bild noch das Standardbild von Bolt (`bolt.new/static/og_default.png`). Der Seitentitel ist noch „Zurich Altstadt Tour“.
- `public/_redirects` (`/* /index.html 200`) ist eine SPA-Regel im Netlify-Format. Bolt-Hosting (`*.bolt.host`) läuft über Netlify.
- Die App wurde unter `zurich-altstadt-audi-m05b.bolt.host` veröffentlicht. Diese URL stand bis zum Refactoring als Teilen-Link im Code.

**Seit dem 18.09.2026** wird lokal mit VS Code und Claude Code entwickelt und direkt auf GitHub gepusht. Die Umstellung auf Supabase, Login und Tour-Engine vom 08.10. ist nur über GitHub passiert, nicht in Bolt.

**Offen (klären, bevor weitergeplant wird):**
1. **Ist Bolt noch mit dem GitHub-Repo synchronisiert?** Falls ja, kann eine Änderung in Bolt den neuen Stand überschreiben oder Konflikte erzeugen. Falls nein, ist der Code in Bolt veraltet.
2. **Wo läuft die Produktion?** Läuft sie weiter auf `bolt.host` (Deploy über Bolt) oder auf eigenem Netlify/Vercel mit Auto-Deploy von `main`?
3. **Fehlen Umgebungsvariablen beim Hosting?** Der neue Stand braucht `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` und `VITE_MAPBOX_TOKEN` beim Build. Ohne sie startet die App nicht und zeigt „Missing VITE_SUPABASE_URL…“.
4. **Doppeltes Supabase-Projekt?** Bolt hat eine eigene Supabase-Integration. Wird sie genutzt, könnte ein zweites Supabase-Projekt entstehen. Maßgeblich ist `Projekt_Murano`.

---

## 6. Assets und Inhalte

- **Tour-Audio:** Die MP3-Dateien werden direkt von `raw.githubusercontent.com` geladen, und zwar aus drei Repos:
  - Zürich-Touraudio: `RaBaKa4142/letsgetthebag/Files/Cities/Zuerich`
  - Zürich-Guide-Vorstellung: `RaBaKa4142/AltstadtZurich`
  - Kitzingen: `RaBaKa4142/Kitzingen`
  - Umeå: `RaBaKa4142/letsgetthebag/Files/Cities/Umea`

  GitHub raw ist kein CDN: Es gibt Rate-Limits, keine Garantien und kein Caching-Konzept. Die Dateien liegen außerdem im App-Repo und machen etwa 28 MB in `Files/` aus.
- **Bilder:**
  - Zürich (`/Zurich.jpg`) und Kitzingen (`/image.png`) liegen in `public/`.
  - Das Umeå-Bild wird von Pexels per Hotlink geladen.
  - Bildnachweis Kitzingen: „© Tilman2007 / CC BY-SA 4.0“.
- **Tourinhalte** (Texte, Koordinaten, Audio-URLs) stehen als TypeScript im Code. Jede inhaltliche Änderung braucht deshalb ein neues Deployment, ein CMS gibt es nicht.

---

## 7. Konfiguration

| Variable | Wo | Zweck |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env.local` und Hosting | Supabase-Projekt (öffentlich) |
| `VITE_SUPABASE_ANON_KEY` | `.env.local` und Hosting | Publishable/Anon-Key (öffentlich, geschützt durch Auth) |
| `VITE_MAPBOX_TOKEN` | `.env.local` und Hosting | ein Mapbox-`pk.`-Token für alle Touren (öffentlich) |
| `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `CLAUDE_MODEL` | Supabase Secrets | nur serverseitig |

Die Vorlage liegt in `.env.example`. `.env.local` ist per gitignore ausgeschlossen.

---

## 8. Sicherheit: Stand und offene Punkte

- ✅ Die KI-Keys liegen nicht mehr im Frontend. Die Edge Function ist nur mit echtem Login nutzbar.
- ⚠️ **Die alten Anthropic- und ElevenLabs-Keys stehen in der Git-Historie** (vor Commit `936c659`). Sie müssen ausgetauscht und widerrufen werden. Ob das schon passiert ist, ist **offen**.
- ⚠️ Mapbox-Token: Er ist öffentlich und gewollt sichtbar. Im Mapbox-Dashboard sollte er per URL-Beschränkung auf die eigenen Domains begrenzt werden.
- ⚠️ Es gibt kein Kosten- oder Rate-Limit für Ask Guide (siehe 4.2).
- ℹ️ Die Supabase-Datenbank wird nicht genutzt. Sobald Tabellen dazukommen, sind RLS-Policies Pflicht.

---

## 9. Bekannte Lücken und technische Schulden

| Thema | Ist-Zustand | Auswirkung |
|---|---|---|
| GPS / Geofencing | Fortschritt nur über „Next Stop“ | Das Kernversprechen „GPS-guided“ ist noch nicht erfüllt. Ein Feld für den Geofence-Radius war in den alten Kitzingen- und Umeå-Daten vorhanden, wurde aber nie genutzt. |
| Nutzerdaten | Bewertung, Tourfortschritt und abgeschlossene Touren werden nicht gespeichert | Es gibt keine Analytics, keinen Fortsetzen-Modus und kein Feedback |
| Inhalte im Code | Touren sind TS-Dateien | Redakteure können ohne Entwickler nichts ändern |
| Audio-Hosting | GitHub raw | Zuverlässigkeit und Performance; das Repo wird groß |
| Bundle | Tour-Chunk etwa 1,8 MB (davon ~500 KB gzip), überwiegend Mapbox | Langsamer erster Tourstart im Mobilnetz |
| Offline | kein Service Worker, keine PWA | Bei schlechtem Netz unterwegs bricht das Audio ab |
| Ask Guide | ~14 s Latenz, eine Stimme für alle, kein Verlauf | User Experience |
| i18n | Die UI ist englisch, die Kitzingen-Beschreibung und das Audio sind deutsch | uneinheitlich, keine Sprachwahl |
| Routing | keine URLs pro Tour | Touren lassen sich nicht direkt verlinken oder teilen |
| Qualität | keine Tests, keine CI | Regressionen fallen erst manuell auf |
| Umgebungen | nur ein Supabase-Projekt | Dev und Prod nicht getrennt |

---

## 10. Entwicklung lokal

```sh
npm install
cp .env.example .env.local   # Werte eintragen
npm run dev                  # http://localhost:5173
npm run typecheck && npm run lint && npm run build
```

Edge Function deployen und Secrets setzen: siehe Abschnitt 4.3.
