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
const DAY_MS = 24 * 60 * 60 * 1000;
const MESSAGE_CHAR_LIMIT = 240;

function messageCharCount(value) {
  return (value || '').length;
}

function updateSendCharCount() {
  const msgEl = document.getElementById('sendMsg');
  const countEl = document.getElementById('sendCharCount');
  if (!msgEl || !countEl) return;
  const count = messageCharCount(msgEl.value);
  const over = count > MESSAGE_CHAR_LIMIT;
  countEl.textContent = t('send.characters', { count, limit: MESSAGE_CHAR_LIMIT });
  countEl.classList.toggle('over', over);
  msgEl.classList.toggle('over-limit', over);
}

function parsePlantDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date;
}

function formatPlantAge(value) {
  const date = parsePlantDate(value);
  if (!date) return '';
  const ageMs = Date.now() - date.getTime();
  if (ageMs >= 0 && ageMs < 7 * DAY_MS) {
    const days = Math.floor(ageMs / DAY_MS);
    if (days <= 0) return t('plant.age.today');
    if (days === 1) return t('plant.age.dayAgo');
    return t('plant.age.daysAgo', { count: days });
  }
  return date.toLocaleDateString();
}

function formatPlantedLabel(value) {
  const date = parsePlantDate(value);
  if (!date) return '';
  const ageMs = Date.now() - date.getTime();
  if (ageMs >= 0 && ageMs < 7 * DAY_MS) {
    const days = Math.floor(ageMs / DAY_MS);
    if (days <= 0) return t('plant.planted.today');
    if (days === 1) return t('plant.planted.dayAgo');
    return t('plant.planted.daysAgo', { count: days });
  }
  return t('plant.planted.date', { date: date.toLocaleDateString() });
}

// a plant holds at most MAX_LEAVES leaves; the six stages span 0..MAX_LEAVES
const MAX_LEAVES = 12;
const STAGE_STEPS = [
  { key: 'seed', min: 0, max: 0, icon: '🌰' },
  { key: 'sprout', min: 1, max: 2, icon: '🌱' },
  { key: 'sapling', min: 3, max: 4, icon: '🍃' },
  { key: 'bush', min: 5, max: 7, icon: '🌿' },
  { key: 'blooming', min: 8, max: 10, icon: '✿' },
  { key: 'flourishing', min: 11, max: MAX_LEAVES, icon: '❀' },
];

function stageStepFor(count) {
  const safeCount = Math.max(0, Number(count) || 0);
  return STAGE_STEPS.findIndex(step =>
    safeCount >= step.min && (step.max == null || safeCount <= step.max));
}

function stageRangeLabel(step) {
  if (step.min === 0 && step.max === 0) return t('stage.progress.rangeZero');
  if (step.max == null) return t('stage.progress.rangePlus', { min: step.min });
  return t('stage.progress.range', { min: step.min, max: step.max });
}

function stageNameForKey(key) {
  return t(`stage.${key}`);
}

function plantHistoryMeta(plant) {
  const count = plant.final_leaf_count || 0;
  const start = formatPlantAge(plant.created_at);
  const end = formatPlantAge(plant.archived_at);
  if (start && end) return t('plant.history.meta', { count, start, end });
  if (end) return t('plant.history.leaves', { count, date: end });
  return t('plant.history.count', { count });
}

// ---------- theme ----------
const THEME_KEY = 'sprout.theme';
function storedTheme() {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === 'dark' || value === 'light' ? value : null;
  } catch (_) {
    return null;
  }
}
function systemTheme() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function currentTheme() {
  return storedTheme() || document.documentElement.dataset.theme || systemTheme();
}
function updateThemeControls(theme) {
  const isDark = theme === 'dark';
  document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
    btn.setAttribute('aria-pressed', String(isDark));
    btn.setAttribute('aria-label', t('theme.toggle'));
    btn.title = t('theme.toggle');
    const icon = btn.querySelector('.theme-icon');
    if (icon) icon.textContent = isDark ? '☀' : '☾';
  });
  document.querySelectorAll('[data-theme-choice]').forEach(btn => {
    const active = btn.dataset.themeChoice === theme;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
}
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  updateThemeControls(theme);
}
function setTheme(theme) {
  try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
  applyTheme(theme);
}
function initTheme() {
  applyTheme(currentTheme());
  document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
    if (btn.dataset.themeWired) return;
    btn.dataset.themeWired = '1';
    btn.addEventListener('click', () => setTheme(currentTheme() === 'dark' ? 'light' : 'dark'));
  });
  document.querySelectorAll('[data-theme-choice]').forEach(btn => {
    if (btn.dataset.themeWired) return;
    btn.dataset.themeWired = '1';
    btn.addEventListener('click', () => setTheme(btn.dataset.themeChoice === 'dark' ? 'dark' : 'light'));
  });
  if (window.matchMedia) {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemTheme = e => {
      if (!storedTheme()) applyTheme(e.matches ? 'dark' : 'light');
    };
    if (media.addEventListener) media.addEventListener('change', onSystemTheme);
    else if (media.addListener) media.addListener(onSystemTheme);
  }
}

const emailKey = e => e.trim().toLowerCase();
const PROFILE_ICON_CHOICES = [
  '🌸', '🌼', '🌻', '🌷',
  '🌹', '🌺', '🌿', '🌱',
  '🌳', '🌲', '🍀', '✿',
];

function profileInitial(profile) {
  const name = profile && profile.display_name ? profile.display_name.trim() : '';
  return (name[0] || '✿').toUpperCase();
}

