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
const cap  = s => s[0].toUpperCase() + s.slice(1);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

function randomCuteName() { return `${pick(CUTE_ADJ)}${cap(pick(CUTE_NOUN))}`; }
function randomCuteMsg()  { return window.i18n ? window.i18n.randomMsg() : pick(['you make the world brighter ✿']); }
const t  = (k, vars) => (window.i18n ? window.i18n.t(k, vars) : k);

const emailKey = e => e.trim().toLowerCase();

// ---------- view routing ----------
const views = {
  login:  document.getElementById('view-login'),
  signup: document.getElementById('view-signup'),
  main:   document.getElementById('view-main'),
};
function go(name) {
  Object.entries(views).forEach(([k, el]) => el.hidden = (k !== name));
  if (name === 'main')   renderMain().catch(err => console.error('renderMain failed:', err));
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

// ---------- click-to-copy ----------
function enableCopyOnClick(el) {
  if (!el) return;
  el.classList.add('copyable');
  el.title = t('copy.title');
  if (el.dataset.copyWired) return;
  el.dataset.copyWired = '1';
  el.addEventListener('click', async () => {
    const text = el.textContent.trim();
    if (!text || text === '—') return;
    try {
      await navigator.clipboard.writeText(text);
      toast(t('copy.success'));
    } catch (err) {
      console.error(err);
      toast(t('copy.fail'), 'pink');
    }
  });
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
    errEl.textContent = t('signup.error.shortpass');
    return;
  }

  const submitBtn = e.target.querySelector('button[type=submit]');
  submitBtn.disabled = true;
  submitBtn.textContent = t('signup.submitting');

  try {
    if (await db.nicknameTaken(name)) {
      errEl.textContent = t('signup.error.nickname');
      return;
    }

    // try up to 3 times in case sprout_id collides
    let lastErr;
    for (let attempt = 0; attempt < 3; attempt++) {
      const sproutId = makeId();
      try {
        const { session } = await db.signUp({ email, password: pass, displayName: name, sproutId });
        if (!session) {
          // email confirmation required
          toast(t('signup.confirm.email'), 'pink');
          go('login');
          return;
        }
        toast(t('signup.welcome', { name }));
        go('main');
        return;
      } catch (err) {
        lastErr = err;
        const msg = (err && err.message) || '';
        // collision on unique sprout_id → retry; nickname or other duplicate → bail
        if (/display_name_lower/i.test(msg)) break;
        if (!/duplicate|unique/i.test(msg)) break;
      }
    }
    throw lastErr;
  } catch (err) {
    console.error(err);
    const msg = (err && err.message) || t('common.error');
    if (/display_name_lower/i.test(msg)) {
      errEl.textContent = t('signup.error.nickname');
    } else if (/already.*registered/i.test(msg) || /already.*exists/i.test(msg)) {
      errEl.textContent = t('signup.error.email');
    } else {
      errEl.textContent = msg;
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = t('signup.submit');
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
  submitBtn.textContent = t('login.submitting');

  try {
    await db.signIn({ email, password: pass });
    const me = await db.currentProfile();
    if (!me) {
      await db.signOut();
      errEl.textContent = t('login.error.noprofile');
      return;
    }
    toast(t('login.welcome', { name: me.display_name }));
    go('main');
  } catch (err) {
    console.error(err);
    const msg = (err && err.message) || '';
    if (/invalid.*credentials/i.test(msg)) {
      errEl.textContent = t('login.error.creds');
    } else if (/confirm/i.test(msg)) {
      errEl.textContent = t('login.error.confirm');
    } else {
      errEl.textContent = msg || t('common.error.generic');
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = t('login.submit');
  }
});

// ---------- logout ----------
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await db.signOut();
  document.getElementById('loginForm').reset();
  toast(t('logout.bye'), 'pink');
  go('login');
});

