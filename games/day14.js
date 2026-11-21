// Día 14: Simón Dice Navideño - repetir secuencia de 5 pasos (con sonido)
export function startGame(container, config, onWin) {
  const stepsTotal = (config.gameConfig && config.gameConfig.steps) || 5;
  const tones = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5
  const colors = [
    { base: '#b81d33', glow: '#ff6b81', label: '❤' },
    { base: '#2e7d32', glow: '#7ed957', label: '★' },
    { base: '#1565c0', glow: '#64b5f6', label: '❄' },
    { base: '#d4af37', glow: '#ffe082', label: '✦' },
  ];

  let sequence = [];
  let inputIndex = 0;
  let accepting = false;
  let level = 0;
  let audioCtx = null;

  const root = document.createElement('div');
  root.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:12px;';
  container.appendChild(root);

  const status = document.createElement('div');
  status.style.cssText = 'color:#f2c6ce;font-weight:700;text-align:center;min-height:24px;';
  status.textContent = 'Mira y escucha la secuencia...';
  root.appendChild(status);

  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(2,1fr);gap:12px;width:min(280px,80vw);aspect-ratio:1/1;';
  root.appendChild(grid);

  const pads = colors.map((c, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.style.cssText = `border:none;border-radius:18px;background:${c.base};color:#fff;font-size:1.6rem;box-shadow:0 6px 14px rgba(0,0,0,0.3);transition:transform 0.1s, filter 0.1s;filter:brightness(0.85);`;
    b.textContent = c.label;
    b.addEventListener('click', () => onPad(i));
    grid.appendChild(b);
    return b;
  });

  const startBtn = document.createElement('button');
  startBtn.type = 'button';
  startBtn.className = 'game-btn';
  startBtn.textContent = 'Empezar';
  root.appendChild(startBtn);

  function ensureAudio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    return audioCtx;
  }

  function beep(i, duration = 0.28) {
    try {
      const ctx = ensureAudio();
      if (!ctx) return;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = tones[i] || 440;
      const t = ctx.currentTime;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      o.connect(g); g.connect(ctx.destination);
      o.start(t);
      o.stop(t + duration + 0.05);
    } catch (e) { /* sin audio disponible */ }
  }

  function flash(i, duration = 450, sound = true) {
    return new Promise(res => {
      const p = pads[i];
      if (sound) beep(i, duration / 1000);
      p.style.filter = 'brightness(1.5)';
      p.style.transform = 'scale(1.05)';
      p.style.boxShadow = `0 0 20px ${colors[i].glow}`;
      setTimeout(() => {
        p.style.filter = 'brightness(0.85)';
        p.style.transform = '';
        p.style.boxShadow = '0 6px 14px rgba(0,0,0,0.3)';
        setTimeout(res, 120);
      }, duration);
    });
  }

  async function playSequence() {
    accepting = false;
    status.textContent = `Nivel ${level} de ${stepsTotal}`;
    await new Promise(r => setTimeout(r, 450));
    for (const idx of sequence) await flash(idx, 420, true);
    accepting = true;
    inputIndex = 0;
    status.textContent = 'Tu turno';
  }

  async function nextLevel() {
    level++;
    let next;
    if (sequence.length >= 2 && sequence[sequence.length - 1] === sequence[sequence.length - 2]) {
      const banned = sequence[sequence.length - 1];
      const opts = [0, 1, 2, 3].filter(i => i !== banned);
      next = opts[Math.floor(Math.random() * opts.length)];
    } else {
      next = Math.floor(Math.random() * 4);
    }
    sequence.push(next);
    await playSequence();
  }

  async function onPad(i) {
    if (!accepting) return;
    await flash(i, 180, true);
    if (i === sequence[inputIndex]) {
      inputIndex++;
      if (inputIndex === sequence.length) {
        accepting = false;
        if (level >= stepsTotal) {
          status.textContent = '¡Secuencia completa!';
          setTimeout(() => onWin && onWin(), 700);
        } else {
          status.textContent = '¡Bien! Siguiente...';
          setTimeout(nextLevel, 700);
        }
      }
    } else {
      accepting = false;
      // sonido de error
      try { const ctx = ensureAudio(); if (ctx) { const o=ctx.createOscillator(); const g=ctx.createGain(); o.type='sawtooth'; o.frequency.value=140; const t=ctx.currentTime; g.gain.setValueAtTime(0.12,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.25); o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t+0.3);} } catch(e){}
      status.textContent = 'Ups, esa no era. Intenta de nuevo';
      startBtn.style.display = '';
      startBtn.textContent = 'Reintentar';
      sequence = []; level = 0;
    }
  }

  startBtn.addEventListener('click', () => {
    ensureAudio();
    sequence = []; level = 0;
    startBtn.style.display = 'none';
    nextLevel();
  });

  return () => {
    if (audioCtx) { try { audioCtx.close(); } catch (e) {} }
  };
}
