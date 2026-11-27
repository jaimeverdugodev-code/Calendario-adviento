// Día 17: Une las Estrellas - arrastra para unir la figura y revela la foto
import { sfx } from '../js/audio.js';

export function startGame(container, config, onWin) {
  const cfg = config.gameConfig || {};
  const W = container.clientWidth || 360;
  const H = container.clientHeight || 420;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  canvas.style.touchAction = 'none';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const revealSrc = cfg.revealPhoto || config.photo || '';
  const revealImg = new Image();
  if (revealSrc) revealImg.src = revealSrc;

  // figura por defecto: corazón
  const defaultPoints = [
    { xPct: 0.50, yPct: 0.88 },
    { xPct: 0.34, yPct: 0.75 },
    { xPct: 0.20, yPct: 0.60 },
    { xPct: 0.14, yPct: 0.45 },
    { xPct: 0.16, yPct: 0.32 },
    { xPct: 0.25, yPct: 0.23 },
    { xPct: 0.37, yPct: 0.23 },
    { xPct: 0.50, yPct: 0.33 },
    { xPct: 0.63, yPct: 0.23 },
    { xPct: 0.75, yPct: 0.23 },
    { xPct: 0.84, yPct: 0.32 },
    { xPct: 0.86, yPct: 0.45 },
    { xPct: 0.80, yPct: 0.60 },
    { xPct: 0.66, yPct: 0.75 }
  ];
  const shape = Array.isArray(cfg.shapePoints) && cfg.shapePoints.length >= 4 ? cfg.shapePoints : defaultPoints;
  const points = shape.map((p, i) => ({ n: i + 1, x: p.xPct * W, y: p.yPct * H, hit: false }));

  let next = 1;
  let won = false;
  let wonAt = 0;
  let raf;
  let dragging = false;
  let pointer = null;

  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#050814'); g.addColorStop(1, '#121b2e');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 50; i++) ctx.fillRect((i * 73) % W, (i * 41) % H, 2, 2);

    // revela la foto al completar
    const revealAlpha = won ? Math.min(1, (Date.now() - wonAt) / 800) : 0;
    if (revealAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = revealAlpha;
      ctx.beginPath();
      points.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
      ctx.closePath();
      ctx.clip();
      if (revealImg.complete && revealImg.naturalWidth) {
        const iw = revealImg.naturalWidth, ih = revealImg.naturalHeight;
        const scale = Math.max(W / iw, H / ih);
        const dw = iw * scale, dh = ih * scale;
        ctx.drawImage(revealImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
      } else {
        ctx.fillStyle = '#f2c6ce'; ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = revealAlpha;
      ctx.beginPath();
      points.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
      ctx.closePath();
      ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 4; ctx.shadowColor = '#ffe082'; ctx.shadowBlur = 12; ctx.stroke();
      ctx.restore();
    }

    // líneas unidas
    ctx.strokeStyle = revealAlpha > 0.5 ? 'rgba(242,198,206,0.95)' : '#f2c6ce';
    ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    let started = false;
    let lastHit = null;
    for (const p of points) {
      if (!p.hit) break;
      if (!started) { ctx.moveTo(p.x, p.y); started = true; }
      else ctx.lineTo(p.x, p.y);
      lastHit = p;
    }
    if (won && points.length) ctx.closePath();
    ctx.stroke();

    // línea de arrastre hacia el dedo
    if (dragging && pointer && lastHit && !won && next <= points.length) {
      ctx.beginPath();
      ctx.moveTo(lastHit.x, lastHit.y);
      ctx.lineTo(pointer.x, pointer.y);
      ctx.strokeStyle = 'rgba(212,175,55,0.7)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // puntos
    for (const p of points) {
      const active = p.n === next && !won;
      ctx.beginPath();
      ctx.arc(p.x, p.y, active ? 14 : 11, 0, Math.PI * 2);
      ctx.fillStyle = p.hit ? '#d4af37' : (active ? '#b81d33' : '#3a4a6a');
      ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(p.n), p.x, p.y + 0.5);
      if (active) {
        ctx.beginPath(); ctx.arc(p.x, p.y, 19, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(212,175,55,0.65)'; ctx.lineWidth = 2; ctx.stroke();
      }
    }

    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(8, 8, W - 16, 34);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 15px "Plus Jakarta Sans",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const hint = won ? '¡Nuestra foto revelada! ❤' : (next === 1 ? 'Arrastra desde el 1 para unir las estrellas' : `Sigue arrastrando hasta el ${next}`);
    ctx.fillText(hint, W / 2, 25);

    raf = requestAnimationFrame(draw);
  }

  function toPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) };
  }

  function tryHitAt(pos) {
    if (won) return;
    // permite enganchar puntos en orden mientras se arrastra
    while (next <= points.length) {
      const target = points[next - 1];
      const dx = pos.x - target.x, dy = pos.y - target.y;
      if (dx * dx + dy * dy < 30 * 30) {
        target.hit = true;
        next++;
        try { sfx(next > points.length ? 'success' : 'pop'); } catch (e) {}
        if (next > points.length) {
          won = true;
          wonAt = Date.now();
          dragging = false;
          pointer = null;
          setTimeout(() => onWin && onWin(), 1500);
          return;
        }
      } else {
        break;
      }
    }
  }

  function onDown(e) {
    if (won) return;
    e.preventDefault();
    dragging = true;
    pointer = toPos(e);
    if (canvas.setPointerCapture) { try { canvas.setPointerCapture(e.pointerId); } catch (_) {} }
    tryHitAt(pointer);
  }
  function onMove(e) {
    if (!dragging || won) return;
    e.preventDefault();
    pointer = toPos(e);
    tryHitAt(pointer);
  }
  function onUp(e) {
    dragging = false;
    pointer = null;
    if (canvas.releasePointerCapture) { try { canvas.releasePointerCapture(e.pointerId); } catch (_) {} }
  }

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  raf = requestAnimationFrame(draw);

  return () => {
    cancelAnimationFrame(raf);
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerup', onUp);
    canvas.removeEventListener('pointercancel', onUp);
  };
}
