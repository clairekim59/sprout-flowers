/* ============================================================
   Sprout ✿ — plant rendering (shared by main app & preview)
   Six species: each chosen seed grows into a different plant.
   ============================================================ */

// species index 0..5 — chosen from a "mystery seed" at signup
const PLANT_SPECIES = [
  { // 0 — fern: soft green rounded leaves, pink daisies
    key: 'fern',
    stem: ['#3b8c58', '#8fd3a0'], sprout: '#8fd3a0',
    leaf: { kind: 'oval',   a: '#d8f0d8', b: '#8fd3a0', c: '#5ab97a', stroke: '#3b8c58', vein: '#5ab97a' },
    accent: { a: '#ffe3ec', b: '#ffb5c9', c: '#ff8fae', stroke: '#d96a8a', vein: '#ff8fae' },
    flower: { kind: 'daisy', petal: ['#fff5f8', '#ffd1dc', '#ff8fae'], center: '#ffe27a', centerStroke: '#e8a93b', stroke: '#d96a8a' },
    bloomFrom: 10,
  },
  { // 1 — rose: serrated leaves, layered roses
    key: 'rose',
    stem: ['#6b8e3b', '#a7c957'], sprout: '#a7c957',
    leaf: { kind: 'serr',   a: '#e7f0cf', b: '#9bbf57', c: '#5f7d2e', stroke: '#4f6b2a', vein: '#7d9c45' },
    accent: { a: '#ffe3ec', b: '#ff9dba', c: '#e23e6b', stroke: '#b32a52', vein: '#e23e6b' },
    flower: { kind: 'rose',  petal: ['#ffe3ec', '#ff9dba', '#e23e6b'], center: '#e23e6b', centerStroke: '#b32a52', stroke: '#b32a52' },
    bloomFrom: 8,
  },
  { // 2 — sunflower: broad leaves, big sunny blooms
    key: 'sunny',
    stem: ['#5a7a2a', '#9bbf4a'], sprout: '#9bbf4a',
    leaf: { kind: 'broad',  a: '#e3f0c4', b: '#8fb84a', c: '#5a7a2a', stroke: '#4a6622', vein: '#74933a' },
    accent: { a: '#fff0c4', b: '#ffd24a', c: '#f59000', stroke: '#c87600', vein: '#f0b000' },
    flower: { kind: 'sun',   petal: ['#ffe88a', '#ffc24a', '#f59000'], center: '#7a4f24', centerStroke: '#5a3a1a', stroke: '#e09000' },
    bloomFrom: 9,
  },
  { // 3 — lavender: slender needle leaves, purple spikes
    key: 'lavender',
    stem: ['#6f8a5c', '#aebf9a'], sprout: '#aebf9a',
    leaf: { kind: 'needle', a: '#eef2e6', b: '#bcc9a6', c: '#8a9c74', stroke: '#74855e', vein: '#9cab84' },
    accent: { a: '#efe6ff', b: '#c4a6ff', c: '#9b6fff', stroke: '#7c4dff', vein: '#b388ff' },
    flower: { kind: 'spike', petal: ['#e6d6ff', '#b388ff', '#7c4dff'], center: '#7c4dff', centerStroke: '#5e35d0', stroke: '#7c4dff' },
    bloomFrom: 6,
  },
  { // 4 — cactus: round pads, bright pops
    key: 'cactus',
    stem: ['#2f7d5e', '#6dbf9a'], sprout: '#6dbf9a',
    leaf: { kind: 'pad',    a: '#d6f0e2', b: '#6dbf9a', c: '#2f7d5e', stroke: '#246b50', vein: '#3f9a73' },
    accent: { a: '#fff0f5', b: '#ffb5c9', c: '#ff6fae', stroke: '#e23e8b', vein: '#ff6fae' },
    flower: { kind: 'pop',   petal: ['#fff0f5', '#ffb5c9', '#ff6fae'], center: '#ffe27a', centerStroke: '#e8a93b', stroke: '#e23e8b' },
    bloomFrom: 8,
  },
  { // 5 — cherry blossom: tiny leaves, sakura on a branch
    key: 'blossom',
    stem: ['#9a6b4a', '#c9a07a'], sprout: '#a7c957',
    leaf: { kind: 'tiny',   a: '#e7f0cf', b: '#9bbf57', c: '#5f7d2e', stroke: '#4f6b2a', vein: '#7d9c45' },
    accent: { a: '#fff0f6', b: '#ffd1e3', c: '#ff9ec7', stroke: '#e26ba0', vein: '#ff9ec7' },
    flower: { kind: 'sakura', petal: ['#fff0f6', '#ffd1e3', '#ff9ec7'], center: '#ffe27a', centerStroke: '#e8a93b', stroke: '#e26ba0' },
    bloomFrom: 5,
  },
];

