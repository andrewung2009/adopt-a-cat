const params = new URLSearchParams(window.location.search);
const next = params.get('next') || 'index.html';
const form = document.getElementById('quiz-form');
const msg = document.getElementById('msg');
const questionsEl = document.getElementById('questions');

(async () => {
  let data;
  try {
    data = await api('/api/quiz/questions');
  } catch (err) {
    if (err.message === 'Not logged in') {
      window.location.href = 'login.html?next=' + encodeURIComponent('quiz.html' + window.location.search);
      return;
    }
    msg.className = 'msg error';
    msg.textContent = err.message;
    return;
  }

  questionsEl.innerHTML = data.questions
    .map(
      (q, qi) => `
      <div style="margin-bottom:18px;">
        <p style="font-weight:600;margin-bottom:8px;">${qi + 1}. ${escapeHtml(q.question)}</p>
        ${q.options
          .map(
            (opt, oi) => `
          <label style="display:flex; gap:8px; align-items:center; margin-bottom:6px;">
            <input type="radio" name="q${q.id}" value="${oi}" required style="width:auto;" />
            <span style="margin:0;">${escapeHtml(opt)}</span>
          </label>`
          )
          .join('')}
      </div>`
    )
    .join('');
})();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.className = 'msg';
  msg.textContent = '';

  const answers = [];
  let complete = true;
  for (let i = 1; i <= 4; i++) {
    const selected = form[`q${i}`];
    if (!selected) continue;
    let val = null;
    for (const r of selected) if (r.checked) val = r.value;
    if (val === null) complete = false;
    answers.push(val === null ? -1 : Number(val));
  }
  if (!complete) {
    msg.className = 'msg error';
    msg.textContent = 'Please answer all questions.';
    return;
  }

  try {
    const result = await api('/api/quiz/submit', { method: 'POST', body: { answers } });
    if (result.passed) {
      msg.className = 'msg success';
      msg.textContent = `You passed (${result.score}/${result.passThreshold})! Redirecting...`;
      setTimeout(() => (window.location.href = next), 1200);
    } else {
      msg.className = 'msg error';
      msg.textContent = `You scored ${result.score}/${result.passThreshold}. Please review your answers and try again.`;
    }
  } catch (err) {
    msg.className = 'msg error';
    msg.textContent = err.message;
  }
});