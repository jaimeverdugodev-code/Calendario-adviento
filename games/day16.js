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
  function makeBall(x, y, vx, vy, stuck) {
    return { x, y, r: 8, vx, vy, stuck: !!stuck, slowUntil: 0, speedFactor: 1 };
  }
  const balls = [makeBall(W / 2, H - 50, 3.4, -3.8, true)];
  const brickPad = 6, brickTop = 50;
  const brickW = (W - brickPad * (cols + 1)) / cols;
  const brickH = 20;
  const bricks = [];
  const buffs = []; // {x,y,vy,type}
  const buffTypes = ['wide', 'slow', 'multi'];
  const buffMeta = {
    wide:  { emoji: '↔️', color: '#2e7d32' },
    slow:  { emoji: '🐢', color: '#1565c0' },
    multi: { emoji: '💖', color: '#ad1457' }
  };

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

  function resetBalls() {
    balls.length = 0;
    balls.push(makeBall(paddle.x + paddle.w / 2, paddle.y - 8 - 2, (Math.random() > 0.5 ? 1 : -1) * 3.4, -3.8, true));
  }

  function resetPaddleAndBalls() {
    paddle.w = paddle.baseW;
    paddle.wideUntil = 0;
    clampPaddle();
    buffs.length = 0;
    resetBalls();
  }

  buildLevel(1);
  resetBalls();

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
    const meta = buffMeta[b.type] || { emoji: '?', color: '#666' };
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.fillStyle = meta.color;
    ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f0d77a'; ctx.lineWidth = 2; ctx.stroke();
    ctx.font = '14px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(meta.emoji, 0, 1);
    ctx.restore();
  }

  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1b2742'); g.addColorStop(1, '#1B0D12');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (let i=0;i<24;i++) ctx.fillRect((i*67)%W, (i*43)%H, 2, 2);

    for (const b of bricks) if (b.alive) {
      ctx.fillStyle = b.color;
      roundRect(b.x, b.y, b.w, b.h, 5); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(b.x + 3, b.y + 3, b.w - 6, 4);
      if (b.buff) {
        const meta = buffMeta[b.buff];
        if (meta) {
          ctx.font = '12px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(meta.emoji, b.x + b.w / 2, b.y + b.h / 2 + 1);
        }
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

    // balls (glow if piercing fall)
    for (const ball of balls) {
      if (ball.vy > 0 && !ball.stuck) {
        ctx.save(); ctx.shadowColor = '#ff6b81'; ctx.shadowBlur = 12;
        drawHeart(ball.x, ball.y - 6, 7.5, '#ff9fb0'); ctx.restore();
      } else {
        drawHeart(ball.x, ball.y - 6, 7, '#ff6b81');
      }
    }

    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(8, 8, W - 16, 34);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 13px "Plus Jakarta Sans",sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const hearts = '❤'.repeat(lives) + '♡'.repeat(Math.max(0, 3 - lives));
    ctx.fillText(`Nivel ${level}/${maxLevels}  ${hearts}`, 16, 25);

    const anyStuck = balls.some(b => b.stuck);
    if (anyStuck && !won && !lost) {
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
      for (const b of balls) { b.speedFactor = 0.7; b.slowUntil = now + 6000; }
    } else if (type === 'multi') {
      const source = balls.find(b => !b.stuck) || balls[0];
      if (source) {
        const baseAngle = Math.atan2(source.vy, source.vx || -0.001);
        const speed = Math.max(3.8, Math.hypot(source.vx, source.vy) || 4.2);
        const offsets = [-0.45, 0.45];
        for (const off of offsets) {
          const a = baseAngle + off;
          balls.push(makeBall(source.x, source.y, Math.cos(a) * speed, Math.sin(a) * speed, false));
        }
        if (source.stuck) {
          source.stuck = false;
          source.vx = Math.cos(baseAngle) * speed;
          source.vy = Math.sin(baseAngle) * speed;
        }
      }
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
    for (const b of balls) {
      if (b.slowUntil && now > b.slowUntil) { b.speedFactor = 1; b.slowUntil = 0; }
    }

    if (!won && !lost) {
      for (const ball of balls) {
        if (ball.stuck) {
          ball.x = paddle.x + paddle.w / 2;
          ball.y = paddle.y - ball.r - 2;
        }
      }

      const moving = balls.filter(b => !b.stuck);
      for (const ball of moving) {
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
      }

      // remove fallen balls
      for (let i = balls.length - 1; i >= 0; i--) {
        const b = balls[i];
        if (!b.stuck && b.y - b.r > H) balls.splice(i, 1);
      }
      if (balls.length === 0) {
        lives--;
        if (lives <= 0) {
          lost = true;
          running = false;
          draw();
          return;
        } else {
          resetPaddleAndBalls();
        }
      }

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
          resetPaddleAndBalls();
        } else {
          won = true;
          running = false;
          draw();
          setTimeout(() => onWin && onWin(), 700);
          return;
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
    if (!lost && !won) {
      for (const b of balls) if (b.stuck) b.stuck = false;
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.buttons === 0 && e.pointerType === 'mouse') return;
    setPaddle(e.clientX);
  });

  update();
  return () => { running = false; cancelAnimationFrame(raf); };
}
