const form = document.getElementById('donate-form');
const msg = document.getElementById('msg');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.className = 'msg';
  msg.textContent = '';
  try {
    const result = await api('/api/donations', {
      method: 'POST',
      body: {
        amount: Number(form.amount.value),
        message: form.message.value,
      },
    });
    msg.className = 'msg success';
    msg.textContent = result.message;
    form.reset();
  } catch (err) {
    msg.className = 'msg error';
    msg.textContent = err.message;
  }
});