// ---------- main render ----------
async function renderMain() {
  const me = await db.currentProfile();
  if (!me) { go('login'); return; }

  // profile
  const profNameEl  = document.getElementById('profName');
  const profEmailEl = document.getElementById('profEmail');
  profNameEl.textContent  = me.display_name;
  profEmailEl.textContent = me.email;
  document.getElementById('profAvatar').textContent = (me.display_name[0] || '✿').toUpperCase();
  enableCopyOnClick(profNameEl);
  enableCopyOnClick(profEmailEl);

  // leaves
  const leaves = await db.inbox();
  document.getElementById('leafCount').textContent = leaves.length;

  const stage = stageInfo(leaves.length);
  document.getElementById('stageName').textContent = stage.name;
  document.getElementById('plantStageBanner').textContent = stage.banner;

  drawPlant(leaves);
  refreshGardenBadge();
}

// ---------- modals ----------
function openModal(id, preset) {
  document.getElementById('modal-' + id).hidden = false;
  if (id === 'sent')   renderSent();
  if (id === 'garden') renderGarden();
  if (id === 'send') {
    document.getElementById('sendForm').reset();
    document.getElementById('sendError').textContent = '';
    document.getElementById('sendSuccess').textContent = '';
    document.getElementById('sendMsg').placeholder = randomCuteMsg();
    if (preset && preset.to) {
      document.getElementById('sendTo').value = preset.to;
    }
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
  const msg    = (msgEl.value.trim() || msgEl.placeholder || t('send.fallback')).slice(0, 240);
  const anon   = document.getElementById('sendAnon').checked;
  const errEl  = document.getElementById('sendError');
  const okEl   = document.getElementById('sendSuccess');
  errEl.textContent = ''; okEl.textContent = '';

  const submitBtn = e.target.querySelector('button[type=submit]');
  submitBtn.disabled = true;
  submitBtn.textContent = t('send.submitting');

  try {
    const recipient = await db.findProfile(to);
    if (!recipient) { errEl.textContent = t('send.error.notfound'); return; }
    if (recipient.id === me.id) { errEl.textContent = t('send.error.self'); return; }

    await db.sendMessage({ recipientId: recipient.id, body: msg, anon });

    okEl.textContent = t('send.success', { name: recipient.display_name });
    document.getElementById('sendForm').reset();
    toast(t('send.toast'));
  } catch (err) {
    console.error(err);
    errEl.textContent = (err && err.message) || t('common.error.generic');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = t('send.submit');
  }
});

// ---------- sent list ----------
async function renderSent() {
  const list = document.getElementById('sentList');
  list.innerHTML = `<li class="empty">${escapeHtml(t('sent.loading'))}</li>`;
  const items = await db.sentBox();
  list.innerHTML = '';
  if (!items.length) {
    list.innerHTML = `<li class="empty">${escapeHtml(t('sent.empty'))}</li>`;
    return;
  }
  items.forEach(s => {
    const li = document.createElement('li');
    li.className = 'sent-item';
    const date = new Date(s.at).toLocaleString();
    const toName = s.toName === '(deleted user)' ? t('sent.deleted') : s.toName;
    li.innerHTML = `
      <div class="row">
        <div>${escapeHtml(t('sent.to'))}<span class="to">${escapeHtml(toName)}</span>
          <span class="muted small">(${escapeHtml(s.toId)})</span>
          ${s.anon ? `<span class="anon-tag">${escapeHtml(t('sent.anonTag'))}</span>` : ''}
        </div>
        <div>${escapeHtml(date)}</div>
      </div>
      <div class="msg">${escapeHtml(s.msg)}</div>
    `;
    list.appendChild(li);
  });
}

