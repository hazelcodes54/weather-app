// Final, cleaned app.js wired to the current HTML
const iconElement = document.querySelector('.weather-icon');
const tempElement = document.querySelector('.temperature-value p');
const descElement = document.querySelector('.temperature-description p');
const locationElement = document.querySelector('.location p');
const notificationElement = document.querySelector('.notification');
const searchBtn = document.getElementById('searchBtn');
const locBtn = document.getElementById('locBtn');
const inputEl = document.getElementById('search');
const feelsEl = document.getElementById('feelsLike');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');

const KELVIN = 273.15; // more accurate offset
const key = '82005d27a116c2880c8f0fcb866998a0';

// Unit handling: 'metric' => °C, 'imperial' => °F
let unit = localStorage.getItem('weather_unit') || 'metric';
const unitCBtn = document.getElementById('unitC');
const unitFBtn = document.getElementById('unitF');

function setUnitButtons() {
  if (!unitCBtn || !unitFBtn) return;
  if (unit === 'metric') {
    unitCBtn.classList.add('active'); unitCBtn.setAttribute('aria-pressed', 'true');
    unitFBtn.classList.remove('active'); unitFBtn.setAttribute('aria-pressed', 'false');
  } else {
    unitFBtn.classList.add('active'); unitFBtn.setAttribute('aria-pressed', 'true');
    unitCBtn.classList.remove('active'); unitCBtn.setAttribute('aria-pressed', 'false');
  }
}

function toDisplayTemp(kelvin) {
  if (kelvin == null) return null;
  const c = kelvin - KELVIN;
  if (unit === 'metric') return Number(c.toFixed(1));
  const f = (c * 9/5) + 32;
  return Number(f.toFixed(1));
}

function refreshDisplayedTemps() {
  // re-render from last known response
  if (!window.__lastWeather) return;
  const mapped = window.__lastWeather;
  const display = {
    temp: toDisplayTemp(mapped.tempK),
    feels: toDisplayTemp(mapped.feelsK),
    humidity: mapped.humidity,
    wind: mapped.wind,
    desc: mapped.desc,
    icon: mapped.icon,
    city: mapped.city,
    country: mapped.country,
    main: mapped.main
  };
  updateUI(display);
}

// wire unit buttons
if (unitCBtn && unitFBtn) {
  setUnitButtons();
  unitCBtn.addEventListener('click', () => { unit = 'metric'; localStorage.setItem('weather_unit', unit); setUnitButtons(); refreshDisplayedTemps(); });
  unitFBtn.addEventListener('click', () => { unit = 'imperial'; localStorage.setItem('weather_unit', unit); setUnitButtons(); refreshDisplayedTemps(); });
} else {
  // attempt to set buttons state even if elements are not yet present
  document.addEventListener('DOMContentLoaded', setUnitButtons);
}