function profileIcon(profile) {
  const saved = profile && profile.profile_icon ? profile.profile_icon.trim() : '';
  return saved || profileInitial(profile);
}

function applyProfileIcon(profile) {
  const icon = profileIcon(profile);
  const profAvatar = document.getElementById('profAvatar');
  if (profAvatar) {
    profAvatar.textContent = icon;
    profAvatar.setAttribute('aria-label', t('profile.icon.menu'));
  }
  const navAvatar = document.getElementById('navAvatar');
  if (navAvatar) navAvatar.textContent = icon;
}

// ---------- view routing ----------
const views = {
  login:      document.getElementById('view-login'),
  signup:     document.getElementById('view-signup'),
  onboarding: document.getElementById('view-onboarding'),
  main:       document.getElementById('view-main'),
};
function go(name) {
  Object.entries(views).forEach(([k, el]) => el.hidden = (k !== name));
  // on main the toggle lives inline in the topbar; elsewhere use the fixed one
  const fixedToggle = document.getElementById('langToggleFixed');
  if (fixedToggle) fixedToggle.hidden = (name === 'main');
  const fixedTheme = document.getElementById('themeToggleFixed');
  if (fixedTheme) fixedTheme.hidden = (name === 'main');
  if (name === 'main')       renderMain().catch(err => console.error('renderMain failed:', err));
  if (name === 'signup')     refreshSignupPlaceholder();
  if (name === 'onboarding') renderOnboarding();
}

// route a logged-in user to onboarding only for a genuinely new account:
// the active plant has no chosen species, no leaves yet, AND the user has
// no graduated plants in their history. Anyone who has grown or graduated
// a plant before just renders with the default species.
async function routeAfterAuth() {
  try {
    const plant = await db.currentPlant();
    if (plant && plant.species == null) {
      const me = await db.currentProfile();
      const hasLeaves = me && (me.leaf_count || 0) > 0;
      if (!hasLeaves) {
        const history = await db.plantHistory();
        if (!history.length) { go('onboarding'); return; }
      }
    }
  } catch (err) { console.error(err); }
  go('main');
  consumePendingSend(); // if the user arrived via "send a kind word", open it prefilled
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

// ---------- onboarding (guideline → mystery seed → name) ----------
let onboardSeedSpecies = null;

function showOnboardStep(step) {
  document.querySelectorAll('#view-onboarding .onboard-step').forEach(s => {
    s.hidden = s.dataset.step !== String(step);
  });
}

function buildSeedGrid() {
  const grid = document.getElementById('seedGrid');
  if (!grid) return;
  grid.innerHTML = '';
  // shuffle so a seed's slot doesn't reveal which plant it becomes
  const order = PLANT_SPECIES.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  // six clearly distinct pastels, one per seed slot (not tied to species)
  const tints = ['#ffc9d6', '#ffe0b3', '#fff3a8', '#c8ecc0', '#c5e3f6', '#e2d2f7'];
  order.forEach((speciesIdx, slot) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'seed-card';
    btn.dataset.species = speciesIdx;
    btn.innerHTML = `
      <span class="seed-shape" style="background:${tints[slot % tints.length]}"><i class="seed-dot"></i></span>
      <span class="seed-label">${escapeHtml(t('onboard.seed.item'))}</span>
    `;
    grid.appendChild(btn);
  });
}

function renderOnboarding() {
  onboardSeedSpecies = null;
  showOnboardStep(1);
  document.getElementById('onboardError').textContent = '';
  const nameInput = document.getElementById('onboardName');
  nameInput.value = '';
  nameInput.placeholder = randomCuteName();
  document.getElementById('seedNextBtn').disabled = true;
  buildSeedGrid();
}

document.getElementById('onboardStartBtn').addEventListener('click', () => showOnboardStep(2));

