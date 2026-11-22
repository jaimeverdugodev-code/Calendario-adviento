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

  const joyWrap = document.createElement('div');
  joyWrap.style.cssText = 'position:absolute;left:14px;bottom:14px;width:96px;height:96px;border-radius:50%;background:rgba(253,248,245,0.12);border:2px solid rgba(212,175,55,0.45);touch-action:none;z-index:5;user-select:none;';
  const joyKnob = document.createElement('div');
  joyKnob.style.cssText = 'position:absolute;left:50%;top:50%;width:44px;height:44px;margin-left:-22px;margin-top:-22px;border-radius:50%;background:rgba(212,175,55,0.85);border:2px solid #f2c6ce;box-shadow:0 2px 8px rgba(0,0,0,0.35);transform:translate(0px,0px);pointer-events:none;';
  joyWrap.appendChild(joyKnob);
  container.appendChild(joyWrap);

  const meImg = new Image(); meImg.src = getMyAvatarForDay(config.day);
  const youImg = new Image(); youImg.src = 'public/avatars/pareja.png';

  // Maze defined on a grid, then scaled. 0 = path, 1 = wall. More difficult layout.
  const cols = 11, rows = 13;
  const maze = [
    [1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,1,0,0,0,0,0,1],
    [1,1,1,0,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,1],
    [1,0,1,1,1,1,1,0,1,1,1],
    [1,0,0,0,0,0,0,0,1,0,1],
    [1,1,1,1,1,0,1,1,1,0,1],
    [1,0,0,0,1,0,0,0,0,0,1],
    [1,0,1,0,1,1,1,1,1,0,1],
    [1,0,1,0,0,0,0,0,1,0,1],
    [1,0,1,1,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1],
  ];
  const pad = 12;
  const cellW = (W - pad*2) / cols;
  const cellH = (H - pad*2) / rows;

  const start = { r: 1, c: 1 };
  const goal = { r: 11, c: 9 };
  const playerR = Math.min(cellW, cellH) * 0.32;
  let player = { x: pad + (start.c + 0.5)*cellW, y: pad + (start.r + 0.5)*cellH };
  const goalPos = { x: pad + (goal.c + 0.5)*cellW, y: pad + (goal.r + 0.5)*cellH };
  let won = false;
  let lostFlash = 0;
  let raf;
  let joyActive = false;
  let joyVec = { x: 0, y: 0 };
  const joyRadius = 34;
  const moveSpeed = 1.9;

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
    g.addColorStop(0,'#0f1e19'); g.addColorStop(1,'#1B0D12');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

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
    ctx.fillText(won ? '¡Nos encontramos! ❤' : 'Usa el joystick para llegar a mi amor', W/2, 23);
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

  function setJoyFromEvent(e) {
    const r = joyWrap.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy) || 1;
    const clamped = Math.min(dist, joyRadius);
    dx = (dx / dist) * clamped;
    dy = (dy / dist) * clamped;
    joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
    joyVec = { x: dx / joyRadius, y: dy / joyRadius };
  }

  function resetJoy() {
    joyActive = false;
    joyVec = { x: 0, y: 0 };
    joyKnob.style.transform = 'translate(0px, 0px)';
  }

  const onJoyDown = (e) => {
    e.preventDefault();
    joyActive = true;
    joyWrap.setPointerCapture && joyWrap.setPointerCapture(e.pointerId);
    setJoyFromEvent(e);
  };
  const onJoyMove = (e) => {
    if (!joyActive) return;
    e.preventDefault();
    setJoyFromEvent(e);
  };
  const onJoyUp = (e) => {
    if (joyWrap.releasePointerCapture) { try { joyWrap.releasePointerCapture(e.pointerId); } catch (_) {} }
    resetJoy();
  };

  joyWrap.addEventListener('pointerdown', onJoyDown);
  joyWrap.addEventListener('pointermove', onJoyMove);
  joyWrap.addEventListener('pointerup', onJoyUp);
  joyWrap.addEventListener('pointercancel', onJoyUp);

  function loop() {
    if (lostFlash > 0) lostFlash--;
    if (!won && (joyVec.x || joyVec.y)) {
      tryMoveBy(joyVec.x * moveSpeed, joyVec.y * moveSpeed);
    }
    draw();
    raf = requestAnimationFrame(loop);
  }
  loop();
  return ()=>{
    cancelAnimationFrame(raf);
    joyWrap.removeEventListener('pointerdown', onJoyDown);
    joyWrap.removeEventListener('pointermove', onJoyMove);
    joyWrap.removeEventListener('pointerup', onJoyUp);
    joyWrap.removeEventListener('pointercancel', onJoyUp);
    joyWrap.remove();
  };
}
