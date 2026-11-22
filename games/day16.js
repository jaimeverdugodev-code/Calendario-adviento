// Día 16: Rompeladrillos de Amor - 3 niveles, 3 vidas, buffs y bola perforante al caer (v2)
export function startGame(container, config, onWin) {
  const baseRows = (config.gameConfig && config.gameConfig.rows) || 3;
  const cols = (config.gameConfig && config.gameConfig.cols) || 6;
  const W = container.clientWidth || 360;
  const H = container.clientHeight || 420;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const avatar = new Image(); avatar.src = 'public/avatars/pareja.png';
  let running = true, won = false, lost = false, raf;

  const paddle = { baseW: 74, w: 74, h: 16, x: W / 2 - 37, y: H - 30, wideUntil: 0 };
  const ball = { x: W / 2, y: H - 50, r: 8, vx: 3.4, vy: -3.8, stuck: true, slowUntil: 0, speedFactor: 1 };
  const brickPad = 6, brickTop = 50;
  const brickW = (W - brickPad * (cols + 1)) / cols;
  const brickH = 20;
  const bricks = [];
  const buffs = []; // {x,y,vy,type}
  const buffTypes = ['wide', 'slow'];

  let lives = 3;
  let level = 1;
  const maxLevels = 3;
  const levelRows = [baseRows, baseRows + 1, baseRows + 2];

  function buildLevel(lvl) {
    bricks.length = 0;
    buffs.length = 0;
    const rCount = levelRows[Math.min(lvl - 1, levelRows.length - 1)] || baseRows;
    for (let r = 0; r < rCount; r++) for (let c = 0; c < cols; c++) {
      const hasBuff = Math.random() < 0.22;
      bricks.push({
        x: brickPad + c * (brickW + brickPad),
        y: brickTop + r * (brickH + brickPad),
        w: brickW, h: brickH, alive: true,
        color: ['#b81d33', '#d4af37', '#f2c6ce'][(r + c) % 3],
        buff: hasBuff ? buffTypes[Math.floor(Math.random() * buffTypes.length)] : null
      });
    }
  }

  function clampPaddle() {
    paddle.x = Math.max(0, Math.min(W - paddle.w, paddle.x));
  }

  function resetBall() {
    ball.x = paddle.x + paddle.w / 2; ball.y = paddle.y - ball.r - 2;
    ball.vx = (Math.random() > 0.5 ? 1 : -1) * 3.4; ball.vy = -3.8; ball.stuck = true;
    ball.speedFactor = 1; ball.slowUntil = 0;
  }

  function resetPaddleAndBall() {
    paddle.w = paddle.baseW;
    paddle.wideUntil = 0;
    clampPaddle();
    buffs.length = 0;
    resetBall();
  }

  buildLevel(1);
  resetBall();

  function drawHeart(x, y, r, color) {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = color;
    ctx.beginPath();
    const s = r / 8;
    ctx.moveTo(0, 3 * s);
    ctx.bezierCurveTo(0, 0, -8 * s, 0, -8 * s, 5 * s);
    ctx.bezierCurveTo(-8 * s, 9 * s, 0, 12 * s, 0, 15 * s);
    ctx.bezierCurveTo(0, 12 * s, 8 * s, 9 * s, 8 * s, 5 * s);
    ctx.bezierCurveTo(8 * s, 0, 0, 0, 0, 3 * s);
    ctx.fill(); ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawBuff(b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.fillStyle = b.type === 'wide' ? '#2e7d32' : '#1565c0';
    ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f0d77a'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(b.type === 'wide' ? 'W' : 'S', 0, 1);
    ctx.restore();
  }

  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1b2742'); g.addColorStop(1, '#1B0D12');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    for (const b of bricks) if (b.alive) {
      ctx.fillStyle = b.color;
      roundRect(b.x, b.y, b.w, b.h, 5); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(b.x + 3, b.y + 3, b.w - 6, 4);
      if (b.buff) {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(b.buff === 'wide' ? 'W' : 'S', b.x + b.w / 2, b.y + b.h / 2 + 1);
      }
    }

    for (const b of buffs) drawBuff(b);

    // paddle
    ctx.save();
    roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 8);
    ctx.fillStyle = '#d4af37'; ctx.fill();
    ctx.beginPath(); ctx.arc(paddle.x + paddle.w / 2, paddle.y + paddle.h / 2, 12, 0, Math.PI * 2); ctx.clip();
    if (avatar.complete && avatar.naturalWidth) ctx.drawImage(avatar, paddle.x + paddle.w / 2 - 12, paddle.y + paddle.h / 2 - 12, 24, 24);
    ctx.restore();

    // ball (glow if piercing fall)
    if (ball.vy > 0 && !ball.stuck) {
      ctx.save(); ctx.shadowColor = '#ff6b81'; ctx.shadowBlur = 12;
      drawHeart(ball.x, ball.y - 6, 7.5, '#ff9fb0'); ctx.restore();
    } else {
      drawHeart(ball.x, ball.y - 6, 7, '#ff6b81');
    }

    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(8, 8, W - 16, 34);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 13px "Plus Jakarta Sans",sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const hearts = '❤'.repeat(lives) + '♡'.repeat(Math.max(0, 3 - lives));
    ctx.fillText(`Nivel ${level}/${maxLevels}  ${hearts}`, 16, 25);
    ctx.textAlign = 'right';
    ctx.fillStyle = ball.vy > 0 && !ball.stuck ? '#ff9fb0' : '#f2c6ce';
    ctx.fillText(ball.vy > 0 && !ball.stuck ? 'Perforador' : 'Atrapa buffs', W - 16, 25);

    if (ball.stuck && !won && !lost) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, H / 2 - 26, W, 52);
      ctx.fillStyle = '#f2c6ce'; ctx.font = '16px "Plus Jakarta Sans",sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Toca para lanzar el corazón', W / 2, H / 2 + 6);
    }
    if (won || lost) {
      ctx.fillStyle = 'rgba(27,13,18,0.65)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#d4af37'; ctx.font = 'bold 28px "Playfair Display",serif'; ctx.textAlign = 'center';
      ctx.fillText(won ? '¡Completaste los 3 niveles!' : '¡Sin vidas!', W / 2, H / 2);
      if (lost) { ctx.fillStyle = '#f2c6ce'; ctx.font = '16px "Plus Jakarta Sans",sans-serif'; ctx.fillText('Toca reintentar', W / 2, H / 2 + 26); }
    }
  }

  function applyBuff(type) {
    const now = Date.now();
    if (type === 'wide') {
      paddle.w = paddle.baseW + 36;
      paddle.wideUntil = now + 8000;
      clampPaddle();
      paddle.x = Math.max(0, Math.min(W - paddle.w, paddle.x - 18));
    } else if (type === 'slow') {
      ball.speedFactor = 0.7;
      ball.slowUntil = now + 6000;
    }
  }

  let lastTime = 0;
  function update(time = 0) {
    if (!running) return;
    const dt = lastTime ? Math.min((time - lastTime) / (1000 / 60), 2) : 1;
    lastTime = time;
    const now = Date.now();
    if (paddle.wideUntil && now > paddle.wideUntil) {
      paddle.w = paddle.baseW;
      paddle.wideUntil = 0;
      clampPaddle();
    }
    if (ball.slowUntil && now > ball.slowUntil) { ball.speedFactor = 1; ball.slowUntil = 0; }

    if (!won && !lost) {
      if (ball.stuck) {
        ball.x = paddle.x + paddle.w / 2; ball.y = paddle.y - ball.r - 2;
      } else {
        ball.x += ball.vx * ball.speedFactor * dt;
        ball.y += ball.vy * ball.speedFactor * dt;
        if (ball.x - ball.r < 0) { ball.x = ball.r; ball.vx *= -1; }
        if (ball.x + ball.r > W) { ball.x = W - ball.r; ball.vx *= -1; }
        if (ball.y - ball.r < 0) { ball.y = ball.r; ball.vy *= -1; }

        // paddle
        if (ball.vy > 0 && ball.y + ball.r >= paddle.y && ball.y - ball.r <= paddle.y + paddle.h && ball.x >= paddle.x && ball.x <= paddle.x + paddle.w) {
          ball.y = paddle.y - ball.r;
          const hit = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
          ball.vx = hit * 4.8;
          ball.vy = -Math.max(3.8, Math.abs(ball.vy));
        }

        // bricks: perfora al caer (vy > 0), rebota al subir
        let bounce = false;
        for (const b of bricks) if (b.alive) {
          if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w && ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {
            b.alive = false;
            if (b.buff) buffs.push({ x: b.x + b.w / 2, y: b.y + b.h / 2, vy: 1.8, type: b.buff });
            if (ball.vy < 0) bounce = true; // solo rebota al subir
          }
        }
        if (bounce) ball.vy *= -1;

        // buffs falling
        for (let i = buffs.length - 1; i >= 0; i--) {
          const f = buffs[i];
          f.y += f.vy * dt;
          if (f.y + 10 >= paddle.y && f.y - 10 <= paddle.y + paddle.h && f.x >= paddle.x && f.x <= paddle.x + paddle.w) {
            applyBuff(f.type); buffs.splice(i, 1); continue;
          }
          if (f.y - 12 > H) buffs.splice(i, 1);
        }

        if (bricks.every(b => !b.alive)) {
          if (level < maxLevels) {
            level++;
            buildLevel(level);
            resetPaddleAndBall();
          } else {
            won = true;
            running = false;
            draw();
            setTimeout(() => onWin && onWin(), 700);
            return;
          }
        }

        if (ball.y - ball.r > H) {
          lives--;
          if (lives <= 0) {
            lost = true;
            running = false;
            draw();
            return;
          } else {
            resetPaddleAndBall();
          }
        }
      }
    }

    draw();
    raf = requestAnimationFrame(update);
  }

  function setPaddle(clientX) {
    const r = canvas.getBoundingClientRect();
    const x = (clientX - r.left) * (W / r.width);
    paddle.x = Math.max(0, Math.min(W - paddle.w, x - paddle.w / 2));
  }

  canvas.addEventListener('pointerdown', (e) => {
    setPaddle(e.clientX);
    if (ball.stuck && !lost && !won) { ball.stuck = false; }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.buttons === 0 && e.pointerType === 'mouse') return;
    setPaddle(e.clientX);
  });

  update();
  return () => { running = false; cancelAnimationFrame(raf); };
}