// ---------- neighbors (friend list) ----------
async function renderGarden() {
  document.getElementById('friendError').textContent = '';
  document.getElementById('friendSuccess').textContent = '';

  const grid = document.getElementById('friendGrid');
  const reqSection = document.getElementById('requestsSection');
  const reqList    = document.getElementById('requestList');
  const reqBadge   = document.getElementById('requestsBadge');
  const outSection = document.getElementById('outgoingSection');
  const outList    = document.getElementById('outgoingList');

  grid.innerHTML = `<div class="friend-empty">${escapeHtml(t('garden.loading'))}</div>`;
  reqList.innerHTML = '';
  outList.innerHTML = '';

  const [friends, incoming, outgoing] = await Promise.all([
    db.myFriends(),
    db.incomingRequests(),
    db.outgoingRequests(),
  ]);

  // incoming
  if (incoming.length) {
    reqSection.hidden = false;
    reqBadge.textContent = incoming.length;
    incoming.forEach(r => {
      const li = document.createElement('li');
      li.className = 'request-item';
      const initial = (r.fromName[0] || '✿').toUpperCase();
      li.innerHTML = `
        <div class="ri-avatar">${escapeHtml(initial)}</div>
        <div class="ri-info">
          <div class="ri-name">${escapeHtml(r.fromName)}</div>
          <div class="ri-id">${r.fromLeafCount} 🍃</div>
          ${r.message ? `<div class="ri-msg">"${escapeHtml(r.message)}"</div>` : ''}
        </div>
        <div class="ri-actions">
          <button class="btn-mini accept"  data-accept="${escapeHtml(r.id)}">${escapeHtml(t('garden.accept'))}</button>
          <button class="btn-mini decline" data-decline="${escapeHtml(r.id)}">${escapeHtml(t('garden.decline'))}</button>
        </div>
      `;
      reqList.appendChild(li);
    });
  } else {
    reqSection.hidden = true;
  }

  // outgoing
  if (outgoing.length) {
    outSection.hidden = false;
    outgoing.forEach(o => {
      const li = document.createElement('li');
      li.className = 'outgoing-item';
      li.innerHTML = `
        <span class="oi-name">${escapeHtml(o.toName)}</span>
        <button class="oi-cancel" title="cancel" data-cancel="${escapeHtml(o.id)}">✕</button>
      `;
      outList.appendChild(li);
    });
  } else {
    outSection.hidden = true;
  }

  // friends grid
  grid.innerHTML = '';
  if (!friends.length) {
    grid.innerHTML = `<div class="friend-empty">${escapeHtml(t('garden.empty'))}</div>`;
  } else {
    friends.forEach(f => {
      const stage = stageInfo(f.leafCount);
      const card = document.createElement('div');
      card.className = 'friend-card';
      card.innerHTML = `
        <button class="remove-friend" title="${escapeHtml(t('garden.removeTitle'))}" data-row="${escapeHtml(f.rowId)}">✕</button>
        <div class="mini-plant">
          <svg viewBox="0 0 400 520" preserveAspectRatio="xMidYMax meet"></svg>
          <div class="ground"></div>
          <div class="pot-base"></div>
        </div>
        <div class="f-name">${escapeHtml(f.name)}</div>
        <div class="f-stat">${f.leafCount} 🍃 · ${escapeHtml(stage.name)}</div>
        <div>
          <button class="f-send" data-name="${escapeHtml(f.name)}">${escapeHtml(t('garden.send'))}</button>
        </div>
      `;
      grid.appendChild(card);

      const svg = card.querySelector('svg');
      const dummyLeaves = Array.from({ length: f.leafCount }, () => ({
        msg: '', anon: false, fromName: f.name, fromId: f.sproutId, at: 0,
      }));
      drawPlant(dummyLeaves, svg, { interactive: false });
    });
  }

  // also refresh the nav badge
  updateGardenBadge(incoming.length);
}

function updateGardenBadge(count) {
  const btns = document.querySelectorAll('.navbtn[data-open="garden"]');
  btns.forEach(b => {
    const existing = b.querySelector('.nav-badge');
    if (count > 0) {
      if (existing) existing.textContent = count;
      else b.insertAdjacentHTML('beforeend', ` <span class="nav-badge">${count}</span>`);
    } else if (existing) {
      existing.remove();
    }
  });
}

