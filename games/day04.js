// Día 4: Infla el Corazón - toques rápidos (posible y divertido)
import { sfx } from '../js/audio.js';

export function startGame(container, config, onWin) {
  const durationMs = (config.gameConfig && config.gameConfig.durationMs) || 10000;
  const targetTaps = (config.gameConfig && config.gameConfig.targetTaps) || 75;
  let progress = 0;
  let started = false;
  let ended = false;
  let startTime = 0;
  let lastTime = 0;
  let raf;

  const root = document.createElement('div');
  root.className = 'game-center-col';
  root.style.background = 'radial-gradient(circle at 50% 40%, #2a121a, #12090c)';
  container.appendChild(root);

  const hud = document.createElement('div');
  hud.style.cssText = 'position:absolute;top:10px;left:10px;right:10px;display:flex;justify-content:space-between;color:#fff;font-weight:700;';
  root.appendChild(hud);

  const heart = document.createElement('div');
  heart.textContent = '❤';
  heart.style.cssText = 'font-size:64px;line-height:1;transition:transform 0.06s ease;filter:drop-shadow(0 6px 18px rgba(184,29,51,0.6));user-select:none;';
  root.appendChild(heart);

  const msg = document.createElement('div');
  msg.style.cssText = 'color:#f2c6ce;font-size:1rem;min-height:24px;text-align:center;padding:0 8px;';
  msg.textContent = 'Toca rápido para inflar el corazón antes de que se acabe el tiempo';
  root.appendChild(msg);

  const barWrap = document.createElement('div');
  barWrap.style.cssText = 'width:80%;max-width:280px;height:12px;background:rgba(255,255,255,0.15);border-radius:999px;overflow:hidden;border:1px solid rgba(212,175,55,0.4);';
  const bar = document.createElement('div');
  bar.style.cssText = 'height:100%;width:0%;background:linear-gradient(90deg,#d4af37,#f2c6ce);';
  barWrap.appendChild(bar);
  root.appendChild(barWrap);

  function updateHUD() {
    const elapsed = started ? Math.min(durationMs, Date.now() - startTime) : 0;
    const left = Math.max(0, Math.ceil((durationMs - elapsed) / 1000));
    const shown = Math.floor(progress);
    hud.innerHTML = `<span>Tiempo: ${left}s</span><span>Aire: ${shown}/${targetTaps}</span>`;
    const pct = Math.min(100, (progress / targetTaps) * 100);
    bar.style.width = pct + '%';
    const scale = 1 + Math.min(1.6, (progress / targetTaps) * 1.6);
    heart.style.transform = `scale(${scale})`;
  }

  function finish(win) {
    if (ended) return;
    ended = true;
    cancelAnimationFrame(raf);
    if (win) {
      heart.style.transition = 'transform 0.2s ease';
      heart.style.transform = 'scale(3)';
      heart.style.opacity = '0';
      msg.textContent = '¡Boom! Lleno de amor';
      try { sfx('success'); } catch (e) {}
      setTimeout(() => onWin && onWin(), 600);
    } else {
      msg.textContent = '¡Casi! Pulsa reintentar para intentarlo otra vez';
      try { sfx('fail'); } catch (e) {}
      updateHUD();
    }
  }

  function tick(now) {
    if (ended) return;
    if (!lastTime) lastTime = now;
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    if (started) {
      // fuga muy suave para que sea fácil y divertido
      progress = Math.max(0, progress - dt * 0.8);
      const elapsed = Date.now() - startTime;
      if (progress >= targetTaps) { updateHUD(); finish(true); return; }
      if (elapsed >= durationMs) { updateHUD(); finish(progress >= targetTaps); return; }
    }
    updateHUD();
    raf = requestAnimationFrame(tick);
  }

  function tap(e) {
    e.preventDefault();
    if (ended) return;
    if (!started) {
      started = true;
      startTime = Date.now();
      lastTime = 0;
    }
    progress = Math.min(targetTaps + 1, progress + 1.5);
    try { sfx('pop'); } catch (e) {}
    if (progress >= targetTaps) finish(true);
  }

  root.addEventListener('pointerdown', tap);
  updateHUD();
  raf = requestAnimationFrame(tick);

  return () => {
    ended = true;
    cancelAnimationFrame(raf);
    root.removeEventListener('pointerdown', tap);
  };
}