function speciesAt(i) {
  return PLANT_SPECIES[(i != null && i >= 0 && i < PLANT_SPECIES.length) ? i : 0];
}

function stageInfo(n) {
  const t = (k) => (window.i18n ? window.i18n.t(k) : k);
  if (n === 0)  return { name: t('stage.seed'),       banner: t('stage.banner.seed') };
  if (n <= 2)   return { name: t('stage.sprout'),     banner: t('stage.banner.sprout') };
  if (n <= 5)   return { name: t('stage.sapling'),    banner: t('stage.banner.sapling') };
  if (n <= 9)   return { name: t('stage.bush'),       banner: t('stage.banner.bush') };
  if (n <= 14)  return { name: t('stage.blooming'),   banner: t('stage.banner.blooming') };
  return        { name: t('stage.flourishing'), banner: t('stage.banner.flourishing') };
}

function svgEl(tag, attrs = {}, parent) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(el);
  return el;
}

let _plantUID = 0;

function gradientDefs(uid, sp) {
  return `
    <linearGradient id="${uid}stem" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="${sp.stem[0]}"/>
      <stop offset="1" stop-color="${sp.stem[1]}"/>
    </linearGradient>
    <radialGradient id="${uid}leaf" cx="0.35" cy="0.35" r="0.75">
      <stop offset="0"   stop-color="${sp.leaf.a}"/>
      <stop offset="0.6" stop-color="${sp.leaf.b}"/>
      <stop offset="1"   stop-color="${sp.leaf.c}"/>
    </radialGradient>
    <radialGradient id="${uid}accent" cx="0.35" cy="0.35" r="0.75">
      <stop offset="0"   stop-color="${sp.accent.a}"/>
      <stop offset="0.6" stop-color="${sp.accent.b}"/>
      <stop offset="1"   stop-color="${sp.accent.c}"/>
    </radialGradient>
    <radialGradient id="${uid}flower" cx="0.5" cy="0.4" r="0.6">
      <stop offset="0"   stop-color="${sp.flower.petal[0]}"/>
      <stop offset="0.5" stop-color="${sp.flower.petal[1]}"/>
      <stop offset="1"   stop-color="${sp.flower.petal[2]}"/>
    </radialGradient>
  `;
}

function drawPlant(leaves, svg, opts) {
  svg = svg || document.getElementById('plantSvg');
  if (!svg) return;
  opts = opts || {};
  const interactive = opts.interactive !== false;
  const sp = speciesAt(opts.species);
  const uid = 'p' + (++_plantUID) + '_';
  svg.innerHTML = '';

  const defs = svgEl('defs', {}, svg);
  defs.innerHTML = gradientDefs(uid, sp);

  const n = leaves.length;
  const groundY = 470;

  if (n === 0) {
    const seed = svgEl('g', { class: 'sway' }, svg);
    svgEl('ellipse', {
      cx: 200, cy: groundY - 6, rx: 22, ry: 14,
      fill: '#a87454', stroke: '#7a4f36', 'stroke-width': 2
    }, seed);
    svgEl('path', {
      d: 'M 188 460 Q 200 452 212 460',
      stroke: '#7a4f36', 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round'
    }, seed);
    svgEl('circle', { cx: 192, cy: 463, r: 1.6, fill: '#5a3d2a' }, seed);
    svgEl('circle', { cx: 208, cy: 463, r: 1.6, fill: '#5a3d2a' }, seed);
    return;
  }

  const stemTopY = Math.max(80, groundY - 40 - n * 28);
  const swayGroup = svgEl('g', { class: 'sway' }, svg);

  const stemPath = `M 200 ${groundY}
    C 210 ${groundY - 60}, 188 ${groundY - 130}, 204 ${groundY - 200}
    S 192 ${groundY - 300}, 200 ${stemTopY}`;
  const stemEl = svgEl('path', {
    d: stemPath,
    stroke: `url(#${uid}stem)`,
    'stroke-width': 8,
    'stroke-linecap': 'round',
    fill: 'none',
  }, swayGroup);

  for (let i = 0; i < 3; i++) {
    const x = 200 + (i - 1) * 22;
    svgEl('path', {
      d: `M ${x} ${groundY} q -3 -10 0 -18 q 3 -8 6 0 q -2 10 -2 18`,
      fill: sp.sprout, opacity: 0.7
    }, swayGroup);
  }

  // newest first: index 0 sits at the top of the stem, last at the base.
  const ordered = leaves.slice().reverse();
  const stemLen = stemEl.getTotalLength();

  ordered.forEach((leaf, i) => {
    const tParam = (i + 1) / (n + 1);
    const dist = stemLen * (1 - tParam);
    const pt = stemEl.getPointAtLength(dist);
    const side = i % 2 === 0 ? -1 : 1;
    const x = pt.x + side * 22;
    const y = pt.y;

    // newest growth at the top blooms into this species' flower
    const isFlower = (n >= sp.bloomFrom) && (i < Math.floor(n / 4) + 1);

    if (isFlower) {
      drawFlower(swayGroup, x, y, side, leaf, i === 0, interactive, sp, uid);
    } else {
      drawLeaf(swayGroup, x, y, side, leaf, i === 0, i, interactive, sp, uid);
    }
  });

  if (n >= 6) drawTopBud(swayGroup, 200, stemTopY, n >= sp.bloomFrom, sp, uid);
}

