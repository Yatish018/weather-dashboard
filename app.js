// --- DOM Element References ---
const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const weatherDisplay = document.getElementById("weather-display");
const statusMessage = document.getElementById("status-message");

// --- WMO Weather Code Translator ---
// Open-Meteo provides standard WMO weather interpretation codes.
const weatherCodeMap = {
  0: { label: "Clear sky", icon: "☀️" },
  1: { label: "Mainly clear", icon: "🌤️" },
  2: { label: "Partly cloudy", icon: "⛅" },
  3: { label: "Overcast", icon: "☁️" },
  45: { label: "Foggy", icon: "🌫️" },
  48: { label: "Depositing rime fog", icon: "🌫️" },
  51: { label: "Light drizzle", icon: "🌦️" },
  61: { label: "Slight rain", icon: "🌧️" },
  63: { label: "Moderate rain", icon: "🌧️" },
  65: { label: "Heavy rain", icon: "🌧️" },
  71: { label: "Slight snow fall", icon: "🌨️" },
  73: { label: "Moderate snow fall", icon: "🌨️" },
  75: { label: "Heavy snow fall", icon: "❄️" },
  95: { label: "Thunderstorm", icon: "⛈️" }
};

function getWeatherMeta(code) {
  return weatherCodeMap[code] || { label: "Moderate conditions", icon: "🌡️" };
}

// --- UI Status Helper ---
function setStatus(text = "", type = "") {
  statusMessage.textContent = text;
  statusMessage.className = `status-box ${type}`.trim();
}

// --- Network Functions ---
async function fetchCoordinates(city) {
  const endpoint = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error("Geocoding service unavailable.");
  }

  const data = await response.json();
  if (!data.results || data.results.length === 0) {
    throw new Error(`Location "${city}" not found. Check spelling and retry.`);
  }

  const { name, country, latitude, longitude } = data.results[0];
  return { name, country, latitude, longitude };
}

async function fetchWeatherData(lat, lon) {
  const endpoint = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`;
  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error("Weather service unavailable.");
  }

  return await response.json();
}

// --- DOM Rendering ---
function renderWeather(location, weather) {
  const current = weather.current;
  const meta = getWeatherMeta(current.weather_code);

  weatherDisplay.innerHTML = `
    <div style="font-size: 3rem; margin-bottom: 0.5rem;" aria-hidden="true">${meta.icon}</div>
    <h2 style="font-size: 1.5rem; margin-bottom: 0.25rem;">${location.name}, ${location.country || ""}</h2>
    <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">${meta.label}</p>

    <div style="font-size: 3rem; font-weight: 700; color: var(--accent); margin-bottom: 1.5rem;">
      ${Math.round(current.temperature_2m)}°C
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; border-top: 1px solid var(--border-color); padding-top: 1.25rem;">
      <div>
        <span style="display: block; font-size: 0.8rem; color: var(--text-secondary);">Feels Like</span>
        <strong>${Math.round(current.apparent_temperature)}°C</strong>
      </div>
      <div>
        <span style="display: block; font-size: 0.8rem; color: var(--text-secondary);">Humidity</span>
        <strong>${current.relative_humidity_2m}%</strong>
      </div>
      <div>
        <span style="display: block; font-size: 0.8rem; color: var(--text-secondary);">Wind Speed</span>
        <strong>${Math.round(current.wind_speed_10m)} km/h</strong>
      </div>
    </div>
  `;
}

// --- Event Handlers ---
searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const query = cityInput.value.trim();
  if (!query) return;

  setStatus("Fetching atmospheric conditions...", "loading");

  try {
    const location = await fetchCoordinates(query);
    const weather = await fetchWeatherData(location.latitude, location.longitude);

    renderWeather(location, weather);
    setStatus(""); // Clear loading status on success
    cityInput.value = "";
  } catch (err) {
    setStatus(err.message, "error");
  }
});