document.getElementById('seedGrid').addEventListener('click', e => {
  const card = e.target.closest('.seed-card');
  if (!card) return;
  document.querySelectorAll('#seedGrid .seed-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  onboardSeedSpecies = Number(card.dataset.species);
  document.getElementById('seedNextBtn').disabled = false;
});

document.getElementById('seedNextBtn').addEventListener('click', () => {
  if (onboardSeedSpecies == null) return;
  showOnboardStep(3);
});

document.getElementById('onboardFinishBtn').addEventListener('click', async () => {
  if (onboardSeedSpecies == null) { showOnboardStep(2); return; }
  const btn = document.getElementById('onboardFinishBtn');
  const errEl = document.getElementById('onboardError');
  errEl.textContent = '';
  const nameInput = document.getElementById('onboardName');
  const name = (nameInput.value.trim() || nameInput.placeholder || '').slice(0, 40);
  btn.disabled = true;
  try {
    const plant = await db.currentPlant();
    if (!plant) throw new Error('no active plant');
    await db.chooseSeed(plant.id, onboardSeedSpecies, name);
    toast(t('signup.welcome', { name }));
    go('main');
    consumePendingSend();
  } catch (err) {
    console.error(err);
    errEl.textContent = t('onboard.fail');
  } finally {
    btn.disabled = false;
  }
});

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

// ---------- auto-fit text ----------
// Shrink font-size until the element's content fits within its container width.
function fitText(el, maxPx, minPx) {
  if (!el) return;
  maxPx = maxPx || 26;
  minPx = minPx || 12;
  let size = maxPx;
  el.style.fontSize = size + 'px';
  // shrink one px at a time until the text stops overflowing its own box
  while (el.scrollWidth > el.clientWidth && size > minPx) {
    size -= 1;
    el.style.fontSize = size + 'px';
  }
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
        routeAfterAuth();
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
    routeAfterAuth();
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
async function handleLogout() {
  await db.signOut();
  closeAllModals();
  document.getElementById('loginForm').reset();
  toast(t('logout.bye'), 'pink');
  go('login');
}
document.querySelectorAll('[data-action="logout"]').forEach(btn => {
  btn.addEventListener('click', handleLogout);
});

// ---------- account deletion ----------
function resetDeleteAccountModal() {
  const input = document.getElementById('deleteAccountConfirm');
  const btn = document.getElementById('deleteAccountBtn');
  const err = document.getElementById('deleteAccountError');
  if (input) input.value = '';
  if (btn) btn.disabled = true;
  if (err) err.textContent = '';
}

const deleteAccountInput = document.getElementById('deleteAccountConfirm');
const deleteAccountBtn = document.getElementById('deleteAccountBtn');
if (deleteAccountInput && deleteAccountBtn) {
  deleteAccountInput.addEventListener('input', () => {
    deleteAccountBtn.disabled = deleteAccountInput.value.trim() !== 'DELETE';
  });
  deleteAccountBtn.addEventListener('click', async () => {
    const err = document.getElementById('deleteAccountError');
    if (deleteAccountInput.value.trim() !== 'DELETE') {
      if (err) err.textContent = t('account.delete.confirmError');
      return;
    }
    deleteAccountBtn.disabled = true;
    if (err) err.textContent = '';
    try {
      await db.deleteAccount();
      closeAllModals();
      document.getElementById('loginForm').reset();
      toast(t('account.delete.success'), 'pink');
      go('login');
    } catch (e) {
      console.error(e);
      if (err) err.textContent = t('account.delete.fail');
      deleteAccountBtn.disabled = false;
    }
  });
}

// ---------- profile dropdown menu ----------
(function wireProfileMenu() {
  const btn = document.getElementById('profileBtn');
  const dd  = document.getElementById('profileDropdown');
  if (!btn || !dd) return;
  const menu = btn.closest('.profile-menu');
  let closeTimer = null;
  const cancelClose = () => {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
  };
  const setOpen = (open) => {
    if (open) cancelClose();
    dd.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer = setTimeout(() => setOpen(false), 260);
  };
  const supportsHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;
  if (supportsHover && menu) {
    menu.addEventListener('mouseenter', () => setOpen(true));
    menu.addEventListener('mouseleave', scheduleClose);
    dd.addEventListener('mouseenter', cancelClose);
    btn.addEventListener('click', e => e.stopPropagation());
  } else {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      setOpen(dd.hidden);
    });
  }
  // selecting a destination closes the menu.
  dd.addEventListener('click', e => {
    if (e.target.closest('[data-menu-keepopen]')) return;
    setOpen(false);
  });
  // click anywhere else closes it
  document.addEventListener('click', e => {
    if (menu && menu.contains(e.target)) return;
    cancelClose();
    setOpen(false);
  });
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      cancelClose();
      setOpen(false);
    }
  });
})();

async function renderProfileIconChoices() {
  const grid = document.getElementById('profileIconGrid');
  const errEl = document.getElementById('profileIconError');
  if (!grid) return;
  if (errEl) errEl.textContent = '';
  grid.innerHTML = '';

  const me = await db.currentProfile();
  if (!me) return;

  const active = (me.profile_icon || '').trim();
  const choices = [
    { icon: profileInitial(me), value: '', label: t('profile.icon.initial') },
    ...PROFILE_ICON_CHOICES.map(icon => ({ icon, value: icon, label: t('profile.icon.choice', { icon }) })),
  ];

  choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'profile-icon-choice';
    btn.dataset.icon = choice.value;
    btn.textContent = choice.icon;
    btn.title = choice.label;
    btn.setAttribute('aria-label', choice.label);
    if (choice.value === active) {
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
    } else {
      btn.setAttribute('aria-pressed', 'false');
    }
    grid.appendChild(btn);
  });
}

async function renderSettings() {
  const nameEl = document.getElementById('settingsName');
  const emailEl = document.getElementById('settingsEmail');
  const avatarEl = document.getElementById('settingsAvatar');
  if (!nameEl || !emailEl || !avatarEl) return;

  try {
    const me = await db.currentProfile();
    if (!me) return;
    nameEl.textContent = me.display_name || t('profile.fallbackName');
    emailEl.textContent = me.email || '—';
    avatarEl.textContent = profileIcon(me);
    enableCopyOnClick(nameEl);
    enableCopyOnClick(emailEl);
  } catch (err) {
    console.error('renderSettings failed:', err);
  }
}

const settingsIconBtn = document.getElementById('settingsIconBtn');
if (settingsIconBtn) {
  settingsIconBtn.addEventListener('click', () => {
    const settingsModal = document.getElementById('modal-settings');
    if (settingsModal) settingsModal.hidden = true;
    openModal('profile-icon');
  });
}

const profAvatarBtn = document.getElementById('profAvatar');
if (profAvatarBtn) {
  profAvatarBtn.addEventListener('click', () => openModal('profile-icon'));
}

const profileIconGrid = document.getElementById('profileIconGrid');
if (profileIconGrid) {
  profileIconGrid.addEventListener('click', async e => {
    const btn = e.target.closest('.profile-icon-choice');
    if (!btn) return;
    const errEl = document.getElementById('profileIconError');
    if (errEl) errEl.textContent = '';
    profileIconGrid.querySelectorAll('button').forEach(choice => { choice.disabled = true; });
    try {
      const profile = await db.updateProfileIcon(btn.dataset.icon || '');
      applyProfileIcon(profile);
      const settingsAvatar = document.getElementById('settingsAvatar');
      if (settingsAvatar) settingsAvatar.textContent = profileIcon(profile);
      document.getElementById('modal-profile-icon').hidden = true;
      toast(t('profile.icon.saved'));
    } catch (err) {
      console.error(err);
      if (errEl) errEl.textContent = t('profile.icon.fail');
    } finally {
      profileIconGrid.querySelectorAll('button').forEach(choice => { choice.disabled = false; });
    }
  });
}

