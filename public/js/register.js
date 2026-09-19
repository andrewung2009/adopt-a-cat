const form = document.getElementById('register-form');
const msg = document.getElementById('msg');
const countryInput = document.getElementById('country');
const countryListEl = document.getElementById('register-country-list');
let selectedCountry = '';

function renderCountryList(filter = '') {
  const term = filter.toLowerCase();
  const filtered = COUNTRIES.filter((c) => c.toLowerCase().includes(term));
  countryListEl.innerHTML = filtered.map((c) => `
    <div class="country-item" data-country="${escapeHtml(c)}">${escapeHtml(c)}</div>
  `).join('');
  countryListEl.style.display = filtered.length ? 'block' : 'none';
}

function selectCountry(country) {
  selectedCountry = country;
  countryInput.value = country;
  countryListEl.style.display = 'none';
}

countryInput.addEventListener('focus', () => renderCountryList(countryInput.value));
countryInput.addEventListener('input', () => { selectedCountry = ''; renderCountryList(countryInput.value); });
countryListEl.addEventListener('click', (e) => {
  const item = e.target.closest('.country-item');
  if (item) selectCountry(item.dataset.country);
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.country-picker')) countryListEl.style.display = 'none';
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.className = 'msg';
  msg.textContent = '';
  if (form.password.value !== form['confirm-password'].value) {
    msg.className = 'msg error';
    msg.textContent = 'Passwords do not match.';
    return;
  }
  try {
    await api('/api/auth/register', {
      method: 'POST',
      body: {
        firstName: form['first-name'].value,
        lastName: form['last-name'].value,
        email: form.email.value,
        password: form.password.value,
        phone: form.phone.value,
        country: selectedCountry || countryInput.value.trim(),
        state: form.state.value,
        city: form.city.value,
        hasCatExperience: form.experience.checked,
        confirmPassword: form['confirm-password'].value,
      },
    });
    msg.className = 'msg success';
    msg.textContent = 'Account created! Please check your email to verify your address.';
    form.reset();
  } catch (err) {
    msg.className = 'msg error';
    msg.textContent = err.message;
  }
});
