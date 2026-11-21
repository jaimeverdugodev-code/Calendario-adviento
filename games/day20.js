// Día 20: ¿Dónde está mi amor? - escena tipo "buscando a Wally"
import { sfx } from '../js/audio.js';

export const dia20 = {
  title: "Día 20: ¿Dónde está mi amor?",
  description: "¡Encuentra a mi amor entre la gran multitud del mercadillo navideño! Toca sobre él cuando lo veas.",
  photo: "public/wally/escena.jpg", // Asegúrate de guardar aquí la imagen
  gameConfig: {
    scene: "public/wally/escena.jpg",
    target: { xPct: 0.68, yPct: 0.53, rPct: 0.045 }, // Coordenadas del objetivo (hombre con gafas y jersey navideño junto al puesto rojo)
    hint: "Busca a tu amor (el de las gafas y jersey navideño) cerca de una de las casetas del mercadillo..."
  }
};

export function startGame(container, config, onWin) {
  const cfg = config.gameConfig || {};
  const hint = cfg.hint || 'Busca y toca el detalle escondido';
  const target = cfg.target || { xPct: 0.68, yPct: 0.53, rPct: 0.045 };

  const W = container.clientWidth || 360;
  const H = container.clientHeight || 420;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const candidates = [
    cfg.scene,
    'public/wally/escena.jpg',
    'public/wally/escena.png',
    'public/wally/escena.webp',
    'public/wally/wally.jpg',
    'public/wally/wally.png',
    config.photo
  ].filter(Boolean);
  let cIdx = 0;
  const img = new Image();
  let imgReady = false;

  function tryNext() {
    if (cIdx < candidates.length) {
      imgReady = false;
      img.src = candidates[cIdx++];
    }
  }
  img.onload = () => { imgReady = true; };
  img.onerror = () => { tryNext(); };
  tryNext();

  let won = false;
  let wrongFlash = 0;
  let raf;

  function getImageRect() {
    const iw = (imgReady && img.naturalWidth) ? img.naturalWidth : W;
    const ih = (imgReady && img.naturalHeight) ? img.naturalHeight : H;
    const scale = Math.min(W / iw, H / ih);
    const dw = iw * scale, dh = ih * scale;
    const dx = (W - dw) / 2, dy = (H - dh) / 2;
    return { dx, dy, dw, dh };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0f1e19'); bg.addColorStop(1, '#1B0D12');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const r = getImageRect();
    if (imgReady && img.naturalWidth) {
      ctx.drawImage(img, r.dx, r.dy, r.dw, r.dh);
      ctx.strokeStyle = 'rgba(212,175,55,0.6)'; ctx.lineWidth = 3;
      ctx.strokeRect(r.dx, r.dy, r.dw, r.dh);
    } else {
      ctx.fillStyle = '#2c1a1d'; ctx.fillRect(r.dx, r.dy, r.dw, r.dh);
      ctx.strokeStyle = 'rgba(212,175,55,0.4)'; ctx.lineWidth = 2; ctx.strokeRect(r.dx, r.dy, r.dw, r.dh);
      ctx.fillStyle = '#f2c6ce'; ctx.font = '15px "Plus Jakarta Sans",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('Coloca tu imagen en', W / 2, H / 2 - 10);
      ctx.fillStyle = '#d4af37'; ctx.font = 'bold 14px "Plus Jakarta Sans",sans-serif';
      ctx.fillText('public/wally/escena.jpg', W / 2, H / 2 + 14);
    }

    if (wrongFlash > 0) {
      ctx.fillStyle = `rgba(184,29,51,${0.25 * wrongFlash})`;
      ctx.fillRect(0, 0, W, H);
      wrongFlash *= 0.85;
      if (wrongFlash < 0.02) wrongFlash = 0;
    }

    ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(8, 8, W - 16, 42);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 13px "Plus Jakarta Sans",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(won ? '¡Lo encontraste! ❤' : hint, W / 2, 29);

    if (!won) {
      ctx.fillStyle = 'rgba(253,248,245,0.85)'; ctx.font = '11px "Plus Jakarta Sans",sans-serif';
      ctx.fillText('Toca la zona correcta en la imagen', W / 2, H - 14);
    }

    if (won) {
      const tx = r.dx + target.xPct * r.dw;
      const ty = r.dy + target.yPct * r.dh;
      const tr = target.rPct * Math.min(r.dw, r.dh);
      ctx.beginPath(); ctx.arc(tx, ty, tr, 0, Math.PI * 2);
      ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 4; ctx.stroke();
      ctx.beginPath(); ctx.arc(tx, ty, tr + 6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(212,175,55,0.5)'; ctx.lineWidth = 2; ctx.stroke();
    }

    raf = requestAnimationFrame(draw);
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (won) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    const r = getImageRect();
    if (x < r.dx || x > r.dx + r.dw || y < r.dy || y > r.dy + r.dh) return;
    const tx = r.dx + target.xPct * r.dw;
    const ty = r.dy + target.yPct * r.dh;
    const tr = target.rPct * Math.min(r.dw, r.dh);
    const dx = x - tx, dy = y - ty;
    if (dx * dx + dy * dy <= tr * tr) {
      won = true;
      try { sfx('success'); } catch (e) {}
      setTimeout(() => onWin && onWin(), 800);
    } else {
      wrongFlash = 1;
      try { sfx('tap'); } catch (e) {}
    }
  });

  raf = requestAnimationFrame(draw);
  return () => { cancelAnimationFrame(raf); };
}