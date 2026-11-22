// Día 19: Salto a las Nubes - control por inclinación del móvil
import { getMyAvatarForDay } from '../js/avatars.js';

export function startGame(container, config, onWin) {
  const targetHeight = (config.gameConfig && config.gameConfig.targetHeight) || 4200;
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
  let tiltX = 0; // gamma/acceleration-based
  let tiltActive = false;
  let keyboardDir = 0;

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

    // Cielo por etapas según altura: césped/cielo -> nubes -> espacio
    const sky = ctx.createLinearGradient(0,0,0,H);
    if (t < 0.33) {
      const p = t / 0.33;
      sky.addColorStop(0, `rgb(${90 - p*40},${170 - p*40},${235 - p*80})`);
      sky.addColorStop(0.7, `rgb(${120 - p*50},${200 - p*60},${255 - p*110})`);
      sky.addColorStop(1, '#4f9a4f');
    } else if (t < 0.66) {
      const p = (t - 0.33) / 0.33;
      sky.addColorStop(0, `rgb(${40 - p*20},${90 - p*30},${170 - p*60})`);
      sky.addColorStop(1, `rgb(${120 - p*60},${170 - p*80},${220 - p*90})`);
    } else {
      const p = (t - 0.66) / 0.34;
      sky.addColorStop(0, `rgb(${8 + p*4},${12 + p*8},${30 + p*20})`);
      sky.addColorStop(1, `rgb(${20 - p*10},${30 - p*15},${70 - p*30})`);
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0,0,W,H);

    // Césped al inicio
    if (t < 0.4) {
      const grassA = 1 - (t / 0.4);
      ctx.fillStyle = `rgba(62,140,62,${0.55 * grassA})`;
      ctx.fillRect(0, H - 70, W, 70);
      ctx.fillStyle = `rgba(95,180,95,${0.45 * grassA})`;
      for (let x=0; x<W; x+=16) ctx.fillRect(x, H - 72 - (x%3)*2, 8, 10);
    }

    // Nubes en tramo medio
    if (t > 0.15 && t < 0.8) {
      const cloudA = t < 0.45 ? (t - 0.15) / 0.3 : 1 - (t - 0.45) / 0.35;
      ctx.fillStyle = `rgba(255,255,255,${0.35 * Math.max(0, Math.min(1, cloudA))})`;
      for (let i=0;i<6;i++) {
        const cx = (i * 90 + 20) % (W + 60) - 30;
        const cy = 60 + (i % 3) * 55;
        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0, Math.PI*2);
        ctx.arc(cx+18, cy+4, 14, 0, Math.PI*2);
        ctx.arc(cx-16, cy+6, 12, 0, Math.PI*2);
        ctx.fill();
      }
    }

    // Estrellas al acercarse al espacio
    if (t > 0.55) {
      const starA = Math.min(1, (t - 0.55) / 0.35);
      ctx.fillStyle = `rgba(255,255,255,${0.85 * starA})`;
      for (let i=0;i<35;i++) ctx.fillRect((i*97)%W, (i*53)%(H*0.7), 2, 2);
    }

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

  let lastTime = 0;
  function update(time = 0) {
    if (!running) return;
    const dt = lastTime ? Math.min((time - lastTime) / (1000 / 60), 2) : 1;
    lastTime = time;
    if (!won && !lost) {
      const tiltDir = Math.max(-1, Math.min(1, tiltX / 25));
      // invertido: inclinar izquierda mueve izquierda en pantalla
      const dir = Math.abs(tiltDir) > 0.08 ? -tiltDir : keyboardDir;
      player.x += dir * 5.2 * dt;
      player.vy += gravity * dt;
      player.y += player.vy * dt;
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

  function onOrientation(e) {
    if (typeof e.gamma === 'number') {
      tiltX = e.gamma;
      tiltActive = true;
    }
  }
  function onMotion(e) {
    const ag = e.accelerationIncludingGravity;
    if (ag && typeof ag.x === 'number') {
      // Fallback aproximado para algunos dispositivos
      tiltX = Math.max(-45, Math.min(45, ag.x * 4.5));
      tiltActive = true;
    }
  }
  async function requestMotionPermission() {
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        const p = await DeviceOrientationEvent.requestPermission();
        if (p === 'granted') {
          window.addEventListener('deviceorientation', onOrientation);
        }
      } else {
        window.addEventListener('deviceorientation', onOrientation);
      }
      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        const p2 = await DeviceMotionEvent.requestPermission();
        if (p2 === 'granted') window.addEventListener('devicemotion', onMotion);
      } else {
        window.addEventListener('devicemotion', onMotion);
      }
    } catch (e) { /* ignore */ }
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') keyboardDir = -1;
    if (e.key === 'ArrowRight') keyboardDir = 1;
  };
  const onKeyUp = (e) => {
    if ((e.key === 'ArrowLeft' && keyboardDir === -1) || (e.key === 'ArrowRight' && keyboardDir === 1)) keyboardDir = 0;
  };

  canvas.addEventListener('pointerdown', requestMotionPermission);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('deviceorientation', onOrientation);
  window.addEventListener('devicemotion', onMotion);

  // hint overlay text via HUD when not tilt
  const originalDraw = draw;
  draw = function() {
    originalDraw();
    if (!won && !lost && !tiltActive) {
      ctx.fillStyle = 'rgba(253,248,245,0.85)';
      ctx.font = '12px "Plus Jakarta Sans",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Inclina el móvil (o usa ← → en PC)', W/2, H - 12);
    }
  };

  update();
  return ()=>{
    running=false;
    cancelAnimationFrame(raf);
    canvas.removeEventListener('pointerdown', requestMotionPermission);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('deviceorientation', onOrientation);
    window.removeEventListener('devicemotion', onMotion);
  };
}