function showNotification(msg, isError = false) {
  if (!notificationElement) return;
  // Handle multi-line messages
  notificationElement.innerHTML = msg.replace(/\n/g, '<br>');
  notificationElement.style.display = 'block';
  notificationElement.style.background = isError ? 'rgba(255,75,75,0.08)' : 'rgba(255,255,255,0.02)';
  // Show error messages longer
  const duration = isError ? 7000 : 3500;
  setTimeout(() => (notificationElement.style.display = 'none'), duration);
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

function mapData(data) {
  return {
    tempK: data?.main ? data.main.temp : null,
    feelsK: data?.main ? data.main.feels_like : null,
    humidity: data?.main ? data.main.humidity : null,
    wind: data?.wind ? data.wind.speed : null,
    desc: data?.weather?.[0] ? data.weather[0].description : '',
    icon: data?.weather?.[0] ? data.weather[0].icon : null,
    city: data?.name || '',
    country: data?.sys ? data.sys.country : '',
    main: data?.weather?.[0] ? data.weather[0].main : '',
  };
}

function getClothingSuggestions(tempC) {
  if (tempC === null) return [];
  
  const suggestions = [];
  
  if (tempC <= 5) {
    suggestions.push({ icon: '🧥', text: 'Winter coat' });
    suggestions.push({ icon: '🧣', text: 'Scarf' });
    suggestions.push({ icon: '🧤', text: 'Gloves' });
    suggestions.push({ icon: '🧦', text: 'Warm socks' });
  } else if (tempC <= 15) {
    suggestions.push({ icon: '🧥', text: 'Light jacket' });
    suggestions.push({ icon: '🧥', text: 'Sweater' });
    suggestions.push({ icon: '👖', text: 'Long pants' });
  } else if (tempC <= 22) {
    suggestions.push({ icon: '👕', text: 'Light layers' });
    suggestions.push({ icon: '👖', text: 'Light pants' });
    suggestions.push({ icon: '👟', text: 'Comfortable shoes' });
  } else if (tempC <= 28) {
    suggestions.push({ icon: '👕', text: 'T-shirt' });
    suggestions.push({ icon: '🩳', text: 'Shorts' });
    suggestions.push({ icon: '🧢', text: 'Hat' });
  } else {
    suggestions.push({ icon: '👕', text: 'Light clothing' });
    suggestions.push({ icon: '🩳', text: 'Short sleeves' });
    suggestions.push({ icon: '🧢', text: 'Sun hat' });
    suggestions.push({ icon: '🕶️', text: 'Sunglasses' });
  }

  return suggestions;
}

function updateUI(w) {
  if (iconElement) iconElement.innerHTML = w.icon ? `<img src="https://openweathermap.org/img/wn/${w.icon}@2x.png" alt="icon" style="width:100px;height:100px"/>` : '';
  // temp and feels may be raw or already formatted depending on caller
  const tempDisplay = (w.tempK != null) ? toDisplayTemp(w.tempK) : (w.temp ?? null);
  const feelsDisplay = (w.feelsK != null) ? toDisplayTemp(w.feelsK) : (w.feels ?? null);
  if (tempElement) tempElement.innerHTML = `${tempDisplay ?? '--'}<span>${unit === 'metric' ? '&#8451;' : '&#8457;'}</span>`;
  if (descElement) descElement.textContent = w.desc || '--';
  if (locationElement) locationElement.textContent = w.city ? `${w.city}, ${w.country}` : '--';
  if (feelsEl) feelsEl.textContent = feelsDisplay != null ? `${feelsDisplay}${unit === 'metric' ? '\u00b0C' : '\u00b0F'}` : '--';
  if (humidityEl) humidityEl.textContent = w.humidity != null ? `${w.humidity}%` : '--';
  if (windEl) windEl.textContent = w.wind != null ? `${w.wind} m/s` : '--';
  
  // Update clothing suggestions
  const wearItems = document.getElementById('wearItems');
  if (wearItems) {
    const tempC = unit === 'metric' ? tempDisplay : ((tempDisplay - 32) * 5/9);
    const suggestions = getClothingSuggestions(tempC);
    wearItems.innerHTML = suggestions.map(item => 
      `<div class="wear-item">
        <span>${item.icon}</span>
        ${item.text}
      </div>`
    ).join('');
  }
  const card = document.querySelector('.weather-card');
  const colors = { Rain: '#4a90e2', Clouds: '#6b7280', Clear: '#f59e0b', Haze: '#94a3b8' };
  if (card) card.style.borderColor = colors[w.main] || '';
  // set data-theme for CSS variants
  if (card) {
    const theme = (w.main || '').toString();
    card.setAttribute('data-theme', theme);
  }

  // add or update decorative weather effect layer
  try {
    let effect = document.querySelector('.weather-effect');
    if (!effect && card) {
      effect = document.createElement('div'); effect.className = 'weather-effect';
      card.insertBefore(effect, card.firstChild);
    }
    if (effect) {
      // clear previous
      effect.innerHTML = '';
      const m = (w.main || '').toLowerCase();
      if (m.includes('clear')) {
        effect.className = 'weather-effect sun';
        const s = document.createElement('div'); s.className = 'sun'; effect.appendChild(s);
      } else if (m.includes('cloud')) {
        effect.className = 'weather-effect clouds';
        const c = document.createElement('div'); c.className = 'cloud'; effect.appendChild(c);
      } else if (m.includes('rain') || m.includes('drizzle')) {
        effect.className = 'weather-effect rain';
        // multiple raindrops
        for (let i=0;i<14;i++){ const d=document.createElement('div'); d.className='raindrop'; d.style.left=(5+i*6)+'%'; d.style.top=(5+i%3*6)+'%'; d.style.animationDelay=(Math.random()*0.8)+'s'; effect.appendChild(d); }
      } else if (m.includes('snow')) {
        effect.className = 'weather-effect snow';
        for (let i=0;i<12;i++){ const f=document.createElement('div'); f.className='flake'; f.style.left=(Math.random()*90)+'%'; f.style.top=(Math.random()*20)+'%'; f.style.animationDelay=(Math.random()*3)+'s'; effect.appendChild(f); }
      } else if (m.includes('thunder') || m.includes('storm')) {
        effect.className = 'weather-effect thunder';
        const b = document.createElement('div'); b.className='bolt'; effect.appendChild(b);
      } else {
        effect.className = 'weather-effect';
      }
    }
  } catch (e) { console.warn('weather effect error', e); }
}

async function getWeatherByCoords(lat, lon) {
  try {
    const api = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}`;
    const data = await fetchJson(api);
    const mapped = mapData(data);
    // keep last raw kelvin values for re-render when unit changes
    window.__lastWeather = mapped;
    updateUI(mapped);
    // fetch hourly/daily data and render
    try { 
      await getHourlyDaily(lat, lon); 
      updateTemperatureChart();
    } catch (e) { 
      console.warn('Hourly/daily fetch failed', e); 
    }
  } catch (err) {
    console.error(err);
    showNotification('Failed to load weather', true);
  }
}

async function getWeatherByCity(q) {
  try {
    // Add state code and country code support
    let searchQuery = q;
    
    const api = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(searchQuery)}&appid=${key}`;
    const data = await fetchJson(api);
    const mapped = mapData(data);
    window.__lastWeather = mapped;
    updateUI(mapped);
    // if we got coord back, fetch hourly/daily
    if (data && data.coord && data.coord.lat && data.coord.lon) {
      try { 
        await getHourlyDaily(data.coord.lat, data.coord.lon);
        updateTemperatureChart(); // Update the chart with new data
      } catch (e) { 
        console.warn('Hourly/daily fetch failed', e); 
      }
    }
    
    // Clear any existing notifications since the search was successful
    if (notificationElement) {
      notificationElement.style.display = 'none';
    }
  } catch (err) {
    console.error(err);
    let errorMessage = 'Location not found. Try:';
    errorMessage += '\n• Add state code (e.g., "Richmond,VA")';
    errorMessage += '\n• Add country code (e.g., "London,UK")';
    errorMessage += '\n• Check spelling';
    showNotification(errorMessage, true);
  }
}

