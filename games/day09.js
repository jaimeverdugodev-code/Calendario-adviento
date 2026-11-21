// Día 9: ¡Atrapa al Elfo! - 6 chimeneas, toca 10 veces
import { getMyAvatarForDay } from '../js/avatars.js';

export function startGame(container, config, onWin) {
  const target = (config.gameConfig && config.gameConfig.targetHits) || 10;
  let score = 0;
  let active = -1;
  let timer = null;
  let running = true;
  const meSrc = getMyAvatarForDay(config.day);

  const hitSoundCandidates = [
    'public/dia09/aplastar.mp3',
    'public/dia09/aplastar.ogg',
    'public/dia09/aplastar.wav',
    'public/dia09/golpe.mp3',
    'public/dia09/golpe.ogg',
    'public/dia09/golpe.wav',
    'public/dia09/sonido.mp3',
    'public/dia09/sonido.ogg',
    'public/dia09/sonido.wav'
  ];
  let hitAudio = null;
  hitSoundCandidates.forEach((src) => {
    const a = new Audio(src);
    a.preload = 'auto';
    a.addEventListener('canplaythrough', () => { if (!hitAudio) hitAudio = a; }, { once: true });
  });
  function playWhackSound() {
    if (!hitAudio) return;
    try {
      hitAudio.currentTime = 0;
      const p = hitAudio.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (e) {}
  }

  const root = document.createElement('div');
  root.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;padding:12px;gap:10px;';
  container.appendChild(root);

  const hud = document.createElement('div');
  hud.style.cssText = 'text-align:center;color:#fff;font-weight:700;font-size:1.1rem;';
  const updateHud = () => hud.textContent = `Atrapados: ${score} / ${target}`;
  updateHud();
  root.appendChild(hud);

  const grid = document.createElement('div');
  grid.style.cssText = 'flex:1;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(2,1fr);gap:10px;';
  root.appendChild(grid);

  const chimneys = [];
  for (let i=0;i<6;i++) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.style.cssText = 'position:relative;border:none;background:transparent;padding:0;overflow:hidden;border-radius:12px;';
    cell.innerHTML = `
      <div style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;">
        <div class="elf" style="position:absolute;bottom:38%;width:58%;aspect-ratio:1/1;border-radius:50%;background:url('${meSrc}') center/cover,#f2c6ce; border:3px solid #d4af37; transform:translateY(140%); transition:transform 0.15s ease; z-index:1;"></div>
        <div style="width:85%;height:40%;background:linear-gradient(#8b3a3a,#5a2424);border-radius:6px 6px 4px 4px;border:2px solid #3d1818;position:relative;z-index:2;">
          <div style="position:absolute;top:-10px;left:-5%;right:-5%;height:14px;background:#4a1f1f;border-radius:4px;border:2px solid #2d1212;"></div>
          <div style="position:absolute;inset:18% 20%;background:rgba(0,0,0,0.35);border-radius:3px;"></div>
        </div>
        <div style="width:100%;height:18%;background:#fdf8f5;border-radius:6px 6px 0 0;z-index:2;"></div>
      </div>`;
    const elf = cell.querySelector('.elf');
    cell.addEventListener('click', () => {
      if (!running) return;
      if (active === i) {
        score++;
        playWhackSound();
        updateHud();
        elf.style.transform = 'translateY(140%)';
        active = -1;
        if (score >= target) {
          running = false;
          clearTimeout(timer);
          hud.textContent = '¡Lo atrapaste!';
          setTimeout(() => onWin && onWin(), 700);
        }
      }
    });
    grid.appendChild(cell);
    chimneys.push({ cell, elf });
  }

  function showRandom() {
    if (!running) return;
    if (active >= 0) chimneys[active].elf.style.transform = 'translateY(140%)';
    let next = Math.floor(Math.random() * 6);
    if (next === active) next = (next + 1) % 6;
    active = next;
    chimneys[active].elf.style.transform = 'translateY(-18%)';
    const stay = 800 + Math.random() * 400;
    timer = setTimeout(() => {
      if (active >= 0) chimneys[active].elf.style.transform = 'translateY(140%)';
      active = -1;
      timer = setTimeout(showRandom, 250 + Math.random() * 300);
    }, stay);
  }

  timer = setTimeout(showRandom, 500);
  return () => { running = false; clearTimeout(timer); };
}
