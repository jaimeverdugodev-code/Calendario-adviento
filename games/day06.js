// Día 6: Lluvia de Besos - atrapa corazones, evita carbón (3 vidas)
import { sfx } from '../js/audio.js';

function tryLoadImage(candidates) {
  const img = new Image();
  img._loaded = false;
  let i = 0;
  const tryNext = () => {
    if (i >= candidates.length) return;
    img.src = candidates[i++];
  };
  img.onload = () => { img._loaded = true; };
  img.onerror = tryNext;
  tryNext();
  return img;
}

export function startGame(container, config, onWin) {
  const target = (config.gameConfig && config.gameConfig.targetHearts) || 15;
  const W = container.clientWidth || 360;
  const H = container.clientHeight || 420;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  canvas.style.touchAction = 'none';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const playerImg = new Image();
  playerImg.src = 'public/avatars/pareja.png';

  const heartItemImg = tryLoadImage([
    'public/dia06/corazones/corazon.png',
    'public/dia06/corazones/corazon.jpg',
    'public/dia06/corazones/corazon.jpeg',
    'public/dia06/corazones/corazon.webp',
    'public/dia06/corazones/corazon.svg',
    'public/dia06/corazones/beso.png',
    'public/dia06/corazones/beso.jpg',
    'public/dia06/corazones/beso.jpeg',
    'public/dia06/corazones/beso.webp',
    'public/dia06/corazones/beso.svg',
    'public/dia06/corazones/imagen.png',
    'public/dia06/corazones/imagen.jpg',
    'public/dia06/corazones/imagen.jpeg',
    'public/dia06/corazones/imagen.webp',
    'public/dia06/corazones/imagen.svg'
  ]);
  const coalItemImg = tryLoadImage([
    'public/dia06/carbones/carbon.png',
    'public/dia06/carbones/carbon.jpg',
    'public/dia06/carbones/carbon.jpeg',
    'public/dia06/carbones/carbon.webp',
    'public/dia06/carbones/carbon.svg',
    'public/dia06/carbones/imagen.png',
    'public/dia06/carbones/imagen.jpg',
    'public/dia06/carbones/imagen.jpeg',
    'public/dia06/carbones/imagen.webp',
    'public/dia06/carbones/imagen.svg'
  ]);

  let running = true, ended = false, won = false;
  let score = 0, lives = 3, raf, frames = 0;
  let dragging = false;
  let lastSpawn = 0;
  const player = { x: W / 2, y: H - 46, w: 58, h: 58 };
  const items = []; // {x,y,vy,type,r}

  function spawn(now) {
    if (items.length > 10) return;
    const isCoal = Math.random() < 0.42;
    items.push({
      x: 30 + Math.random() * (W - 60),
      y: -28,
      vy: 1.5 + Math.random() * 0.85,
      type: isCoal ? 'coal' : 'heart',
      r: 24
    });
    lastSpawn = now;
  }

  function loseLife() {
    if (ended) return;
    lives = Math.max(0, lives - 1);
    try { sfx('hit'); } catch (e) {}
    if (lives <= 0) {
      ended = true;
      won = false;
    }
  }

  function drawPlayer() {
    ctx.save();
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.w / 2 + 3, 0, Math.PI * 2);
    ctx.fillStyle = '#d4af37'; ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.w / 2, 0, Math.PI * 2);
    ctx.clip();
    if (playerImg.complete && playerImg.naturalWidth) {
      ctx.drawImage(playerImg, player.x - player.w / 2, player.y - player.h / 2, player.w, player.h);
    } else {
      ctx.fillStyle = '#f2c6ce';
      ctx.fillRect(player.x - player.w / 2, player.y - player.h / 2, player.w, player.h);
      ctx.fillStyle = '#b81d33'; ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('❤', player.x, player.y + 1);
    }
    ctx.restore();
  }

  function drawHUD() {
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.fillRect(8, 8, W - 16, 36);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(`Corazones: ${score}/${target}`, 16, 26);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#f2c6ce';
    const hearts = '❤'.repeat(lives) + '♡'.repeat(Math.max(0, 3 - lives));
    ctx.fillText(hearts, W - 16, 26);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1b2742'); g.addColorStop(1, '#1B0D12');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    for (const it of items) {
      const size = it.r * 2;
      if (it.type === 'heart') {
        if (heartItemImg._loaded && heartItemImg.naturalWidth) {
          ctx.save();
          ctx.shadowColor = 'rgba(255,92,138,0.35)';
          ctx.shadowBlur = 6;
          ctx.drawImage(heartItemImg, it.x - it.r, it.y - it.r, size, size);
          ctx.restore();
        } else {
          ctx.save();
          ctx.shadowColor = 'rgba(255,92,138,0.5)';
          ctx.shadowBlur = 6;
          ctx.font = `${size}px serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('❤', it.x, it.y + 1);
          ctx.restore();
        }
      } else {
        if (coalItemImg._loaded && coalItemImg.naturalWidth) {
          ctx.drawImage(coalItemImg, it.x - it.r, it.y - it.r, size, size);
        } else {
          ctx.beginPath(); ctx.arc(it.x, it.y, it.r, 0, Math.PI * 2);
          ctx.fillStyle = '#2f2f2f'; ctx.fill();
          ctx.strokeStyle = '#6a6a6a'; ctx.lineWidth = 2; ctx.stroke();
          ctx.fillStyle = '#cfcfcf'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('✖', it.x, it.y + 1);
        }
      }
    }

    drawPlayer();
    drawHUD();

    if (!ended && frames < 160) {
      ctx.fillStyle = 'rgba(253,248,245,0.92)';
      ctx.font = '13px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Atrapa los besos. Si se escapa uno o coges carbón, pierdes vida.', W / 2, H - 12);
    }

    if (ended) {
      ctx.fillStyle = 'rgba(27,13,18,0.7)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#d4af37'; ctx.font = 'bold 28px "Playfair Display", serif'; ctx.textAlign = 'center';
      ctx.fillText(won ? '¡Qué lluvia de amor!' : '¡Te quedaste sin vidas!', W / 2, H / 2 - 6);
      ctx.fillStyle = '#f2c6ce'; ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(won ? 'Los has atrapado todos' : 'Pulsa reintentar', W / 2, H / 2 + 24);
    }
  }

  function update(nowTs) {
    if (!running) return;
    frames++;
    const now = nowTs || performance.now();

    if (!ended) {
      if (!lastSpawn) lastSpawn = now;
      if (now - lastSpawn > 680) spawn(now);

      for (let i = 0; i < items.length; i++) items[i].y += items[i].vy;

      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        const dx = it.x - player.x;
        const dy = it.y - player.y;
        const catchR = (player.w / 2) + it.r - 6;
        const isHit = (dx * dx + dy * dy) <= (catchR * catchR);

        if (isHit) {
          if (it.type === 'heart') {
            score = Math.min(target, score + 1);
            try { sfx('catch'); } catch (e) {}
            items.splice(i, 1);
            if (score >= target) {
              ended = true; won = true;
              draw();
              running = false;
              setTimeout(() => onWin && onWin(), 700);
              return;
            }
          } else {
            // carbón: pierde vida
            items.splice(i, 1);
            loseLife();
            if (ended) { draw(); return; }
          }
          continue;
        }

        // se escapa por abajo
        if (it.y - it.r > H + 8) {
          if (it.type === 'heart') {
            items.splice(i, 1);
            loseLife();
            if (ended) { draw(); return; }
          } else {
            items.splice(i, 1); // carbón que se va no penaliza
          }
        }
      }
    }

    draw();
    if (running) raf = requestAnimationFrame(update);
  }

  function setPlayerX(clientX) {
    const r = canvas.getBoundingClientRect();
    const x = (clientX - r.left) * (W / r.width);
    player.x = Math.max(player.w / 2, Math.min(W - player.w / 2, x));
  }

  function onDown(e) {
    if (ended) return;
    dragging = true;
    setPlayerX(e.clientX);
    if (canvas.setPointerCapture) { try { canvas.setPointerCapture(e.pointerId); } catch (_) {} }
  }
  function onMove(e) {
    if (!dragging) return;
    e.preventDefault();
    setPlayerX(e.clientX);
  }
  function onUp(e) {
    dragging = false;
    if (canvas.releasePointerCapture) { try { canvas.releasePointerCapture(e.pointerId); } catch (_) {} }
  }

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  raf = requestAnimationFrame(update);

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerup', onUp);
    canvas.removeEventListener('pointercancel', onUp);
  };
}
