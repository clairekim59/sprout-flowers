/* ============================================================
   Sprout ✿ — UI logic (Supabase-backed)
   ============================================================ */

// ---------- id helpers ----------
function makeId() {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  let id = 'plant_';
  for (let i = 0; i < 4; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

// ---------- random cute pools ----------
const CUTE_ADJ = [
  'fluffy', 'sleepy', 'sunny', 'dreamy', 'cozy', 'sparkly', 'tiny', 'sweet',
  'happy', 'bubbly', 'rosy', 'mossy', 'soft', 'cloudy', 'gentle', 'minty',
  'peachy', 'honey', 'twinkly', 'lucky',
];
const CUTE_NOUN = [
  'sprout', 'leaf', 'petal', 'bloom', 'bud', 'pebble', 'cloud', 'star',
  'moon', 'bee', 'bunny', 'fern', 'daisy', 'mochi', 'puff', 'berry',
  'tofu', 'dewdrop', 'kitten', 'duckling',
];
const CUTE_MSGS = [
  'you make the world brighter ✿',
  'thinking of you today ♡',
  "you're a tiny ray of sunshine 🌞",
  'sending a little leaf of love 🍃',
  "you're doing amazing, sweetie ✿",
  'hope your day is soft and cozy ☁',
  'you bloom so beautifully ❀',
  'just because — i appreciate you ♡',
  'a little hi from a friend ✿',
  'remember to drink some water today 🌱',
  'your kindness is contagious ♡',
];
const cap  = s => s[0].toUpperCase() + s.slice(1);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

function randomCuteName() { return `${pick(CUTE_ADJ)}${cap(pick(CUTE_NOUN))}`; }
function randomCuteMsg()  { return pick(CUTE_MSGS); }

const emailKey = e => e.trim().toLowerCase();

// ---------- view routing ----------
const views = {
  login:  document.getElementById('view-login'),
  signup: document.getElementById('view-signup'),
  main:   document.getElementById('view-main'),
};
function go(name) {
  Object.entries(views).forEach(([k, el]) => el.hidden = (k !== name));
  if (name === 'main')   renderMain();
  if (name === 'signup') refreshSignupPlaceholder();
}
document.querySelectorAll('[data-go]').forEach(el => {
  el.addEventListener('click', e => { e.preventDefault(); go(el.dataset.go); });
});

function refreshSignupPlaceholder() {
  const el = document.getElementById('suName');
  if (!el) return;
  el.placeholder = randomCuteName();
  el.value = '';
}

// ---------- toast ----------
const toastEl = document.getElementById('toast');
let toastTimer;
function toast(msg, kind = 'green') {
  toastEl.textContent = msg;
  toastEl.classList.toggle('pink', kind === 'pink');
  toastEl.hidden = false;
  requestAnimationFrame(() => toastEl.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('show');
    setTimeout(() => toastEl.hidden = true, 300);
  }, 2400);
}

// ---------- setup check ----------
function ensureConfigured() {
  if (window.db && window.db.needsSetup) {
    document.body.innerHTML = `
      <div style="max-width:500px;margin:80px auto;padding:32px;
        background:#fff;border-radius:22px;border:2px solid #ffd1dc;
        font-family:Quicksand,sans-serif;color:#5a4a5a;line-height:1.5;
        box-shadow:0 8px 30px rgba(255,143,174,0.2);">
        <h2 style="font-family:Pacifico,cursive;color:#d96a8a;margin:0 0 12px;">
          almost there ✿
        </h2>
        <p>Sprout needs Supabase credentials before it can run.</p>
        <ol>
          <li>Open <code>config.js</code></li>
          <li>Paste your Supabase Project URL + anon public key</li>
          <li>Save and reload this page</li>
        </ol>
        <p style="font-size:13px;color:#8a7a8a;">
          See the instructions inside <code>config.js</code> for where to find these.
        </p>
      </div>
    `;
    return false;
  }
  return true;
}

// ---------- signup ----------
document.getElementById('signupForm').addEventListener('submit', async e => {
  e.preventDefault();
  const nameEl = document.getElementById('suName');
  const name   = (nameEl.value.trim() || nameEl.placeholder || 'sprout').slice(0, 30);
  const email  = emailKey(document.getElementById('suEmail').value);
  const pass   = document.getElementById('suPass').value;
  const errEl  = document.getElementById('signupError');
  errEl.textContent = '';

  if (pass.length < 6) {
    errEl.textContent = 'password must be at least 6 characters ♡';
    return;
  }

  const submitBtn = e.target.querySelector('button[type=submit]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'planting…';

  try {
    // try up to 3 times in case sprout_id collides
    let lastErr;
    for (let attempt = 0; attempt < 3; attempt++) {
      const sproutId = makeId();
      try {
        const { session } = await db.signUp({ email, password: pass, displayName: name, sproutId });
        if (!session) {
          // email confirmation required
          toast('check your email to confirm ✿', 'pink');
          go('login');
          return;
        }
        toast(`welcome, ${name} 🌱`);
        go('main');
        return;
      } catch (err) {
        lastErr = err;
        const msg = (err && err.message) || '';
        // collision on unique sprout_id → retry; otherwise bail
        if (!/duplicate|unique/i.test(msg)) break;
      }
    }
    throw lastErr;
  } catch (err) {
    console.error(err);
    const msg = (err && err.message) || 'something went wrong ✿';
    if (/already.*registered/i.test(msg) || /already.*exists/i.test(msg)) {
      errEl.textContent = 'this email is already growing a plant ✿';
    } else {
      errEl.textContent = msg;
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'create my sprout 🌱';
  }
});

// ---------- login ----------
document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const email = emailKey(document.getElementById('loginIdent').value);
  const pass  = document.getElementById('loginPass').value;
  const errEl = document.getElementById('loginError');
  errEl.textContent = '';

  const submitBtn = e.target.querySelector('button[type=submit]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'logging in…';

  try {
    await db.signIn({ email, password: pass });
    const me = await db.currentProfile();
    toast(`welcome back, ${me ? me.display_name : ''} ✿`);
    go('main');
  } catch (err) {
    console.error(err);
    const msg = (err && err.message) || '';
    if (/invalid.*credentials/i.test(msg)) {
      errEl.textContent = 'email or password doesn’t match ♡';
    } else if (/confirm/i.test(msg)) {
      errEl.textContent = 'please confirm your email first ✿';
    } else {
      errEl.textContent = msg || 'something went wrong';
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'log in ✿';
  }
});

// ---------- logout ----------
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await db.signOut();
  document.getElementById('loginForm').reset();
  toast('see you soon ♡', 'pink');
  go('login');
});

// ---------- main render ----------
async function renderMain() {
  const me = await db.currentProfile();
  if (!me) { go('login'); return; }

  // profile
  document.getElementById('profName').textContent   = me.display_name;
  document.getElementById('profId').textContent     = me.sprout_id;
  document.getElementById('profEmail').textContent  = me.email;
  document.getElementById('profAvatar').textContent = (me.display_name[0] || '✿').toUpperCase();

  // leaves
  const leaves = await db.inbox();
  document.getElementById('leafCount').textContent = leaves.length;

  const stage = stageInfo(leaves.length);
  document.getElementById('stageName').textContent = stage.name;
  document.getElementById('plantStageBanner').textContent = stage.banner;

  drawPlant(leaves);
}

// id chip copy
document.getElementById('profId').addEventListener('click', () => {
  const id = document.getElementById('profId').textContent;
  if (id && id !== '—') {
    navigator.clipboard?.writeText(id);
    toast('id copied ♡', 'pink');
  }
});

// ---------- modals ----------
function openModal(id) {
  document.getElementById('modal-' + id).hidden = false;
  if (id === 'sent') renderSent();
  if (id === 'send') {
    document.getElementById('sendForm').reset();
    document.getElementById('sendError').textContent = '';
    document.getElementById('sendSuccess').textContent = '';
    document.getElementById('sendMsg').placeholder = randomCuteMsg();
  }
}
function closeAllModals() {
  document.querySelectorAll('.modal').forEach(m => m.hidden = true);
}
document.querySelectorAll('[data-open]').forEach(b => {
  b.addEventListener('click', () => openModal(b.dataset.open));
});
document.querySelectorAll('[data-close]').forEach(b => {
  b.addEventListener('click', closeAllModals);
});
document.querySelectorAll('.modal').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) closeAllModals(); });
});