async function refreshGardenBadge() {
  try {
    const incoming = await db.incomingRequests();
    updateGardenBadge(incoming.length);
  } catch (err) { console.error(err); }
}

document.getElementById('addFriendForm').addEventListener('submit', async e => {
  e.preventDefault();
  const input = document.getElementById('addFriendInput');
  const ident = input.value.trim();
  const errEl = document.getElementById('friendError');
  const okEl  = document.getElementById('friendSuccess');
  errEl.textContent = ''; okEl.textContent = '';
  if (!ident) return;

  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true; btn.textContent = t('garden.invite.sending');
  try {
    const { target, autoAccepted } = await db.sendFriendRequest(ident);
    if (autoAccepted) {
      okEl.textContent = t('garden.inviteAuto', { name: target.display_name });
    } else {
      okEl.textContent = t('garden.inviteSent', { name: target.display_name });
    }
    input.value = '';
    renderGarden();
  } catch (err) {
    console.error(err);
    errEl.textContent = (err && err.message) || t('common.error.generic');
  } finally {
    btn.disabled = false; btn.textContent = t('garden.invite.submit');
  }
});

document.getElementById('friendGrid').addEventListener('click', async e => {
  const sendBtn = e.target.closest('.f-send');
  if (sendBtn) {
    const name = sendBtn.dataset.name;
    closeAllModals();
    openModal('send', { to: name });
    return;
  }
  const removeBtn = e.target.closest('.remove-friend');
  if (removeBtn) {
    const rowId = removeBtn.dataset.row;
    if (!confirm(t('garden.removeConfirm'))) return;
    try {
      await db.removeFriend(rowId);
      toast(t('garden.removedToast'), 'pink');
      renderGarden();
    } catch (err) {
      console.error(err);
      toast(t('garden.removeFail'), 'pink');
    }
  }
});

document.getElementById('requestList').addEventListener('click', async e => {
  const accept = e.target.closest('[data-accept]');
  if (accept) {
    try {
      await db.acceptRequest(accept.dataset.accept);
      toast(t('garden.acceptToast'));
      renderGarden();
      renderMain();
    } catch (err) { console.error(err); toast(t('garden.acceptFail'), 'pink'); }
    return;
  }
  const decline = e.target.closest('[data-decline]');
  if (decline) {
    try {
      await db.declineRequest(decline.dataset.decline);
      toast(t('garden.declineToast'), 'pink');
      renderGarden();
    } catch (err) { console.error(err); toast(t('garden.declineFail'), 'pink'); }
  }
});

document.getElementById('outgoingList').addEventListener('click', async e => {
  const cancel = e.target.closest('[data-cancel]');
  if (!cancel) return;
  try {
    await db.cancelOutgoingRequest(cancel.dataset.cancel);
    toast(t('garden.cancelToast'), 'pink');
    renderGarden();
  } catch (err) { console.error(err); toast(t('garden.cancelFail'), 'pink'); }
});

// ---------- leaf click ----------
let currentLeaf = null;

async function openLeaf(leaf) {
  currentLeaf = leaf;
  document.getElementById('leafFrom').textContent = leaf.anon
    ? t('leaf.from.anon')
    : t('leaf.from.named', { name: leaf.fromName || t('leaf.from.friend') });
  document.getElementById('leafDate').textContent = new Date(leaf.at).toLocaleString();
  document.getElementById('leafMsg').textContent  = leaf.msg;

  const photo   = document.getElementById('leafSenderPhoto');
  const initial = document.getElementById('leafSenderInitial');
  const row     = document.getElementById('leafInviteRow');
  const btn     = document.getElementById('leafInviteBtn');

  if (leaf.anon || !leaf.fromProfileId) {
    photo.classList.add('anon');
    photo.disabled = true;
    initial.textContent = '🍃';
    row.hidden = true;
  } else {
    photo.classList.remove('anon');
    photo.disabled = false;
    initial.textContent = (leaf.fromName[0] || '✿').toUpperCase();
    row.hidden = false;
    btn.disabled = true;
    btn.textContent = t('leaf.invite.checking');

    openModal('leaf');

    // determine current relationship and set button state
    try {
      const rel = await db.relationshipTo(leaf.fromProfileId);
      applyInviteBtnState(rel);
    } catch (err) {
      console.error(err);
      applyInviteBtnState('none');
    }
    return;
  }

  openModal('leaf');
}

