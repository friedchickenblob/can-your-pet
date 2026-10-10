const tabs = document.querySelectorAll('nav button');
const panels = document.querySelectorAll('section');
tabs.forEach(tab => tab.addEventListener('click', () => {
  tabs.forEach(t => t.setAttribute('aria-selected', t === tab));
  panels.forEach(p => p.classList.toggle('active', p.id === tab.dataset.tab));
}));

const pet = document.querySelector('#dress .pet');
const box = document.getElementById('wornBox');
const worn = document.getElementById('worn');
const tint = box.querySelector('.tint');
const dressBtns = document.querySelectorAll('[data-dress]');
const MIN = 30;
let current = null;

function setBox(x, y, w, h) {
  const r = pet.getBoundingClientRect();
  Object.assign(box.style, { left: x / r.width * 100 + '%', top: y / r.height * 100 + '%',
    width: w / r.width * 100 + '%', height: h / r.height * 100 + '%' });
}
function resetBox() {
  Object.assign(box.style, { left: '0', top: '0', width: '100%', height: '100%' });
}
function hideDress() {
  current = null;
  box.style.display = 'none';
  box.classList.remove('selected');
  resetBox();
  dressBtns.forEach(o => o.classList.remove('on'));
}
worn.style.width = worn.style.height = '100%';

dressBtns.forEach(b => b.addEventListener('click', () => {
  if (current === b) return hideDress();
  current = b;
  worn.src = b.dataset.dress;
  tint.style.setProperty('--mask', `url("${b.dataset.dress}")`);
  box.style.display = 'block';
  dressBtns.forEach(o => o.classList.toggle('on', o === b));
}));
document.getElementById('trash').addEventListener('click', hideDress);

// select / move / resize
let drag = null;
box.addEventListener('pointerdown', e => {
  e.preventDefault();
  const pr = pet.getBoundingClientRect(), br = box.getBoundingClientRect();
  const rect = { x: br.left - pr.left, y: br.top - pr.top, w: br.width, h: br.height };
  const c = e.target.dataset.c;
  box.classList.add('selected');
  box.setPointerCapture(e.pointerId);
  if (c) {
    drag = { mode: 'resize', c, rect, pr, ratio: rect.w / rect.h,
      ax: c.includes('w') ? rect.x + rect.w : rect.x, ay: c.includes('n') ? rect.y + rect.h : rect.y };
  } else {
    drag = { mode: 'move', rect, pr, sx: e.clientX, sy: e.clientY };
  }
});
box.addEventListener('pointermove', e => {
  if (!drag) return;
  const { rect, pr } = drag;
  if (drag.mode === 'move') {
    setBox(rect.x + e.clientX - drag.sx, rect.y + e.clientY - drag.sy, rect.w, rect.h);
  } else {
    const mx = e.clientX - pr.left, my = e.clientY - pr.top;
    // keep aspect ratio: use whichever axis the mouse has moved further along
    const w = Math.max(MIN, Math.abs(mx - drag.ax), Math.abs(my - drag.ay) * drag.ratio);
    const h = w / drag.ratio;
    setBox(drag.c.includes('w') ? drag.ax - w : drag.ax, drag.c.includes('n') ? drag.ay - h : drag.ay, w, h);
  }
});
const endDrag = () => { drag = null; };
box.addEventListener('pointerup', endDrag);
box.addEventListener('pointercancel', endDrag);
// export a square PNG: chicken bounds (opaque pixels) plus ~1cm padding all round
const BODY = { x: 10, y: 21, w: 413, h: 429 }; // opaque bounds inside chicken.png (433x461)
document.getElementById('export').addEventListener('click', () => {
  const chicken = document.getElementById('chicken');
  const s = pet.getBoundingClientRect().height / chicken.naturalHeight; // display px per image px
  const pad = 96 / 2.54 / s; // 1cm in image px
  const side = Math.round(Math.max(BODY.w, BODY.h) + 2 * pad);
  const ox = BODY.x + BODY.w / 2 - side / 2, oy = BODY.y + BODY.h / 2 - side / 2;
  const cv = document.createElement('canvas');
  cv.width = cv.height = side;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg');
  ctx.fillRect(0, 0, side, side);
  ctx.drawImage(chicken, -ox, -oy);
  if (current) {
    const pr = pet.getBoundingClientRect(), br = box.getBoundingClientRect();
    ctx.drawImage(worn, (br.left - pr.left) / s - ox, (br.top - pr.top) / s - oy, br.width / s, br.height / s);
  }
  cv.toBlob(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'chicken.png';
    a.click();
    URL.revokeObjectURL(a.href);
  });
});
// click anywhere else deselects
document.addEventListener('pointerdown', e => {
  if (!box.contains(e.target)) box.classList.remove('selected');
});