// ---------- main render ----------
let currentLeafTotal = 0;

function renderStageProgress() {
  const list = document.getElementById('stageProgressList');
  const summary = document.getElementById('stageProgressSummary');
  const fill = document.getElementById('stageProgressFill');
  if (!list || !summary || !fill) return;

  const count = Math.max(0, Number(currentLeafTotal) || 0);
  const currentIndex = Math.max(0, stageStepFor(count));
  const currentStep = STAGE_STEPS[currentIndex];
  const currentName = stageNameForKey(currentStep.key);
  const nextStep = STAGE_STEPS[currentIndex + 1];

  if (nextStep) {
    const needed = Math.max(nextStep.min - count, 1);
    summary.textContent = t(needed === 1 ? 'stage.progress.nextOne' : 'stage.progress.nextMany', {
      count,
      stage: currentName,
      needed,
      next: stageNameForKey(nextStep.key),
    });
  } else {
    summary.textContent = t('stage.progress.done', { count, stage: currentName });
  }

  fill.style.width = `${Math.min(100, (Math.min(count, 15) / 15) * 100)}%`;
  list.innerHTML = '';
  STAGE_STEPS.forEach((step, index) => {
    const li = document.createElement('li');
    const isCurrent = index === currentIndex;
    const isDone = index < currentIndex;
    li.className = `stage-progress-step ${isCurrent ? 'current' : isDone ? 'done' : 'future'}`;
    if (isCurrent) li.setAttribute('aria-current', 'step');
    li.innerHTML = `
      <span class="stage-step-icon">${escapeHtml(step.icon)}</span>
      <span class="stage-step-main">
        <span class="stage-step-name">${escapeHtml(stageNameForKey(step.key))}</span>
        <span class="stage-step-desc">${escapeHtml(t(`stage.progress.desc.${step.key}`))}</span>
      </span>
      <span class="stage-step-side">
        <span class="stage-step-range">${escapeHtml(stageRangeLabel(step))}</span>
        <span class="stage-step-status">${escapeHtml(t(isCurrent ? 'stage.progress.current' : isDone ? 'stage.progress.doneStatus' : 'stage.progress.future'))}</span>
      </span>
    `;
    list.appendChild(li);
  });
}

async function renderMain() {
  const me = await db.currentProfile();
  if (!me) { go('login'); return; }

  // profile
  const profNameEl  = document.getElementById('profName');
  const profEmailEl = document.getElementById('profEmail');
  profNameEl.textContent  = me.display_name;
  profEmailEl.textContent = me.email;
  applyProfileIcon(me);
  enableCopyOnClick(profNameEl);
  enableCopyOnClick(profEmailEl);

  // leaves
  const leaves = await db.inbox();
  currentLeafTotal = leaves.length;
  document.getElementById('leafCount').textContent = leaves.length;

  const stage = stageInfo(leaves.length);
  const stageEl = document.getElementById('stageName');
  const leafCountEl = document.getElementById('leafCount');
  stageEl.textContent = stage.name;
  document.getElementById('plantStageBanner').textContent = stage.banner;

  // auto-shrink stat values so long words like "flourishing" still fit fully
  requestAnimationFrame(() => {
    fitText(stageEl, 26, 14);
    fitText(leafCountEl, 26, 14);
  });

  const plant = await db.currentPlant();
  drawPlant(leaves, null, { species: plant ? plant.species : 0 });
  refreshGardenBadge();

  // plant name + graduate button
  const nameEl = document.getElementById('plantName');
  const startDateEl = document.getElementById('plantStartDate');
  const gradBtn = document.getElementById('graduateBtn');
  if (plant) {
    if (plant.name && plant.name.trim()) {
      nameEl.textContent = plant.name;
      nameEl.classList.remove('unnamed');
    } else {
      nameEl.textContent = t('plant.name.fallback');
      nameEl.classList.add('unnamed');
    }
    nameEl.title = t('plant.name.title');
    startDateEl.textContent = formatPlantedLabel(plant.created_at);
  } else {
    startDateEl.textContent = '';
  }
  // graduation unlocks once the plant is full (MAX_LEAVES)
  gradBtn.hidden = leaves.length < MAX_LEAVES;

  // past plants (graduated)
  renderPastPlants().catch(err => console.error('renderPastPlants failed:', err));

  // reflect how many received leaves are still unread (read state is server-side)
  updateLeafBadge(unreadCount(leaves));
  if (!document.getElementById('modal-stage').hidden) renderStageProgress();
}

// click a past plant card → open modal showing that plant with its real messages
document.getElementById('pastPlantsGrid').addEventListener('click', async e => {
  const card = e.target.closest('.past-card');
  if (!card || !card.dataset.plantId) return;
  await openPastPlant(card.dataset.plantId);
});

