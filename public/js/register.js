const form = document.getElementById('register-form');
const msg = document.getElementById('msg');

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
        country: form.country.value,
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