// ---------- leaves (species-aware shapes) ----------
function drawLeaf(parent, x, y, side, leaf, animate, idx, interactive, sp, uid) {
  sp = sp || PLANT_SPECIES[0];
  const pos = svgEl('g', { transform: `translate(${x}, ${y}) rotate(${side * 35})` }, parent);
  const g = svgEl('g', {
    class: 'leaf' + (animate ? ' grow-in' : '') + (interactive === false ? ' static' : ''),
  }, pos);

  const accent = idx % 5 === 4; // occasional accent-colored leaf
  const fill   = `url(#${uid}${accent ? 'accent' : 'leaf'})`;
  const stroke = accent ? sp.accent.stroke : sp.leaf.stroke;
  const vein   = accent ? sp.accent.vein   : sp.leaf.vein;

  const shapes = {
    oval:   'M 0 0 Q 30 -22 60 0 Q 30 22 0 0 Z',
    serr:   'M 0 0 Q 14 -16 22 -8 Q 26 -16 34 -8 Q 40 -16 48 -6 Q 56 -10 60 0 Q 30 20 0 0 Z',
    broad:  'M 0 0 Q 34 -32 64 -6 Q 66 2 60 6 Q 32 26 0 0 Z',
    needle: 'M 0 0 Q 26 -6 54 0 Q 26 6 0 0 Z',
    tiny:   'M 0 0 Q 14 -11 30 0 Q 14 11 0 0 Z',
  };

  if (sp.leaf.kind === 'pad') {
    // cactus pad: upright rounded segment with spike dots
    svgEl('ellipse', {
      cx: 26, cy: 0, rx: 26, ry: 15,
      fill, stroke, 'stroke-width': 1.6, 'stroke-linejoin': 'round',
    }, g);
    for (let s = 0; s < 5; s++) {
      svgEl('circle', { cx: 10 + s * 8, cy: (s % 2 ? -6 : 6), r: 1.3, fill: stroke, opacity: 0.6 }, g);
    }
  } else {
    const d = shapes[sp.leaf.kind] || shapes.oval;
    svgEl('path', { d, fill, stroke, 'stroke-width': 1.4, 'stroke-linejoin': 'round' }, g);
    const veinLen = sp.leaf.kind === 'needle' ? 50 : (sp.leaf.kind === 'tiny' ? 28 : 58);
    svgEl('path', {
      d: `M 2 0 Q ${veinLen / 2} -2 ${veinLen} 0`,
      stroke: vein, 'stroke-width': 1, fill: 'none', opacity: 0.7,
    }, g);
    svgEl('circle', { cx: Math.min(30, veinLen / 2), cy: 0, r: 2.4, fill: 'white', opacity: 0.6 }, g);
  }

  if (interactive !== false && typeof openLeaf === 'function') {
    g.addEventListener('click', () => openLeaf(leaf));
  }
  const t = (k, vars) => (window.i18n ? window.i18n.t(k, vars) : k);
  g.setAttribute('aria-label', leaf.anon ? t('leaf.from.anon') : t('leaf.from.named', { name: leaf.fromName }));
}