document.getElementById('removePastPlantBtn').addEventListener('click', async () => {
  if (!currentPastPlant) return;
  const name = (currentPastPlant.name && currentPastPlant.name.trim()) || t('plant.history.unnamed');
  if (!window.confirm(t('plant.delete.confirm', { name }))) return;
  const btn = document.getElementById('removePastPlantBtn');
  btn.disabled = true;
  try {
    await db.deletePlant(currentPastPlant.id);
    toast(t('plant.delete.toast'), 'pink');
    document.getElementById('modal-past-plant').hidden = true;
    currentPastPlant = null;
    renderMain();
  } catch (err) {
    console.error(err);
    toast(t('plant.delete.fail'), 'pink');
  } finally {
    btn.disabled = false;
  }
});

let currentPastPlant = null;

async function openPastPlant(plantId) {
  const history = await db.plantHistory();
  const plant = history.find(p => p.id === plantId);
  if (!plant) return;
  currentPastPlant = plant;

  const nameEl = document.getElementById('pastPlantName');
  const metaEl = document.getElementById('pastPlantMeta');
  const svg    = document.getElementById('pastPlantSvg');
  const named  = !!(plant.name && plant.name.trim());

  nameEl.textContent = named ? plant.name : t('plant.history.unnamed');
  nameEl.classList.toggle('unnamed', !named);
  metaEl.textContent = plantHistoryMeta(plant);
  svg.innerHTML = '';

  openModal('past-plant');

  // fetch the real leaves for this archived plant
  const leaves = await db.plantInbox(plantId);
  drawPlant(leaves, svg, { interactive: true, species: plant.species });
}

async function renderPastPlants() {
  const section = document.getElementById('pastPlantsSection');
  const grid    = document.getElementById('pastPlantsGrid');
  const history = await db.plantHistory();
  if (!history.length) {
    section.hidden = true;
    grid.innerHTML = '';
    return;
  }
  section.hidden = false;
  grid.innerHTML = '';
  history.forEach(p => {
    const card = document.createElement('div');
    card.className = 'past-card';
    card.dataset.plantId = p.id;
    const name = (p.name && p.name.trim()) || t('plant.history.unnamed');
    const count = p.final_leaf_count || 0;
    const meta = plantHistoryMeta(p);
    card.innerHTML = `
      <div class="mini-plant">
        <svg viewBox="0 0 400 520" preserveAspectRatio="xMidYMax meet"></svg>
        <div class="ground"></div>
        <div class="pot-base"></div>
      </div>
      <div class="past-name">${escapeHtml(name)}</div>
      <div class="past-meta">${escapeHtml(meta)}</div>
    `;
    grid.appendChild(card);
    const svg = card.querySelector('svg');
    const dummyLeaves = Array.from({ length: count }, () => ({
      msg: '', anon: false, fromName: name, fromId: '', at: 0,
    }));
    drawPlant(dummyLeaves, svg, { interactive: false, species: p.species });
  });
}

// ---------- plant name + graduate ----------
document.getElementById('plantName').addEventListener('click', async () => {
  const plant = await db.currentPlant();
  if (!plant) return;
  const suggested = (plant.name || '').trim();
  const next = window.prompt(t('plant.rename.prompt'), suggested);
  if (next === null) return; // cancelled
  const trimmed = next.trim().slice(0, 40);
  try {
    await db.renamePlant(trimmed);
    toast(t('plant.rename.toast'));
    renderMain();
  } catch (err) {
    console.error(err);
    toast(t('plant.rename.fail'), 'pink');
  }
});

// build a shareable link for a plant and hand it to the OS share sheet
// (KakaoTalk / WhatsApp / etc.), falling back to copying the link.
async function sharePlant(plantId, plantName) {
  if (!plantId) return;
  try {
    const shareId = await db.enablePlantShare(plantId);
    const url = `${location.origin}/p/${shareId}`;
    // Keep the share body URL-only. Some share targets concatenate `url` and
    // `text` without whitespace, which can turn /<uuid> + a plant name into
    // a broken link like /<uuid>Second.
    const shareData = {
      title: t('share.title'),
      url,
    };
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(url);
      toast(t('share.copied'));
    }
  } catch (err) {
    if (err && err.name === 'AbortError') return; // user dismissed the sheet
    console.error(err);
    // last-ditch: try clipboard then report
    try {
      const shareId = await db.enablePlantShare(plantId);
      await navigator.clipboard.writeText(`${location.origin}/p/${shareId}`);
      toast(t('share.copied'));
    } catch (e) {
      toast(t('share.fail'), 'pink');
    }
  }
}

document.getElementById('sharePlantBtn').addEventListener('click', async () => {
  const plant = await db.currentPlant();
  if (!plant) return;
  sharePlant(plant.id, plant.name);
});

document.getElementById('sharePastPlantBtn').addEventListener('click', () => {
  if (currentPastPlant) sharePlant(currentPastPlant.id, currentPastPlant.name);
});

document.getElementById('deleteCurrentBtn').addEventListener('click', async () => {
  const plant = await db.currentPlant();
  if (!plant) return;
  const name = (plant.name && plant.name.trim()) || t('plant.history.unnamed');
  if (!window.confirm(t('plant.delete.confirm', { name }))) return;
  const btn = document.getElementById('deleteCurrentBtn');
  btn.disabled = true;
  try {
    await db.deletePlant(plant.id);
    toast(t('plant.delete.toast'), 'pink');
    // a fresh seed was planted (species null) → pick a new one
    routeAfterAuth();
  } catch (err) {
    console.error(err);
    toast(t('plant.delete.fail'), 'pink');
  } finally {
    btn.disabled = false;
  }
});

document.getElementById('graduateBtn').addEventListener('click', async () => {
  if (!window.confirm(t('plant.graduate.confirm'))) return;
  const btn = document.getElementById('graduateBtn');
  btn.disabled = true;
  try {
    await db.graduatePlant();
    toast(t('plant.graduate.toast'));
    renderMain();
  } catch (err) {
    console.error(err);
    toast(t('plant.graduate.fail'), 'pink');
  } finally {
    btn.disabled = false;
  }
});

