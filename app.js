// --- Application State ---
let currentUnit = localStorage.getItem("skypulse_unit") || "celsius";
let lastLocationData = null;
let lastWeatherData = null;

// --- DOM Element References ---
const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const geoBtn = document.getElementById("geo-btn");
const weatherDisplay = document.getElementById("weather-display");
const statusMessage = document.getElementById("status-message");
const unitButtons = document.querySelectorAll(".unit-btn");
const forecastSection = document.getElementById("forecast-section");
const forecastGrid = document.getElementById("forecast-grid");

// --- WMO Weather Code Translator ---
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
  71: { label: "Slight snowfall", icon: "🌨️" },
  73: { label: "Moderate snowfall", icon: "🌨️" },
  75: { label: "Heavy snowfall", icon: "❄️" },
  95: { label: "Thunderstorm", icon: "⛈️" }
};

function getWeatherMeta(code) {
  return weatherCodeMap[code] || { label: "Moderate conditions", icon: "🌡️" };
}

// --- Unit Conversion Utility ---
function formatTemperature(celsius) {
  if (currentUnit === "fahrenheit") {
    const fahrenheit = (celsius * 9) / 5 + 32;
    return `${Math.round(fahrenheit)}°F`;
  }
  return `${Math.round(celsius)}°C`;
}

// --- UI Status Helper ---
function setStatus(text = "", type = "") {
  statusMessage.textContent = text;
  statusMessage.className = `status-box ${type}`.trim();
}

// --- Network & Location Functions ---
async function fetchCoordinates(city) {
  const endpoint = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error("Geocoding service unavailable.");
  }

  const data = await response.json();
  if (!data.results || data.results.length === 0) {
    throw new Error(`Location "${city}" not found. Please check spelling.`);
  }

  const { name, country, latitude, longitude } = data.results[0];
  return { name, country, latitude, longitude };
}

async function fetchCityFromCoordinates(lat, lon) {
  try {
    const endpoint = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const response = await fetch(endpoint);
    if (response.ok) {
      const data = await response.json();
      const city = data.city || data.locality || "Current Location";
      const country = data.countryCode || data.countryName || "";
      return { name: city, country, latitude: lat, longitude: lon };
    }
  } catch (err) {
    // Graceful fallback if reverse geocoding is unavailable
  }
  return { name: "Your Location", country: "", latitude: lat, longitude: lon };
}

async function fetchWeatherData(lat, lon) {
  const endpoint = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
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
    <div class="weather-icon" aria-hidden="true">${meta.icon}</div>
    <h2 class="weather-location">${location.name}${location.country ? `, ${location.country}` : ""}</h2>
    <p class="weather-condition">${meta.label}</p>
    <div class="weather-temp">${formatTemperature(current.temperature_2m)}</div>
    <div class="metrics-grid">
      <div class="metric-item">
        <span class="metric-label">Feels Like</span>
        <span class="metric-value">${formatTemperature(current.apparent_temperature)}</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Humidity</span>
        <span class="metric-value">${current.relative_humidity_2m}%</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Wind Speed</span>
        <span class="metric-value">${Math.round(current.wind_speed_10m)} km/h</span>
      </div>
    </div>
  `;
}

function renderForecast(daily) {
  forecastSection.hidden = false;
  forecastGrid.innerHTML = "";

  for (let i = 0; i < 5; i++) {
    const dateStr = daily.time[i];
    const code = daily.weather_code[i];
    const maxTemp = daily.temperature_2m_max[i];
    const minTemp = daily.temperature_2m_min[i];

    const date = new Date(`${dateStr}T00:00:00`);
    const dayLabel = i === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "short" });
    const meta = getWeatherMeta(code);

    const card = document.createElement("article");
    card.className = "forecast-card";
    card.innerHTML = `
      <span class="forecast-day">${dayLabel}</span>
      <span class="forecast-icon" aria-hidden="true">${meta.icon}</span>
      <div class="forecast-temps">
        <span class="forecast-max">${formatTemperature(maxTemp)}</span>
        <span class="forecast-min">${formatTemperature(minTemp)}</span>
      </div>
    `;

    forecastGrid.appendChild(card);
  }
}

// --- Controller Functions ---
async function handleSearch(city) {
  setStatus("Fetching atmospheric conditions...", "loading");

  try {
    const location = await fetchCoordinates(city);
    const weather = await fetchWeatherData(location.latitude, location.longitude);

    lastLocationData = location;
    lastWeatherData = weather;
    localStorage.setItem("skypulse_last_city", location.name);

    renderWeather(location, weather);
    renderForecast(weather.daily);
    setStatus("");
  } catch (err) {
    setStatus(err.message, "error");
  }
}

async function handleGeolocation() {
  if (!navigator.geolocation) {
    setStatus("Geolocation is not supported by your browser.", "error");
    return;
  }

  setStatus("Acquiring GPS coordinates...", "loading");

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      setStatus("Loading local atmospheric data...", "loading");

      try {
        const location = await fetchCityFromCoordinates(latitude, longitude);
        const weather = await fetchWeatherData(latitude, longitude);

        lastLocationData = location;
        lastWeatherData = weather;
        localStorage.setItem("skypulse_last_city", location.name);

        renderWeather(location, weather);
        renderForecast(weather.daily);
        setStatus("");
      } catch (err) {
        setStatus("Failed to load weather for your location.", "error");
      }
    },
    (error) => {
      if (error.code === error.PERMISSION_DENIED) {
        setStatus("Location permission denied. Please search manually.", "error");
      } else {
        setStatus("Unable to detect current location.", "error");
      }
    },
    { timeout: 10000 }
  );
}

// --- Event Listeners ---
searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = cityInput.value.trim();
  if (!query) return;

  handleSearch(query);
  cityInput.value = "";
});

geoBtn.addEventListener("click", handleGeolocation);

unitButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const selectedUnit = btn.dataset.unit;
    if (selectedUnit === currentUnit) return;

    currentUnit = selectedUnit;
    localStorage.setItem("skypulse_unit", currentUnit);

    unitButtons.forEach((b) => {
      const isActive = b.dataset.unit === currentUnit;
      b.classList.toggle("active", isActive);
      b.setAttribute("aria-pressed", String(isActive));
    });

    if (lastLocationData && lastWeatherData) {
      renderWeather(lastLocationData, lastWeatherData);
      renderForecast(lastWeatherData.daily);
    }
  });
});

// --- Initial App Boot ---
function initApp() {
  unitButtons.forEach((btn) => {
    const isActive = btn.dataset.unit === currentUnit;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  });

  const savedCity = localStorage.getItem("skypulse_last_city");
  if (savedCity) {
    handleSearch(savedCity);
  }
}

initApp();
