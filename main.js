import { getCountries, getCities, getPrayerTimes, showError } from './utility.js';

const continentSelect = document.getElementById('continent-select');
const countrySelect = document.getElementById('country-select');
const citySelect = document.getElementById('city-select');
const methodSelect = document.getElementById('method-select');
const prayerTableBody = document.querySelector('#prayer-table tbody');
const resetBtn = document.getElementById('reset-btn');
const countdownDiv = document.getElementById('nextPrayerCountDown');

// 🧭 Global interval tracker for countdown
let countdownInterval = null;

// 🇵🇸 Fallback list for Palestine cities
const fallbackCities = {
  "Palestine": [
    "Gaza",
    "Khan Yunis",
    "Rafah",
    "Deir al-Balah",
    "Nuseirat",
    "Beit Lahia",
    "Beit Hanoun",
    "Jerusalem",
    "Hebron",
    "Yatta",
    "Dura",
    "Halhul",
    "Nablus",
    "Jenin",
    "Tulkarm",
    "Qalqilya",
    "Ramallah",
    "Al-Bireh",
    "Bethlehem",
    "Dheisheh",
    "Jericho",
    "Salfit"
  ]
};

// 🧩 Restore selections on load
window.addEventListener('DOMContentLoaded', async () => {
  const lastContinent = localStorage.getItem('continent');
  const lastCountry   = localStorage.getItem('country');
  const lastCity      = localStorage.getItem('city');
  const lastMethod    = localStorage.getItem('method');

  if (lastContinent) {
    continentSelect.value = lastContinent;
    await loadCountries(lastContinent);
  }
  if (lastCountry) {
    countrySelect.value = lastCountry;
    await loadCities(lastCountry);
  }
  if (lastCity) citySelect.value = lastCity;
  if (lastMethod) methodSelect.value = lastMethod;

  if (lastCountry && lastCity) {
    await loadPrayerTimes();
    startPrayerCountdown(lastCountry, lastCity);
  }
});

// 🌍 Load countries by continent
async function loadCountries(continent) {
  countrySelect.innerHTML = '<option>Loading countries...</option>';
  citySelect.innerHTML = '<option value="">Select City</option>';
  prayerTableBody.innerHTML = '';

  try {
    const countries = await getCountries(continent);
    countrySelect.innerHTML = '<option value="">Select Country</option>';
    countries.forEach(c => {
      const option = document.createElement('option');
      option.value = c;
      option.textContent = c;
      countrySelect.appendChild(option);
    });
  } catch (err) {
    showError(err.message);
  }
}

// 🏙️ Load cities with Palestine fallback
async function loadCities(country) {
  citySelect.innerHTML = '<option>Loading cities...</option>';
  prayerTableBody.innerHTML = '';

  try {
    let cities = await getCities(country);
    if (!cities || cities.length === 0) {
      if (fallbackCities[country]) cities = fallbackCities[country];
      else { showError("No cities available"); return; }
    }
    renderCities(cities);
  } catch (err) {
    // If API fails, use fallback for Palestine
    if (fallbackCities[country]) {
      renderCities(fallbackCities[country]);
    } else {
      showError(err.message);
    }
  }
}

// Helper to render cities in dropdown
function renderCities(cities) {
  citySelect.innerHTML = '<option value="">Select City</option>';
  cities.forEach(c => {
    const option = document.createElement('option');
    option.value = c;
    option.textContent = c;
    citySelect.appendChild(option);
  });
}

// 🕌 Load prayer times
async function loadPrayerTimes() {
  const country = countrySelect.value;
  const city = citySelect.value;
  const method = methodSelect.value;
  if (!country || !city) return;

  prayerTableBody.innerHTML = '<tr><td colspan="2">Loading prayer times...</td></tr>';

  try {
    const prayers = await getPrayerTimes(country, city, method);
    prayerTableBody.innerHTML = '';
    for (const [name, time] of Object.entries(prayers)) {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${name}</td><td>${time}</td>`;
      prayerTableBody.appendChild(row);
    }
  } catch (err) {
    showError(err.message);
  }
}

// ⏰ Countdown logic
async function getNextPrayerCountdown(country, city) {
  const prayerTimes = await getPrayerTimes(country, city);
  const now = new Date();
  const prayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

  for (let prayer of prayers) {
    const [h, m] = prayerTimes[prayer].split(":").map(Number);
    const prayerTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
    if (prayerTime > now) {
      const diff = prayerTime - now;
      return {
        prayer,
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        day: "Today"
      };
    }
  }

  const [h, m] = prayerTimes["Fajr"].split(":").map(Number);
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, h, m);
  const diff = tomorrow - now;
  return {
    prayer: "Fajr",
    hours: Math.floor(diff / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    day: "Tomorrow"
  };
}

function formatTime(h, m, s) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

async function startPrayerCountdown(country, city) {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }

  async function update() {
    try {
      const result = await getNextPrayerCountdown(country, city);
      const timeStr = formatTime(result.hours, result.minutes, result.seconds);
      countdownDiv.textContent = `Next prayer in ${city}: ${result.prayer} (${result.day}) in ${timeStr}`;
    } catch (err) {
      showError("Error updating countdown: " + err.message);
    }
  }

  await update();
  countdownInterval = setInterval(update, 1000);
}

// 🧭 Event bindings
continentSelect.addEventListener('change', async () => {
  localStorage.setItem('continent', continentSelect.value);
  await loadCountries(continentSelect.value);
  localStorage.removeItem('country');
  localStorage.removeItem('city');
});

countrySelect.addEventListener('change', async () => {
  localStorage.setItem('country', countrySelect.value);
  await loadCities(countrySelect.value);
  localStorage.removeItem('city');
});

citySelect.addEventListener('change', () => {
  localStorage.setItem('city', citySelect.value);
  loadPrayerTimes();
  startPrayerCountdown(countrySelect.value, citySelect.value);
});

methodSelect.addEventListener('change', () => {
  localStorage.setItem('method', methodSelect.value);
  loadPrayerTimes();
  startPrayerCountdown(countrySelect.value, citySelect.value);
});

resetBtn.addEventListener('click', () => {
  continentSelect.value = '';
  countrySelect.innerHTML = '<option value="">Select Country</option>';
  citySelect.innerHTML = '<option value="">Select City</option>';
  methodSelect.value = '2';
  prayerTableBody.innerHTML = '';
  countdownDiv.textContent = '';

  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }

  localStorage.clear();
});
