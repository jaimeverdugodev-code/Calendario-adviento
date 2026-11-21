// Día 2: Rasca y Gana - revela al 55%
export function startGame(container, config, onWin) {
  const revealTarget = (config.gameConfig && config.gameConfig.revealPercent) || 55;
  const W = container.clientWidth || 360;
  const H = container.clientHeight || 420;
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:relative;width:100%;height:100%;';
  container.appendChild(wrap);

  const base = document.createElement('canvas');
  base.width = W; base.height = H;
  base.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
  const top = document.createElement('canvas');
  top.width = W; top.height = H;
  top.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;touch-action:none;';
  wrap.appendChild(base);
  wrap.appendChild(top);

  const bctx = base.getContext('2d');
  const tctx = top.getContext('2d');

  // draw base: photo or voucher
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => { bctx.drawImage(img, 0, 0, W, H); drawOverlay(); };
  img.onerror = () => { drawVoucher(); drawOverlay(); };
  img.src = config.photo || '';

  function drawVoucher() {
    const g = bctx.createLinearGradient(0,0,W,H);
    g.addColorStop(0,'#fdf8f5'); g.addColorStop(1,'#f2c6ce');
    bctx.fillStyle = g; bctx.fillRect(0,0,W,H);
    bctx.strokeStyle = '#d4af37'; bctx.lineWidth = 6; bctx.strokeRect(18,18,W-36,H-36);
    bctx.fillStyle = '#b81d33';
    bctx.font = 'bold 28px "Playfair Display", serif';
    bctx.textAlign = 'center';
    bctx.fillText('Vale especial', W/2, H/2 - 20);
    bctx.fillStyle = '#2c1a1d';
    bctx.font = '18px "Plus Jakarta Sans", sans-serif';
    bctx.fillText('Canjeable por un abrazo', W/2, H/2 + 20);
    bctx.fillText('interminable', W/2, H/2 + 46);
  }

  function drawOverlay() {
    const g = tctx.createLinearGradient(0,0,W,H);
    g.addColorStop(0,'#d4af37'); g.addColorStop(0.5,'#f0d77a'); g.addColorStop(1,'#b8922e');
    tctx.globalCompositeOperation = 'source-over';
    tctx.fillStyle = g;
    tctx.fillRect(0,0,W,H);
    // texture
    for (let i=0;i<120;i++){
      tctx.fillStyle = `rgba(255,255,255,${Math.random()*0.15})`;
      tctx.fillRect(Math.random()*W, Math.random()*H, 2, 2);
    }
    tctx.fillStyle = 'rgba(44,26,29,0.75)';
    tctx.font = 'bold 22px "Playfair Display", serif';
    tctx.textAlign = 'center';
    tctx.fillText('Rasca aquí', W/2, H/2 - 8);
    tctx.font = '15px "Plus Jakarta Sans", sans-serif';
    tctx.fillText('Desliza el dedo para descubrir', W/2, H/2 + 20);
  }

  // if image loads slowly, ensure overlay still appears
  setTimeout(() => { if (tctx.getImageData(0,0,1,1).data[3] === 0) { if (!img.complete) drawVoucher(); drawOverlay(); } }, 300);

  let scratching = false;
  let won = false;

  function scratch(x, y) {
    if (won) return;
    tctx.globalCompositeOperation = 'destination-out';
    tctx.beginPath();
    tctx.arc(x, y, 22, 0, Math.PI * 2);
    tctx.fill();
  }

  function getPos(e) {
    const r = top.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return { x: (p.clientX - r.left) * (W / r.width), y: (p.clientY - r.top) * (H / r.height) };
  }

  function checkReveal() {
    if (won) return;
    try {
      const step = 8;
      const data = tctx.getImageData(0,0,W,H).data;
      let total = 0, clear = 0;
      for (let y=0; y<H; y+=step) {
        for (let x=0; x<W; x+=step) {
          total++;
          const i = (y*W + x) * 4 + 3;
          if (data[i] < 128) clear++;
        }
      }
      const pct = (clear / total) * 100;
      if (pct >= revealTarget) {
        won = true;
        tctx.clearRect(0,0,W,H);
        setTimeout(() => onWin && onWin(), 500);
      }
    } catch (e) { /* tainted canvas fallback */ }
  }

  let lastCheck = 0;
  function onDown(e){ scratching = true; const p=getPos(e); scratch(p.x,p.y); }
  function onMove(e){ if(!scratching) return; e.preventDefault(); const p=getPos(e); scratch(p.x,p.y); const now=Date.now(); if(now-lastCheck>250){ lastCheck=now; checkReveal(); } }
  function onUp(){ if(scratching){ scratching=false; checkReveal(); } }

  top.addEventListener('pointerdown', onDown);
  top.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);

  return () => {
    top.removeEventListener('pointerdown', onDown);
    top.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
  };
}