// shower
const showerPet = document.getElementById('showerPet');
const lever = document.getElementById('lever');
const water = showerPet.querySelector('.water');
for (let i = 0; i < 18; i++) {
  const d = document.createElement('span');
  d.className = 'drop';
  d.style.left = 38 + Math.random() * 24 + '%';
  d.style.animationDelay = -Math.random() * 0.7 + 's';
  water.appendChild(d);
}
lever.addEventListener('click', () => {
  const on = showerPet.classList.toggle('running');
  lever.classList.toggle('on', on);
  lever.setAttribute('aria-pressed', on);
});

// food: fly to the beak, get bitten away
const foodPet = document.getElementById('foodPet');
const foodBtns = document.querySelectorAll('[data-food]');
const MOUTH = { x: 52, y: 36 }; // % of the pet, just in front of the beak
foodBtns.forEach(b => b.addEventListener('click', async () => {
  foodBtns.forEach(o => o.disabled = true);
  const f = document.createElement('div');
  f.className = 'food';
  f.innerHTML = b.innerHTML;
  foodPet.appendChild(f);
  const at = (x, y, sc, rot) => ({ left: x + '%', top: y + '%',
    transform: `translate(-50%, -50%) scale(${sc}) rotate(${rot}deg)` });
  const anim = f.animate([
    at(95, 85, 1, 25), at(MOUTH.x, MOUTH.y, 1, -10),
    at(MOUTH.x, MOUTH.y, 0.75, -10), at(MOUTH.x, MOUTH.y, 0.5, -10),
    at(MOUTH.x, MOUTH.y, 0.25, -10), at(MOUTH.x, MOUTH.y, 0, -10)
  ], { duration: 2000, easing: 'ease-in-out', fill: 'forwards' });
  foodPet.querySelector('.chick').animate(
    [{ transform: 'none' }, { transform: 'scale(1.03, 0.95)' }, { transform: 'none' }],
    { duration: 220, delay: 700, iterations: 4 });
  await anim.finished;
  f.remove();
  foodBtns.forEach(o => o.disabled = false);
}));

// ---------- day / night cycle: 20 real minutes = 24 game hours (10 min day, 10 min night) ----------
const HOUR_MS = 50000;
let hourSkew = 8 * HOUR_MS - performance.now(); // start at 8:00 AM
const gameHour = () => ((performance.now() + hourSkew) / HOUR_MS) % 24;
window.setGameHour = h => { hourSkew = h * HOUR_MS - performance.now(); tick(); };

const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const SKY = [ // hour, top, bottom, light level
  [0, '#070b25', '#1a2250', 0], [4.5, '#070b25', '#1a2250', 0], [6, '#6d6bb0', '#ff9e6d', 0.4],
  [7.5, '#6ec3ff', '#e6f6ff', 1], [16.5, '#6ec3ff', '#e6f6ff', 1], [18, '#7a5a9c', '#ff8a5c', 0.4],
  [19.5, '#070b25', '#1a2250', 0], [24, '#070b25', '#1a2250', 0]
];
function skyAt(h) {
  for (let i = 0; i < SKY.length - 1; i++) {
    if (h <= SKY[i + 1][0]) {
      const [h0, t0, b0, l0] = SKY[i], [h1, t1, b1, l1] = SKY[i + 1], k = (h - h0) / (h1 - h0);
      return { top: mix(hex(t0), hex(t1), k), bot: mix(hex(b0), hex(b1), k), light: l0 + (l1 - l0) * k };
    }
  }
}

