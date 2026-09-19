const params = new URLSearchParams(window.location.search);
const catId = params.get('cat');
const form = document.getElementById('inquiry-form');
const msg = document.getElementById('msg');
const catNameEl = document.getElementById('cat-name');

let catName = '';

(async () => {
  if (!catId) {
    msg.className = 'msg error';
    msg.textContent = 'No cat selected.';
    form.querySelector('button').disabled = true;
    return;
  }

  try {
    const { cat } = await api(`/api/cats/${catId}`);
    catName = cat.name;
    catNameEl.textContent = `Regarding: ${cat.name}`;
    document.getElementById('message').placeholder = `Tell us about your home and why you would like to adopt ${cat.name}.`;
  } catch (err) {
    msg.className = 'msg error';
    msg.textContent = err.message;
  }

  const user = await currentUser();
  if (user) {
    document.getElementById('name').value = `${user.firstName} ${user.lastName}`;
    document.getElementById('email').value = user.email;
  }
})();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.className = 'msg';
  msg.textContent = '';
  try {
    const result = await api('/api/applications', {
      method: 'POST',
      body: {
        catId: Number(catId),
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        message: form.message.value,
      },
    });
    msg.className = 'msg success';
    msg.textContent = `${result.message} We'll be in touch soon!`;
    form.querySelector('button').disabled = true;
  } catch (err) {
    msg.className = 'msg error';
    msg.textContent = err.message;
  }
});