// ---------- modals ----------
function openModal(id, preset) {
  document.getElementById('modal-' + id).hidden = false;
  if (id === 'sent')   renderSent();
  if (id === 'garden') renderGarden();
  if (id === 'stage')  renderStageProgress();
  if (id === 'settings') renderSettings();
  if (id === 'profile-icon') renderProfileIconChoices().catch(err => console.error('renderProfileIconChoices failed:', err));
  if (id === 'delete-account') resetDeleteAccountModal();
  if (id === 'send') {
    document.getElementById('sendForm').reset();
    document.getElementById('sendError').textContent = '';
    document.getElementById('sendSuccess').textContent = '';
    document.getElementById('sendMsg').placeholder = randomCuteMsg();
    updateSendCharCount();
    document.getElementById('sendToDropdown').hidden = true;
    if (preset && preset.to) {
      document.getElementById('sendTo').value = preset.to;
    }
    loadSendNeighbors(); // populate the to-field dropdown
  }
}

// ---------- neighbor picker in the send modal ----------
let sendNeighbors = [];

async function loadSendNeighbors() {
  try {
    sendNeighbors = await db.myFriends();
  } catch (err) {
    console.error(err);
    sendNeighbors = [];
  }
}

function renderNeighborDropdown(filter) {
  const dd = document.getElementById('sendToDropdown');
  const q = (filter || '').trim().toLowerCase();
  const matches = sendNeighbors.filter(n => n.name && n.name.toLowerCase().includes(q));
  if (!matches.length) { dd.hidden = true; dd.innerHTML = ''; return; }
  dd.innerHTML = '';
  matches.forEach(n => {
    const li = document.createElement('li');
    li.className = 'neighbor-item';
    li.dataset.name = n.name;
    const icon = profileIcon({ display_name: n.name, profile_icon: n.profileIcon });
    li.innerHTML = `
      <span class="ni-avatar">${escapeHtml(icon)}</span>
      <span class="ni-name">${escapeHtml(n.name)}</span>
      <span class="ni-leaves">${n.leafCount} 🍃</span>
    `;
    dd.appendChild(li);
  });
  dd.hidden = false;
}

(function wireNeighborPicker() {
  const input = document.getElementById('sendTo');
  const dd    = document.getElementById('sendToDropdown');
  if (!input || !dd) return;
  input.addEventListener('focus', () => renderNeighborDropdown(input.value));
  input.addEventListener('input', () => renderNeighborDropdown(input.value));
  input.addEventListener('blur', () => {
    setTimeout(() => { dd.hidden = true; }, 150); // let item mousedown land first
  });
  // mousedown (not click) so it fires before the input's blur hides the list
  dd.addEventListener('mousedown', e => {
    const item = e.target.closest('.neighbor-item');
    if (!item) return;
    e.preventDefault();
    input.value = item.dataset.name;
    dd.hidden = true;
    document.getElementById('sendMsg').focus();
  });
})();

document.getElementById('sendMsg').addEventListener('input', updateSendCharCount);

function closeAllModals() {
  document.querySelectorAll('.modal').forEach(m => m.hidden = true);
}
document.querySelectorAll('[data-open]').forEach(b => {
  b.addEventListener('click', () => {
    const settingsModal = b.closest('#modal-settings');
    if (settingsModal) settingsModal.hidden = true;
    openModal(b.dataset.open);
  });
});
document.querySelectorAll('[data-close]').forEach(b => {
  b.addEventListener('click', () => {
    const modal = b.closest('.modal');
    if (modal) modal.hidden = true;
    else closeAllModals();
  });
});
document.querySelectorAll('.modal').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.hidden = true; });
});