const rootStyle = document.documentElement.style;
const clockIcon = document.getElementById('clockIcon');
const clockTime = document.getElementById('clockTime');

function updateRays(sun, p, moon, q) {
  const sc = document.querySelector('.scene.active');
  const rays = sc && sc.querySelector('.rays');
  if (!rays) return;
  const win = sc.querySelector('.win');
  const x = win.offsetLeft + win.offsetWidth, y = win.offsetTop, h = win.offsetHeight;
  const poly = rays.querySelector('polygon');
  let strength = 0, a = 0, color = '255, 235, 150';
  if (sun) { strength = 0.4 * Math.min(1, Math.sin(Math.PI * p) * 3); a = 18 + 50 * Math.sin(Math.PI * p); }
  else if (moon) { strength = 0.18 * Math.min(1, Math.sin(Math.PI * q) * 3); a = 18 + 50 * Math.sin(Math.PI * q); color = '180, 200, 255'; }
  const L = sc.clientWidth * 0.9, dx = L * Math.cos(a * Math.PI / 180), dy = L * Math.sin(a * Math.PI / 180);
  poly.setAttribute('points', `${x},${y} ${x},${y + h} ${x + dx},${y + h + dy} ${x + dx},${y + dy}`);
  poly.setAttribute('fill', `rgba(${color}, ${strength})`);
}

function tick() {
  const h = gameHour();
  const { top, bot, light } = skyAt(h);
  const p = (h - 6) / 12, hn = (h - 18 + 24) % 24, q = (hn > 23 ? hn - 24 : hn) / 12;
  const sunUp = p > -0.04 && p < 1.04, moonUp = q > -0.04 && q < 1.04;
  const set = (k, v) => rootStyle.setProperty(k, v);
  set('--sky-top', `rgb(${top})`); set('--sky-bot', `rgb(${bot})`);
  set('--sun-x', 8 + 84 * p + '%'); set('--sun-y', 92 - 80 * Math.sin(Math.PI * p) + '%'); set('--sun-o', sunUp ? 1 : 0);
  set('--moon-x', 8 + 84 * q + '%'); set('--moon-y', 92 - 80 * Math.sin(Math.PI * q) + '%'); set('--moon-o', moonUp ? 1 : 0);
  set('--star', Math.max(0, Math.min(1, 1 - light * 1.6)));
  set('--lamp', `rgb(${mix(hex('#e8dcc0'), hex('#ffc860'), 1 - light)})`);
  const active = document.querySelector('.scene.active');
  const outdoors = active && (active.id === 'home' || active.id === 'bike');
  set('--dim', (1 - light) * (outdoors ? 0.3 : 0.5));
  const hh = Math.floor(h), mm = Math.floor((h % 1) * 60);
  clockTime.textContent = `${hh % 12 || 12}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'AM' : 'PM'}`;
  clockIcon.innerHTML = h >= 6 && h < 18 ? '&#9728;' : '&#9790;';
  updateRays(sunUp, p, moonUp, q);
  homeTick(h);
}

// a window in every room scene: shows the sky and lets sun / moon rays in
document.querySelectorAll('#dress .stage, #shower .stage, #food .stage').forEach(st => st.insertAdjacentHTML('afterbegin',
  '<svg class="rays" aria-hidden="true"><polygon points="0,0 0,0 0,0"/></svg>' +
  '<div class="win" aria-hidden="true"><div class="win-sky"><div class="stars"></div><div class="orb sun"></div><div class="orb moon"></div></div></div>'));

