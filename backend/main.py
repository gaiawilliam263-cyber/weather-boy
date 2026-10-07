import os
from dotenv import load_dotenv
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client

load_dotenv()

OWM_KEY = os.getenv("OPENWEATHER_API_KEY")
db = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))

app = FastAPI(title="Weather API")

origins = [o.strip() for o in os.getenv("FRONTEND_URL", "http://localhost:5173").split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LocationIn(BaseModel):
    query: str


@app.get("/")
def health():
    return {"status": "ok"}


@app.post("/locations")
async def add_location(body: LocationIn):
    """Look up the typed location on OpenWeather, then save it."""
    async with httpx.AsyncClient() as client:
        r = await client.get(
            "https://api.openweathermap.org/geo/1.0/direct",
            params={"q": body.query, "limit": 1, "appid": OWM_KEY},
        )
    if r.status_code != 200:
        raise HTTPException(502, "OpenWeather lookup failed")
    results = r.json()
    if not results:
        raise HTTPException(404, f"Couldn't find '{body.query}'")

    p = results[0]
    row = {
        "name": p["name"],
        "country": p.get("country"),
        "state": p.get("state"),
        "lat": p["lat"],
        "lon": p["lon"],
    }
    saved = db.table("locations").upsert(row, on_conflict="lat,lon").execute()
    return saved.data[0]


@app.get("/locations")
def list_locations():
    res = db.table("locations").select("*").order("created_at", desc=True).execute()
    return res.data


@app.delete("/locations/{loc_id}")
def delete_location(loc_id: int):
    db.table("locations").delete().eq("id", loc_id).execute()
    return {"deleted": loc_id}


@app.get("/weather/{loc_id}")
async def weather(loc_id: int):
    res = db.table("locations").select("*").eq("id", loc_id).execute()
    if not res.data:
        raise HTTPException(404, "Location not found")
    loc = res.data[0]

    async with httpx.AsyncClient() as client:
        r = await client.get(
            "https://api.openweathermap.org/data/2.5/weather",
            params={"lat": loc["lat"], "lon": loc["lon"], "units": "metric", "appid": OWM_KEY},
        )
    if r.status_code != 200:
        raise HTTPException(502, "OpenWeather weather fetch failed")
    w = r.json()
    return {
        "location": loc,
        "temp": w["main"]["temp"],
        "feels_like": w["main"]["feels_like"],
        "humidity": w["main"]["humidity"],
        "wind": w["wind"]["speed"],
        "description": w["weather"][0]["description"],
        "icon": w["weather"][0]["icon"],
    }
