/* ===== State ===== */
const state = {
  color1: '#8B6B4E',
  color2: '#F5F0E8',
  pattern: 'solid',
  style: 'wave',
  userImage: null,
};

const MAX_W = 600;
const MAX_H = 480;

/* ===== DOM References ===== */
const canvas        = document.getElementById('curtainCanvas');
const ctx           = canvas.getContext('2d');
const windowFrame   = document.getElementById('windowFrame');
const roomScene     = document.getElementById('roomScene');
const labelW        = document.getElementById('labelW');
const labelH        = document.getElementById('labelH');
const foldVal       = document.getElementById('foldVal');
const uploadSection = document.getElementById('imageUploadSection');
const uploadZone    = document.getElementById('uploadZone');
const imgUpload     = document.getElementById('imgUpload');

/* ===== Helpers ===== */
function getVal(id) {
  return parseFloat(document.getElementById(id).value) || 0;
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function lighten(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${Math.min(255, r + amt)},${Math.min(255, g + amt)},${Math.min(255, b + amt)})`;
}

function darken(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${Math.max(0, r - amt)},${Math.max(0, g - amt)},${Math.max(0, b - amt)})`;
}

/* ===== Pattern Builder ===== */
function buildPattern(patternName) {
  const p  = document.createElement('canvas');
  const s  = 40;
  p.width  = s;
  p.height = s;
  const pc = p.getContext('2d');

  pc.fillStyle = state.color1;
  pc.fillRect(0, 0, s, s);
  pc.fillStyle   = state.color2;
  pc.strokeStyle = state.color2;

  switch (patternName) {
    case 'stripes-v':
      for (let x = 0; x < s; x += s / 2) pc.fillRect(x, 0, s / 4, s);
      break;

    case 'stripes-h':
      for (let y = 0; y < s; y += s / 2) pc.fillRect(0, y, s, s / 4);
      break;

    case 'check':
      pc.fillRect(0,    0,    s / 2, s / 2);
      pc.fillRect(s / 2, s / 2, s / 2, s / 2);
      break;

    case 'dots':
      [[s/4, s/4], [3*s/4, s/4], [s/4, 3*s/4], [3*s/4, 3*s/4]].forEach(([cx, cy]) => {
        pc.beginPath();
        pc.arc(cx, cy, s / 8, 0, Math.PI * 2);
        pc.fill();
      });
      break;

    case 'herringbone': {
      const q = s / 4;
      const quads = [
        [0, q,     q, 0,     s/2, q,   q,   s/2],
        [s/2, q,   s/2+q, 0, s, q,     s/2+q, s/2],
        [0, 3*q,   q, s/2,   s/2, 3*q, q,   s],
        [s/2, 3*q, s/2+q, s/2, s, 3*q, s/2+q, s],
      ];
      quads.forEach(([x1,y1,x2,y2,x3,y3,x4,y4]) => {
        pc.beginPath();
        pc.moveTo(x1, y1); pc.lineTo(x2, y2);
        pc.lineTo(x3, y3); pc.lineTo(x4, y4);
        pc.closePath();
        pc.fill();
      });
      break;
    }

    case 'damask':
      pc.strokeStyle = state.color2;
      pc.lineWidth   = 1.5;
      pc.beginPath(); pc.ellipse(s/2, s/2, s/6, s/3, 0, 0, Math.PI*2); pc.stroke();
      pc.beginPath(); pc.ellipse(s/2, s/2, s/3, s/6, 0, 0, Math.PI*2); pc.stroke();
      pc.beginPath(); pc.arc(s/2, s/2, s/10, 0, Math.PI*2); pc.fill();
      break;

    case 'linen':
      for (let y = 4; y < s; y += 8) {
        pc.lineWidth    = y % 16 === 0 ? 2 : 0.8;
        pc.globalAlpha  = y % 16 === 0 ? 0.35 : 0.5;
        pc.strokeStyle  = state.color2;
        pc.beginPath();
        pc.moveTo(0, y); pc.lineTo(s, y);
        pc.stroke();
      }
      pc.globalAlpha = 1;
      break;

    default:
      break;
  }

  return ctx.createPattern(p, 'repeat');
}

/* ===== Fill Setter ===== */
function applyFill() {
  if (state.pattern !== 'solid' && state.pattern !== 'image') {
    ctx.fillStyle = buildPattern(state.pattern) || state.color1;
  } else if (state.pattern === 'image' && state.userImage) {
    ctx.fillStyle = ctx.createPattern(state.userImage, 'repeat');
  } else {
    ctx.fillStyle = state.color1;
  }
}

