// Día 18: Sopa de Letras - marcar palabras
export function startGame(container, config, onWin) {
  const words = (config.gameConfig && config.gameConfig.words) || ["AMOR","BESO","NIEVE","CHICHARRON","NAVIDAD"];
  const size = (config.gameConfig && config.gameConfig.size) || 10;
  const letters = 'ABCDEFGHIJKLMNÑOPRSTUVWXYZ';
  let grid = Array.from({length:size}, ()=>Array(size).fill(''));
  let placements = []; // {word, cells:[{r,c}]}
  let found = new Set();
  let selecting = false;
  let selCells = [];
  let won = false;

  function canPlace(word, r, c, dr, dc) {
    for (let i=0;i<word.length;i++) {
      const rr=r+dr*i, cc=c+dc*i;
      if (rr<0||rr>=size||cc<0||cc>=size) return false;
      const ch = grid[rr][cc];
      if (ch && ch !== word[i]) return false;
    }
    return true;
  }
  function place(word) {
    const dirs = [[0,1],[1,0],[0,-1],[-1,0],[1,1],[1,-1]];
    for (let tries=0; tries<200; tries++) {
      const [dr,dc] = dirs[Math.floor(Math.random()*dirs.length)];
      const r = Math.floor(Math.random()*size);
      const c = Math.floor(Math.random()*size);
      if (!canPlace(word,r,c,dr,dc)) continue;
      const cells=[];
      for (let i=0;i<word.length;i++){ const rr=r+dr*i, cc=c+dc*i; grid[rr][cc]=word[i]; cells.push({r:rr,c:cc}); }
      placements.push({word, cells});
      return true;
    }
    return false;
  }
  // place words
  for (const w of words) place(w.toUpperCase());
  // fill rest
  for (let r=0;r<size;r++) for (let c=0;c<size;c++) if (!grid[r][c]) grid[r][c]=letters[Math.floor(Math.random()*letters.length)];

  const root = document.createElement('div');
  root.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;padding:10px;gap:8px;';
  container.appendChild(root);

  const info = document.createElement('div');
  info.style.cssText = 'color:#f2c6ce;font-weight:600;text-align:center;';
  info.textContent = 'Encuentra: ' + words.join(', ');
  root.appendChild(info);

  const board = document.createElement('div');
  board.style.cssText = `display:grid;grid-template-columns:repeat(${size},1fr);gap:3px;width:min(94vw,${Math.min(container.clientHeight||420,400)-30}px);aspect-ratio:1/1;touch-action:none;`;
  root.appendChild(board);

  const status = document.createElement('div');
  status.style.cssText = 'color:#d4af37;font-weight:700;min-height:22px;';
  root.appendChild(status);

  const cellEls = [];
  function cellKey(r,c){ return `${r},${c}`; }
  function isInSel(r,c){ return selCells.some(s=>s.r===r&&s.c===c); }
  function foundWordOf(r,c){ for(const p of placements) if(found.has(p.word) && p.cells.some(x=>x.r===r&&x.c===c)) return p.word; return null; }

  function render() {
    board.innerHTML = ''; cellEls.length = 0;
    for (let r=0;r<size;r++) for (let c=0;c<size;c++) {
      const el = document.createElement('div');
      const fw = foundWordOf(r,c);
      const sel = isInSel(r,c);
      let bg = 'rgba(253,248,245,0.12)';
      if (fw) bg = 'rgba(46,125,50,0.55)';
      else if (sel) bg = 'rgba(212,175,55,0.5)';
      const fontSize = size >= 10 ? '0.72rem' : '1.05rem';
      el.style.cssText = `display:flex;align-items:center;justify-content:center;border-radius:6px;background:${bg};color:#fff;font-weight:700;font-size:${fontSize};user-select:none;border:1px solid rgba(212,175,55,0.25);`;
      el.textContent = grid[r][c];
      el.dataset.r = r; el.dataset.c = c;
      board.appendChild(el);
      cellEls.push(el);
    }
  }

  function cellFromPoint(clientX, clientY) {
    const el = document.elementFromPoint(clientX, clientY);
    if (!el || !el.dataset || el.dataset.r == null) return null;
    return { r: parseInt(el.dataset.r), c: parseInt(el.dataset.c) };
  }

  function trySelect() {
    if (selCells.length < 2) return;
    const str = selCells.map(s=>grid[s.r][s.c]).join('');
    const rev = str.split('').reverse().join('');
    for (const p of placements) {
      if (found.has(p.word)) continue;
      if (p.word === str || p.word === rev) {
        found.add(p.word);
        status.textContent = `¡Encontrada: ${p.word}!`;
        if (found.size === placements.length) {
          won = true;
          render();
          setTimeout(()=>onWin&&onWin(), 700);
          return;
        }
      }
    }
  }

  board.addEventListener('pointerdown', (e)=>{ if(won) return; selecting=true; selCells=[]; const c=cellFromPoint(e.clientX,e.clientY); if(c){ selCells.push(c); render(); } board.setPointerCapture && board.setPointerCapture(e.pointerId); });
  board.addEventListener('pointermove', (e)=>{ if(!selecting||won) return; const c=cellFromPoint(e.clientX,e.clientY); if(!c) return; if(!isInSel(c.r,c.c)) { selCells.push(c); render(); } });
  const endSel = ()=>{ if(!selecting) return; selecting=false; trySelect(); selCells=[]; render(); };
  window.addEventListener('pointerup', endSel);

  render();
  return ()=>{ window.removeEventListener('pointerup', endSel); };
}
