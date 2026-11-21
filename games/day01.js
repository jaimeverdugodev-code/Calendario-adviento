// Día 1: Flappy Love - esquiva 12 bastones de caramelo
import { sfx } from '../js/audio.js';
import { getMyAvatarForDay } from '../js/avatars.js';

export function startGame(container, config, onWin) {
  const target = (config.gameConfig && config.gameConfig.target) || 12;
  const W = container.clientWidth || 360;
  const H = container.clientHeight || 420;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const avatarImg = new Image();
  avatarImg.src = config.avatarMe || getMyAvatarForDay(config.day);

  let running = true;
  let started = false;
  let ended = false;
  let score = 0;
  let frames = 0;
  let raf;

  const bird = { x: W * 0.28, y: H * 0.45, r: 18, vy: 0 };
  const gravity = 0.085;
  const flap = -3.3;
  const pipes = [];
  const gap = 190;
  const pipeW = 54;
  const speed = 1.55;
  const spawnEvery = 145;

  function reset(full = true) {
    if (full) score = 0;
    bird.y = H * 0.45; bird.vy = 0;
    pipes.length = 0;
    frames = 0;
    started = false;
    ended = false;
  }

  function spawnPipe() {
    const margin = 70;
    const topH = margin + Math.random() * (H - gap - margin * 2 - 20);
    pipes.push({ x: W + 20, top: topH, passed: false });
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1b2742');
    g.addColorStop(1, '#2a3d2f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 30; i++) {
      const sx = (i * 97 + frames * 0.08) % W;
      const sy = (i * 53) % (H * 0.6);
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.fillStyle = '#fdf8f5';
    ctx.fillRect(0, H - 28, W, 28);
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(0, H - 28, W, 4);
  }

  function drawCandyCane(x, y, w, h, flip) {
    ctx.save();
    ctx.translate(x, y);
    if (flip) { ctx.translate(w, h); ctx.scale(-1, -1); }
    ctx.fillStyle = '#fff';
    roundRect(ctx, 0, 0, w, h, 8);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, 0, 0, w, h, 8);
    ctx.clip();
    ctx.strokeStyle = '#b81d33';
    ctx.lineWidth = 10;
    for (let s = -h; s < h * 2; s += 22) {
      ctx.beginPath();
      ctx.moveTo(-10, s);
      ctx.lineTo(w + 10, s + w + 20);
      ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    roundRect(ctx, 0, 0, w, h, 8);
    ctx.stroke();
    ctx.restore();
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

  function drawBird() {
    ctx.save();
    ctx.translate(bird.x, bird.y);
    const rot = Math.max(-0.4, Math.min(0.5, bird.vy / 12));
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.arc(0, 0, bird.r + 2, 0, Math.PI * 2);
    ctx.fillStyle = '#d4af37';
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, bird.r, 0, Math.PI * 2);
    ctx.clip();
    if (avatarImg.complete && avatarImg.naturalWidth) {
      ctx.drawImage(avatarImg, -bird.r, -bird.r, bird.r * 2, bird.r * 2);
    } else {
      ctx.fillStyle = '#f2c6ce';
      ctx.fill();
      ctx.fillStyle = '#b81d33';
      ctx.font = '16px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('❤', 0, 1);
    }
    ctx.restore();
    ctx.fillStyle = '#b81d33';
    ctx.beginPath();
    ctx.moveTo(-10, -bird.r + 4);
    ctx.lineTo(0, -bird.r - 12);
    ctx.lineTo(10, -bird.r + 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(-11, -bird.r + 2, 22, 5);
    ctx.beginPath(); ctx.arc(0, -bird.r - 12, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawHUD() {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(8, 8, 130, 34);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Bastones: ${score}/${target}`, 16, 25);
  }

  function drawOverlay(title, sub) {
    ctx.fillStyle = 'rgba(27,13,18,0.65)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 28px "Playfair Display", serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, H / 2 - 10);
    ctx.fillStyle = '#f2c6ce';
    ctx.font = '16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(sub, W / 2, H / 2 + 24);
  }

  function collide() {
    if (bird.y - bird.r < 0 || bird.y + bird.r > H - 28) return true;
    for (const p of pipes) {
      const inX = bird.x + bird.r > p.x && bird.x - bird.r < p.x + pipeW;
      if (!inX) continue;
      if (bird.y - bird.r < p.top || bird.y + bird.r > p.top + gap) return true;
    }
    return false;
  }

  function update() {
    if (!running) return;
    frames++;
    drawBackground();

    if (started && !ended) {
      bird.vy += gravity;
      bird.y += bird.vy;
      if (frames % spawnEvery === 0) spawnPipe();
      for (const p of pipes) {
        p.x -= speed;
        if (!p.passed && p.x + pipeW < bird.x) {
          p.passed = true;
          score++;
          try { sfx('score'); } catch (e) {}
          if (score >= target) {
            ended = true;
            drawPipes();
            drawBird();
            drawHUD();
            drawOverlay('¡Lo lograste!', 'Has esquivado todos los bastones');
            running = false;
            setTimeout(() => onWin && onWin(), 700);
            return;
          }
        }
      }
      while (pipes.length && pipes[0].x + pipeW < -10) pipes.shift();
      if (collide()) {
        ended = true;
        try { sfx('hit'); } catch (e) {}
        drawPipes();
        drawBird();
        drawHUD();
        drawOverlay('¡Casi!', 'Toca para intentarlo de nuevo');
      }
    }

    drawPipes();
    drawBird();
    drawHUD();
    if (!started) drawOverlay('Flappy Love', 'Toca para volar');
    raf = requestAnimationFrame(update);
  }

  function drawPipes() {
    for (const p of pipes) {
      drawCandyCane(p.x, 0, pipeW, p.top, false);
      const bottomY = p.top + gap;
      drawCandyCane(p.x, bottomY, pipeW, H - 28 - bottomY, true);
    }
  }

  function onPress(e) {
    e.preventDefault();
    if (!started) { started = true; bird.vy = flap; try { sfx('flap'); } catch (e) {} return; }
    if (ended) { reset(true); return; }
    bird.vy = flap;
    try { sfx('flap'); } catch (e) {}
  }

  canvas.addEventListener('pointerdown', onPress);
  update();

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    canvas.removeEventListener('pointerdown', onPress);
  };
}