// ---------- send ----------
document.getElementById('sendForm').addEventListener('submit', async e => {
  e.preventDefault();
  const to     = document.getElementById('sendTo').value.trim();
  const msgEl  = document.getElementById('sendMsg');
  const msg    = msgEl.value.trim() || msgEl.placeholder || t('send.fallback');
  const anon   = document.getElementById('sendAnon').checked;
  const errEl  = document.getElementById('sendError');
  const okEl   = document.getElementById('sendSuccess');
  errEl.textContent = ''; okEl.textContent = '';
  updateSendCharCount();
  const charCount = messageCharCount(msgEl.value);
  if (charCount > MESSAGE_CHAR_LIMIT) {
    errEl.textContent = t('send.error.charLimit', {
      count: charCount,
      limit: MESSAGE_CHAR_LIMIT,
    });
    msgEl.focus();
    return;
  }

  const me = await db.currentProfile();
  if (!me) return;

  const submitBtn = e.target.querySelector('button[type=submit]');
  submitBtn.disabled = true;
  submitBtn.textContent = t('send.submitting');

  try {
    const recipient = await db.findProfile(to);
    if (!recipient) { errEl.textContent = t('send.error.notfound'); return; }
    if (recipient.id === me.id) { errEl.textContent = t('send.error.self'); return; }

    await db.sendMessage({ recipientId: recipient.id, body: msg, anon });

    okEl.textContent = t('send.success', { name: recipient.display_name });
    // keep the recipient (and anon choice) so you can send several notes
    // to the same person; just clear the message and refresh the suggestion
    msgEl.value = '';
    msgEl.placeholder = randomCuteMsg();
    updateSendCharCount();
    msgEl.focus();
    toast(t('send.toast'));
  } catch (err) {
    console.error(err);
    // the DB caps each plant at MAX_LEAVES and raises PLANT_FULL past it
    if (err && /PLANT_FULL/.test(err.message || '')) {
      errEl.textContent = t('send.error.full', { limit: MAX_LEAVES });
    } else {
      errEl.textContent = (err && err.message) || t('common.error.generic');
    }
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
      const icon = profileIcon({ display_name: r.fromName, profile_icon: r.fromProfileIcon });
      li.innerHTML = `
        <div class="ri-avatar">${escapeHtml(icon)}</div>
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
      const icon = profileIcon({ display_name: f.name, profile_icon: f.profileIcon });
      const plantName = (f.plantName && f.plantName.trim()) || t('plant.history.unnamed');
      const card = document.createElement('div');
      card.className = 'friend-card';
      card.innerHTML = `
        <button class="remove-friend" title="${escapeHtml(t('garden.removeTitle'))}" data-row="${escapeHtml(f.rowId)}">✕</button>
        <div class="mini-plant">
          <svg viewBox="0 0 400 520" preserveAspectRatio="xMidYMax meet"></svg>
          <div class="ground"></div>
          <div class="pot-base"></div>
        </div>
        <div class="f-plant-name">${escapeHtml(plantName)}</div>
        <div class="friend-person">
          <span class="f-avatar">${escapeHtml(icon)}</span>
          <span class="f-name">${escapeHtml(f.name)}</span>
        </div>
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
      drawPlant(dummyLeaves, svg, { interactive: false, species: f.species });
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

  // reading a leaf marks the message read server-side (only matters for the
  // logged-in app, not the public shared view). The RPC is a no-op unless the
  // current user is that message's recipient, so it's safe to call eagerly.
  if (leaf && leaf.id && !leaf.read && document.getElementById('view-shared').hidden) {
    leaf.read = true; // optimistic: stop counting it as unread right away
    db.markMessageRead(leaf.id)
      .then(() => { if (leafPollTimer) refreshUnread(); })
      .catch(() => {});
  }

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
window.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  // close just the topmost visible modal so closing a leaf reveals
  // the past-plant modal beneath, etc.
  const visible = Array.from(document.querySelectorAll('.modal:not([hidden])'));
  if (visible.length) visible[visible.length - 1].hidden = true;
});

// ---------- public shared plant view ----------
let sharedData = null;

async function showSharedPlant(shareId) {
  // hide the normal views, reveal the public read-only view
  Object.values(views).forEach(el => { el.hidden = true; });
  document.getElementById('view-shared').hidden = false;
  const fixedToggle = document.getElementById('langToggleFixed');
  if (fixedToggle) fixedToggle.hidden = false; // let guests switch language
  const fixedTheme = document.getElementById('themeToggleFixed');
  if (fixedTheme) fixedTheme.hidden = false;
  sharedData = await db.getSharedPlant(shareId);
  renderSharedPlant();
}

function sharedMessages(data) {
  const value = data && data.messages;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }
  return [];
}

function sharedLeafCount(data, messages) {
  const count = Number(data && data.leaf_count);
  if (Number.isFinite(count) && count > 0) return Math.floor(count);
  return messages.length;
}

function placeholderLeaves(count) {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    id: null,
    msg: '',
    anon: true,
    fromName: null,
    fromProfileId: null,
    at: now - (count - i) * 1000,
  }));
}

function renderSharedPlant() {
  const data    = sharedData;
  const nameEl  = document.getElementById('sharedPlantName');
  const subEl   = document.getElementById('sharedSubtitle');
  const metaEl  = document.getElementById('sharedPlantMeta');
  const svg     = document.getElementById('sharedPlantSvg');
  const sendBtn = document.getElementById('sharedSendBtn');
  svg.innerHTML = '';

  if (!data) {
    nameEl.textContent = '🥀';
    nameEl.classList.add('unnamed');
    subEl.textContent = t('shared.notfound');
    metaEl.textContent = '';
    if (sendBtn) sendBtn.hidden = true;
    return;
  }

  const named = !!(data.name && data.name.trim());
  nameEl.textContent = named ? data.name : t('plant.history.unnamed');
  nameEl.classList.toggle('unnamed', !named);
  subEl.textContent  = t('shared.subtitle', { name: data.owner_name || '✿' });
  metaEl.textContent = t('shared.meta', { count: data.leaf_count || 0 });

  // "send a kind word to <owner>" — personalize if we know the owner's name
  if (sendBtn) {
    if (data.owner_name) {
      sendBtn.hidden = false;
      sendBtn.textContent = t('shared.sendNamed', { name: data.owner_name });
    } else {
      sendBtn.hidden = true;
    }
  }

  const messages = sharedMessages(data);
  const leaves = messages.map(m => ({
    id: m.id,
    msg: m.body,
    anon: m.anon,
    fromName: m.anon ? null : m.from_name,
    fromProfileId: null, // no invite affordance in the public view
    at: new Date(m.created_at).getTime(),
  }));
  const leafCount = sharedLeafCount(data, messages);
  // Some deployed RPC versions expose only leaf_count. Still draw the grown
  // plant so shared links do not collapse to the seed/empty-pot state.
  const visibleLeaves = leaves.length ? leaves : placeholderLeaves(leafCount);
  drawPlant(visibleLeaves, svg, { interactive: leaves.length > 0, species: data.species });
}

// "send a kind word to this user" from a shared plant page.
// Guests aren't logged in here (and the shared-link boot path never wires the
// auth router), so we stash the intended recipient and reload to the clean app
// root: boot() then runs normally, lands on login/signup, and consumePendingSend
// opens the send modal prefilled once the user reaches their garden.
const PENDING_SEND_KEY = 'sprout:pendingSendTo';

