(() => {
  'use strict';

  const CF = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/';
  const SRC = {
    dunes:   [CF + 'hf_20261124_025933_fa37857a-0e54-406c-ae1a-9983cf44beaa.png', 2048],
    flowers: [CF + 'hf_20261124_025937_de627bd0-51ca-4cd2-bb18-42078b8b6ae8.png', 2048],
    ingr:    [CF + 'hf_20261124_030133_951f1e52-743a-4384-8e3b-b48d09875864.png', 2048],
    tins:    [CF + 'hf_20261124_030106_c6bd583e-b8e6-415e-97de-f03e46986ba5.png', 2048],
    funnel:  [CF + 'hf_20261124_025837_8a2d9b71-23b2-4369-b282-6a9fc7da56df.png', 1440]
  };
  const proxy = (url, w) =>
    'https://images.higgs.ai/?default=1&output=webp&url=' + encodeURIComponent(url) + '&w=' + w + '&q=85';

  const SHEET = { ingr: [2048, 1152], tins: [2048, 2048] };

  const SPR = {
    i_tea:    ['ingr', 57, 144, 437, 343],
    i_card:   ['ingr', 563, 158, 420, 290],
    i_cassia: ['ingr', 1054, 173, 435, 275],
    i_peel:   ['ingr', 1561, 187, 410, 295],
    i_rose:   ['ingr', 61, 655, 409, 346],
    i_amber:  ['ingr', 616, 650, 338, 323],
    drop:     ['ingr', 1151, 633, 219, 355],
    tin_l:    ['tins', 64, 252, 582, 463],
    tin_m:    ['tins', 734, 252, 582, 463],
    tin_r:    ['tins', 1403, 251, 580, 463],
    lid_l:    ['tins', 188, 902, 334, 329],
    lid_m:    ['tins', 855, 903, 333, 328],
    lid_r:    ['tins', 1528, 903, 333, 328],
    p_m:      ['tins', 87, 1556, 537, 280],
    p_l:      ['tins', 1449, 1355, 502, 480],
    p_r:      ['tins', 1449, 1355, 502, 480]
  };
  const FUN_BOX = [622, 184, 1636, 2578];
  const FL_BOX = { l: [0, 314, 579, 838], r: [1431, 363, 617, 789] };
  const HILL_FRAC = 413 / 1152;

  const ASP = {};
  for (const k in SPR) ASP[k] = SPR[k][4] / SPR[k][3];
  ASP.funnel = FUN_BOX[3] / FUN_BOX[2];

  const IDS = ['rose', 'tea', 'peel', 'cassia', 'amber', 'card'];
  const SPRITES = Object.keys(SPR).concat('funnel');

  const $ = (id) => document.getElementById(id);
  const EL = {};
  SPRITES.forEach((id) => { EL[id] = $(id); });
  ['bgField', 'bgProd', 'headline', 'blends', 'mark', 'dunes', 'fl_l', 'fl_r'].forEach((id) => { EL[id] = $(id); });
  IDS.forEach((id) => { EL['t_' + id] = $('t_' + id); });

  const nav = $('nav'), track = $('track');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  for (const id in SPR) {
    const [sh, x, y, w, h] = SPR[id], [W, H] = SHEET[sh], s = EL[id].style;
    s.backgroundSize = (W / w * 100) + '% ' + (H / h * 100) + '%';
    s.backgroundPosition = (x / (W - w) * 100) + '% ' + (y / (H - h) * 100) + '%';
  }

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;

  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const X = (t) => ((ax * t + bx) * t + cx) * t;
    const Y = (t) => ((ay * t + by) * t + cy) * t;
    const dX = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) {
        const e = X(t) - x;
        if (Math.abs(e) < 1e-7) return Y(t);
        const d = dX(t);
        if (Math.abs(d) < 1e-6) break;
        t -= e / d;
      }
      let lo = 0, hi = 1; t = x;
      for (let i = 0; i < 40; i++) {
        const v = X(t);
        if (Math.abs(v - x) < 1e-7) break;
        if (v < x) lo = t; else hi = t;
        t = (lo + hi) / 2;
      }
      return Y(t);
    };
  }
  const easeOut = bezier(0, 0, 0.58, 1);

  function tryLoad(src, cors) {
    return new Promise((resolve) => {
      const im = new Image();
      if (cors) im.crossOrigin = 'anonymous';
      im.decoding = 'async';
      im.onload = () => resolve(im);
      im.onerror = () => resolve(null);
      im.src = src;
    });
  }

  async function loadAsset(key) {
    const [url, w] = SRC[key];
    const tries = [[proxy(url, w), true], [url, true], [url, false]];
    for (const [src, cors] of tries) {
      const im = await tryLoad(src, cors);
      if (im && im.naturalWidth) return { im, url: src };
    }
    console.warn('[emberleaf] could not load asset:', key);
    return null;
  }

  function readable(im) {
    const c = document.createElement('canvas');
    c.width = im.naturalWidth; c.height = im.naturalHeight;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(im, 0, 0);
    return [c, g];
  }

  function whiteKey(im) {
    const [c, g] = readable(im);
    try {
      const d = g.getImageData(0, 0, c.width, c.height), p = d.data;
      for (let i = 0; i < p.length; i += 4) {
        const r = p[i], gg = p[i + 1], b = p[i + 2];
        const m = Math.max(255 - r, 255 - gg, 255 - b);
        let a = (m - 14) / 46;
        a = a < 0 ? 0 : a > 1 ? 1 : a;
        if (a > 0 && a < 1) {
          p[i] = 255 - (255 - r) / a;
          p[i + 1] = 255 - (255 - gg) / a;
          p[i + 2] = 255 - (255 - b) / a;
        }
        p[i + 3] = Math.round(a * p[i + 3]);
      }
      g.putImageData(d, 0, 0);
    } catch (e) {}
    return c;
  }

  function drawFunnel(im, cv) {
    const k = im.naturalWidth / 2880;
    const [bx, by, bw, bh] = FUN_BOX.map((v) => Math.round(v * k));
    const [, tg] = readable(im);
    cv.width = bw; cv.height = bh;
    const g = cv.getContext('2d');
    try {
      const pd = tg.getImageData(4, 4, 24, 24).data;
      let R = 0, G = 0, B = 0;
      for (let i = 0; i < pd.length; i += 4) { R += pd[i]; G += pd[i + 1]; B += pd[i + 2]; }
      const n = pd.length / 4; R /= n; G /= n; B /= n;
      const d = tg.getImageData(bx, by, bw, bh), p = d.data;
      for (let i = 0; i < p.length; i += 4) {
        const dr = p[i] - R, dg = p[i + 1] - G, db = p[i + 2] - B;
        const dist = Math.sqrt(dr * dr + dg * dg + db * db);
        let a = (dist - 5) / 70;
        a = a < 0 ? 0 : a > 1 ? 1 : a;
        if (a === 0) { p[i + 3] = 0; continue; }
        a = Math.min(1, a * 1.05 + 0.04);
        p[i] = R + dr / a; p[i + 1] = G + dg / a; p[i + 2] = B + db / a;
        p[i + 3] = Math.round(a * 255);
      }
      g.putImageData(d, 0, 0);
    } catch (e) {
      g.drawImage(im, bx, by, bw, bh, 0, 0, bw, bh);
    }
  }

  let flAsp = { l: FL_BOX.l[3] / FL_BOX.l[2], r: FL_BOX.r[3] / FL_BOX.r[2] };

  const pDunes = loadAsset('dunes').then((a) => {
    if (!a) return;
    const c = whiteKey(a.im), cv = EL.dunes;
    cv.width = c.width; cv.height = c.height;
    cv.getContext('2d').drawImage(c, 0, 0);
  });
  const pFlowers = loadAsset('flowers').then((a) => {
    if (!a) return;
    const c = whiteKey(a.im), s = a.im.naturalWidth / 2048;
    [['l', EL.fl_l], ['r', EL.fl_r]].forEach(([k, cv]) => {
      const [x, y, w, h] = FL_BOX[k].map((v) => Math.round(v * s));
      cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(c, x, y, w, h, 0, 0, w, h);
    });
    flAsp = { l: EL.fl_l.height / EL.fl_l.width, r: EL.fl_r.height / EL.fl_r.width };
  });
  const pFunnel = loadAsset('funnel').then((a) => { if (a) drawFunnel(a.im, $('funnelCv')); });
  const pSheets = Promise.all(['ingr', 'tins'].map((sheet) => loadAsset(sheet).then((a) => {
    if (!a) return;
    for (const id in SPR) if (SPR[id][0] === sheet) EL[id].style.backgroundImage = 'url("' + a.url + '")';
  })));

  let F = null, S = [], stepPx = 0, lastW = -1;

  function layoutNav(vw, vh, desk, u) {
    let side, top, bs, ls, gap;
    if (desk) {
      const n = Math.min(vw / 1440, vh / 900);
      side = Math.max(16, 78 * vw / 1440); top = Math.max(12, 30 * n);
      bs = Math.max(18, 30 * n); ls = Math.max(11, 14 * n); gap = Math.max(14, 40 * n);
    } else {
      side = Math.max(16, vw * 0.055); top = Math.max(14, 22 * u);
      bs = Math.max(18, 22 * u); ls = Math.max(11, 11 * u); gap = 8;
    }
    nav.style.padding = top + 'px ' + side + 'px 0';
    nav.querySelector('.brand').style.fontSize = bs + 'px';
    nav.querySelector('ul').style.gap = gap + 'px';
    nav.querySelectorAll('ul a').forEach((a) => { a.style.fontSize = ls + 'px'; });
  }

  function layout() {
    const vw = innerWidth, vh = innerHeight, desk = vw / vh >= 0.9;
    const W = desk ? 1440 : 390, H = desk ? 900 : 844;
    const u = Math.min(vw / W, vh / H);
    const ox = (vw - W * u) / 2, oy = (vh - H * u) / 2;
    const spread = desk ? 1 : clamp((vw / u) / 390 * 0.92, 1, 1.55);
    const sx = (x) => W / 2 + (x - W / 2) * spread;
    const BELOW = (vh - oy) / u, ABOVE = -oy / u;

    if (vw !== lastW) { lastW = vw; stepPx = Math.max(320, vh); }
    track.style.height = (7 * stepPx + vh) + 'px';

    layoutNav(vw, vh, desk, u);

    EL.headline.style.fontSize = (desk ? 148 : 72) * u + 'px';
    EL.blends.style.fontSize = (desk ? 252 : 84) * u + 'px';
    EL.mark.style.fontSize = (desk ? 80 : 54) * u + 'px';
    const lfs = desk ? Math.max(11, 22 * u) : Math.max(11, 14 * u);
    IDS.forEach((id) => { EL['t_' + id].style.fontSize = lfs + 'px'; });

    SPRITES.forEach((id) => {
      EL[id].style.width = 400 * u + 'px';
      EL[id].style.height = 400 * u * ASP[id] + 'px';
    });

    const hillPx = oy + (desk ? 380 : 338) * u;
    let dH = Math.max(vw * 0.5625, W * u * 0.5625, (vh - hillPx) / (1 - HILL_FRAC) + 2);
    if (!desk) dH = Math.max(dH, (vh - hillPx) / (1 - HILL_FRAC) * 1.04);
    const dW = dH / 0.5625;
    EL.dunes.style.width = dW + 'px';
    EL.dunes.style.height = dH + 'px';
    EL.dunes.style.marginLeft = (-dW / 2) + 'px';
    const dunesTop = hillPx - HILL_FRAC * dH;
    const down = BELOW - (dunesTop - oy) / u + 40;

    const fw = (desk ? 300 : 130) * u;
    const fl = { l: { w: fw, h: fw * flAsp.l }, r: { w: fw, h: fw * flAsp.r } };
    fl.l.x = -0.06 * fw;      fl.l.y = vh - 0.86 * fl.l.h;
    fl.r.x = vw - 0.94 * fw;  fl.r.y = vh - 0.86 * fl.r.h;
    EL.fl_l.style.width = fw + 'px'; EL.fl_l.style.height = fl.l.h + 'px';
    EL.fl_r.style.width = fw + 'px'; EL.fl_r.style.height = fl.r.h + 'px';

    F = { vw, vh, desk, W, H, u, ox, oy, BELOW, ABOVE, dunesTop, fl };

    S = [...Array(8)].map(() => ({}));
    const all = (id, fn) => { for (let k = 0; k < 8; k++) S[k][id] = fn(k); };

    all('bgField', (k) => ({ o: k >= 2 && k <= 4 ? 1 : 0 }));
    all('bgProd', (k) => ({ o: k >= 5 ? 1 : 0 }));
    all('dunes', (k) => ({ y: k ? down : 0 }));
    all('flowers', (k) => ({ y: k ? BELOW + 40 : 0 }));
    const hx = desk ? 92 : 22, hy = desk ? 224 : 272;
    all('headline', (k) => ({ x: hx, y: k ? hy + down : hy }));

    const HERO = desk
      ? { tea: [300, 560, 100, -8], card: [1035, 520, 92, 6], rose: [585, 628, 96, -4], peel: [1215, 612, 104, 10], cassia: [860, 575, 104, -6], amber: [430, 720, 78, 0] }
      : { tea: [70, 450, 62, -8], card: [300, 430, 58, 6], rose: [180, 520, 62, -4], peel: [330, 560, 64, 10], cassia: [120, 610, 66, -6], amber: [250, 640, 50, 0] };

    const GW = desk
      ? { rose: 230, tea: 240, peel: 228, cassia: 240, amber: 180, card: 236 }
      : { rose: 138, tea: 146, peel: 136, cassia: 146, amber: 110, card: 142 };
    const GRID = {};
    IDS.forEach((id, i) => {
      if (desk) {
        const c = i % 3, r = Math.floor(i / 3);
        GRID[id] = { x: sx([292, 720, 1150][c]), y: [355, 712][r], ly: [188, 548][r] };
      } else {
        const c = i % 2, r = Math.floor(i / 2);
        GRID[id] = { x: sx([105, 285][c]), y: [232, 440, 648][r], ly: [140, 348, 556][r] };
      }
    });

    const GC = desk ? [720, 175] : [195, 190];
    const GO = desk
      ? { rose: [-120, -20, 150, -10], tea: [10, -55, 165, 0], peel: [125, -5, 140, 12], cassia: [-55, 55, 150, -14], amber: [75, 58, 108, 8], card: [0, 25, 140, 4] }
      : { rose: [-70, -12, 92, -10], tea: [6, -34, 100, 0], peel: [74, -3, 86, 12], cassia: [-34, 34, 92, -14], amber: [46, 36, 66, 8], card: [0, 15, 86, 4] };

    const IN = desk
      ? { rose: [636, 178, 160, -8], tea: [806, 170, 168, 4], cassia: [660, 262, 152, -16], card: [790, 270, 148, 10], peel: [716, 350, 132, 6], amber: [724, 424, 96, 0] }
      : { rose: [150, 200, 88, -8], tea: [240, 196, 94, 4], cassia: [160, 258, 84, -16], card: [232, 262, 80, 10], peel: [185, 316, 74, 6], amber: [204, 368, 56, 0] };
    const shift4 = desk ? -560 : -330;
    const shift5 = desk ? -810 : -610;

    IDS.forEach((id) => {
      const h = HERO[id], g = GRID[id], o = GO[id], f = IN[id];
      all('i_' + id, (k) => {
        if (k === 0) return { x: sx(h[0]), y: h[1], w: h[2], r: h[3], o: 1 };
        if (k === 1) return { x: g.x, y: g.y, w: GW[id], r: 0, o: 1 };
        if (k === 2) return { x: GC[0] + o[0], y: GC[1] + o[1], w: o[2], r: o[3], o: 1 };
        if (k === 3) return { x: f[0], y: f[1], w: f[2], r: f[3], o: 1 };
        if (k === 4) return { x: f[0], y: f[1] + shift4, w: f[2], r: f[3], o: 1 };
        return { x: f[0], y: f[1] + shift5 - 200, w: f[2], r: f[3], o: 0 };
      });
      all('t_' + id, (k) =>
        k === 0 ? { x: g.x, y: g.ly + 24, o: 0 }
          : k === 1 ? { x: g.x, y: g.ly, o: 1 }
            : { x: g.x, y: g.ly - 14, o: 0 });
    });

    const funW = desk ? 483 : 330, funH = funW * ASP.funnel;
    const top2 = desk ? 660 : 640, top3 = desk ? 89 : 150;
    const gone5 = top3 + shift5 - 0.4 * funH;
    const ftops = [BELOW + 60, BELOW + 60, top2, top3, top3 + shift4, gone5, gone5, gone5];
    all('funnel', (k) => ({ x: W / 2, y: ftops[k] + funH / 2, w: funW, r: 0, o: 1 }));

    const fsB = desk ? 252 : 84;
    const yW = Math.max(desk ? 1080 : 960, BELOW + fsB * 0.7);
    const y3 = desk ? 600 : 548;
    const by = [yW, yW, yW, y3, y3 + shift4, y3 + shift5 - 300, y3 + shift5 - 300, y3 + shift5 - 300];
    all('blends', (k) => ({ x: W / 2, y: by[k], o: k <= 4 ? 1 : 0 }));

    const bigW = desk ? 600 : 330, bigTop = desk ? 480 : 470, bigH = bigW * ASP.tin_m;
    const lw = bigW * 0.45, lh = lw * ASP.lid_m;

    const dropW = desk ? 34 : 22, dropH = dropW * ASP.drop;
    const spout4 = top3 + funH + shift4;
    all('drop', (k) =>
      k <= 3 ? { x: W / 2, y: spout4 - 0.2 * dropH, w: dropW * 0.35, r: 0, o: 0 }
        : k === 4 ? { x: W / 2, y: spout4 + 0.5 * dropH, w: dropW, r: 0, o: 1 }
          : { x: W / 2, y: bigTop + 0.2 * dropH, w: dropW * 0.8, r: 0, o: 0 });

    const RX = desk ? [375, 720, 1065] : [76, 195, 314];
    const RT = desk ? [600, 765, 600] : [620, 712, 620];
    const PW = desk ? [340, 420, 340] : [148, 184, 148];
    const TW = desk ? [290, 320, 290] : [120, 140, 120];
    const FIN = {};
    ['l', 'm', 'r'].forEach((s, i) => {
      const x = sx(RX[i]), pt = RT[i];
      const pid = 'p_' + s, tid = 'tin_' + s, lid = 'lid_' + s;
      const th = TW[i] * ASP[tid], tTop = pt + 6 - th;
      const lW = TW[i] * 0.45, lH = lW * ASP[lid];
      FIN[pid] = { x, y: pt + PW[i] * ASP[pid] / 2, w: PW[i], r: 0, o: 1, f: s === 'r' ? -1 : 1 };
      FIN[tid] = { x, y: tTop + th / 2, w: TW[i], r: 0, o: 1 };
      FIN[lid] = { x, y: tTop + 0.05 * th - lH / 2, w: lW, r: 0, o: 1 };
    });
    const maxTW = Math.max(...TW);
    const goneOff = BELOW - Math.min(...RT) + maxTW * (ASP.tin_m + 0.45 * ASP.lid_m) + 60;
    const lowOff = (desk ? 420 : 300) + Math.max(0, BELOW - H);
    const off = (p, d) => Object.assign({}, p, { y: p.y + d });
    ['p_l', 'p_r', 'tin_l', 'tin_r', 'lid_l', 'lid_r', 'p_m'].forEach((id) => {
      all(id, (k) => (k <= 5 ? off(FIN[id], goneOff) : k === 6 ? off(FIN[id], lowOff) : FIN[id]));
    });
    all('tin_m', (k) =>
      k <= 4 ? { x: W / 2, y: BELOW + 40 + bigH / 2, w: bigW, r: 0, o: 1 }
        : k <= 6 ? { x: W / 2, y: bigTop + bigH / 2, w: bigW, r: 0, o: 1 }
          : FIN.tin_m);
    all('lid_m', (k) =>
      k <= 5 ? { x: W / 2, y: ABOVE - 0.9 * lh, w: lw, r: 0, o: 1 }
        : k === 6 ? { x: W / 2, y: bigTop + 0.05 * bigH - lh / 2, w: lw, r: 0, o: 1 }
          : FIN.lid_m);

    const fsM = desk ? 80 : 54;
    const navBottom = nav.offsetTop + nav.offsetHeight;
    const y7 = Math.max(desk ? 166 : 215, (navBottom + 6 - oy) / u + fsM * 0.62);
    all('mark', (k) => (k === 7 ? { x: W / 2, y: y7, o: 1 } : { x: W / 2, y: y7 - 18, o: 0 }));
  }

  const SPRITE_SET = new Set(SPRITES);

  function mix(A, B, t) {
    const o = {};
    for (const k in A) o[k] = typeof A[k] === 'number' ? lerp(A[k], B[k] ?? A[k], t) : A[k];
    return o;
  }

  function render(P) {
    let i = Math.floor(P), t = P - i;
    if (i >= 7) { i = 6; t = 1; }
    if (i < 0) { i = 0; t = 0; }
    const A = S[i], B = S[i + 1], { u, ox, oy, dunesTop, fl } = F;

    for (const id in A) {
      const p = mix(A[id], B[id], t);
      if (id === 'bgField' || id === 'bgProd') {
        EL[id].style.opacity = p.o;
      } else if (id === 'dunes') {
        EL.dunes.style.transform = 'translate3d(0,' + (dunesTop + p.y * u) + 'px,0)';
      } else if (id === 'flowers') {
        EL.fl_l.style.transform = 'translate3d(' + fl.l.x + 'px,' + (fl.l.y + p.y * u) + 'px,0)';
        EL.fl_r.style.transform = 'translate3d(' + fl.r.x + 'px,' + (fl.r.y + p.y * u) + 'px,0)';
      } else if (id === 'headline') {
        EL.headline.style.transform = 'translate3d(' + (ox + p.x * u) + 'px,' + (oy + p.y * u) + 'px,0)';
      } else if (SPRITE_SET.has(id)) {
        const s = p.w / 400;
        const X = ox + p.x * u - 200 * u;
        const Y = oy + p.y * u - 200 * u * ASP[id];
        EL[id].style.transform = 'translate3d(' + X + 'px,' + Y + 'px,0) rotate(' + p.r + 'deg) scale(' + (s * (p.f || 1)) + ',' + s + ')';
        EL[id].style.opacity = p.o;
      } else {
        EL[id].style.transform = 'translate3d(' + (ox + p.x * u) + 'px,' + (oy + p.y * u) + 'px,0) translate(-50%,-50%)';
        EL[id].style.opacity = p.o;
      }
    }
  }

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  layout();
  scrollTo(0, 0);

  const lenis = (!reduce && window.Lenis)
    ? new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false })
    : null;

  const getP = () => clamp(scrollY / stepPx, 0, 7);
  let lastY = scrollY, lastMove = performance.now(), lastWheel = -1e9;
  let fingerDown = false, dir = 1, settling = false, pending = false, lastInput = '';
  let lastP = -1, dirty = true;

  function goTo(target, duration) {
    target = clamp(target, 0, 7);
    if (!lenis || duration <= 0) { settling = false; scrollTo(0, target * stepPx); return; }
    settling = true;
    lenis.scrollTo(target * stepPx, {
      duration, easing: easeOut, force: true,
      onComplete: () => { settling = false; }
    });
  }

  function settle() {
    const P = getP(), i = Math.floor(P), f = P - i;
    if (f < 1e-3 || f > 1 - 1e-3) return;
    const target = dir > 0 ? (f > 0.12 ? i + 1 : i) : (f < 0.88 ? i : i + 1);
    goTo(target, (reduce || !lenis) ? 0 : Math.max(0.25, Math.abs(target - P) * 1.0));
  }

  addEventListener('wheel', () => {
    pending = true; lastInput = 'wheel'; lastWheel = performance.now(); settling = false;
  }, { passive: true });

  addEventListener('touchstart', () => {
    pending = true; lastInput = 'touch'; fingerDown = true;
    if (settling && lenis) { lenis.stop(); lenis.start(); }
    settling = false;
  }, { passive: true });
  addEventListener('touchend', () => { fingerDown = false; lastMove = performance.now(); }, { passive: true });
  addEventListener('touchcancel', () => { fingerDown = false; }, { passive: true });
  addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') { pending = true; lastInput = 'bar'; }
  }, { passive: true });

  addEventListener('keydown', (e) => {
    const k = e.key, P = getP();
    let target = null;
    if (k === 'ArrowDown' || k === 'PageDown' || k === ' ' || k === 'Spacebar') target = Math.floor(P + 1e-3) + 1;
    else if (k === 'ArrowUp' || k === 'PageUp') target = Math.ceil(P - 1e-3) - 1;
    else if (k === 'Home') target = 0;
    else if (k === 'End') target = 7;
    if (target === null) return;
    e.preventDefault();
    pending = false;
    target = clamp(target, 0, 7);
    goTo(target, (reduce || !lenis) ? 0 : Math.min(1.6, Math.max(0.35, Math.abs(target - P))));
  });

  function onResize() {
    const P = getP();
    layout();
    if (lenis) lenis.resize();
    const y = P * stepPx;
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
    else scrollTo(0, y);
    lastY = scrollY;
    dirty = true;
  }
  addEventListener('resize', onResize);

  function frame(now) {
    if (lenis) lenis.raf(now);
    const y = scrollY;
    if (Math.abs(y - lastY) > 0.5) { dir = y > lastY ? 1 : -1; lastMove = now; }
    lastY = y;

    const P = getP();
    if (dirty || P !== lastP) { render(P); lastP = P; dirty = false; }

    if (pending && !settling && !fingerDown && now - lastWheel > 140) {
      const ready = lastInput === 'wheel' ? true : now - lastMove > 140;
      if (ready) { pending = false; settle(); }
    }
    requestAnimationFrame(frame);
  }
  render(0);
  requestAnimationFrame(frame);

  const fontsReady = document.fonts
    ? document.fonts.load('400 1em Marcellus').then(() => document.fonts.ready)
    : Promise.resolve();
  let shown = false;
  function show() {
    if (shown) return;
    shown = true;
    onResize();
    document.body.classList.add('ready');
  }
  Promise.all([fontsReady, pDunes, pFlowers, pFunnel, pSheets]).then(show, show);
  setTimeout(show, 2500);
})();