/* ===== Curtain Style Renderers ===== */
function drawWave(x, w, h) {
  const numWaves = Math.max(3, Math.round(w / 35));
  ctx.save();
  ctx.beginPath(); ctx.rect(x, 0, w, h); ctx.clip();
  for (let i = 0; i < numWaves; i++) {
    const t   = (i + 0.5) / numWaves;
    const cx2 = x + t * w;
    const shade = Math.abs(Math.sin(t * Math.PI * 2)) * 25;
    const seg = w / numWaves;
    const g = ctx.createLinearGradient(cx2 - seg/2, 0, cx2 + seg/2, 0);
    g.addColorStop(0, darken(state.color1, 20 + shade));
    g.addColorStop(0.5, lighten(state.color1, 15));
    g.addColorStop(1, darken(state.color1, 20 + shade));
    ctx.fillStyle = g;
    ctx.fillRect(cx2 - seg/2, 0, seg, h);
  }
  ctx.restore();
}

function drawPencil(x, w, h) {
  const numFolds = Math.max(4, Math.round(w / 18));
  ctx.save();
  ctx.beginPath(); ctx.rect(x, 0, w, h); ctx.clip();
  for (let i = 0; i <= numFolds; i++) {
    const bx  = x + (i / numFolds) * w;
    const seg = w / numFolds;
    const g = ctx.createLinearGradient(bx - seg/2, 0, bx + seg/2, 0);
    g.addColorStop(0, darken(state.color1, 35));
    g.addColorStop(0.3, lighten(state.color1, 20));
    g.addColorStop(0.7, lighten(state.color1, 20));
    g.addColorStop(1, darken(state.color1, 35));
    ctx.fillStyle = g;
    ctx.fillRect(bx - seg/2, 0, seg, h);
  }
  ctx.restore();
}