// ---------- flowers (species-aware shapes) ----------
function drawFlower(parent, x, y, side, leaf, animate, interactive, sp, uid) {
  sp = sp || PLANT_SPECIES[0];
  const pos = svgEl('g', { transform: `translate(${x}, ${y})` }, parent);
  const g = svgEl('g', {
    class: 'flower' + (animate ? ' grow-in' : '') + (interactive === false ? ' static' : ''),
  }, pos);

  const fl = sp.flower;
  const petalFill = `url(#${uid}flower)`;

  switch (fl.kind) {
    case 'rose': {
      svgEl('circle', { cx: 0, cy: 0, r: 13, fill: fl.petal[0], stroke: fl.stroke, 'stroke-width': 1 }, g);
      svgEl('circle', { cx: 0, cy: 0, r: 9,  fill: fl.petal[1], stroke: fl.stroke, 'stroke-width': 0.8 }, g);
      svgEl('circle', { cx: 0, cy: 0, r: 5,  fill: fl.petal[2] }, g);
      svgEl('path', { d: 'M -4 -2 Q 0 -6 4 -2 Q 0 2 -4 -2 Z', fill: fl.center, opacity: 0.8 }, g);
      break;
    }
    case 'sun': {
      for (let p = 0; p < 12; p++) {
        svgEl('ellipse', {
          cx: 0, cy: -14, rx: 4.5, ry: 11,
          fill: petalFill, stroke: fl.stroke, 'stroke-width': 0.6,
          transform: `rotate(${p * 30})`,
        }, g);
      }
      svgEl('circle', { cx: 0, cy: 0, r: 8, fill: fl.center, stroke: fl.centerStroke, 'stroke-width': 1 }, g);
      break;
    }
    case 'spike': {
      for (let r = 0; r < 6; r++) {
        const yy = -r * 7;
        const rad = 5 - r * 0.5;
        svgEl('circle', { cx: -3, cy: yy, r: rad, fill: fl.petal[1] }, g);
        svgEl('circle', { cx: 3,  cy: yy - 3, r: rad, fill: fl.petal[2] }, g);
      }
      break;
    }
    case 'pop': {
      for (let p = 0; p < 6; p++) {
        svgEl('ellipse', {
          cx: 0, cy: -9, rx: 5, ry: 9,
          fill: petalFill, stroke: fl.stroke, 'stroke-width': 0.8,
          transform: `rotate(${p * 60})`,
        }, g);
      }
      svgEl('circle', { cx: 0, cy: 0, r: 4, fill: fl.center, stroke: fl.centerStroke, 'stroke-width': 1 }, g);
      break;
    }
    case 'sakura': {
      for (let p = 0; p < 5; p++) {
        // notched petal (heart-dent at the tip)
        svgEl('path', {
          d: 'M 0 0 Q -7 -12 -3 -17 Q 0 -14 3 -17 Q 7 -12 0 0 Z',
          fill: petalFill, stroke: fl.stroke, 'stroke-width': 0.8,
          transform: `rotate(${p * 72})`,
        }, g);
      }
      svgEl('circle', { cx: 0, cy: 0, r: 3.2, fill: fl.center, stroke: fl.centerStroke, 'stroke-width': 0.8 }, g);
      break;
    }
    default: { // daisy
      for (let p = 0; p < 5; p++) {
        svgEl('ellipse', {
          cx: 0, cy: -12, rx: 8, ry: 12,
          fill: petalFill, stroke: fl.stroke, 'stroke-width': 1,
          transform: `rotate(${(p / 5) * 360})`,
        }, g);
      }
      svgEl('circle', { cx: 0, cy: 0, r: 5, fill: fl.center, stroke: fl.centerStroke, 'stroke-width': 1 }, g);
    }
  }

  if (interactive !== false && typeof openLeaf === 'function') {
    g.addEventListener('click', () => openLeaf(leaf));
  }
}

function drawTopBud(parent, x, y, fullFlower, sp, uid) {
  sp = sp || PLANT_SPECIES[0];
  const fl = sp.flower;
  if (fullFlower) {
    // crown the plant with one of its blooms
    drawFlower(parent, x, y - 6, -1, { anon: true, msg: '' }, false, false, sp, uid);
  } else {
    const g = svgEl('g', { transform: `translate(${x}, ${y})` }, parent);
    svgEl('ellipse', { cx: 0, cy: -8, rx: 7, ry: 12, fill: fl.petal[1], stroke: fl.stroke, 'stroke-width': 1 }, g);
    svgEl('path', { d: 'M -8 0 Q 0 -8 8 0', stroke: sp.stem[0], 'stroke-width': 2, fill: 'none' }, g);
  }
}
