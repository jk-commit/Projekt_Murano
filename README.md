# letsgetthebag

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-xvzkraqw)

## Setup: Supabase (auth + Ask Marco backend)

1. Copy `.env.example` to `.env.local` and fill in `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `VITE_MAPBOX_TOKEN`.
2. Link the project and set the secret API keys (they live only on Supabase, never in the frontend):
   ```sh
   supabase login
   supabase link --project-ref <your-project-ref>
   supabase secrets set ANTHROPIC_API_KEY=... ELEVENLABS_API_KEY=... ELEVENLABS_VOICE_ID=9IzcwKmvwJcw58h3KnlH
   supabase functions deploy ask-marco
   ```
3. In the Supabase dashboard → Authentication → URL Configuration, set the Site URL to the production domain and add `http://localhost:5173` to the redirect URLs (needed for confirmation and password-reset emails).
4. On the hosting provider (e.g. Netlify), set the same `VITE_*` environment variables.