// Fetch forecast data using the 5-day forecast API
async function getHourlyDaily(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${key}`;
  try {
    const data = await fetchJson(url);
    console.log('Received forecast data:', data);
    // store for re-renders and format for our use
    // Process and structure the forecast data
    const processedDaily = {};
    
    data.list.forEach(item => {
      const date = new Date(item.dt * 1000).toISOString().split('T')[0];
      if (!processedDaily[date]) {
        processedDaily[date] = {
          dt: item.dt,
          temp: {
            min: item.main.temp,
            max: item.main.temp
          },
          weather: item.weather
        };
      } else {
        processedDaily[date].temp.min = Math.min(processedDaily[date].temp.min, item.main.temp);
        processedDaily[date].temp.max = Math.max(processedDaily[date].temp.max, item.main.temp);
      }
    });

    // Convert to array and sort by date
    const dailyArray = Object.values(processedDaily).sort((a, b) => a.dt - b.dt);

    window.__onecall = {
      hourly: data.list.slice(0, 12), // Next 36 hours (12 3-hour slots)
      daily: dailyArray, // Processed daily data
      timezone_offset: 0 // Default to local time
    };
    renderHourly(window.__onecall);
    renderDaily(window.__onecall);
    try {
      updateTemperatureChart();
      console.log('Chart updated with new data');
    } catch (e) {
      console.error('Error updating chart:', e);
    }
  } catch (err) {
    console.error('Forecast fetch failed', err);
    // try fallback to the 3-hour forecast endpoint
    try {
      await getForecastFallback(lat, lon);
    } catch (e) {
      console.warn('Fallback forecast failed', e);
      showNotification('Hourly/daily data unavailable', true);
      const c = document.getElementById('hourlyScroll'); if (c) c.innerHTML = '<div style="color:var(--muted)">Hourly data unavailable</div>';
      const d = document.getElementById('dailyList'); if (d) d.innerHTML = '<li style="color:var(--muted)">Daily data unavailable</li>';
    }
  }
}

// Fallback using 3-hour /forecast endpoint and aggregate into hourly/daily UI
async function getForecastFallback(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${key}`;
  const data = await fetchJson(url);
  if (!data || !data.list) throw new Error('Invalid forecast response');
  // store for later
  window.__forecast = data;
  // render next 12 forecast slots as 'hourly'
  renderHourlyFromForecast(data);
  // aggregate by date for daily min/max
  renderDailyFromForecast(data);
}

