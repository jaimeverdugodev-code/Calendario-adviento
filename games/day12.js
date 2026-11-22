// Día 12: Pesca Navideña - baja el anzuelo y pesca tesoros
import { sfx } from '../js/audio.js';
import { getMyAvatarForDay } from '../js/avatars.js';

export function startGame(container, config, onWin) {
  const target = (config.gameConfig && config.gameConfig.target) || 6;
  const W = container.clientWidth || 360;
  const H = container.clientHeight || 420;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const meImg = new Image(); meImg.src = getMyAvatarForDay(config.day);
  const partnerImg = new Image(); partnerImg.src = 'public/avatars/pareja.png';

  let running = true, ended = false, won = false, raf;
  let score = 0;
  let lives = 3;
  let boatX = W / 2;
  let boatDir = 1;
  const boatY = 70;
  const boatSpeed = 1.6;

  // hook states: 'idle' (swaying with boat), 'down', 'up'
  let hook = { x: boatX, y: boatY + 18, len: 0, state: 'idle', speed: 4.2, caught: null, swing: 0 };

  const treasures = [];
  const goodTypes = ['🎁', '⭐', '🍬', '🔔', '🧦'];
  const badTypes = ['🪾', '🪨'];

  function makeTreasure(bad) {
    const r = bad ? 16 : 17;
    return {
      x: 30 + Math.random() * (W - 60),
      y: H * 0.45 + Math.random() * (H * 0.4),
      r,
      type: bad ? badTypes[Math.floor(Math.random() * badTypes.length)] : goodTypes[Math.floor(Math.random() * goodTypes.length)],
      good: !bad,
      alive: true,
      vx: (Math.random() * 0.6 + 0.2) * (Math.random() < 0.5 ? -1 : 1)
    };
  }

  function ensureBadTreasure() {
    if (treasures.some(t => t.alive && !t.good)) return;
    const goodAlive = treasures.find(t => t.alive && t.good);
    if (goodAlive) {
      const bad = makeTreasure(true);
      goodAlive.type = bad.type;
      goodAlive.good = false;
      goodAlive.r = bad.r;
    } else {
      treasures.push(makeTreasure(true));
    }
  }

  function spawnTreasures() {
    treasures.length = 0;
    const count = 9;
    for (let i = 0; i < count; i++) {
      const bad = Math.random() < 0.25;
      treasures.push(makeTreasure(bad));
    }
    ensureBadTreasure();
  }
  spawnTreasures();

  function resetHook() {
    hook.state = 'idle';
    hook.len = 0;
    hook.caught = null;
    hook.y = boatY + 18;
    hook.x = boatX;
  }

  function dropHook() {
    if (ended || hook.state !== 'idle') return;
    hook.state = 'down';
    hook.caught = null;
    try { sfx('drop'); } catch (e) {}
  }

  function drawBoatAvatar(img, cx, cy, r) {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
    ctx.fillStyle = '#d4af37'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
    if (img.complete && img.naturalWidth) {
      ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
    } else {
      ctx.fillStyle = '#f2c6ce';
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
    ctx.restore();
  }

  function draw() {
    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.45);
    sky.addColorStop(0, '#0b1a33'); sky.addColorStop(1, '#1d3557');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H * 0.45);
    // stars
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 25; i++) ctx.fillRect((i * 97) % W, (i * 37) % (H * 0.4), 2, 2);
    // moon
    ctx.fillStyle = '#fff7d6';
    ctx.beginPath(); ctx.arc(W - 50, 45, 18, 0, Math.PI * 2); ctx.fill();

    // water
    const water = ctx.createLinearGradient(0, H * 0.4, 0, H);
    water.addColorStop(0, '#1e6091'); water.addColorStop(1, '#0b3d5c');
    ctx.fillStyle = water; ctx.fillRect(0, H * 0.4, W, H * 0.6);
    // waves
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    for (let w = 0; w < 4; w++) {
      const wy = H * 0.42 + w * 22;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 12) {
        const yy = wy + Math.sin((x + performance.now() / 20 + w * 30) / 18) * 3;
        if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }

    // treasures
    for (const t of treasures) {
      if (!t.alive) continue;
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.shadowColor = 'rgba(0,0,0,0.25)';
      ctx.shadowBlur = 4;
      ctx.beginPath(); ctx.arc(t.x, t.y, t.r + 6, 0, Math.PI * 2);
      ctx.fillStyle = t.good ? '#d4af37' : '#8a8a8a';
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.font = `${t.r * 1.8}px serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(t.type, t.x, t.y + 1);
      ctx.restore();
    }

    // boat
    ctx.save();
    ctx.translate(boatX, boatY);
    ctx.fillStyle = '#8d4b3e';
    ctx.beginPath();
    ctx.moveTo(-34, 0); ctx.lineTo(34, 0); ctx.lineTo(22, 14); ctx.lineTo(-22, 14); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d4af37'; ctx.fillRect(-2, -22, 4, 22);
    ctx.fillStyle = '#f2c6ce';
    ctx.beginPath(); ctx.moveTo(2, -22); ctx.lineTo(26, -12); ctx.lineTo(2, -2); ctx.closePath(); ctx.fill();
    // fotos de los dos en el barco
    drawBoatAvatar(meImg, -12, -4, 9);
    drawBoatAvatar(partnerImg, 10, -4, 9);
    ctx.restore();

    // line and hook
    ctx.strokeStyle = '#fdf8f5'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(boatX, boatY + 10); ctx.lineTo(hook.x, hook.y); ctx.stroke();
    ctx.save();
    ctx.translate(hook.x, hook.y);
    ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 6, 0.2 * Math.PI, 1.3 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(0, -12); ctx.stroke();
    if (hook.caught) {
      ctx.font = '20px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(hook.caught.type, 0, 18);
    }
    ctx.restore();

    // HUD
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(8, 8, W - 16, 34);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 15px "Plus Jakarta Sans",sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(`Tesoros: ${score}/${target}`, 16, 25);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#f2c6ce';
    ctx.fillText('❤'.repeat(Math.max(0, lives)) + '♡'.repeat(Math.max(0, 3 - lives)), W - 16, 25);

    if (!ended) {
      ctx.fillStyle = 'rgba(253,248,245,0.9)'; ctx.font = '14px "Plus Jakarta Sans",sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(hook.state === 'idle' ? 'Toca para lanzar el anzuelo' : 'Espera a recoger...', W / 2, H - 14);
    }

    if (ended) {
      ctx.fillStyle = 'rgba(27,13,18,0.65)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#d4af37'; ctx.font = 'bold 28px "Playfair Display",serif'; ctx.textAlign = 'center';
      ctx.fillText(won ? '¡Pesca perfecta!' : (lives <= 0 ? '¡Te quedaste sin vidas!' : '¡Buen intento!'), W / 2, H / 2);
      if (!won && lives <= 0) {
        ctx.fillStyle = '#f2c6ce'; ctx.font = '16px "Plus Jakarta Sans",sans-serif';
        ctx.fillText('Pulsa reintentar', W / 2, H / 2 + 28);
      }
    }
  }

  let lastTime = 0;
  function update(now) {
    if (!running) return;
    const dt = lastTime ? Math.min((now - lastTime) / (1000 / 60), 2) : 1;
    lastTime = now;
    if (!ended) {
      // boat movement
      boatX += boatDir * boatSpeed * dt;
      if (boatX > W - 40) { boatX = W - 40; boatDir = -1; }
      if (boatX < 40) { boatX = 40; boatDir = 1; }

      // treasures drift
      for (const t of treasures) {
        if (!t.alive) continue;
        t.x += t.vx * dt;
        if (t.x < 20 || t.x > W - 20) t.vx *= -1;
      }

      // hook logic
      if (hook.state === 'idle') {
        hook.swing = (hook.swing || 0) + 0.03 * dt;
        hook.x = boatX + Math.sin(hook.swing) * 4;
        hook.y = boatY + 18;
      } else if (hook.state === 'down') {
        hook.len += hook.speed * dt;
        hook.x = boatX;
        hook.y = boatY + 18 + hook.len;
        // catch check
        if (!hook.caught) {
          for (const t of treasures) {
            if (!t.alive) continue;
            const dx = hook.x - t.x, dy = hook.y - t.y;
            if (dx * dx + dy * dy < (t.r + 8) * (t.r + 8)) {
              t.alive = false;
              hook.caught = t;
              hook.state = 'up';
              break;
            }
          }
        }
        if (hook.y > H - 20) hook.state = 'up';
      } else if (hook.state === 'up') {
        hook.len -= hook.speed * 1.1 * dt;
        if (hook.len < 0) hook.len = 0;
        hook.x = boatX;
        hook.y = boatY + 18 + hook.len;
        if (hook.caught) {
          hook.caught.x = hook.x;
          hook.caught.y = hook.y + 18;
        }
        if (hook.len <= 0) {
          if (hook.caught) {
            if (hook.caught.good) {
              score++;
              try { sfx('catch'); } catch (e) {}
              if (score >= target) {
                ended = true; won = true;
                resetHook();
                draw();
                running = false;
                setTimeout(() => onWin && onWin(), 700);
                return;
              }
            } else {
              lives = Math.max(0, lives - 1);
              try { sfx('fail'); } catch (e) {}
              if (lives <= 0) {
                ended = true; won = false;
                resetHook();
                draw();
                running = false;
                return;
              }
            }
          }
          // respawn a treasure to keep pool
          const aliveCount = treasures.filter(t => t.alive).length;
          if (aliveCount < 6) {
            const noBadAlive = !treasures.some(t => t.alive && !t.good);
            const bad = noBadAlive ? true : Math.random() < 0.25;
            treasures.push(makeTreasure(bad));
          }
          ensureBadTreasure();
          resetHook();
        }
      }
    }
    draw();
    raf = requestAnimationFrame(update);
  }

  canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); dropHook(); });
  raf = requestAnimationFrame(update);

  return () => { running = false; cancelAnimationFrame(raf); };
}
