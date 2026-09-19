const form = document.getElementById('login-form');
const msg = document.getElementById('msg');

const params = new URLSearchParams(window.location.search);
const next = params.get('next');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.className = 'msg';
  msg.textContent = '';
  try {
    await api('/api/auth/login', {
      method: 'POST',
      body: { email: form.email.value, password: form.password.value },
    });
    window.location.href = next || 'index.html';
  } catch (err) {
    msg.className = 'msg error';
    msg.textContent = err.message;
  }
});