# YSky Weather Dashboard

A lightweight, accessible, zero-dependency weather application built with vanilla web technologies. It queries live atmospheric data and daily forecasts via the Open-Meteo API suite with client-side caching and responsive, mobile-first design.

🔗 **Live Production Demo:** [https://yatish018.github.io/weather-dashboard/](https://yatish018.github.io/weather-dashboard/)

---

## Key Features

- **Real-Time Atmospheric Metrics:** Fetches current temperature, perceived ("feels like") temperature, relative humidity, wind speed, and dynamic weather conditions.
- **5-Day Extended Forecast:** Multi-day projection displaying expected weather conditions and daily high/low temperatures.
- **Instant Unit Conversion (°C / °F):** Converts units in-memory mathematically without triggering redundant API calls or layout shifts.
- **Client-Side Persistence:** Remembers your preferred temperature unit and last searched city across page reloads using `localStorage`.
- **Accessible & Screen-Reader Ready:** Built with semantic HTML5 landmarks (`<header>`, `<main>`, `<section>`, `<article>`), explicit form labels, and an `aria-live="polite"` dynamic announcement region.
- **Zero API Key Exposure:** Powered by Open-Meteo's open REST API, preventing the security vulnerability of exposing secret keys in public frontend repositories.

---

## Tech Stack & Architecture

- **Markup:** Semantic HTML5 (`<dialog>`, `<fieldset>`, `<article>`, `<main>`)
- **Styling:** Vanilla CSS3 (Custom Properties / CSS Variables, Flexbox, CSS Grid, mobile-first media queries)
- **Scripting:** Modern JavaScript (ES6+, Async/Await, Fetch API, DOM manipulation)
- **API Services:**
  - [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) (Name-to-coordinate resolution)
  - [Open-Meteo Weather Forecast API](https://open-meteo.com/en/docs) (Atmospheric conditions & daily forecasts)
- **Deployment:** GitHub Pages (Automated continuous deployment via the `main` branch)

---

## Engineering Highlights

### 1. Two-Tier Network Strategy
Because meteorological data requires precise geographic coordinates, the search pipeline chains two asynchronous calls cleanly using `async/await`:
1. **Geocoding Step:** Resolves freeform user strings into verified `{ latitude, longitude }` pairs.
2. **Forecast Step:** Requests specific metric parameters (`temperature_2m`, `apparent_temperature`, `relative_humidity_2m`, `wind_speed_10m`, `daily`) in a single payload.

### 2. State Caching Over Redundant Requests
When switching between Celsius and Fahrenheit, the application avoids refetching data from the network. It references cached coordinates and temperature numbers in local memory, re-rendering the view instantly.

---

## Local Development Setup

To run this project locally without any dependencies or package managers:

1. Clone the repository:
   ```bash
   git clone [https://github.com/yatish018/weather-dashboard.git](https://github.com/yatish018/weather-dashboard.git)
