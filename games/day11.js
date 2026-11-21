// Día 11: Decora el Árbol - arrastra los adornos a su sitio
import { sfx } from '../js/audio.js';

export function startGame(container, config, onWin) {
  const total = Math.min(8, Math.max(4, (config.gameConfig && config.gameConfig.ornaments) || 6));
  const emojis = ['❤️', '⭐', '🔔', '🎁', '🍬', '🎀', '❄️', '💫'];
  const chosen = emojis.slice(0, total);

  const root = document.createElement('div');
  root.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;padding:10px;gap:8px;background:linear-gradient(180deg,#102033,#1B0D12);overflow:hidden;';
  container.appendChild(root);

  const hud = document.createElement('div');
  hud.style.cssText = 'color:#f2c6ce;font-weight:700;text-align:center;min-height:22px;';
  root.appendChild(hud);

  const hint = document.createElement('div');
  hint.style.cssText = 'color:rgba(253,248,245,0.85);font-size:0.9rem;text-align:center;';
  hint.textContent = 'Arrastra cada adorno hasta un hueco del árbol';
  root.appendChild(hint);

  const area = document.createElement('div');
  area.style.cssText = 'position:relative;flex:1;width:100%;max-width:320px;min-height:230px;';
  root.appendChild(area);

  // Árbol
  const tree = document.createElement('div');
  tree.style.cssText = 'position:absolute;left:50%;top:6%;transform:translateX(-50%);width:100%;height:80%;pointer-events:none;';
  tree.innerHTML = `
    <div style="position:absolute;left:50%;top:0;transform:translateX(-50%);color:#d4af37;font-size:28px;filter:drop-shadow(0 0 8px rgba(212,175,55,0.8));">★</div>
    <div style="position:absolute;left:50%;top:10%;transform:translateX(-50%);width:0;height:0;border-left:55px solid transparent;border-right:55px solid transparent;border-bottom:70px solid #1f7a3a;"></div>
    <div style="position:absolute;left:50%;top:28%;transform:translateX(-50%);width:0;height:0;border-left:78px solid transparent;border-right:78px solid transparent;border-bottom:88px solid #228b44;"></div>
    <div style="position:absolute;left:50%;top:50%;transform:translateX(-50%);width:0;height:0;border-left:98px solid transparent;border-right:98px solid transparent;border-bottom:98px solid #1e6b34;"></div>
    <div style="position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:34px;height:38px;background:#6b3e26;border-radius:4px;"></div>
  `;
  area.appendChild(tree);

  // Huecos (posiciones en % del área)
  const spotPositions = [
    { x: 50, y: 22 }, { x: 39, y: 39 }, { x: 61, y: 39 },
    { x: 30, y: 56 }, { x: 50, y: 52 }, { x: 70, y: 56 },
    { x: 41, y: 69 }, { x: 59, y: 69 }
  ].slice(0, total);

  let placedCount = 0;
  let won = false;

  function updateHud() {
    hud.textContent = won ? '¡Árbol decorado!' : `Adornos colocados: ${placedCount} / ${total}`;
  }

  const spots = spotPositions.map((p, i) => {
    const s = document.createElement('div');
    s.dataset.index = String(i);
    s.dataset.filled = 'false';
    s.style.cssText = `position:absolute;left:${p.x}%;top:${p.y}%;width:34px;height:34px;transform:translate(-50%,-50%);border-radius:50%;border:2px dashed rgba(240,215,122,0.95);background:rgba(212,175,55,0.18);box-shadow:0 0 10px rgba(212,175,55,0.35);transition:opacity 0.15s ease;`;
    area.appendChild(s);
    return s;
  });

  const tray = document.createElement('div');
  tray.style.cssText = 'display:flex;flex-wrap:wrap;justify-content:center;gap:10px;padding:8px 4px;min-height:64px;width:100%;';
  root.appendChild(tray);

  let dragging = null; // { el, offsetX, offsetY }

  function onDown(e) {
    if (won) return;
    const el = e.currentTarget;
    e.preventDefault();

    // Si ya estaba colocado, liberar su hueco
    if (el.dataset.spotIndex != null) {
      const idx = Number(el.dataset.spotIndex);
      if (spots[idx]) {
        spots[idx].dataset.filled = 'false';
        spots[idx].style.opacity = '1';
      }
      delete el.dataset.spotIndex;
      el.style.transform = '';
      placedCount = Math.max(0, placedCount - 1);
      updateHud();
    }

    const rect = el.getBoundingClientRect();
    dragging = {
      el,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top
    };

    el.style.position = 'fixed';
    el.style.left = (e.clientX - dragging.offsetX) + 'px';
    el.style.top = (e.clientY - dragging.offsetY) + 'px';
    el.style.zIndex = '1000';
    el.style.cursor = 'grabbing';
    el.style.transform = 'scale(1.08)';
    document.body.appendChild(el);
    try { el.setPointerCapture(e.pointerId); } catch (_) {}
  }

  function onMove(e) {
    if (!dragging) return;
    e.preventDefault();
    dragging.el.style.left = (e.clientX - dragging.offsetX) + 'px';
    dragging.el.style.top = (e.clientY - dragging.offsetY) + 'px';
  }

  function onUp(e) {
    if (!dragging) return;
    const el = dragging.el;
    try { el.releasePointerCapture(e.pointerId); } catch (_) {}

    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    let snapped = false;
    for (let i = 0; i < spots.length; i++) {
      const s = spots[i];
      if (s.dataset.filled === 'true') continue;
      const sr = s.getBoundingClientRect();
      const sx = sr.left + sr.width / 2;
      const sy = sr.top + sr.height / 2;
      const dx = cx - sx;
      const dy = cy - sy;
      if (dx * dx + dy * dy < 42 * 42) {
        // Colocar en el hueco
        s.dataset.filled = 'true';
        s.style.opacity = '0';
        el.dataset.spotIndex = String(i);
        el.style.position = 'absolute';
        el.style.left = spotPositions[i].x + '%';
        el.style.top = spotPositions[i].y + '%';
        el.style.transform = 'translate(-50%,-50%)';
        el.style.zIndex = '5';
        el.style.cursor = 'grab';
        area.appendChild(el);
        placedCount++;
        try { sfx('pop'); } catch (_) {}
        updateHud();
        snapped = true;

        if (placedCount >= total && !won) {
          won = true;
          hint.textContent = '¡Ha quedado precioso!';
          try { sfx('success'); } catch (_) {}
          setTimeout(() => onWin && onWin(), 850);
        }
        break;
      }
    }

    if (!snapped) {
      // Volver a la bandeja
      el.style.position = '';
      el.style.left = '';
      el.style.top = '';
      el.style.zIndex = '';
      el.style.transform = '';
      el.style.cursor = 'grab';
      tray.appendChild(el);
    }

    dragging = null;
  }

  function makeOrnament(emoji) {
    const o = document.createElement('div');
    o.textContent = emoji;
    o.dataset.emoji = emoji;
    o.style.cssText = 'width:44px;height:44px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#fff7f7,#f2c6ce);border:2px solid #d4af37;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 4px 10px rgba(0,0,0,0.3);touch-action:none;cursor:grab;user-select:none;transition:transform 0.08s ease;';
    o.addEventListener('pointerdown', onDown);
    tray.appendChild(o);
    return o;
  }

  chosen.forEach((em) => makeOrnament(em));

  window.addEventListener('pointermove', onMove, { passive: false });
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);

  updateHud();

  return () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    if (dragging && dragging.el && dragging.el.parentElement) {
      try { dragging.el.remove(); } catch (_) {}
    }
  };
}
