const msg = document.getElementById('msg');
const profile = document.getElementById('profile');
const prefsDiv = document.getElementById('prefs');

(async () => {
  const user = await currentUser();
  if (!user) {
    window.location.href = 'login.html?next=account.html';
    return;
  }
  const loc = [user.location.city, user.location.state, user.location.country].filter(Boolean).join(', ') || 'not set';
  profile.innerHTML = `
    <p><b>Name:</b> ${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}</p>
    <p><b>Email:</b> ${escapeHtml(user.email)} ${user.emailVerified ? '&#10003; verified' : '(not verified)'}</p>
    <p><b>Phone:</b> ${escapeHtml(user.phone) || 'not set'}</p>
    <p><b>Location:</b> ${escapeHtml(loc)}</p>
    <p><b>Cat experience:</b> ${user.hasCatExperience ? 'Yes' : 'No'}</p>
    <p><b>Questionnaire:</b> ${user.quizScore == null ? 'Not taken' : `${user.quizScore}/4`}</p>
    ${user.quizScore < 3 ? '<p><a class="btn" href="quiz.html">Take the questionnaire</a></p>' : ''}
  `;

  try {
    const prefs = await api('/api/preferences');
    const hasPrefs = prefs.age || prefs.personality || prefs.home || prefs.location;
    const display = (val) => val ? escapeHtml(val) : '<em style="color:#999;">any</em>';
    prefsDiv.innerHTML = `
      <h3>Saved filter preferences</h3>
      ${hasPrefs ? `
        <p><b>Age:</b> ${display(prefs.age)}</p>
        <p><b>Personality:</b> ${display(prefs.personality)}</p>
        <p><b>Home:</b> ${display(prefs.home)}</p>
        <p><b>Location:</b> ${display(prefs.location)}</p>
        <div style="display:flex; gap:10px; margin-top:12px;">
          <a href="index.html" class="btn">Browse with these filters</a>
          <button id="clear-prefs" class="secondary">Clear preferences</button>
        </div>
      ` : '<p>No saved preferences yet. Use the filter bar on the gallery page and click "Save preferences".</p>'}
    `;
    const clearBtn = document.getElementById('clear-prefs');
    if (clearBtn) {
      clearBtn.addEventListener('click', async () => {
        await api('/api/preferences', { method: 'DELETE' });
        msg.className = 'msg success';
        msg.textContent = 'Preferences cleared.';
        prefsDiv.innerHTML = '<h3>Saved filter preferences</h3><p>No saved preferences yet.</p>';
      });
    }
  } catch (err) {
    prefsDiv.innerHTML = `<p style="color:#999;">Could not load preferences.</p>`;
  }
})();