function applyInviteBtnState(rel) {
  const btn = document.getElementById('leafInviteBtn');
  btn.dataset.rel = rel;
  switch (rel) {
    case 'friend':
      btn.textContent = t('leaf.invite.friend');
      btn.disabled = true;
      break;
    case 'request_sent':
      btn.textContent = t('leaf.invite.pending');
      btn.disabled = true;
      break;
    case 'request_received':
      btn.textContent = t('leaf.invite.accept');
      btn.disabled = false;
      break;
    case 'self':
      btn.textContent = t('leaf.invite.self');
      btn.disabled = true;
      break;
    default:
      btn.textContent = t('leaf.invite.default');
      btn.disabled = false;
  }
}

document.getElementById('leafInviteBtn').addEventListener('click', async () => {
  if (!currentLeaf || currentLeaf.anon) return;
  const btn = document.getElementById('leafInviteBtn');
  const rel = btn.dataset.rel;
  btn.disabled = true;
  const original = btn.textContent;
  btn.textContent = t('leaf.invite.sending');

  try {
    if (rel === 'request_received') {
      // accept the incoming request
      const incoming = await db.incomingRequests();
      const match = incoming.find(r => r.fromId === currentLeaf.fromProfileId);
      if (match) {
        await db.acceptRequest(match.id);
        toast(t('leaf.joinedToast', { name: currentLeaf.fromName }));
        applyInviteBtnState('friend');
      } else {
        applyInviteBtnState('none');
      }
    } else {
      const { autoAccepted, target } = await db.sendFriendRequest(currentLeaf.fromProfileId);
      if (autoAccepted) {
        toast(t('leaf.joinedToast', { name: target.display_name }));
        applyInviteBtnState('friend');
      } else {
        toast(t('leaf.sentToast'));
        applyInviteBtnState('request_sent');
      }
    }
    refreshGardenBadge();
  } catch (err) {
    console.error(err);
    toast((err && err.message) || t('leaf.sendFail'), 'pink');
    btn.disabled = false;
    btn.textContent = original;
  }
});

document.getElementById('leafSenderPhoto').addEventListener('click', () => {
  // tapping the photo triggers the invite button
  const btn = document.getElementById('leafInviteBtn');
  if (!btn.disabled) btn.click();
});

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

  // i18n: apply persisted language, then re-render dynamic content on change
  if (window.i18n) {
    window.i18n.init();
    window.i18n.on(() => {
      if (!views.main.hidden) {
        renderMain().catch(err => console.error(err));
      }
      if (!document.getElementById('modal-sent').hidden)   renderSent();
      if (!document.getElementById('modal-garden').hidden) renderGarden();
      // re-pick random cute message placeholder if the send modal is open
      if (!document.getElementById('modal-send').hidden) {
        document.getElementById('sendMsg').placeholder = randomCuteMsg();
      }
      // refresh leaf modal button state if open
      if (!document.getElementById('modal-leaf').hidden && currentLeaf) {
        const btn = document.getElementById('leafInviteBtn');
        if (btn.dataset.rel) applyInviteBtnState(btn.dataset.rel);
        document.getElementById('leafFrom').textContent = currentLeaf.anon
          ? t('leaf.from.anon')
          : t('leaf.from.named', { name: currentLeaf.fromName || t('leaf.from.friend') });
      }
    });
  }

  // react to login / logout events from any tab
  db.onAuth((event) => {
    if (event === 'SIGNED_OUT') go('login');
    if (event === 'SIGNED_IN')  go('main');
  });

  const session = await db.session();
  if (session) go('main');
  else         go('login');
})();
