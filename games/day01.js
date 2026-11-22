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
  let spawnTimer = 0;
  let lastTime = 0;
  let raf;

  const bird = { x: W * 0.28, y: H * 0.45, r: 18, vy: 0 };
  // Física ajustada para sentirse igual en móvil/desktop (independiente de FPS)
  const gravity = 0.32;
  const flap = -6.0;
  const pipes = [];
  const baseGap = 220;
  const minGap = 140;
  const pipeW = 40;
  const speed = 4;
  const spawnInterval = 105 * (1000 / 60);

  function reset(full = true) {
    if (full) score = 0;
    bird.y = H * 0.45; bird.vy = 0;
    pipes.length = 0;
    frames = 0;
    spawnTimer = 0;
    lastTime = 0;
    started = false;
    ended = false;
  }

  function spawnPipe() {
    const margin = 70;
    const gap = Math.max(minGap, baseGap - score * 8);
    const topH = margin + Math.random() * (H - gap - margin * 2 - 20);
    pipes.push({ x: W + 20, top: topH, gap, passed: false });
  }

  const cityImg = new Image();
  let cityReady = false;
  cityImg.onload = () => { cityReady = true; };
  cityImg.src = 'public/bg-village.svg';

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1b2742');
    g.addColorStop(1, '#2a3d2f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // ciudad de fondo moviéndose
    if (cityReady && cityImg.naturalWidth) {
      const scale = Math.max(H / cityImg.naturalHeight, (W * 1.2) / cityImg.naturalWidth);
      const dw = cityImg.naturalWidth * scale;
      const dh = cityImg.naturalHeight * scale;
      const y = H - dh + 10;
      const offset = (frames * 0.6) % dw;
      ctx.globalAlpha = 0.45;
      ctx.drawImage(cityImg, -offset, y, dw, dh);
      ctx.drawImage(cityImg, -offset + dw, y, dw, dh);
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(27,13,18,0.25)';
      ctx.fillRect(0, 0, W, H);
    }

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
      const pGap = p.gap || baseGap;
      if (bird.y - bird.r < p.top || bird.y + bird.r > p.top + pGap) return true;
    }
    return false;
  }

  function update(time = 0) {
    if (!running) return;
    const dt = lastTime ? Math.min((time - lastTime) / (1000 / 60), 2.2) : 1;
    lastTime = time;
    frames += dt;
    drawBackground();

    if (started && !ended) {
      bird.vy += gravity * dt;
      bird.y += bird.vy * dt;
      spawnTimer += dt * (1000 / 60);
      if (spawnTimer >= spawnInterval) {
        spawnPipe();
        spawnTimer -= spawnInterval;
      }
      for (const p of pipes) {
        p.x -= speed * dt;
        if (!p.passed && p.x + pipeW < bird.x) {
          p.passed = true;
          score++;
          try {
            const a = new Audio('public/audio/pipe.mp3');
            a.volume = 0.65;
            a.play().catch(() => sfx('pipe'));
          } catch (e) { try { sfx('pipe'); } catch (_) {} }
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
      const pGap = p.gap || baseGap;
      drawCandyCane(p.x, 0, pipeW, p.top, false);
      const bottomY = p.top + pGap;
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
