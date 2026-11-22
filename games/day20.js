// Día 20: Cupido al Blanco - un corazón a la vez, 10 aciertos, 3 vidas
import { sfx } from '../js/audio.js';
import { getMyAvatarForDay } from '../js/avatars.js';

export function startGame(container, config, onWin) {
  const targetHits = (config.gameConfig && config.gameConfig.targetHits) || 10;
  const W = container.clientWidth || 360;
  const H = container.clientHeight || 420;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  canvas.style.touchAction = 'none';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const avatar = new Image();
  avatar.src = getMyAvatarForDay(config.day);

  let running = true, won = false, ended = false;
  let score = 0;
  let lives = 3;
  let spawned = 0;
  let raf;
  let lastTime = 0;
  const arrows = []; // {x,y,vx,vy}
  const targets = []; // {x,y,r,vx,vy}
  const pops = []; // {x,y,t,text}

  function spawnTarget() {
    if (ended || won) return;
    if (targets.length >= 1) return;
    if (spawned >= targetHits) return;
    const r = 18 + Math.random() * 6;
    const side = Math.random() < 0.5 ? -1 : 1;
    const y = 65 + Math.random() * (H * 0.42);
    const speed = 1.7 + spawned * 0.22; // progresivo, controlado
    targets.push({
      x: side < 0 ? -r - 12 : W + r + 12,
      y,
      r,
      vx: speed * -side,
      vy: (Math.random() - 0.5) * 0.45
    });
    spawned += 1;
  }

  function shoot(tx, ty) {
    if (won || ended) return;
    const origin = { x: W / 2, y: H - 38 };
    const dx = tx - origin.x;
    const dy = ty - origin.y;
    const len = Math.hypot(dx, dy) || 1;
    const speed = 8.5;
    arrows.push({ x: origin.x, y: origin.y - 8, vx: (dx / len) * speed, vy: (dy / len) * speed });
    try { sfx('tap'); } catch (e) {}
  }

  function drawHeart(x, y, r, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    const s = r / 8;
    ctx.moveTo(0, 3 * s);
    ctx.bezierCurveTo(0, 0, -8 * s, 0, -8 * s, 5 * s);
    ctx.bezierCurveTo(-8 * s, 9 * s, 0, 12 * s, 0, 15 * s);
    ctx.bezierCurveTo(0, 12 * s, 8 * s, 9 * s, 8 * s, 5 * s);
    ctx.bezierCurveTo(8 * s, 0, 0, 0, 0, 3 * s);
    ctx.fill();
    ctx.restore();
  }

  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1b2742');
    g.addColorStop(1, '#1B0D12');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // stars
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 35; i++) ctx.fillRect((i * 97) % W, (i * 53) % (H * 0.6), 2, 2);

    // targets
    for (const t of targets) {
      drawHeart(t.x, t.y - 6, t.r / 2.2, '#ff6b81');
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r + 2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(212,175,55,0.45)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // arrows
    for (const a of arrows) {
      ctx.save();
      ctx.translate(a.x, a.y);
      const ang = Math.atan2(a.vy, a.vx);
      ctx.rotate(ang);
      ctx.strokeStyle = '#f0d77a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-14, 0); ctx.lineTo(10, 0);
      ctx.stroke();
      ctx.fillStyle = '#ff6b81';
      ctx.beginPath();
      ctx.moveTo(14, 0); ctx.lineTo(6, -4); ctx.lineTo(6, 4);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    // pops
    for (const p of pops) {
      ctx.globalAlpha = Math.max(0, p.t / 20);
      ctx.fillStyle = '#f2c6ce';
      ctx.font = 'bold 16px "Plus Jakarta Sans",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.text || '+1', p.x, p.y);
      ctx.globalAlpha = 1;
    }

    // shooter base
    ctx.fillStyle = '#2c1a1d';
    ctx.fillRect(W/2 - 34, H - 32, 68, 24);
    ctx.strokeStyle = '#d4af37';
    ctx.strokeRect(W/2 - 34, H - 32, 68, 24);

    // avatar
    ctx.save();
    ctx.beginPath(); ctx.arc(W/2, H - 44, 20, 0, Math.PI*2);
    ctx.fillStyle = '#d4af37'; ctx.fill();
    ctx.beginPath(); ctx.arc(W/2, H - 44, 17, 0, Math.PI*2); ctx.clip();
    if (avatar.complete && avatar.naturalWidth) ctx.drawImage(avatar, W/2 - 17, H - 61, 34, 34);
    else { ctx.fillStyle = '#f2c6ce'; ctx.fillRect(W/2 - 17, H - 61, 34, 34); }
    ctx.restore();

    // HUD
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(8, 8, W - 16, 36);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px "Plus Jakarta Sans",sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(`Dianas: ${score}/${targetHits}`, 16, 26);
    ctx.textAlign = 'right'; ctx.fillStyle = '#f2c6ce';
    ctx.fillText('❤'.repeat(Math.max(0, lives)) + '♡'.repeat(Math.max(0, 3 - lives)), W - 16, 26);

    if (won || ended) {
      ctx.fillStyle = 'rgba(27,13,18,0.65)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#d4af37'; ctx.font = 'bold 30px "Playfair Display",serif'; ctx.textAlign = 'center';
      ctx.fillText(won ? '¡Puntería perfecta!' : '¡Te quedaste sin vidas!', W/2, H/2 - 6);
      ctx.fillStyle = '#f2c6ce'; ctx.font = '16px "Plus Jakarta Sans",sans-serif';
      ctx.fillText(won ? 'Cupido estaría orgulloso' : 'Pulsa reintentar', W/2, H/2 + 24);
    }
  }

  function update(time = 0) {
    if (!running) return;
    const dt = lastTime ? Math.min((time - lastTime) / (1000 / 60), 2) : 1;
    lastTime = time;

    if (!won && !ended) {
      for (let i = arrows.length - 1; i >= 0; i--) {
        const a = arrows[i];
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        if (a.x < -30 || a.x > W + 30 || a.y < -30 || a.y > H + 30) {
          arrows.splice(i, 1);
        }
      }

      for (let i = targets.length - 1; i >= 0; i--) {
        const t = targets[i];
        t.x += t.vx * dt;
        t.y += t.vy * dt;
        if (t.y < 40 || t.y > H * 0.65) t.vy *= -1;
        // Si el corazón se escapa, pierdes vida
        if ((t.vx > 0 && t.x - t.r > W + 30) || (t.vx < 0 && t.x + t.r < -30)) {
          targets.splice(i, 1);
          lives = Math.max(0, lives - 1);
          pops.push({ x: W / 2, y: H / 2, t: 24, text: '-1 ❤' });
          try { sfx('fail'); } catch (e) {}
          if (lives <= 0) {
            ended = true;
            break;
          }
          spawnTarget();
          continue;
        }

        for (let j = arrows.length - 1; j >= 0; j--) {
          const a = arrows[j];
          const dx = a.x - t.x, dy = a.y - t.y;
          if (dx * dx + dy * dy < (t.r + 6) * (t.r + 6)) {
            targets.splice(i, 1);
            arrows.splice(j, 1);
            score++;
            pops.push({ x: t.x, y: t.y, t: 20, text: '+1' });
            try { sfx('score'); } catch (e) {}
            if (score >= targetHits) {
              won = true;
              setTimeout(() => onWin && onWin(), 900);
            } else {
              spawnTarget();
            }
            break;
          }
        }
      }

      if (!won && !ended && targets.length === 0 && spawned < targetHits) spawnTarget();

      for (let i = pops.length - 1; i >= 0; i--) {
        pops[i].y -= 0.6 * dt;
        pops[i].t -= dt;
        if (pops[i].t <= 0) pops.splice(i, 1);
      }
    }

    draw();
    raf = requestAnimationFrame(update);
  }

  function toCanvas(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) };
  }

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const p = toCanvas(e);
    shoot(p.x, p.y);
  });

  spawnTarget();
  raf = requestAnimationFrame(update);
  return () => { running = false; cancelAnimationFrame(raf); };
}