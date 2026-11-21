// Día 19: Salto a las Nubes (Doodle Jump simple) - llegar a la estrella
import { getMyAvatarForDay } from '../js/avatars.js';

export function startGame(container, config, onWin) {
  const targetHeight = (config.gameConfig && config.gameConfig.targetHeight) || 1800;
  const W = container.clientWidth || 360;
  const H = container.clientHeight || 420;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const avatar = new Image(); avatar.src = getMyAvatarForDay(config.day);
  let running = true, won = false, lost = false, raf;
  let cameraY = 0;
  let maxHeight = 0;
  let moveDir = 0; // -1 left, 1 right
  let pointerActive = false;

  const player = { x: W/2, y: H-80, w: 36, h: 36, vy: -10 };
  const gravity = 0.35;
  const jump = -10.5;
  const platforms = [];

  function addPlatform(y) {
    const w = 70 + Math.random()*30;
    platforms.push({ x: 20 + Math.random()*(W - 40 - w), y, w, h: 14 });
  }
  // initial platforms
  platforms.push({ x: W/2 - 45, y: H - 40, w: 90, h: 14 });
  for (let y = H - 120; y > -targetHeight - 400; y -= 70 + Math.random()*40) addPlatform(y);

  function worldToScreenY(y) { return y - cameraY; }

  function drawStar() {
    const starY = -targetHeight;
    const sy = worldToScreenY(starY);
    if (sy > H + 50 || sy < -100) return;
    ctx.save(); ctx.translate(W/2, sy);
    ctx.fillStyle = '#d4af37'; ctx.shadowColor='#ffe082'; ctx.shadowBlur=15;
    ctx.beginPath();
    for (let i=0;i<5;i++){
      const a = -Math.PI/2 + i*(Math.PI*2/5);
      const a2 = a + Math.PI/5;
      ctx.lineTo(Math.cos(a)*26, Math.sin(a)*26);
      ctx.lineTo(Math.cos(a2)*11, Math.sin(a2)*11);
    }
    ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.fillStyle='#f2c6ce'; ctx.font='14px "Plus Jakarta Sans",sans-serif'; ctx.textAlign='center';
    ctx.fillText('¡Meta!', W/2, sy + 40);
  }

  function draw() {
    const t = Math.min(1, maxHeight / targetHeight);
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0, `rgb(${10+20*t},${20+30*t},${50+40*t})`);
    g.addColorStop(1, '#1B0D12');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

    drawStar();
    // platforms
    for (const p of platforms) {
      const sy = worldToScreenY(p.y);
      if (sy < -30 || sy > H+30) continue;
      ctx.fillStyle = '#fdf8f5';
      roundRect(p.x, sy, p.w, p.h, 7); ctx.fill();
      ctx.fillStyle = '#d4af37'; ctx.fillRect(p.x+4, sy+3, p.w-8, 3);
      ctx.fillStyle = '#b81d33'; ctx.font='12px serif'; ctx.textAlign='center';
      ctx.fillText('🎁', p.x + p.w/2, sy + p.h - 1);
    }
    // player
    const py = worldToScreenY(player.y);
    ctx.save();
    ctx.beginPath(); ctx.arc(player.x, py, player.w/2+3, 0, Math.PI*2); ctx.fillStyle='#d4af37'; ctx.fill();
    ctx.beginPath(); ctx.arc(player.x, py, player.w/2, 0, Math.PI*2); ctx.clip();
    if (avatar.complete && avatar.naturalWidth) ctx.drawImage(avatar, player.x-player.w/2, py-player.h/2, player.w, player.h);
    else { ctx.fillStyle='#f2c6ce'; ctx.fill(); }
    ctx.restore();

    // HUD
    const pct = Math.floor((maxHeight/targetHeight)*100);
    ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.fillRect(8,8,150,34);
    ctx.fillStyle='#fff'; ctx.font='bold 15px "Plus Jakarta Sans",sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillText(`Altura: ${Math.min(100,pct)}%`, 16, 25);

    if (won || lost) {
      ctx.fillStyle='rgba(27,13,18,0.65)'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#d4af37'; ctx.font='bold 28px "Playfair Display",serif'; ctx.textAlign='center';
      ctx.fillText(won ? '¡Llegaste a la estrella!' : '¡Caíste!', W/2, H/2);
      if (lost) { ctx.fillStyle='#f2c6ce'; ctx.font='16px "Plus Jakarta Sans",sans-serif'; ctx.fillText('Toca reintentar', W/2, H/2+26); }
    }
  }

  function roundRect(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function update() {
    if (!running) return;
    if (!won && !lost) {
      if (pointerActive) player.x += moveDir * 4.2;
      player.vy += gravity;
      player.y += player.vy;
      if (player.x < -20) player.x = W+20;
      if (player.x > W+20) player.x = -20;

      // platforms collision (only when falling)
      if (player.vy > 0) {
        for (const p of platforms) {
          const px1 = player.x - player.w/2, px2 = player.x + player.w/2;
          const pyBottom = player.y + player.h/2;
          if (px2 > p.x && px1 < p.x + p.w && pyBottom >= p.y && pyBottom <= p.y + p.h + player.vy + 2) {
            player.y = p.y - player.h/2;
            player.vy = jump;
            break;
          }
        }
      }
      // camera follows up
      const screenY = worldToScreenY(player.y);
      if (screenY < H * 0.4) cameraY = player.y - H * 0.4;
      const climbed = (H - 80) - player.y;
      if (climbed > maxHeight) maxHeight = climbed;

      if (maxHeight >= targetHeight) { won = true; running=false; draw(); setTimeout(()=>onWin&&onWin(),800); return; }
      if (worldToScreenY(player.y) > H + 60) { lost = true; running=false; draw(); return; }
    }
    draw();
    raf = requestAnimationFrame(update);
  }

  function setDir(clientX) {
    const r = canvas.getBoundingClientRect();
    const x = clientX - r.left;
    moveDir = x < r.width/2 ? -1 : 1;
  }
  canvas.addEventListener('pointerdown', (e)=>{ pointerActive = true; setDir(e.clientX); });
  canvas.addEventListener('pointermove', (e)=>{ if(pointerActive) setDir(e.clientX); });
  window.addEventListener('pointerup', ()=>{ pointerActive=false; });

  update();
  return ()=>{ running=false; cancelAnimationFrame(raf); };
}
