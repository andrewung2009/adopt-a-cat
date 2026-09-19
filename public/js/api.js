async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

async function currentUser() {
  try {
    const { user } = await api('/api/auth/me');
    return user;
  } catch {
    return null;
  }
}

function renderAuthNav(user) {
  const nav = document.querySelector('header.site nav');
  if (!nav) return;
  if (user) {
    nav.innerHTML = `
      <a href="index.html">Browse</a>
      <a href="donate.html">Donate</a>
      ${user.isAdmin ? '<a href="admin.html">Admin</a>' : ''}
      <a href="account.html">${escapeHtml(user.firstName)}</a>
      <a href="#" id="logout-link">Log out</a>`;
    document.getElementById('logout-link').addEventListener('click', async (e) => {
      e.preventDefault();
      await api('/api/auth/logout', { method: 'POST' });
      window.location.href = 'index.html';
    });
  } else {
    nav.innerHTML = `<a href="index.html">Browse</a><a href="donate.html">Donate</a><a href="login.html">Log in</a><a href="register.html" class="btn">Sign up</a>`;
  }
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

async function initAuthNav() {
  renderAuthNav(await currentUser());
}

document.addEventListener('DOMContentLoaded', initAuthNav);