document.getElementById('sharedSendBtn').addEventListener('click', () => {
  const to = sharedData && sharedData.owner_name;
  if (!to) return;
  try { sessionStorage.setItem(PENDING_SEND_KEY, to); } catch (_) {}
  location.href = '/'; // leave the ?share URL → fresh boot wires auth + routing
});

function consumePendingSend() {
  let to;
  try { to = sessionStorage.getItem(PENDING_SEND_KEY); } catch (_) { to = null; }
  if (!to) return;
  try { sessionStorage.removeItem(PENDING_SEND_KEY); } catch (_) {}
  openModal('send', { to });
}

// ---------- unread-leaf notifications ----------
// A "leaf" is an incoming message on the active plant. "Unread" = a received
// message whose read_at is still null in the database; it's only cleared when
// the user actually opens that leaf to read it (see openLeaf -> markMessageRead).
// Because read state lives server-side, every message you haven't checked stays
// unread across reloads, devices, and offline periods. The leaf-stat badge shows
// the running unread count; a toast announces unread on (re)connect and new
// arrivals while the tab is open.
const LEAF_POLL_MS = 30000;
let leafPollTimer = null;
let lastUnread = -1; // -1 = haven't checked yet this session

function unreadCount(leaves) {
  return (leaves || []).filter(l => !l.read).length;
}

function updateLeafBadge(count) {
  const badge = document.getElementById('leafBadge');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : String(count);
    badge.hidden = false;
  } else {
    badge.textContent = '';
    badge.hidden = true;
  }
}

// Reflect the unread count on the badge and toast when there's something new to
// flag: on the first check of a session (offline catch-up) or when the count
// grows (a message just arrived).
function applyUnread(leaves) {
  const unread = unreadCount(leaves);
  if (lastUnread === -1) {
    if (unread > 0) {
      toast(unread === 1
        ? t('notify.unread.one')
        : t('notify.unread.many', { count: unread }));
    }
  } else if (unread > lastUnread) {
    const delta = unread - lastUnread;
    toast(delta === 1
      ? t('notify.newLeaf.one')
      : t('notify.newLeaf.many', { count: delta }));
  }
  lastUnread = unread;
  updateLeafBadge(unread);
}

async function refreshUnread() {
  let me;
  try { me = await db.currentProfile(); } catch (_) { return; }
  if (!me) return;
  let leaves;
  try { leaves = await db.inbox(); } catch (_) { return; }
  const before = lastUnread;
  applyUnread(leaves);
  // a new leaf arrived while the user is watching → redraw so it actually shows
  if (before !== -1 && lastUnread > before &&
      !views.main.hidden && document.visibilityState === 'visible') {
    renderMain().catch(err => console.error('renderMain failed:', err));
  }
}

function startLeafNotifications() {
  stopLeafNotifications();
  lastUnread = -1;       // next refresh treats existing unread as a catch-up toast
  refreshUnread();
  leafPollTimer = setInterval(refreshUnread, LEAF_POLL_MS);
}
function stopLeafNotifications() {
  if (leafPollTimer) { clearInterval(leafPollTimer); leafPollTimer = null; }
  lastUnread = -1;
  updateLeafBadge(0);
}

// regaining focus is a good moment to check immediately rather than wait out the timer
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && leafPollTimer) refreshUnread();
});

(async function boot() {
  if (!ensureConfigured()) return;
  initTheme();

  // i18n: apply persisted language, then re-render dynamic content on change
  if (window.i18n) {
    window.i18n.init();
    updateThemeControls(currentTheme());
    window.i18n.on(() => {
      updateThemeControls(currentTheme());
      if (!document.getElementById('view-shared').hidden) renderSharedPlant();
      if (!views.onboarding.hidden) {
        document.querySelectorAll('#seedGrid .seed-label').forEach(l => { l.textContent = t('onboard.seed.item'); });
      }
      if (!views.main.hidden) {
        renderMain().catch(err => console.error(err));
      }
      if (!document.getElementById('modal-sent').hidden)   renderSent();
      if (!document.getElementById('modal-garden').hidden) renderGarden();
      if (!document.getElementById('modal-stage').hidden)  renderStageProgress();
      if (!document.getElementById('modal-profile-icon').hidden) {
        renderProfileIconChoices().catch(err => console.error(err));
      }
      if (!document.getElementById('modal-settings').hidden) {
        renderSettings().catch(err => console.error(err));
      }
      // re-pick random cute message placeholder if the send modal is open
      if (!document.getElementById('modal-send').hidden) {
        document.getElementById('sendMsg').placeholder = randomCuteMsg();
        updateSendCharCount();
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

  // shared plant link? show the public read-only view and stop here.
  // canonical form is /p/<id>; ?share=<id> is still honored for older links.
  const pathMatch = location.pathname.match(/^\/p\/([^/?#]+)/);
  const shareId = (pathMatch && pathMatch[1]) ||
    new URLSearchParams(location.search).get('share');
  if (shareId) {
    await showSharedPlant(shareId);
    return;
  }

  // react to login / logout events from any tab
  db.onAuth((event) => {
    if (event === 'SIGNED_OUT') { stopLeafNotifications(); go('login'); }
    if (event === 'SIGNED_IN')  { routeAfterAuth(); startLeafNotifications(); }
  });

  const session = await db.session();
  if (session) { routeAfterAuth(); startLeafNotifications(); }
  else         go('login');
})();
