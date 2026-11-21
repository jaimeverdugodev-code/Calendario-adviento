// Día 10: Para el Tiempo - detener entre 5.00 y 5.50
export function startGame(container, config, onWin) {
  const min = (config.gameConfig && config.gameConfig.min) || 5.0;
  const max = (config.gameConfig && config.gameConfig.max) || 5.5;

  let running = false;
  let startTime = 0;
  let raf = null;
  let stopped = false;
  let finalTime = 0;

  const root = document.createElement('div');
  root.className = 'game-center-col';
  root.style.background = 'radial-gradient(circle at 50% 30%, #1f2a24, #12090c)';
  container.appendChild(root);

  const title = document.createElement('div');
  title.style.cssText = 'color:#f2c6ce;font-weight:600;';
  title.textContent = `Para el tiempo entre ${min.toFixed(2)} y ${max.toFixed(2)} s`;
  root.appendChild(title);

  const display = document.createElement('div');
  display.style.cssText = 'font-family:"Playfair Display",serif;font-size:3.2rem;color:#d4af37;letter-spacing:2px;text-shadow:0 2px 12px rgba(212,175,55,0.3);';
  display.textContent = '00.00';
  root.appendChild(display);

  const msg = document.createElement('div');
  msg.style.cssText = 'min-height:24px;color:#f2c6ce;text-align:center;';
  msg.textContent = 'Toca "Empezar" y luego "Parar" en el momento justo';
  root.appendChild(msg);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'game-btn';
  btn.textContent = 'Empezar';
  root.appendChild(btn);

  function tick() {
    if (!running) return;
    const t = (Date.now() - startTime) / 1000;
    display.textContent = t.toFixed(2).padStart(5, '0');
    raf = requestAnimationFrame(tick);
  }

  btn.addEventListener('click', () => {
    if (!running && !stopped) {
      running = true;
      startTime = Date.now();
      btn.textContent = 'Parar';
      msg.textContent = '...';
      tick();
    } else if (running) {
      running = false;
      cancelAnimationFrame(raf);
      finalTime = (Date.now() - startTime) / 1000;
      display.textContent = finalTime.toFixed(2).padStart(5, '0');
      stopped = true;
      if (finalTime >= min && finalTime <= max) {
        msg.textContent = `¡Tiempo perfecto! (${finalTime.toFixed(2)} s) ❤`;
        btn.textContent = '¡Genial!';
        btn.disabled = true;
        setTimeout(() => onWin && onWin(), 700);
      } else {
        msg.textContent = `Te quedaste en ${finalTime.toFixed(2)} s. ${finalTime < min ? 'Un poco pronto.' : 'Te pasaste.'}`;
        btn.textContent = 'Intentar de nuevo';
        btn.disabled = false;
      }
    } else if (stopped) {
      // deja ver el tiempo y vuelve a estado listo sin reiniciar el tirón
      stopped = false;
      finalTime = 0;
      display.textContent = '00.00';
      btn.textContent = 'Empezar';
      msg.textContent = 'Cuando quieras, pulsa "Empezar"';
    }
  });

  return () => { running = false; cancelAnimationFrame(raf); };
}
