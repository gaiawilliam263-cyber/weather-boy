# Weather Saver — deploy with Vercel + Render + Supabase (all free)

```
React (Vercel)  →  FastAPI (Render)  →  OpenWeather API
                          ↓
                  Postgres (Supabase)
```

Flow: type a city → frontend POSTs to backend → backend geocodes via OpenWeather → saves to Supabase → frontend lists saved locations and shows weather.

## 0. Get keys
- **OpenWeather**: sign up at openweathermap.org → API keys. (New keys can take ~1–2 hrs to activate.)
- **Supabase**: new project → SQL Editor → paste & run `supabase.sql`.
  Then Project Settings → API: copy **Project URL** and the **service_role** key (secret — backend only, never in the frontend).

## 1. Run locally
```bash
# backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # fill in values
export $(grep -v '^#' .env | xargs)
uvicorn main:app --reload   # http://localhost:8000/docs

# frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

## 2. Push to GitHub
Put this whole folder in one repo.

## 3. Deploy backend → Render
1. render.com → New → **Blueprint** → pick the repo (reads `render.yaml`).
   (Or New → Web Service: root dir `backend`, build `pip install -r requirements.txt`, start `uvicorn main:app --host 0.0.0.0 --port $PORT`.)
2. Set env vars: `OPENWEATHER_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `FRONTEND_URL` (put `http://localhost:5173` for now).
3. Deploy. Test `https://<your-service>.onrender.com/docs`.

## 4. Deploy frontend → Vercel
1. vercel.com → Add New → Project → pick the repo.
2. **Root Directory**: `frontend`. Framework: Vite (auto-detected).
3. Env var: `VITE_API_URL` = your Render URL (no trailing slash).
4. Deploy.

## 5. Connect them (CORS)
Back on Render, set `FRONTEND_URL` to your Vercel URL, e.g. `https://my-weather.vercel.app` (comma-separate to keep localhost too). Render redeploys automatically.

## Teaching notes
- **Env vars**: `VITE_*` is public (shipped to the browser). Secrets live only on the backend.
- **CORS**: the browser blocks cross-origin calls unless the backend allows the frontend's origin.
- **Why a backend?** Hides the OpenWeather key and service key from users.
- **RLS**: table is locked; only the service key can access it.
- **Free tier gotchas**: Render sleeps after ~15 min idle (first request takes ~30s). Supabase pauses projects after ~1 week of inactivity.
- Every `git push` auto-redeploys both Vercel and Render.
