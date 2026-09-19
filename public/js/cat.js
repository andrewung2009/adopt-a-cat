const params = new URLSearchParams(window.location.search);
const catId = params.get('id');

const detail = document.getElementById('detail');
const photo = document.getElementById('photo');
const info = document.getElementById('info');

(async () => {
  if (!catId) {
    detail.innerHTML = '<p class="empty">No cat specified.</p>';
    return;
  }

  let cat;
  try {
    ({ cat } = await api(`/api/cats/${catId}`));
  } catch (err) {
    detail.innerHTML = `<p class="empty">${escapeHtml(err.message)}</p>`;
    return;
  }

  const loc = [cat.location.city, cat.location.state, cat.location.country].filter(Boolean).join(', ');
  photo.src = cat.photoUrl;
  photo.alt = cat.name;

  const user = await currentUser();
  const isAdmin = user && user.isAdmin;

  const statusBadge = cat.status === 'pending'
    ? `<span class="tag claimed">Claimed</span>`
    : '';

  const fedBadge = cat.fedStatus === 'fed'
    ? `<span class="tag health">&#10003; Fed</span>`
    : `<span class="tag" style="background:#fee2e2; color:#991b1b;">Needs feeding</span>`;

  const fedTime = cat.lastFedAt
    ? `<div class="meta" style="font-size:0.85rem; color:#888;">Last fed: ${escapeHtml(cat.lastFedAt)}</div>`
    : '';

  const adminFeedBtn = isAdmin
    ? `<div style="margin-top:10px;">
        <button id="feed-btn" class="secondary">${cat.fedStatus === 'fed' ? 'Mark as needs feeding' : 'Mark as fed'}</button>
       </div>`
    : '';

  const adoptDisabled = cat.status === 'pending';
  const adoptLabel = adoptDisabled ? 'Claimed' : 'Adopt Cat Now';

  info.innerHTML = `
    <h1>${escapeHtml(cat.name)}</h1>
    ${statusBadge ? `<div class="meta">${statusBadge}</div>` : ''}
    <div class="meta"><b>Age:</b> ${escapeHtml(cat.age)}</div>
    <div class="meta"><b>Personality:</b> ${escapeHtml(cat.personality)}</div>
    <div class="meta"><b>Preferred home:</b> ${escapeHtml(cat.preferredHome)}</div>
    ${loc ? `<div class="meta"><b>Location:</b> ${escapeHtml(loc)}</div>` : ''}
    <div class="meta"><b>Health:</b> ${fedBadge}</div>
    ${fedTime}
    <p><b>Shelter phone:</b> <a href="tel:+15550100">+1 555-0100</a></p>
    ${adminFeedBtn}
    <div style="margin-top:16px;">
      <button id="adopt-btn" class="btn" ${adoptDisabled ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>${adoptLabel}</button>
    </div>
  `;

  if (isAdmin) {
    document.getElementById('feed-btn').addEventListener('click', async () => {
      const endpoint = cat.fedStatus === 'fed' ? 'unfeed' : 'feed';
      try {
        const result = await api(`/api/admin/cats/${catId}/${endpoint}`, { method: 'POST' });
        cat.fedStatus = endpoint === 'feed' ? 'fed' : 'needs feeding';
        cat.lastFedAt = endpoint === 'feed' ? new Date().toISOString() : null;
        const badge = cat.fedStatus === 'fed'
          ? `<span class="tag health">&#10003; Fed</span>`
          : `<span class="tag" style="background:#fee2e2; color:#991b1b;">Needs feeding</span>`;
        const healthDiv = [...info.querySelectorAll('.meta')].find(d => d.textContent.includes('Health'));
        if (healthDiv) healthDiv.innerHTML = `<b>Health:</b> ${badge}`;
        document.getElementById('feed-btn').textContent = cat.fedStatus === 'fed' ? 'Mark as needs feeding' : 'Mark as fed';

        if (endpoint === 'feed' && result.revertIn) {
          setTimeout(() => { window.location.reload(); }, result.revertIn + 500);
        }
      } catch (err) {
        alert(err.message);
      }
    });
  }

  document.getElementById('adopt-btn').addEventListener('click', () => {
    if (!user) {
      window.location.href = 'login.html?next=' + encodeURIComponent(`apply.html?cat=${catId}`);
      return;
    }
    window.location.href = 'apply.html?cat=' + catId;
  });
})();