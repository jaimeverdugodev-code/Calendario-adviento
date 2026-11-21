// Día 22: Laberinto de Invierno - arrastra yo.png hasta pareja.png sin tocar paredes
import { getMyAvatarForDay } from '../js/avatars.js';

export function startGame(container, config, onWin) {
  const W = container.clientWidth || 360;
  const H = container.clientHeight || 420;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const meImg = new Image(); meImg.src = getMyAvatarForDay(config.day);
  const youImg = new Image(); youImg.src = 'public/avatars/pareja.png';

  // Maze defined on a grid, then scaled. 0 = path, 1 = wall. Simple solvable maze.
  const cols = 9, rows = 11;
  const maze = [
    [1,1,1,1,1,1,1,1,1],
    [1,0,0,0,1,0,0,0,1],
    [1,0,1,0,1,0,1,0,1],
    [1,0,1,0,0,0,1,0,1],
    [1,0,1,1,1,0,1,0,1],
    [1,0,0,0,1,0,0,0,1],
    [1,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,1],
    [1,0,1,1,1,0,1,0,1],
    [1,0,0,0,1,0,0,0,1],
    [1,1,1,1,1,1,1,1,1],
  ];
  const pad = 12;
  const cellW = (W - pad*2) / cols;
  const cellH = (H - pad*2) / rows;

  const start = { r: 1, c: 1 };
  const goal = { r: 9, c: 7 };
  const playerR = Math.min(cellW, cellH) * 0.32;
  let player = { x: pad + (start.c + 0.5)*cellW, y: pad + (start.r + 0.5)*cellH };
  const goalPos = { x: pad + (goal.c + 0.5)*cellW, y: pad + (goal.r + 0.5)*cellH };
  let dragging = false;
  let won = false;
  let lostFlash = 0;
  let raf;

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
    ctx.fillText(won ? '¡Nos encontramos! ❤' : 'Arrástrame hasta mi amor', W/2, 23);
  }

  function toCanvas(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left)*(W/r.width), y: (e.clientY - r.top)*(H/r.height) };
  }

  function tryMoveTo(nx, ny) {
    if (won) return;
    // step-wise to prevent tunneling through walls
    const dx = nx - player.x, dy = ny - player.y;
    const steps = Math.max(1, Math.ceil(Math.hypot(dx,dy)/4));
    for (let i=1;i<=steps;i++) {
      const tx = player.x + dx*(i/steps);
      const ty = player.y + dy*(i/steps);
      if (isWallAt(tx, ty)) {
        lostFlash = 12;
        player = { x: pad + (start.c + 0.5)*cellW, y: pad + (start.r + 0.5)*cellH };
        return;
      }
      player.x = tx; player.y = ty;
    }
    const ddx = player.x - goalPos.x, ddy = player.y - goalPos.y;
    if (ddx*ddx + ddy*ddy < (playerR + 8)*(playerR + 8)) {
      won = true;
      setTimeout(()=>onWin&&onWin(), 700);
    }
  }

  canvas.addEventListener('pointerdown', (e)=>{
    const p = toCanvas(e);
    if (Math.hypot(p.x-player.x, p.y-player.y) < playerR + 18) { dragging = true; canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId); }
  });
  canvas.addEventListener('pointermove', (e)=>{ if(!dragging) return; e.preventDefault(); const p=toCanvas(e); tryMoveTo(p.x,p.y); });
  window.addEventListener('pointerup', ()=>{ dragging=false; });

  function loop(){ if(lostFlash>0) lostFlash--; draw(); raf = requestAnimationFrame(loop); }
  loop();
  return ()=>{ cancelAnimationFrame(raf); };
}
