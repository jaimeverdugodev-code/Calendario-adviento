// Día 24: El Regalo de Nochebuena - 3 fases con figuras más detalladas
import { getMyAvatarForDay } from '../js/avatars.js';

export function startGame(container, config, onWin) {
  const W = container.clientWidth || 360;
  const H = container.clientHeight || 420;
  const root = document.createElement('div');
  root.style.cssText = 'position:absolute;inset:0;';
  container.appendChild(root);

  let cleanup = null;

  function clear() {
    if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
    root.innerHTML = '';
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawBackground(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0f1e2e'); g.addColorStop(1, '#1B0D12');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // snow
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 40; i++) ctx.fillRect((i * 97 + (Date.now() / 30)) % W, (i * 53) % H, 2, 2);
    // floor
    ctx.fillStyle = '#fdf8f5';
    ctx.beginPath(); ctx.moveTo(0, H - 60); ctx.quadraticCurveTo(W / 2, H - 80, W, H - 60); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
  }

  function drawBox(ctx, cx, cy, bw, bh, lidLift) {
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(cx, cy + bh / 2 + 8, bw * 0.55, 12, 0, 0, Math.PI * 2); ctx.fill();
    // box body
    const x = cx - bw / 2, y = cy - bh / 2;
    const bodyGrad = ctx.createLinearGradient(x, y, x + bw, y + bh);
    bodyGrad.addColorStop(0, '#c62828'); bodyGrad.addColorStop(1, '#8e1b22');
    ctx.fillStyle = bodyGrad;
    roundRect(ctx, x, y + 18, bw, bh - 18, 8); ctx.fill();
    // lid
    const ly = y + lidLift;
    const lidGrad = ctx.createLinearGradient(x - 6, ly, x + bw + 6, ly + 26);
    lidGrad.addColorStop(0, '#d84343'); lidGrad.addColorStop(1, '#b81d33');
    ctx.fillStyle = lidGrad;
    roundRect(ctx, x - 6, ly, bw + 12, 26, 6); ctx.fill();
    // ribbon vertical
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(cx - 10, ly, 20, bh + lidLift);
    // ribbon horizontal
    ctx.fillRect(x - 6, y + bh / 2 + 2, bw + 12, 18);
    // ribbon highlights
    ctx.fillStyle = 'rgba(240,215,122,0.6)';
    ctx.fillRect(cx - 2, ly, 4, bh + lidLift);
    ctx.fillRect(x - 6, y + bh / 2 + 6, bw + 12, 4);
  }

  function drawBow(ctx, cx, topY, scale, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, topY);
    ctx.scale(scale, scale);
    ctx.strokeStyle = '#f0d77a'; ctx.lineWidth = 10; ctx.lineCap = 'round';
    ctx.fillStyle = '#d4af37';
    // loops
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-70, -50, -50, -90, 0, -40); ctx.bezierCurveTo(50, -90, 70, -50, 0, 0); ctx.fill();
    ctx.strokeStyle = '#f0d77a'; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-55, 10, -70, -40, -20, -30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(55, 10, 70, -40, 20, -30); ctx.stroke();
    // tails
    ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-6, 4); ctx.quadraticCurveTo(-30, 40, -18, 70); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6, 4); ctx.quadraticCurveTo(30, 40, 18, 70); ctx.stroke();
    // knot
    ctx.fillStyle = '#f0d77a';
    ctx.beginPath(); ctx.arc(0, -6, 12, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function startPhase1() {
    clear();
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H; canvas.style.cssText = 'width:100%;height:100%;touch-action:none;display:block;';
    root.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let progress = 0;
    let last = null;
    let done = false;

    function draw() {
      drawBackground(ctx);
      const cx = W / 2, cy = H / 2 + 30;
      drawBox(ctx, cx, cy, 170, 130, 0);
      const alpha = Math.max(0, 1 - progress / 100);
      drawBow(ctx, cx, cy - 65, 1, alpha);

      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(12, 12, W - 24, 54);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 16px "Plus Jakarta Sans",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('Fase 1: Desliza para desatar el lazo', W / 2, 28);
      ctx.fillStyle = '#d4af37'; ctx.fillText(`${Math.min(100, Math.floor(progress))}%`, W / 2, 50);
      if (done) { ctx.fillStyle = '#f2c6ce'; ctx.fillText('¡Lazo desatado!', W / 2, H - 18); }
    }

    function pos(e) { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) }; }
    function down(e) { if (done) return; last = pos(e); }
    function move(e) { if (!last || done) return; e.preventDefault(); const p = pos(e); const d = Math.hypot(p.x - last.x, p.y - last.y); progress += d * 0.35; last = p; if (progress >= 100) { done = true; draw(); setTimeout(startPhase2, 800); return; } draw(); }
    function up() { last = null; }
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    draw();
    cleanup = () => { canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }

  function startPhase2() {
    clear();
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H; canvas.style.cssText = 'width:100%;height:100%;touch-action:none;display:block;';
    root.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let taps = 0, needed = 8, lidLift = 0, opened = false;

    function draw() {
      drawBackground(ctx);
      const cx = W / 2, cy = H / 2 + 30;
      drawBox(ctx, cx, cy, 170, 130, lidLift);
      // glow inside when opening
      if (lidLift < -10) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, (-lidLift) / 50);
        const glow = ctx.createRadialGradient(cx, cy - 40, 10, cx, cy - 40, 80);
        glow.addColorStop(0, 'rgba(240,215,122,0.9)'); glow.addColorStop(1, 'rgba(240,215,122,0)');
        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy - 40, 90, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(12, 12, W - 24, 54);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 16px "Plus Jakarta Sans",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(opened ? '¡Caja abierta!' : 'Fase 2: Toca la caja para abrirla', W / 2, 28);
      ctx.fillStyle = '#d4af37'; ctx.fillText(`${taps} / ${needed}`, W / 2, 50);
    }

    canvas.addEventListener('pointerdown', () => {
      if (opened) return;
      taps++;
      lidLift = -Math.min(55, taps * 7);
      draw();
      if (taps >= needed) {
        opened = true;
        draw();
        setTimeout(startPhase3, 800);
      }
    });
    draw();
    cleanup = () => {};
  }

  function startPhase3() {
    clear();
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H; canvas.style.cssText = 'width:100%;height:100%;touch-action:none;display:block;';
    root.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const meImg = new Image(); meImg.src = getMyAvatarForDay(config.day);
    const youImg = new Image(); youImg.src = 'public/avatars/pareja.png';
    let hits = 0, needed = 10, won = false, raf;
    let pinata = { x: W / 2, y: 130, r: 42, phase: 0 };
    let particles = [];
    let confetti = [];
    let shake = 0;

    function spawnBurst(x, y, n = 10) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 1.5 + Math.random() * 3.5;
        particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1, life: 1, color: ['#b81d33', '#f2c6ce', '#d4af37'][i % 3], size: 6 + Math.random() * 6 });
      }
    }
    function spawnWinConfetti() {
      for (let i = 0; i < 60; i++) {
        confetti.push({ x: pinata.x, y: pinata.y, vx: (Math.random() * 2 - 1) * 5, vy: -Math.random() * 6 - 2, life: 1, color: ['#b81d33', '#d4af37', '#f2c6ce', '#2e7d32', '#fdf8f5'][i % 5], w: 4 + Math.random() * 5, h: 6 + Math.random() * 6, rot: Math.random() * Math.PI });
      }
    }

    function drawAvatar(img, x, y, r, border) {
      ctx.save();
      ctx.beginPath(); ctx.arc(x, y, r + 3, 0, Math.PI * 2); ctx.fillStyle = border; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
      if (img.complete && img.naturalWidth) ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
      else { ctx.fillStyle = '#f2c6ce'; ctx.fill(); }
      ctx.restore();
    }

    function drawStarPinata(x, y, r, broken) {
      ctx.save(); ctx.translate(x, y);
      const spikes = 7;
      const outer = r, inner = r * 0.45;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const rad = (i % 2 === 0 ? outer : inner);
        const a = -Math.PI / 2 + (i * Math.PI) / spikes;
        const px = Math.cos(a) * rad, py = Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      const grad = ctx.createRadialGradient(-10, -10, 5, 0, 0, r);
      grad.addColorStop(0, broken ? '#ffe082' : '#ffd54f');
      grad.addColorStop(1, broken ? '#d4af37' : '#ff8f00');
      ctx.fillStyle = grad; ctx.fill();
      ctx.strokeStyle = '#b81d33'; ctx.lineWidth = 3; ctx.stroke();
      // paper fringe lines
      ctx.strokeStyle = 'rgba(184,29,51,0.5)'; ctx.lineWidth = 2;
      for (let i = 0; i < spikes; i++) {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / spikes;
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner); ctx.lineTo(Math.cos(a) * (outer - 6), Math.sin(a) * (outer - 6)); ctx.stroke();
      }
      // center decoration
      ctx.fillStyle = '#b81d33'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fdf8f5'; ctx.font = 'bold 12px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('❤', 0, 1);
      ctx.restore();
    }

    function draw() {
      ctx.save();
      if (shake > 0) ctx.translate((Math.random() * 2 - 1) * shake, (Math.random() * 2 - 1) * shake);
      drawBackground(ctx);

      // rope
      ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.quadraticCurveTo(W / 2 + (pinata.x - W / 2) * 0.3, 50, pinata.x, pinata.y - pinata.r); ctx.stroke();

      if (!won) drawStarPinata(pinata.x, pinata.y, pinata.r, false);
      else drawStarPinata(pinata.x, pinata.y, pinata.r * 0.7, true);

      // particles
      for (const p of particles) {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2); ctx.fill();
      }
      for (const c of confetti) {
        ctx.save(); ctx.globalAlpha = Math.max(0, c.life);
        ctx.translate(c.x, c.y); ctx.rotate(c.rot);
        ctx.fillStyle = c.color; ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      // avatars
      drawAvatar(meImg, W / 2 - 42, H - 72, 28, '#d4af37');
      drawAvatar(youImg, W / 2 + 42, H - 72, 28, '#d4af37');
      ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('❤', W / 2, H - 72);

      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(12, 12, W - 24, 54);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 16px "Plus Jakarta Sans",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(won ? '¡Sorpresa de amor!' : 'Fase 3: Toca la piñata', W / 2, 28);
      ctx.fillStyle = '#d4af37'; ctx.fillText(`${hits} / ${needed}`, W / 2, 50);
      ctx.restore();
    }

    function update() {
      pinata.phase += 0.03;
      pinata.x = W / 2 + Math.sin(pinata.phase) * 55;
      if (shake > 0) shake *= 0.85;
      for (const p of particles) { p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.life -= 0.02; }
      for (const c of confetti) { c.x += c.vx; c.y += c.vy; c.vy += 0.12; c.vx *= 0.99; c.rot += 0.1; c.life -= 0.012; }
      for (let i = particles.length - 1; i >= 0; i--) if (particles[i].life <= 0) particles.splice(i, 1);
      for (let i = confetti.length - 1; i >= 0; i--) if (confetti[i].life <= 0) confetti.splice(i, 1);
      draw();
      raf = requestAnimationFrame(update);
    }

    canvas.addEventListener('pointerdown', (e) => {
      if (won) return;
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) * (W / r.width);
      const y = (e.clientY - r.top) * (H / r.height);
      if (Math.hypot(x - pinata.x, y - pinata.y) < pinata.r + 12) {
        hits++; shake = 6; spawnBurst(x, y, 8);
        if (hits >= needed) {
          won = true; spawnBurst(pinata.x, pinata.y, 30); spawnWinConfetti();
          setTimeout(() => { cancelAnimationFrame(raf); draw(); setTimeout(() => onWin && onWin(), 1200); }, 500);
        }
      }
    });
    update();
    cleanup = () => { cancelAnimationFrame(raf); };
  }

  startPhase1();
  return () => clear();
}
