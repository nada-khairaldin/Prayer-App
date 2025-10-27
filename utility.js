const cityCache = {};

// --- Get countries by continent ---
export async function getCountries(continent) {
  try {
    const res = await fetch(`https://restcountries.com/v3.1/region/${encodeURIComponent(continent)}`);
    if (!res.ok) throw new Error("Failed to fetch countries");
    const data = await res.json();
    return data.map(c => c.name.common);
  } catch (err) {
    throw new Error("Error fetching countries: " + err.message);
  }
}

// --- Get cities by country (cached) ---
export async function getCities(country) {
  try {
    if (cityCache[country]) return cityCache[country];

    const res = await fetch("https://countriesnow.space/api/v0.1/countries/cities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country })
    });

    if (!res.ok) throw new Error("Failed to fetch cities");

    const data = await res.json();
    cityCache[country] = data.data;
    return data.data;
  } catch (err) {
    throw new Error("Error fetching cities: " + err.message);
  }
}

// --- Get prayer times ---
export async function getPrayerTimes(country, city, method = 2) {
  try {
    if (!country || !city) throw new Error("Country and city are required");

    const res = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}`);
    if (!res.ok) throw new Error("Failed to fetch prayer times");

    const data = await res.json();
    const timings = data.data.timings;

    return {
      Fajr: timings.Fajr,
      Dhuhr: timings.Dhuhr,
      Asr: timings.Asr,
      Maghrib: timings.Maghrib,
      Isha: timings.Isha
    };
  } catch (err) {
    throw new Error("Error fetching prayer times: " + err.message);
  }
}

// --- Error toast display ---
export function showError(message) {
  const toast = document.getElementById('error-toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove('hidden');
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hidden');
  }, 4000);
}
