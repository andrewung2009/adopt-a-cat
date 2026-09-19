const grid = document.getElementById('grid');
const empty = document.getElementById('empty');
const count = document.getElementById('count');
const filters = document.getElementById('filters');
const saveBtn = document.getElementById('save-prefs');
const locationInput = document.getElementById('location');
const countryList = document.getElementById('country-list');
const countryPicker = document.getElementById('country-picker');

let loggedInUser = null;
let selectedCountry = '';

function catCard(cat) {
  const loc = [cat.location.city, cat.location.state, cat.location.country].filter(Boolean).join(', ');
  const pendingBadge = cat.status === 'pending' ? '<span class="tag claimed">Claimed</span>' : '';
  const code = COUNTRY_CODES[cat.location.country] || '';
  const flag = code ? `<img src="https://flagcdn.com/w20/${code}.png" alt="${escapeHtml(cat.location.country)}" class="cat-flag" title="${escapeHtml(cat.location.country)}" />` : '';
  return `
    <a class="card${cat.status === 'pending' ? ' card-pending' : ''}" href="cat.html?id=${cat.id}">
      <div class="card-image-wrapper">
        <img src="${escapeHtml(cat.photoUrl)}" alt="${escapeHtml(cat.name)}" loading="lazy" />
        ${flag}
      </div>
      <div class="body">
        <h3>${escapeHtml(cat.name)}</h3>
        <div class="tags">
          <span class="tag">${escapeHtml(cat.age)}</span>
          <span class="tag">${escapeHtml(cat.personality)}</span>
          <span class="tag">${escapeHtml(cat.preferredHome)}</span>
          ${loc ? `<span class="tag location">${escapeHtml(loc)}</span>` : ''}
          ${pendingBadge}
        </div>
      </div>
    </a>`;
}

async function loadOptions() {
  try {
    const { age, personality, home } = await api('/api/cats/options');
    const set = (id, values) => {
      const sel = document.getElementById(id);
      values.forEach((v) => {
        const opt = document.createElement('option');
        opt.value = v;
        opt.textContent = v;
        sel.appendChild(opt);
      });
    };
    set('age', age);
    set('personality', personality);
    set('home', home);
  } catch (err) {
    console.error('Could not load filter options:', err);
  }
}

async function loadCats(params = {}) {
  try {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    const { cats } = await api(`/api/cats${qs ? '?' + qs : ''}`);
    grid.innerHTML = cats.map(catCard).join('');
    empty.style.display = cats.length ? 'none' : 'block';
    if (count) {
      const active = Object.values(params).filter(Boolean).length;
      count.textContent = active
        ? `${cats.length} cat${cats.length === 1 ? '' : 's'} match${cats.length === 1 ? 'es' : ''} your filters`
        : `${cats.length} cats available for adoption`;
    }
  } catch (err) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    empty.textContent = `Error loading cats: ${err.message}`;
  }
}

function getFilterValues() {
  return {
    age: filters.age.value,
    personality: filters.personality.value,
    home: filters.home.value,
    location: selectedCountry || locationInput.value.trim(),
  };
}

function setFilterValues(prefs) {
  if (prefs.age) filters.age.value = prefs.age;
  if (prefs.personality) filters.personality.value = prefs.personality;
  if (prefs.home) filters.home.value = prefs.home;
  if (prefs.location) {
    selectedCountry = prefs.location;
    locationInput.value = prefs.location;
    renderCountryList(prefs.location);
  }
}

function renderCountryList(filter = '') {
  const term = filter.toLowerCase();
  const filtered = COUNTRIES.filter((c) => c.toLowerCase().includes(term));
  countryList.innerHTML = filtered.map((c) => `
    <div class="country-item${c === selectedCountry ? ' selected' : ''}" data-country="${escapeHtml(c)}">${escapeHtml(c)}</div>
  `).join('');
  countryList.style.display = filtered.length ? 'block' : 'none';
}

function selectCountry(country) {
  selectedCountry = country;
  locationInput.value = country;
  countryList.style.display = 'none';
  renderCountryList();
  applyFilters();
}

async function loadSavedPreferences() {
  try {
    loggedInUser = await currentUser();
    if (!loggedInUser) return;
    const prefs = await api('/api/preferences');
    const hasPrefs = prefs.age || prefs.personality || prefs.home || prefs.location;
    if (hasPrefs) {
      setFilterValues(prefs);
      loadCats(prefs);
      if (saveBtn) {
        saveBtn.textContent = 'Update saved preferences';
        saveBtn.title = 'Overwrite saved preferences with current filters';
      }
    }
  } catch (err) {
    console.error('Could not load preferences:', err);
  }
}

async function savePreferences() {
  if (!loggedInUser) return;
  const vals = getFilterValues();
  try {
    await api('/api/preferences', { method: 'PUT', body: vals });
    if (saveBtn) {
      saveBtn.textContent = 'Saved!';
      setTimeout(() => { saveBtn.textContent = 'Update saved preferences'; }, 1500);
    }
  } catch (err) {
    console.error('Could not save preferences:', err);
  }
}

function applyFilters() {
  loadCats(getFilterValues());
}

locationInput.addEventListener('focus', () => {
  renderCountryList(locationInput.value);
});

locationInput.addEventListener('input', () => {
  selectedCountry = '';
  renderCountryList(locationInput.value);
});

countryList.addEventListener('click', (e) => {
  const item = e.target.closest('.country-item');
  if (item) selectCountry(item.dataset.country);
});

document.addEventListener('click', (e) => {
  if (!countryPicker.contains(e.target)) {
    countryList.style.display = 'none';
  }
});

filters.addEventListener('change', applyFilters);
filters.addEventListener('submit', (e) => {
  e.preventDefault();
  applyFilters();
});

if (saveBtn) {
  saveBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!loggedInUser) {
      window.location.href = 'login.html?next=' + encodeURIComponent(window.location.href);
      return;
    }
    savePreferences();
  });
}

(async () => {
  await loadOptions();
  await loadSavedPreferences();
  if (!document.getElementById('age').value) loadCats();
})();
