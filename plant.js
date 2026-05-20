/* ============================================================
   Sprout ✿ — plant rendering (shared by main app & preview)
   ============================================================ */

function stageInfo(n) {
  if (n === 0)  return { name: 'seed',     banner: 'a tiny seed sleeps 💤  send yourself some friends and watch it grow ✿' };
  if (n <= 2)   return { name: 'sprout',   banner: 'a sprout pokes through the soil 🌱' };
  if (n <= 5)   return { name: 'sapling',  banner: 'leaves unfurl, one for each kind word 🍃' };
  if (n <= 9)   return { name: 'bush',     banner: 'your plant is thriving ♡' };
  if (n <= 14)  return { name: 'blooming', banner: 'tiny flowers begin to bloom ✿' };
  return        { name: 'flourishing', banner: 'a whole garden of love grows here ❀✿❀' };
}

function svgEl(tag, attrs = {}, parent) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(el);
  return el;
}

function drawPlant(leaves, svg, opts) {
  svg = svg || document.getElementById('plantSvg');
  if (!svg) return;
  opts = opts || {};
  const interactive = opts.interactive !== false;
  svg.innerHTML = '';

  // defs: gradients
  const defs = svgEl('defs', {}, svg);
  defs.innerHTML = `
    <linearGradient id="stemGrad" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#3b8c58"/>
      <stop offset="1" stop-color="#8fd3a0"/>
    </linearGradient>
    <radialGradient id="leafGrad" cx="0.35" cy="0.35" r="0.7">
      <stop offset="0"   stop-color="#d8f0d8"/>
      <stop offset="0.6" stop-color="#8fd3a0"/>
      <stop offset="1"   stop-color="#5ab97a"/>
    </radialGradient>
    <radialGradient id="leafPink" cx="0.35" cy="0.35" r="0.7">
      <stop offset="0"   stop-color="#ffe3ec"/>
      <stop offset="0.6" stop-color="#ffb5c9"/>
      <stop offset="1"   stop-color="#ff8fae"/>
    </radialGradient>
    <radialGradient id="flowerGrad" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0"   stop-color="#fff5f8"/>
      <stop offset="0.5" stop-color="#ffd1dc"/>
      <stop offset="1"   stop-color="#ff8fae"/>
    </radialGradient>
  `;

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
  svgEl('path', {
    d: stemPath,
    stroke: 'url(#stemGrad)',
    'stroke-width': 8,
    'stroke-linecap': 'round',
    fill: 'none',
  }, swayGroup);

  for (let i = 0; i < 3; i++) {
    const x = 200 + (i - 1) * 22;
    svgEl('path', {
      d: `M ${x} ${groundY} q -3 -10 0 -18 q 3 -8 6 0 q -2 10 -2 18`,
      fill: '#8fd3a0', opacity: 0.7
    }, swayGroup);
  }

  const yStart = stemTopY + 20;
  const yEnd   = groundY - 50;

  leaves.forEach((leaf, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const y = yStart + (yEnd - yStart) * t;
    const side = i % 2 === 0 ? -1 : 1;
    const wobble = Math.sin(i * 1.7) * 6;
    const x = 200 + side * 22 + wobble;

    const isFlower = (n >= 10) && (i % 4 === 3);

    if (isFlower) {
      drawFlower(swayGroup, x, y, side, leaf, i === n - 1, interactive);
    } else {
      drawLeaf(swayGroup, x, y, side, leaf, i === n - 1, i, interactive);
    }
  });

  if (n >= 6) {
    drawTopBud(swayGroup, 200, stemTopY, n >= 10);
  }
}

function drawLeaf(parent, x, y, side, leaf, animate, idx, interactive) {
  const g = svgEl('g', {
    class: 'leaf' + (animate ? ' grow-in' : '') + (interactive === false ? ' static' : ''),
    transform: `translate(${x}, ${y}) rotate(${side * 35})`,
  }, parent);

  const usePink = idx % 5 === 4;
  svgEl('path', {
    d: 'M 0 0 Q 30 -22 60 0 Q 30 22 0 0 Z',
    fill: usePink ? 'url(#leafPink)' : 'url(#leafGrad)',
    stroke: usePink ? '#d96a8a' : '#3b8c58',
    'stroke-width': 1.4,
    'stroke-linejoin': 'round',
  }, g);
  svgEl('path', {
    d: 'M 2 0 Q 30 -2 58 0',
    stroke: usePink ? '#ff8fae' : '#5ab97a',
    'stroke-width': 1,
    fill: 'none',
    opacity: 0.7,
  }, g);
  svgEl('circle', {
    cx: 30, cy: 0, r: 2.6,
    fill: 'white', opacity: 0.7,
  }, g);

  if (interactive !== false && typeof openLeaf === 'function') {
    g.addEventListener('click', () => openLeaf(leaf));
  }
  g.setAttribute('aria-label', leaf.anon ? 'message from someone anonymous' : `message from ${leaf.fromName}`);
}

function drawFlower(parent, x, y, side, leaf, animate, interactive) {
  const g = svgEl('g', {
    class: 'flower' + (animate ? ' grow-in' : '') + (interactive === false ? ' static' : ''),
    transform: `translate(${x}, ${y})`,
  }, parent);

  for (let p = 0; p < 5; p++) {
    const angle = (p / 5) * 360;
    svgEl('ellipse', {
      cx: 0, cy: -12, rx: 8, ry: 12,
      fill: 'url(#flowerGrad)',
      stroke: '#d96a8a',
      'stroke-width': 1,
      transform: `rotate(${angle})`,
    }, g);
  }
  svgEl('circle', { cx: 0, cy: 0, r: 5, fill: '#ffe27a', stroke: '#e8a93b', 'stroke-width': 1 }, g);

  if (interactive !== false && typeof openLeaf === 'function') {
    g.addEventListener('click', () => openLeaf(leaf));
  }
}

function drawTopBud(parent, x, y, fullFlower) {
  if (fullFlower) {
    const g = svgEl('g', { transform: `translate(${x}, ${y - 4})` }, parent);
    for (let p = 0; p < 6; p++) {
      svgEl('ellipse', {
        cx: 0, cy: -14, rx: 9, ry: 14,
        fill: 'url(#flowerGrad)',
        stroke: '#d96a8a',
        'stroke-width': 1,
        transform: `rotate(${p * 60})`,
      }, g);
    }
    svgEl('circle', { cx: 0, cy: 0, r: 6, fill: '#ffe27a', stroke: '#e8a93b', 'stroke-width': 1 }, g);
  } else {
    const g = svgEl('g', { transform: `translate(${x}, ${y})` }, parent);
    svgEl('ellipse', { cx: 0, cy: -8, rx: 7, ry: 12, fill: '#ffb5c9', stroke: '#d96a8a', 'stroke-width': 1 }, g);
    svgEl('path', { d: 'M -8 0 Q 0 -8 8 0', stroke: '#3b8c58', 'stroke-width': 2, fill: 'none' }, g);
  }
}
