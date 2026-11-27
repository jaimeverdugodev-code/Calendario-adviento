// Día 22: Laberinto de Invierno - arrastra yo.png hasta pareja.png sin tocar paredes
import { getMyAvatarForDay } from '../js/avatars.js';

export function startGame(container, config, onWin) {
  const W = container.clientWidth || 360;
  const H = container.clientHeight || 420;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (getComputedStyle(container).position === 'static') container.style.position = 'relative';

  const dpad = document.createElement('div');
  dpad.style.cssText = 'position:absolute;left:12px;bottom:12px;width:138px;height:138px;z-index:8;touch-action:none;user-select:none;';
  const mkBtn = (dir, label, css) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.dir = dir;
    b.textContent = label;
    b.style.cssText = `position:absolute;width:46px;height:46px;border-radius:12px;border:2px solid rgba(240,215,122,0.85);background:rgba(27,13,18,0.55);color:#fff;font-size:22px;font-weight:800;line-height:1;display:flex;align-items:center;justify-content:center;padding:0;box-shadow:0 3px 10px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.08);backdrop-filter:blur(2px);${css}`;
    dpad.appendChild(b);
    return b;
  };
  mkBtn('up', '▲', 'left:46px;top:0;');
  mkBtn('left', '◀', 'left:0;top:46px;');
  mkBtn('right', '▶', 'left:92px;top:46px;');
  mkBtn('down', '▼', 'left:46px;top:92px;');
  container.appendChild(dpad);

  const meImg = new Image(); meImg.src = getMyAvatarForDay(config.day);
  const youImg = new Image(); youImg.src = 'public/avatars/pareja.png';

  // Maze defined on a grid, then scaled. 0 = path, 1 = wall. More difficult layout.
  const cols = 15, rows = 17;
  const maze = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
    [1,0,1,0,1,0,1,1,1,0,1,0,1,0,1],
    [1,0,1,0,0,0,0,0,1,0,0,0,1,0,1],
    [1,0,1,1,1,1,1,0,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,0,1,1,1,1,1,0,1,1,1],
    [1,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
    [1,0,1,0,1,1,1,1,1,0,1,1,1,0,1],
    [1,0,1,0,0,0,0,0,1,0,0,0,1,0,1],
    [1,0,1,1,1,1,1,0,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,1,0,1,0,1],
    [1,1,1,1,1,0,1,1,1,0,1,0,1,0,1],
    [1,0,0,0,1,0,0,0,1,0,0,0,0,0,1],
    [1,0,1,0,1,1,1,0,1,1,1,1,1,0,1],
    [1,0,1,0,0,0,0,0,0,0,0,0,1,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ];
  const pad = 12;
  const cellW = (W - pad*2) / cols;
  const cellH = (H - pad*2) / rows;

  const start = { r: 1, c: 1 };
  const goal = { r: 15, c: 13 };
  const playerR = Math.min(cellW, cellH) * 0.26;
  let player = { x: pad + (start.c + 0.5)*cellW, y: pad + (start.r + 0.5)*cellH };
  const goalPos = { x: pad + (goal.c + 0.5)*cellW, y: pad + (goal.r + 0.5)*cellH };
  let won = false;
  let lostFlash = 0;
  let raf;
  const moveState = { up: false, down: false, left: false, right: false };
  const moveSpeed = 1.7;

  function isWallAt(px, py) {
    // sample a few points around player circle
    const samples = 12;
    for (let i=0;i<samples;i++) {
      const a = (i/samples)*Math.PI*2;
      const sx = px + Math.cos(a)*(playerR-1);
      const sy = py + Math.sin(a)*(playerR-1);
      const c = Math.floor((sx - pad) / cellW);
      const r = Math.floor((sy - pad) / cellH);
      if (r < 0 || r >= rows || c < 0 || c >= cols) return true;
      if (maze[r][c] === 1) return true;
    }
    return false;
  }

  function draw() {
    ctx.clearRect(0,0,W,H);
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#17372c'); g.addColorStop(1,'#1B0D12');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    // detalles navideños suaves (estáticos, sin lag)
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let i=0;i<20;i++) ctx.fillRect((i*53)%W, (i*37)%H, 2, 2);

    // maze
    for (let r=0;r<rows;r++) for (let c=0;c<cols;c++) {
      const x = pad + c*cellW, y = pad + r*cellH;
      if (maze[r][c] === 1) {
        ctx.fillStyle = '#e8eef5';
        ctx.fillRect(x+1, y+1, cellW-2, cellH-2);
        ctx.fillStyle = 'rgba(180,200,220,0.6)';
        ctx.fillRect(x+2, y+2, cellW-4, (cellH-4)*0.3);
      } else {
        ctx.fillStyle = 'rgba(253,248,245,0.05)';
        ctx.fillRect(x+1,y+1,cellW-2,cellH-2);
      }
    }

    // goal
    ctx.save();
    ctx.beginPath(); ctx.arc(goalPos.x, goalPos.y, playerR+4, 0, Math.PI*2); ctx.fillStyle='#f2c6ce'; ctx.fill();
    ctx.beginPath(); ctx.arc(goalPos.x, goalPos.y, playerR+1, 0, Math.PI*2); ctx.clip();
    if (youImg.complete && youImg.naturalWidth) ctx.drawImage(youImg, goalPos.x-playerR-1, goalPos.y-playerR-1, (playerR+1)*2, (playerR+1)*2);
    else { ctx.fillStyle='#b81d33'; ctx.fill(); }
    ctx.restore();
    ctx.fillStyle='#b81d33'; ctx.font='12px serif'; ctx.textAlign='center'; ctx.fillText('❤', goalPos.x, goalPos.y - playerR - 6);

    // player
    if (lostFlash > 0) { ctx.globalAlpha = 0.5 + 0.5*Math.sin(Date.now()/40); }
    ctx.save();
    ctx.beginPath(); ctx.arc(player.x, player.y, playerR+3, 0, Math.PI*2); ctx.fillStyle='#d4af37'; ctx.fill();
    ctx.beginPath(); ctx.arc(player.x, player.y, playerR, 0, Math.PI*2); ctx.clip();
    if (meImg.complete && meImg.naturalWidth) ctx.drawImage(meImg, player.x-playerR, player.y-playerR, playerR*2, playerR*2);
    else { ctx.fillStyle='#f2c6ce'; ctx.fill(); }
    ctx.restore();
    ctx.globalAlpha = 1;

    // hint
    ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.fillRect(8,8,W-16,30);
    ctx.fillStyle='#fff'; ctx.font='bold 14px "Plus Jakarta Sans",sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(won ? '¡Nos encontramos! ❤' : 'Usa las flechas para llegar a mi amor', W/2, 23);
  }

  function tryMoveBy(dx, dy) {
    if (won || (dx === 0 && dy === 0)) return;
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 2));
    for (let i = 1; i <= steps; i++) {
      const tx = player.x + dx * (i / steps);
      const ty = player.y + dy * (i / steps);
      if (isWallAt(tx, ty)) {
        lostFlash = 12;
        player = { x: pad + (start.c + 0.5) * cellW, y: pad + (start.r + 0.5) * cellH };
        return;
      }
      player.x = tx; player.y = ty;
    }
    const ddx = player.x - goalPos.x, ddy = player.y - goalPos.y;
    if (ddx * ddx + ddy * ddy < (playerR + 8) * (playerR + 8)) {
      won = true;
      setTimeout(() => onWin && onWin(), 700);
    }
  }

  const setDir = (dir, active) => { if (dir in moveState) moveState[dir] = active; };
  const resetMove = () => { moveState.up = moveState.down = moveState.left = moveState.right = false; };

  const onPadDown = (e) => {
    e.preventDefault();
    const dir = e.currentTarget.dataset.dir;
    setDir(dir, true);
    e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPadUp = (e) => {
    const dir = e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.dir : null;
    if (dir) setDir(dir, false);
  };
  dpad.querySelectorAll('button').forEach((b) => {
    b.addEventListener('pointerdown', onPadDown);
    b.addEventListener('pointerup', onPadUp);
    b.addEventListener('pointercancel', onPadUp);
    b.addEventListener('pointerleave', onPadUp);
  });

  const onKeyDown = (e) => {
    if (e.key === 'ArrowUp') moveState.up = true;
    if (e.key === 'ArrowDown') moveState.down = true;
    if (e.key === 'ArrowLeft') moveState.left = true;
    if (e.key === 'ArrowRight') moveState.right = true;
  };
  const onKeyUp = (e) => {
    if (e.key === 'ArrowUp') moveState.up = false;
    if (e.key === 'ArrowDown') moveState.down = false;
    if (e.key === 'ArrowLeft') moveState.left = false;
    if (e.key === 'ArrowRight') moveState.right = false;
  };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  let lastTime = 0;
  function loop(time = 0) {
    const dt = lastTime ? Math.min((time - lastTime) / (1000 / 60), 2) : 1;
    lastTime = time;
    if (lostFlash > 0) lostFlash -= dt;
    if (!won) {
      let dx = 0, dy = 0;
      if (moveState.left) dx -= 1;
      if (moveState.right) dx += 1;
      if (moveState.up) dy -= 1;
      if (moveState.down) dy += 1;
      if (dx || dy) {
        const len = Math.hypot(dx, dy) || 1;
        tryMoveBy((dx / len) * moveSpeed * dt, (dy / len) * moveSpeed * dt);
      }
    }
    draw();
    raf = requestAnimationFrame(loop);
  }
  loop();
  return ()=>{
    cancelAnimationFrame(raf);
    dpad.querySelectorAll('button').forEach((b) => {
      b.removeEventListener('pointerdown', onPadDown);
      b.removeEventListener('pointerup', onPadUp);
      b.removeEventListener('pointercancel', onPadUp);
      b.removeEventListener('pointerleave', onPadUp);
    });
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    dpad.remove();
  };
}