function drawEyelet(x, w, h) {
  const numEyelets = Math.max(2, Math.round(w / 50));
  ctx.save();
  ctx.beginPath(); ctx.rect(x, 0, w, h); ctx.clip();
  for (let i = 0; i < numEyelets; i++) {
    const seg = w / numEyelets;
    const bx  = x + (i + 0.5) * seg;
    const g = ctx.createLinearGradient(bx - seg/2, 0, bx + seg/2, 0);
    g.addColorStop(0, darken(state.color1, 40));
    g.addColorStop(0.5, lighten(state.color1, 10));
    g.addColorStop(1, darken(state.color1, 40));
    ctx.fillStyle = g;
    ctx.fillRect(bx - seg/2, 0, seg, h);
  }
  ctx.restore();

  // Eyelets
  const eyeletY = 14, eyeletR = 8;
  for (let i = 0; i < numEyelets; i++) {
    const ex = x + (i + 0.5) * (w / numEyelets);
    ctx.save();
    ctx.beginPath(); ctx.arc(ex, eyeletY, eyeletR, 0, Math.PI * 2);
    ctx.fillStyle = '#B0A898'; ctx.fill();
    ctx.strokeStyle = '#888070'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(ex, eyeletY, eyeletR - 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(200,195,185,0.6)'; ctx.fill();
    ctx.restore();
  }
}

function drawPanel(x, w, h) {
  const numPanels = 2;
  const seg = w / numPanels;
  for (let i = 0; i < numPanels; i++) {
    const px = x + i * seg;
    const g = ctx.createLinearGradient(px, 0, px + seg, 0);
    g.addColorStop(0, darken(state.color1, 15));
    g.addColorStop(0.5, lighten(state.color1, 8));
    g.addColorStop(1, darken(state.color1, 15));
    ctx.fillStyle = g;
    ctx.fillRect(px, 0, seg, h);
    ctx.strokeStyle = darken(state.color1, 30);
    ctx.lineWidth = 1;
    ctx.strokeRect(px, 0, seg, h);
  }
}

/* ===== Single Panel Draw ===== */
function drawCurtainSide(x, w, h) {
  if (w <= 0 || h <= 0) return;

  // Base fill (pattern / image / solid)
  ctx.save();
  ctx.beginPath(); ctx.rect(x, 0, w, h); ctx.clip();
  applyFill();
  ctx.fillRect(x, 0, w, h);
  ctx.restore();

  // Style overlay (shading / folds)
  switch (state.style) {
    case 'pencil': drawPencil(x, w, h); break;
    case 'eyelet': drawEyelet(x, w, h); break;
    case 'panel':  drawPanel(x, w, h);  break;
    default:       drawWave(x, w, h);   break;
  }

  // Edge vignette
  const eg = ctx.createLinearGradient(x, 0, x + w, 0);
  eg.addColorStop(0,    'rgba(0,0,0,0.18)');
  eg.addColorStop(0.05, 'rgba(0,0,0,0)');
  eg.addColorStop(0.95, 'rgba(0,0,0,0)');
  eg.addColorStop(1,    'rgba(0,0,0,0.18)');
  ctx.fillStyle = eg;
  ctx.fillRect(x, 0, w, h);
}

/* ===== Main Render ===== */
function render() {
  updateWindowFrame();
  drawCurtains();
}

function updateWindowFrame() {
  const winW  = getVal('winW');
  const winH  = getVal('winH');
  const ratio = winW / winH;
  const sceneW = roomScene.offsetWidth;
  const availW = Math.min(sceneW * 0.9, MAX_W);
  const availH = MAX_H;

  let pw, ph;
  if (availW / ratio <= availH) {
    pw = availW; ph = availW / ratio;
  } else {
    ph = availH; pw = availH * ratio;
  }

  windowFrame.style.width  = pw + 'px';
  windowFrame.style.height = ph + 'px';
  canvas.width  = Math.round(pw);
  canvas.height = Math.round(ph);

  labelW.textContent = winW + ' cm';
  labelH.textContent = winH + ' cm';
  document.getElementById('headerRod').style.margin = '0 ' + Math.round(pw * 0.04) + 'px';
}

function drawCurtains() {
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const winW  = getVal('winW');
  const winH  = getVal('winH');
  const curW  = getVal('curW');
  const curH  = getVal('curH');

  const curtainWidthPx  = Math.min((curW / winW) * W, W * 0.48);
  const curtainHeightPx = Math.min((curH / winH) * H, H * 1.05);

  drawCurtainSide(0, curtainWidthPx, curtainHeightPx);
  drawCurtainSide(W - curtainWidthPx, curtainWidthPx, curtainHeightPx);
}

/* ===== Export ===== */
function exportPNG() {
  const w = roomScene.offsetWidth;
  const h = roomScene.offsetHeight;
  const ec = document.createElement('canvas');
  ec.width  = w * 2;
  ec.height = h * 2;
  const c = ec.getContext('2d');
  c.scale(2, 2);

  // Wall
  c.fillStyle = '#F0EAE0';
  c.fillRect(0, 0, w, h - 40);

  // Window frame positioning
  const fr = windowFrame.getBoundingClientRect();
  const sr = roomScene.getBoundingClientRect();
  const fx = fr.left - sr.left;
  const fy = fr.top  - sr.top;
  const fw = fr.width;
  const fh = fr.height;

  // Frame surround
  c.fillStyle = '#E8E0D0';
  c.fillRect(fx - 12, fy - 12, fw + 24, fh + 24);

  // Sky
  const sky = c.createLinearGradient(fx, fy, fx, fy + fh);
  sky.addColorStop(0,   '#BDD8F0');
  sky.addColorStop(0.6, '#DEF0FF');
  sky.addColorStop(1,   '#F0F8FF');
  c.fillStyle = sky;
  c.fillRect(fx, fy, fw, fh);

  // Dividers
  c.fillStyle = '#E8E0D0';
  c.fillRect(fx, fy + fh/2 - 5, fw, 10);
  c.fillRect(fx + fw/2 - 5, fy, 10, fh);

  // Rod
  const rodG = c.createLinearGradient(0, fy - 22, 0, fy - 8);
  rodG.addColorStop(0,   '#C0B090');
  rodG.addColorStop(0.5, '#A89070');
  rodG.addColorStop(1,   '#C0B090');
  c.fillStyle = rodG;
  c.beginPath();
  c.roundRect(fx - 4, fy - 22, fw + 8, 14, 7);
  c.fill();

  // Curtains
  c.drawImage(canvas, fx, fy, fw, fh);

  // Floor
  c.fillStyle = '#D4C8B4';
  c.fillRect(0, h - 40, w, 40);
  c.fillStyle = '#BFB49E';
  c.fillRect(0, h - 40, w, 2);

  // Label
  c.fillStyle = 'rgba(26,22,20,0.65)';
  c.font = '12px DM Sans, sans-serif';
  c.textAlign = 'center';
  c.fillText(
    `Fenster: ${getVal('winW')} × ${getVal('winH')} cm  |  Vorhang: ${getVal('curW')} × ${getVal('curH')} cm pro Seite`,
    w / 2, h - 10
  );

  const link = document.createElement('a');
  link.download = 'vorhang-planung.png';
  link.href = ec.toDataURL('image/png');
  link.click();
}

/* ===== Reset ===== */
function resetAll() {
  document.getElementById('winW').value  = 140;
  document.getElementById('winH').value  = 220;
  document.getElementById('curW').value  = 90;
  document.getElementById('curH').value  = 240;
  document.getElementById('foldRange').value = 25;
  foldVal.textContent = '25%';
  document.getElementById('styleSelect').value = 'wave';

  state.color1    = '#8B6B4E';
  state.color2    = '#F5F0E8';
  state.pattern   = 'solid';
  state.style     = 'wave';
  state.userImage = null;

  document.getElementById('colorPicker').value  = state.color1;
  document.getElementById('colorHex').value      = state.color1;
  document.getElementById('color2Picker').value  = state.color2;
  document.getElementById('color2Hex').value      = state.color2;

  document.querySelectorAll('.pattern-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('[data-pattern="solid"]').classList.add('active');
  uploadSection.classList.add('hidden');
  uploadZone.innerHTML = `
    <div class="icon">🖼</div>
    <strong>Bild hochladen</strong>
    <p>JPG, PNG oder SVG</p>
  `;

  syncSwatches();
  render();
}

/* ===== Swatch Sync ===== */
function syncSwatches() {
  document.querySelectorAll('.swatch').forEach(s => {
    s.classList.toggle('active', s.dataset.color === state.color1);
  });
}

/* ===== Image Loader ===== */
function loadImageFile(file) {
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      state.userImage = img;
      uploadZone.innerHTML = `<strong style="font-size:0.8rem;color:var(--mid)">✓ ${file.name}</strong>`;
      drawCurtains();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

/* ===== Event Listeners ===== */

// Dimensions
['winW', 'winH', 'curW', 'curH'].forEach(id => {
  document.getElementById(id).addEventListener('input', render);
});

// Fold slider
document.getElementById('foldRange').addEventListener('input', e => {
  foldVal.textContent = e.target.value + '%';
  drawCurtains();
});

// Style select
document.getElementById('styleSelect').addEventListener('change', e => {
  state.style = e.target.value;
  drawCurtains();
});

// Color 1
document.getElementById('colorPicker').addEventListener('input', e => {
  state.color1 = e.target.value;
  document.getElementById('colorHex').value = state.color1;
  syncSwatches();
  drawCurtains();
});

document.getElementById('colorHex').addEventListener('input', e => {
  if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
    state.color1 = e.target.value;
    document.getElementById('colorPicker').value = state.color1;
    syncSwatches();
    drawCurtains();
  }
});

// Color 2
document.getElementById('color2Picker').addEventListener('input', e => {
  state.color2 = e.target.value;
  document.getElementById('color2Hex').value = state.color2;
  drawCurtains();
});

document.getElementById('color2Hex').addEventListener('input', e => {
  if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
    state.color2 = e.target.value;
    document.getElementById('color2Picker').value = state.color2;
    drawCurtains();
  }
});

// Swatches
document.getElementById('swatches').addEventListener('click', e => {
  const sw = e.target.closest('.swatch');
  if (!sw) return;
  state.color1 = sw.dataset.color;
  document.getElementById('colorPicker').value = state.color1;
  document.getElementById('colorHex').value    = state.color1;
  syncSwatches();
  drawCurtains();
});

// Pattern buttons
document.getElementById('patternGrid').addEventListener('click', e => {
  const btn = e.target.closest('.pattern-btn');
  if (!btn) return;
  document.querySelectorAll('.pattern-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.pattern = btn.dataset.pattern;
  uploadSection.classList.toggle('hidden', state.pattern !== 'image');
  drawCurtains();
});

// Image upload
uploadZone.addEventListener('click', () => imgUpload.click());

uploadZone.addEventListener('dragover', e => {
  e.preventDefault();
  uploadZone.style.borderColor = '#8B6B4E';
});

uploadZone.addEventListener('dragleave', () => {
  uploadZone.style.borderColor = '';
});

uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.style.borderColor = '';
  if (e.dataTransfer.files[0]) loadImageFile(e.dataTransfer.files[0]);
});

imgUpload.addEventListener('change', e => {
  if (e.target.files[0]) loadImageFile(e.target.files[0]);
});

// Export & Reset
document.getElementById('exportBtn').addEventListener('click', exportPNG);
document.getElementById('resetBtn').addEventListener('click', resetAll);

// Resize
window.addEventListener('resize', render);

/* ===== Init ===== */
syncSwatches();
render();