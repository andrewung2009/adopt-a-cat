const msg = document.getElementById('msg');
const inquiriesBody = document.getElementById('inquiries-body');
const catsBody = document.getElementById('cats-body');

let currentPage = 1;
const PAGE_LIMIT = 10;

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function statusBadge(status) {
  const cls = { available: 'badge-available', pending: 'badge-pending', adopted: 'badge-adopted' };
  return `<span class="badge ${cls[status] || ''}">${escapeHtml(status)}</span>`;
}

function fedBadge(fedStatus) {
  const cls = fedStatus === 'fed' ? 'badge-fed' : 'badge-hungry';
  return `<span class="badge ${cls}">${escapeHtml(fedStatus)}</span>`;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function showMsg(text, type) {
  msg.className = `msg ${type}`;
  msg.textContent = text;
  msg.style.display = 'block';
  setTimeout(() => { msg.style.display = 'none'; }, 3000);
}

function renderPagination(container, page, totalPages, onChange) {
  if (totalPages <= 1) { container.innerHTML = ''; return; }
  let html = '<div style="display:flex; justify-content:center; align-items:center; gap:8px; margin-top:14px;">';
  html += `<button class="page-btn secondary" ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}" style="padding:6px 12px;">Prev</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn ${i === page ? 'btn' : 'secondary'}" data-page="${i}" style="padding:6px 10px; min-width:36px;">${i}</button>`;
  }
  html += `<button class="page-btn secondary" ${page >= totalPages ? 'disabled' : ''} data-page="${page + 1}" style="padding:6px 12px;">Next</button>`;
  html += '</div>';
  container.innerHTML = html;
  container.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = Number(btn.dataset.page);
      if (p >= 1 && p <= totalPages) onChange(p);
    });
  });
}

async function loadInquiries(page) {
  currentPage = page || 1;
  try {
    const data = await api(`/api/admin/inquiries?page=${currentPage}&limit=${PAGE_LIMIT}`);
    if (!data.inquiries.length && currentPage === 1) {
      inquiriesBody.innerHTML = '<tr class="empty-row"><td colspan="5">No inquiries yet.</td></tr>';
      document.getElementById('inquiries-pagination').innerHTML = '';
      return;
    }
    inquiriesBody.innerHTML = data.inquiries.map(i => `
      <tr>
        <td><a href="cat.html?id=${i.cat_id}">${escapeHtml(i.cat_name)}</a></td>
        <td>${escapeHtml(i.first_name)} ${escapeHtml(i.last_name)}</td>
        <td>${escapeHtml(i.user_email)}</td>
        <td>${escapeHtml(i.message || '-')}</td>
        <td>${formatDate(i.created_at)}</td>
      </tr>
    `).join('');
    renderPagination(document.getElementById('inquiries-pagination'), data.page, data.totalPages, loadInquiries);
  } catch (err) {
    inquiriesBody.innerHTML = `<tr class="empty-row"><td colspan="5">Error: ${escapeHtml(err.message)}</td></tr>`;
  }
}

async function loadCats() {
  try {
    const { cats } = await api('/api/admin/cats');
    catsBody.innerHTML = cats.map(c => `
      <tr>
        <td><a href="cat.html?id=${c.id}">${escapeHtml(c.name)}</a></td>
        <td>${escapeHtml(c.age)}</td>
        <td>
          <select class="status-select" data-id="${c.id}" style="padding:4px 8px; border-radius:4px; border:1px solid #ddd;">
            <option value="available" ${c.status === 'available' ? 'selected' : ''}>available</option>
            <option value="pending" ${c.status === 'pending' ? 'selected' : ''}>pending</option>
            <option value="adopted" ${c.status === 'adopted' ? 'selected' : ''}>adopted</option>
          </select>
        </td>
        <td>${fedBadge(c.fed_status)}</td>
        <td>${formatDate(c.last_fed_at)}</td>
        <td>
          <button class="feed-toggle secondary" data-id="${c.id}" data-fed="${c.fed_status}" style="padding:5px 10px; font-size:0.8rem;">
            ${c.fed_status === 'fed' ? 'Unfeed' : 'Feed'}
          </button>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('.status-select').forEach(select => {
      select.addEventListener('change', async () => {
        const catId = select.dataset.id;
        const newStatus = select.value;
        try {
          await api(`/api/admin/cats/${catId}/status`, { method: 'POST', body: { status: newStatus } });
          showMsg(`Status changed to ${newStatus}`, 'success');
          loadCats();
        } catch (err) {
          showMsg(err.message, 'error');
          loadCats();
        }
      });
    });

    document.querySelectorAll('.feed-toggle').forEach(btn => {
      btn.addEventListener('click', async () => {
        const catId = btn.dataset.id;
        const isFed = btn.dataset.fed === 'fed';
        const endpoint = isFed ? 'unfeed' : 'feed';
        try {
          await api(`/api/admin/cats/${catId}/${endpoint}`, { method: 'POST' });
          loadCats();
        } catch (err) {
          showMsg(err.message, 'error');
        }
      });
    });
  } catch (err) {
    catsBody.innerHTML = `<tr class="empty-row"><td colspan="6">Error: ${escapeHtml(err.message)}</td></tr>`;
  }
}

(async () => {
  const user = await currentUser();
  if (!user || !user.isAdmin) {
    document.querySelector('main').innerHTML = '<p class="empty">Admin access required. <a href="login.html">Log in as admin</a></p>';
    return;
  }
  await Promise.all([loadInquiries(1), loadCats()]);
})();