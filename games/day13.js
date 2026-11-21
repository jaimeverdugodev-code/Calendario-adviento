// Día 13: Esquiva la Ventisca - 3 carriles, 45s (un copo por oleada, 1 por carril, velocidad incremental)
export function startGame(container, config, onWin) {
  const durationMs = (config.gameConfig && config.gameConfig.durationMs) || 45000;
  const W = container.clientWidth || 360;
  const H = container.clientHeight || 420;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const lanes = [W * 0.22, W * 0.5, W * 0.78];
  let lane = 1;
  let running = true, ended = false, won = false;
  let start = Date.now();
  let raf;
  let spawnTimer = null;
  const flakes = []; // {lane,y,vy,r}
  const avatar = new Image(); avatar.src = 'public/avatars/pareja.png';

  function spawnWave() {
    if (!running || ended) return;
    const elapsed = Date.now() - start;
    const progress = Math.min(1, elapsed / durationMs);
    // un solo copo por oleada en un carril aleatorio (nunca varios a la vez)
    const l = Math.floor(Math.random() * 3);
    const vy = 2.3 + progress * 3.0; // velocidad incremental, más difícil pero ganable
    flakes.push({ lane: l, y: -24, vy, r: 15 });
    const nextIn = 760 - progress * 280 + Math.random() * 200;
    spawnTimer = setTimeout(spawnWave, Math.max(430, nextIn));
  }

  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#102033'); g.addColorStop(1, '#1B0D12');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // lane dividers
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.setLineDash([8, 8]);
    for (let i = 1; i < 3; i++) { ctx.beginPath(); ctx.moveTo(W * i / 3, 0); ctx.lineTo(W * i / 3, H); ctx.stroke(); }
    ctx.setLineDash([]);
    // snowflakes
    ctx.fillStyle = '#fff';
    for (const f of flakes) {
      ctx.beginPath(); ctx.arc(lanes[f.lane], f.y, f.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(200,230,255,0.9)';
      ctx.beginPath(); ctx.arc(lanes[f.lane] - f.r * 0.3, f.y - f.r * 0.3, f.r * 0.35, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
    }
    // player
    const px = lanes[lane], py = H - 60, pr = 24;
    ctx.save();
    ctx.beginPath(); ctx.arc(px, py, pr + 3, 0, Math.PI * 2); ctx.fillStyle = '#d4af37'; ctx.fill();
    ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.clip();
    if (avatar.complete && avatar.naturalWidth) ctx.drawImage(avatar, px - pr, py - pr, pr * 2, pr * 2);
    else { ctx.fillStyle = '#f2c6ce'; ctx.fill(); }
    ctx.restore();

    const elapsed = Math.min(durationMs, Date.now() - start);
    const left = Math.ceil((durationMs - elapsed) / 1000);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(8, 8, 150, 34);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 16px "Plus Jakarta Sans",sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(`Aguanta: ${left}s`, 16, 25);

    if (!ended) {
      ctx.fillStyle = 'rgba(253,248,245,0.8)'; ctx.font = '13px "Plus Jakarta Sans",sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Desliza o toca a los lados para moverte', W / 2, H - 12);
    }

    if (ended) {
      ctx.fillStyle = 'rgba(27,13,18,0.65)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#d4af37'; ctx.font = 'bold 28px "Playfair Display",serif'; ctx.textAlign = 'center';
      ctx.fillText(won ? '¡Tormenta superada!' : '¡Te alcanzó!', W / 2, H / 2 - 6);
      if (!won) { ctx.fillStyle = '#f2c6ce'; ctx.font = '16px "Plus Jakarta Sans",sans-serif'; ctx.fillText('Toca reintentar', W / 2, H / 2 + 24); }
    }
  }

  function update() {
    if (!running) return;
    if (!ended) {
      const elapsed = Date.now() - start;
      for (const f of flakes) f.y += f.vy;
      // collision
      const px = lanes[lane], py = H - 60, pr = 22;
      for (const f of flakes) {
        const dx = lanes[f.lane] - px, dy = f.y - py;
        if (dx * dx + dy * dy < (f.r + pr - 6) * (f.r + pr - 6)) {
          ended = true; won = false; clearTimeout(spawnTimer); draw(); running = false; return;
        }
      }
      while (flakes.length && flakes[0].y - flakes[0].r > H) flakes.shift();
      if (elapsed >= durationMs) {
        ended = true; won = true; clearTimeout(spawnTimer); draw(); running = false;
        setTimeout(() => onWin && onWin(), 700); return;
      }
    }
    draw();
    raf = requestAnimationFrame(update);
  }

  let touchStartX = null;
  function onDown(e) { touchStartX = e.clientX; }
  function onUp(e) {
    if (touchStartX == null) return;
    const dx = e.clientX - touchStartX;
    if (dx > 25) lane = Math.min(2, lane + 1);
    else if (dx < -25) lane = Math.max(0, lane - 1);
    else {
      // tap sin swipe: mover según lado
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      if (x < r.width / 3) lane = Math.max(0, lane - 1);
      else if (x > r.width * 2 / 3) lane = Math.min(2, lane + 1);
    }
    touchStartX = null;
  }
  canvas.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp);
  spawnTimer = setTimeout(spawnWave, 700);
  update();

  return () => { running = false; clearTimeout(spawnTimer); cancelAnimationFrame(raf); canvas.removeEventListener('pointerdown', onDown); window.removeEventListener('pointerup', onUp); };
}
