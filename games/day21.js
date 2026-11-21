// Día 21: Torre de Regalos - apilar 10 cajas (más difícil)
export function startGame(container, config, onWin) {
  const targetStack = (config.gameConfig && config.gameConfig.targetStack) || 10;
  const W = container.clientWidth || 360;
  const H = container.clientHeight || 420;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let running = true, won = false, lost = false, raf;
  const baseY = H - 30;
  const boxH = 28;
  const colors = ['#b81d33', '#2e7d32', '#1565c0', '#d4af37', '#8e24aa', '#00897b', '#c62828', '#ef6c00'];
  let stack = []; // {x,w,color,base?}
  let current = null;
  let dir = 1;
  let speed = 3.0;

  function newCurrent() {
    const prev = stack[stack.length - 1];
    const w = prev ? prev.w : 120;
    const y = baseY - stack.length * boxH - boxH;
    current = { x: dir > 0 ? -w : W, y, w, h: boxH, color: colors[(stack.length - 1) % colors.length] };
  }
  // base platform
  stack.push({ x: W / 2 - 60, y: baseY - boxH, w: 120, h: boxH, color: '#5d4037', base: true });
  newCurrent();

  function drawBox(b, yOverride) {
    const y = yOverride != null ? yOverride : b.y;
    ctx.fillStyle = b.color;
    roundRect(b.x, y, b.w, b.h, 4); ctx.fill();
    if (!b.base) {
      ctx.fillStyle = '#f0d77a';
      const ribbon = Math.max(4, Math.min(8, b.w * 0.12));
      ctx.fillRect(b.x + b.w / 2 - ribbon / 2, y, ribbon, b.h);
      ctx.fillRect(b.x, y + b.h / 2 - ribbon / 2, b.w, ribbon);
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1.5; roundRect(b.x, y, b.w, b.h, 4); ctx.stroke();
  }
  function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#102033'); g.addColorStop(1, '#1B0D12');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#fdf8f5'; ctx.fillRect(0, baseY, W, H - baseY);

    const offset = Math.max(0, (stack.length - 7) * boxH);
    ctx.save();
    ctx.translate(0, offset);
    for (const b of stack) drawBox(b);
    if (current && !won && !lost) drawBox(current);
    ctx.restore();

    const placed = stack.length - 1;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(8, 8, 180, 34);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 15px "Plus Jakarta Sans",sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(`Regalos: ${placed} / ${targetStack}`, 16, 25);

    if (!won && !lost) {
      ctx.fillStyle = 'rgba(253,248,245,0.85)'; ctx.font = '13px "Plus Jakarta Sans",sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Toca para soltar la caja', W / 2, H - 8);
    }
    if (won || lost) {
      ctx.fillStyle = 'rgba(27,13,18,0.65)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#d4af37'; ctx.font = 'bold 28px "Playfair Display",serif'; ctx.textAlign = 'center';
      ctx.fillText(won ? '¡Torre increíble!' : '¡Se cayó!', W / 2, H / 2);
      if (lost) { ctx.fillStyle = '#f2c6ce'; ctx.font = '16px "Plus Jakarta Sans",sans-serif'; ctx.fillText('Toca reintentar', W / 2, H / 2 + 26); }
    }
  }

  function update() {
    if (!running) return;
    if (!won && !lost && current) {
      current.x += dir * speed;
      if (current.x + current.w > W) { current.x = W - current.w; dir = -1; }
      if (current.x < 0) { current.x = 0; dir = 1; }
    }
    draw();
    raf = requestAnimationFrame(update);
  }

  function drop() {
    if (won || lost || !current) return;
    const prev = stack[stack.length - 1];
    const overlapLeft = Math.max(current.x, prev.x);
    const overlapRight = Math.min(current.x + current.w, prev.x + prev.w);
    const overlap = overlapRight - overlapLeft;
    if (overlap <= 12) {
      lost = true; running = false; draw(); return;
    }
    stack.push({ x: overlapLeft, y: current.y, w: overlap, h: boxH, color: current.color });
    speed += 0.28;
    dir *= -1;
    const placed = stack.length - 1;
    if (placed >= targetStack) {
      won = true; running = false; draw();
      setTimeout(() => onWin && onWin(), 700);
      return;
    }
    newCurrent();
  }

  canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); drop(); });
  update();
  return () => { running = false; cancelAnimationFrame(raf); };
}