function renderHourlyFromForecast(data) {
  const container = document.getElementById('hourlyScroll');
  if (!container) return;
  container.innerHTML = '';
  const list = data.list.slice(0, 12); // each is a 3-hour slot
  list.forEach(item => {
    const div = document.createElement('div'); div.className = 'hour-item';
    const time = document.createElement('div'); time.className = 'hour-time'; time.textContent = new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const iconWrap = document.createElement('div'); iconWrap.className = 'hour-icon';
    if (item.weather && item.weather[0]) { const img = document.createElement('img'); img.src = `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`; img.alt = item.weather[0].description || ''; iconWrap.appendChild(img); }
    const temp = document.createElement('div'); temp.className = 'hour-temp'; temp.textContent = (toDisplayTemp(item.main.temp) ?? '--') + (unit === 'metric' ? '°C' : '°F');
    div.appendChild(time); div.appendChild(iconWrap); div.appendChild(temp);
    container.appendChild(div);
  });
}

function renderDailyFromForecast(data) {
  const listEl = document.getElementById('dailyList');
  if (!listEl) return;
  // group by date string
  const groups = {};
  data.list.forEach(item => {
    const day = new Date(item.dt * 1000).toISOString().slice(0,10);
    groups[day] = groups[day] || [];
    groups[day].push(item);
  });
  // take next 7 days
  const days = Object.keys(groups).slice(0,7);
  listEl.innerHTML = '';
  days.forEach(dayKey => {
    const items = groups[dayKey];
    const temps = items.map(i => i.main.temp);
    const max = Math.max(...temps); const min = Math.min(...temps);
    // pick middle item icon
    const mid = items[Math.floor(items.length/2)];
    const li = document.createElement('li'); li.className = 'daily-item';
    const day = document.createElement('div'); day.className = 'daily-day'; day.textContent = new Date(dayKey).toLocaleDateString([], { weekday: 'short' });
    const icon = document.createElement('div'); icon.className = 'daily-icon';
    if (mid && mid.weather && mid.weather[0]) { const img = document.createElement('img'); img.src = `https://openweathermap.org/img/wn/${mid.weather[0].icon}@2x.png`; img.alt = mid.weather[0].description || ''; img.style.width='36px'; img.style.height='36px'; icon.appendChild(img); }
    const tempsEl = document.createElement('div'); tempsEl.className = 'daily-temps'; tempsEl.textContent = `${toDisplayTemp(max)} / ${toDisplayTemp(min)} ${unit === 'metric' ? '°C' : '°F'}`;
    li.appendChild(day); li.appendChild(icon); li.appendChild(tempsEl);
    listEl.appendChild(li);
  });
}