// ---------- send ----------
document.getElementById('sendForm').addEventListener('submit', async e => {
  e.preventDefault();
  const me = await db.currentProfile();
  if (!me) return;

  const to     = document.getElementById('sendTo').value.trim();
  const msgEl  = document.getElementById('sendMsg');
  const msg    = (msgEl.value.trim() || msgEl.placeholder || 'hi ✿').slice(0, 240);
  const anon   = document.getElementById('sendAnon').checked;
  const errEl  = document.getElementById('sendError');
  const okEl   = document.getElementById('sendSuccess');
  errEl.textContent = ''; okEl.textContent = '';

  const submitBtn = e.target.querySelector('button[type=submit]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'sending…';

  try {
    const recipient = await db.findProfile(to);
    if (!recipient) { errEl.textContent = 'no plant found with that id or email ✿'; return; }
    if (recipient.id === me.id) { errEl.textContent = 'you can’t water your own plant ♡'; return; }

    await db.sendMessage({ recipientId: recipient.id, body: msg, anon });

    okEl.textContent = `a new leaf sprouted on ${recipient.display_name}'s plant! 🌱`;
    document.getElementById('sendForm').reset();
    toast('message sent ✿');
  } catch (err) {
    console.error(err);
    errEl.textContent = (err && err.message) || 'something went wrong';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'send & sprout 🌱';
  }
});

// ---------- sent list ----------
async function renderSent() {
  const list = document.getElementById('sentList');
  list.innerHTML = '<li class="empty">loading…</li>';
  const items = await db.sentBox();
  list.innerHTML = '';
  if (!items.length) {
    list.innerHTML = '<li class="empty">no notes sent yet — go plant some kindness ✿</li>';
    return;
  }
  items.forEach(s => {
    const li = document.createElement('li');
    li.className = 'sent-item';
    const date = new Date(s.at).toLocaleString();
    li.innerHTML = `
      <div class="row">
        <div>to <span class="to">${escapeHtml(s.toName)}</span>
          <span class="muted small">(${escapeHtml(s.toId)})</span>
          ${s.anon ? '<span class="anon-tag">sent anonymously</span>' : ''}
        </div>
        <div>${escapeHtml(date)}</div>
      </div>
      <div class="msg">${escapeHtml(s.msg)}</div>
    `;
    list.appendChild(li);
  });
}

// ---------- leaf click ----------
function openLeaf(leaf) {
  document.getElementById('leafFrom').textContent = leaf.anon
    ? 'from someone anonymous ✿'
    : `from ${leaf.fromName || 'a friend'}`;
  document.getElementById('leafDate').textContent = new Date(leaf.at).toLocaleString();
  document.getElementById('leafMsg').textContent  = leaf.msg;
  openModal('leaf');
}

// ---------- util ----------
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// ---------- boot ----------
window.addEventListener('keydown', e => { if (e.key === 'Escape') closeAllModals(); });

(async function boot() {
  if (!ensureConfigured()) return;

  // react to login / logout events from any tab
  db.onAuth((event) => {
    if (event === 'SIGNED_OUT') go('login');
    if (event === 'SIGNED_IN')  go('main');
  });

  const session = await db.session();
  if (session) go('main');
  else         go('login');
})();
