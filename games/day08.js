// Día 8: Gira el Recuerdo - 3x3 piezas rotadas (5 fallos = reinicio)
import { sfx } from '../js/audio.js';

export function startGame(container, config, onWin) {
  const gridN = (config.gameConfig && config.gameConfig.grid) || 3;
  const maxFails = 5;
  const root = document.createElement('div');
  root.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;gap:8px;padding:10px;';
  container.appendChild(root);

  const info = document.createElement('div');
  info.style.cssText = 'text-align:center;color:#f2c6ce;font-weight:600;';
  root.appendChild(info);

  const boardWrap = document.createElement('div');
  boardWrap.style.cssText = 'flex:1;display:flex;align-items:center;justify-content:center;';
  const board = document.createElement('div');
  board.style.cssText = `display:grid;grid-template-columns:repeat(${gridN},1fr);grid-template-rows:repeat(${gridN},1fr);gap:3px;width:min(92vw,${Math.min(container.clientHeight||360,360)-40}px);aspect-ratio:1/1;background:rgba(212,175,55,0.3);padding:3px;border-radius:10px;`;
  boardWrap.appendChild(board);
  root.appendChild(boardWrap);

  const img = new Image();
  img.src = config.photo || '';
  let rotations = [];
  let won = false;
  let fails = 0;

  function updateInfo(msg) {
    const base = msg || 'Toca cada pieza para girarla hasta completar la foto';
    info.textContent = `${base} · Fallos: ${fails}/${maxFails}`;
  }

  function setup(resetFails = false) {
    if (resetFails) fails = 0;
    board.innerHTML = '';
    rotations = [];
    won = false;
    for (let r=0;r<gridN;r++) for (let c=0;c<gridN;c++) {
      let rot = [0,90,180,270][Math.floor(Math.random()*4)];
      rotations.push(rot);
    }
    // ensure not already solved
    if (rotations.every(x=>x===0)) rotations[0] = 90;
    updateInfo();

    for (let r=0;r<gridN;r++) for (let c=0;c<gridN;c++) {
      const idx = r*gridN + c;
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.style.cssText = 'position:relative;overflow:hidden;border:none;padding:0;background:#2c1a1d;border-radius:4px;';
      const inner = document.createElement('div');
      inner.style.cssText = `position:absolute;inset:0;width:${gridN*100}%;height:${gridN*100}%;left:${-c*100}%;top:${-r*100}%;transform:rotate(${rotations[idx]}deg);transform-origin:${(c+0.5)*(100/gridN)}% ${(r+0.5)*(100/gridN)}%;transition:transform 0.2s ease;background-size:100% 100%;`;
      // use the image as background on a child sized to whole board
      const imgLayer = document.createElement('img');
      imgLayer.src = img.src;
      imgLayer.alt = '';
      imgLayer.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;';
      imgLayer.onerror = () => {
        inner.style.background = `linear-gradient(135deg, #f2c6ce, #fdf8f5)`;
        inner.innerHTML = `<div style="position:absolute;left:${c*100/gridN}%;top:${r*100/gridN}%;width:${100/gridN}%;height:${100/gridN}%;display:flex;align-items:center;justify-content:center;color:#b81d33;font-weight:700;">❤</div>`;
      };
      inner.appendChild(imgLayer);
      cell.appendChild(inner);
      cell.addEventListener('click', () => {
        if (won) return;
        const wasCorrect = rotations[idx] % 360 === 0;
        rotations[idx] = (rotations[idx] + 90) % 360;
        inner.style.transform = `rotate(${rotations[idx]}deg)`;
        if (rotations.every(x => x % 360 === 0)) {
          won = true;
          info.textContent = '¡Foto completada!';
          try { sfx('win'); } catch (e) {}
          setTimeout(() => onWin && onWin(), 700);
          return;
        }
        if (wasCorrect) onFail();
      });
      board.appendChild(cell);
    }
  }

  function onFail() {
    fails += 1;
    try { sfx('fail'); } catch (e) {}
    if (fails >= maxFails) {
      updateInfo('Has fallado 5 veces. ¡Vuelve a intentarlo!');
      setTimeout(() => setup(true), 900);
      return;
    }
    updateInfo();
  }

  if (img.complete) setup(); else { img.onload = setup; img.onerror = setup; }
  return () => { root.innerHTML = ''; };
}