function hourTimeLabel(dt, tzOffset) {
  // dt in seconds, tzOffset in seconds
  const date = new Date((dt + (tzOffset||0)) * 1000);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function renderHourly(data) {
  const container = document.getElementById('hourlyScroll');
  if (!container) return;
  container.innerHTML = '';
  if (!data?.hourly) {
    container.innerHTML = '<div style="color:var(--muted)">No hourly data</div>';
    return;
  }
  const tz = data.timezone_offset || 0;
  const hours = data.hourly.slice(0, 12);
  hours.forEach(h => {
    const div = document.createElement('div');
    div.className = 'hour-item';
    const time = document.createElement('div'); time.className = 'hour-time'; time.textContent = hourTimeLabel(h.dt, tz);
    const iconWrap = document.createElement('div'); iconWrap.className = 'hour-icon';
    if (h.weather && h.weather[0]) {
      const img = document.createElement('img'); img.src = `https://openweathermap.org/img/wn/${h.weather[0].icon}@2x.png`; img.alt = h.weather[0].description || '';
      iconWrap.appendChild(img);
    }
    const temp = document.createElement('div'); temp.className = 'hour-temp'; temp.textContent = (toDisplayTemp(h.temp) ?? '--') + (unit === 'metric' ? '°C' : '°F');
    div.appendChild(time); div.appendChild(iconWrap); div.appendChild(temp);
    container.appendChild(div);
  });
}

function renderDaily(data) {
  const list = document.getElementById('dailyList');
  if (!list) return;
  list.innerHTML = '';
  if (!data?.daily) {
    list.innerHTML = '<li style="color:var(--muted)">No daily data</li>';
    return;
  }
  const days = data.daily.slice(0, 7);
  
  // Update the temperature chart when daily data is available
  updateTemperatureChart();
  
  days.forEach(d => {
    const li = document.createElement('li'); li.className = 'daily-item';
    const day = document.createElement('div'); day.className = 'daily-day';
    day.textContent = new Date(d.dt * 1000).toLocaleDateString([], { weekday: 'short' });
    const icon = document.createElement('div'); icon.className = 'daily-icon';
    if (d.weather && d.weather[0]) { const img = document.createElement('img'); img.src = `https://openweathermap.org/img/wn/${d.weather[0].icon}@2x.png`; img.alt = d.weather[0].description || ''; img.style.width='36px'; img.style.height='36px'; icon.appendChild(img); }
    const temps = document.createElement('div'); temps.className = 'daily-temps';
    const max = toDisplayTemp(d.temp.max); const min = toDisplayTemp(d.temp.min);
    temps.textContent = `${max != null ? max : '--'} / ${min != null ? min : '--'} ${unit === 'metric' ? '°C' : '°F'}`;
    li.appendChild(day); li.appendChild(icon); li.appendChild(temps);
    list.appendChild(li);
  });
}

// Temperature Chart
let temperatureChart = null;

function initTemperatureChart() {
  const ctx = document.getElementById('tempChart');
  if (!ctx) {
    console.error('Temperature chart canvas not found');
    return;
  }
  
  // Destroy existing chart if it exists
  if (temperatureChart) {
    temperatureChart.destroy();
  }

  // Make sure Chart.js is available
  if (typeof Chart === 'undefined') {
    console.error('Chart.js not loaded');
    return;
  }

  console.log('Initializing temperature chart...');
  temperatureChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Max Temperature',
        data: [],
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245,158,11,0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: 'Min Temperature',
        data: [],
        borderColor: '#4b5563',
        backgroundColor: 'rgba(75,85,99,0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(255,255,255,0.9)',
          titleColor: '#1f2937',
          bodyColor: '#1f2937',
          borderColor: 'rgba(16,24,40,0.1)',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y}${unit === 'metric' ? '°C' : '°F'}`;
            }
          }
        },
        legend: {
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            padding: 10,
            callback: function(value) {
              return `${value}${unit === 'metric' ? '°C' : '°F'}`;
            },
            font: {
              size: 11
            }
          },
          grid: {
            color: 'rgba(16,24,40,0.04)',
            drawBorder: false
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            padding: 10,
            font: {
              size: 11
            }
          }
        }
      }
    }
  });
}

function updateTemperatureChart() {
  if (!temperatureChart) {
    initTemperatureChart();
  }

  if (!temperatureChart || !window.__onecall) {
    console.log('No chart or weather data available');
    return;
  }

  const daily = window.__onecall.daily.slice(0, 7);
  if (!daily || daily.length === 0) {
    console.log('No daily data available');
    return;
  }

  console.log('Updating chart with data:', daily);

  const labels = daily.map(d => new Date(d.dt * 1000).toLocaleDateString([], { weekday: 'short' }));
  const maxTemps = daily.map(d => toDisplayTemp(d.temp.max));
  const minTemps = daily.map(d => toDisplayTemp(d.temp.min));

  // Update chart data
  temperatureChart.data.labels = labels;
  temperatureChart.data.datasets[0].data = maxTemps;
  temperatureChart.data.datasets[1].data = minTemps;

  // Update temperature unit display in scales
  temperatureChart.options.scales.y.ticks.callback = function(value) {
    return `${value}${unit === 'metric' ? '°C' : '°F'}`;
  };

  // Adjust Y axis range based on data
  const allTemps = [...maxTemps, ...minTemps].filter(t => t != null);
  if (allTemps.length > 0) {
    const min = Math.min(...allTemps);
    const max = Math.max(...allTemps);
    const padding = (max - min) * 0.1;
    temperatureChart.options.scales.y.min = Math.floor(min - padding);
    temperatureChart.options.scales.y.max = Math.ceil(max + padding);
  }

  console.log('Chart data updated:', {
    labels,
    maxTemps,
    minTemps,
    unit
  });

  temperatureChart.update('active');
}

// Ensure temps re-render for hourly/daily when unit changes
const originalRefresh = refreshDisplayedTemps;
refreshDisplayedTemps = function() {
  try { originalRefresh(); } catch(e) {}
  if (window.__onecall) { 
    renderHourly(window.__onecall); 
    renderDaily(window.__onecall);
    updateTemperatureChart();
  }
  if (window.__forecast) { 
    renderHourlyFromForecast(window.__forecast); 
    renderDailyFromForecast(window.__forecast);
  }
};

// events
if (inputEl) {
  inputEl.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      const q = inputEl.value.trim();
      if (q) getWeatherByCity(q);
    }
  });
}
if (searchBtn) searchBtn.addEventListener('click', () => { const q = inputEl.value.trim(); if (q) getWeatherByCity(q); });
if (locBtn) locBtn.addEventListener('click', () => {
  if (!('geolocation' in navigator)) return showNotification('Geolocation not supported', true);
  navigator.geolocation.getCurrentPosition((p) => { getWeatherByCoords(p.coords.latitude, p.coords.longitude); }, (err) => showNotification(err.message, true), { timeout: 8000 });
});

// Wait for Chart.js to be loaded and initialize chart
document.addEventListener('DOMContentLoaded', () => {
  // Wait a short moment to ensure Chart.js is fully loaded
  setTimeout(() => {
    try {
      if (typeof Chart !== 'undefined') {
        initTemperatureChart();
        console.log('Chart initialized successfully');
      } else {
        console.error('Chart.js not loaded');
      }
    } catch (e) {
      console.error('Error initializing chart:', e);
    }
  }, 500);
  
  // initial auto-load
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (p) => { getWeatherByCoords(p.coords.latitude, p.coords.longitude); },
      () => { }, 
      { timeout: 8000 }
    );
  }
});