// ---------- home: yard by day, bed by night ----------
const homePet = document.getElementById('homePet');
const house = document.querySelector('.house');
const door = house.querySelector('.door');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pose = { x: 0, y: 0, s: 1, o: 1 }; // x, y in % of the chicken's size
let homeState = 'yard', jumpTimer = 0;
const tf = q => `translate(${q.x}%, ${q.y}%) scale(${q.s})`;
function applyPose() { homePet.style.transform = tf(pose); homePet.style.opacity = pose.o; }
function moveTo(to, ms, arc = 0) {
  const from = { ...pose };
  const frames = [{ transform: tf(from), opacity: from.o }];
  if (arc) frames.push({ transform: tf({ x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 - arc, s: (from.s + to.s) / 2 }),
    opacity: (from.o + to.o) / 2, offset: 0.5 });
  frames.push({ transform: tf(to), opacity: to.o });
  pose = { ...to }; applyPose();
  homePet.animate(frames, { duration: ms, easing: 'ease-in-out' });
  return sleep(ms); // timer, not anim.finished: keeps the story moving even if the page is throttled
}
function stopJumping() { clearTimeout(jumpTimer); }
function startJumping() {
  stopJumping();
  jumpTimer = setTimeout(async function jump() {
    if (homeState !== 'yard') return;
    const r = homePet.getBoundingClientRect(), st = homePet.parentElement.getBoundingClientRect();
    const pw = homePet.offsetWidth, padR = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pad-r')) || 0;
    const centre = st.left + (st.width - padR) / 2;
    const limit = Math.max(8, Math.min(40, (Math.min(centre - st.left, st.right - centre) - pw / 2) / pw * 100 - 2));
    const dir = pose.x > limit * 0.5 ? -1 : pose.x < -limit * 0.5 ? 1 : (Math.random() < 0.5 ? -1 : 1);
    const nx = Math.max(-limit, Math.min(limit, pose.x + dir * (15 + Math.random() * 20)));
    await moveTo({ ...pose, x: nx }, 700, 14);
    jumpTimer = setTimeout(jump, 2500 + Math.random() * 2500);
  }, 2500 + Math.random() * 2500);
}
const AT_DOOR = { x: 0, y: -12, s: 0.3 };
async function goToBed() {
  homeState = 'walking'; stopJumping();
  await moveTo({ ...pose, x: 0 }, 500, 8);
  for (let i = 1; i <= 4; i++) {
    const k = i / 4;
    if (i === 3) door.classList.add('open');
    await moveTo({ x: 0, y: AT_DOOR.y * k, s: 1 - 0.7 * k, o: i === 4 ? 0 : 1 }, 750, 10);
  }
  await sleep(300);
  door.classList.remove('open');
  house.classList.add('asleep');
  homeState = 'bed';
}
async function wakeUp() {
  homeState = 'walking';
  house.classList.add('waking');
  await sleep(2500);
  house.classList.remove('asleep', 'waking');
  pose = { ...AT_DOOR, o: 0 }; applyPose();
  door.classList.add('open');
  await sleep(500);
  for (let i = 1; i <= 4; i++) {
    const k = 1 - i / 4;
    await moveTo({ x: 0, y: AT_DOOR.y * k, s: 1 - 0.7 * k, o: 1 }, 750, 10);
  }
  door.classList.remove('open');
  homeState = 'yard';
  startJumping();
}
function homeTick(h) {
  const night = h >= 18.5 || h < 6;
  if (night && homeState === 'yard') goToBed();
  else if (!night && homeState === 'bed') wakeUp();
}
// initial state
if (gameHour() >= 18.5 || gameHour() < 6) {
  homeState = 'bed'; pose = { ...AT_DOOR, o: 0 }; applyPose(); house.classList.add('asleep');
} else startJumping();
tick();
setInterval(tick, 250);
