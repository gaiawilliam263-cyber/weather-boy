import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL;

export default function App() {
  const [query, setQuery] = useState("");
  const [locations, setLocations] = useState([]);
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadLocations() {
    try {
      const res = await fetch(`${API}/locations`);
      setLocations(await res.json());
    } catch {
      setError("Can't reach the API (free servers take ~30s to wake up — retry).");
    }
  }

  useEffect(() => {
    loadLocations();
  }, []);

  async function showWeather(id) {
    setError("");
    const res = await fetch(`${API}/weather/${id}`);
    if (!res.ok) return setError("Couldn't load weather");
    setWeather(await res.json());
  }

  async function addLocation(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/locations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Something went wrong");
      setQuery("");
      await loadLocations();
      showWeather(data.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function remove(id) {
    await fetch(`${API}/locations/${id}`, { method: "DELETE" });
    if (weather?.location.id === id) setWeather(null);
    loadLocations();
  }

  return (
    <main>
      <h1>Weather Saver</h1>

      <form onSubmit={addLocation}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter a city (e.g. Kuching)"
        />
        <button disabled={loading}>{loading ? "Saving…" : "Save"}</button>
      </form>

      {error && <p className="error">{error}</p>}

      {weather && (
        <section className="card">
          <h2>
            {weather.location.name}
            {weather.location.country && `, ${weather.location.country}`}
          </h2>
          <img
            src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
            alt={weather.description}
          />
          <p className="temp">{Math.round(weather.temp)}°C</p>
          <p>{weather.description}</p>
          <small>
            Feels like {Math.round(weather.feels_like)}° · Humidity {weather.humidity}% · Wind{" "}
            {weather.wind} m/s
          </small>
        </section>
      )}

      <h3>Saved locations</h3>
      <ul>
        {locations.map((l) => (
          <li key={l.id}>
            <button className="link" onClick={() => showWeather(l.id)}>
              {l.name}
              {l.country && `, ${l.country}`}
            </button>
            <button className="x" onClick={() => remove(l.id)} aria-label="Delete">
              ✕
            </button>
          </li>
        ))}
        {locations.length === 0 && <li className="muted">Nothing saved yet.</li>}
      </ul>
    </main>
  );
}
