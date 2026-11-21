// Día 7: Wordle Romántico - 5 letras, 6 intentos
export function startGame(container, config, onWin) {
  const answer = ((config.gameConfig && config.gameConfig.word) || 'BESOS').toUpperCase().slice(0, 5);
  const rows = 6, cols = 5;
  let grid = Array.from({ length: rows }, () => Array(cols).fill(''));
  let marks = Array.from({ length: rows }, () => Array(cols).fill(''));
  let row = 0, col = 0, ended = false;

  const root = document.createElement('div');
  root.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;padding:8px 6px 10px;gap:6px;color:#fff;overflow:auto;';
  container.appendChild(root);

  const msg = document.createElement('div');
  msg.style.cssText = 'min-height:20px;color:#f2c6ce;font-weight:600;text-align:center;font-size:0.9rem;';
  msg.textContent = 'Adivina la palabra (5 letras)';
  root.appendChild(msg);

  const board = document.createElement('div');
  board.style.cssText = 'display:grid;grid-template-rows:repeat(6,1fr);gap:5px;width:min(250px,100%);aspect-ratio:5/6;flex:0 0 auto;';
  root.appendChild(board);

  const checkBtn = document.createElement('button');
  checkBtn.type = 'button';
  checkBtn.className = 'game-btn';
  checkBtn.textContent = 'Comprobar';
  checkBtn.style.cssText = 'padding:10px 18px;font-size:0.95rem;margin-top:2px;';
  checkBtn.addEventListener('click', () => onKey('ENTER'));
  root.appendChild(checkBtn);

  const kb = document.createElement('div');
  kb.style.cssText = 'display:flex;flex-direction:column;gap:5px;width:100%;max-width:360px;margin-top:2px;';
  root.appendChild(kb);

  function renderBoard() {
    board.innerHTML = '';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = document.createElement('div');
        const ch = grid[r][c];
        const m = marks[r][c];
        let bg = 'rgba(253,248,245,0.08)', border = 'rgba(212,175,55,0.35)';
        if (m === 'correct') { bg = '#2e7d32'; border = '#2e7d32'; }
        else if (m === 'present') { bg = '#c9a227'; border = '#c9a227'; }
        else if (m === 'absent') { bg = 'rgba(255,255,255,0.12)'; border = 'transparent'; }
        cell.style.cssText = `display:flex;align-items:center;justify-content:center;border-radius:8px;border:1px solid ${border};background:${bg};font-weight:700;font-size:1.1rem;text-transform:uppercase;min-height:0;`;
        cell.textContent = ch;
        board.appendChild(cell);
      }
    }
    board.style.gridTemplateColumns = `repeat(${cols},1fr)`;
  }

  const keyState = {};
  function paintKey(k, m) {
    if (!keyState[k] || (keyState[k] === 'present' && m === 'correct') || (keyState[k] === 'absent' && m !== 'absent')) keyState[k] = m;
  }

  function renderKeyboard() {
    kb.innerHTML = '';
    const rowsKb = ['QWERTYUIOP', 'ASDFGHJKLÑ', 'ZXCVBNM'];
    rowsKb.forEach((rowStr, ri) => {
      const r = document.createElement('div');
      r.style.cssText = 'display:flex;justify-content:center;gap:3px;';
      const keys = ri === 2 ? ['⌫', ...rowStr.split('')] : rowStr.split('');
      keys.forEach(k => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = k;
        const st = keyState[k];
        let bg = 'rgba(253,248,245,0.18)';
        if (st === 'correct') bg = '#2e7d32'; else if (st === 'present') bg = '#c9a227'; else if (st === 'absent') bg = 'rgba(255,255,255,0.08)';
        const wide = k === '⌫';
        btn.style.cssText = `flex:${wide ? 1.4 : 1};min-width:0;padding:10px 0;border:none;border-radius:7px;background:${bg};color:#fff;font-weight:700;font-size:${wide ? '0.95rem' : '0.8rem'};`;
        btn.addEventListener('click', () => onKey(k));
        r.appendChild(btn);
      });
      kb.appendChild(r);
    });
  }

  function onKey(k) {
    if (ended) return;
    if (k === '⌫') {
      if (col > 0) { col--; grid[row][col] = ''; }
    } else if (k === 'ENTER') {
      if (col < cols) { msg.textContent = 'Faltan letras'; return; }
      submit();
    } else if (/^[A-ZÑ]$/.test(k)) {
      if (col < cols) { grid[row][col] = k; col++; }
    }
    renderBoard();
  }

  function submit() {
    const guess = grid[row].join('');
    const ans = answer.split('');
    const res = Array(cols).fill('absent');
    const used = Array(cols).fill(false);
    for (let i = 0; i < cols; i++) {
      if (guess[i] === ans[i]) { res[i] = 'correct'; used[i] = true; }
    }
    for (let i = 0; i < cols; i++) {
      if (res[i] === 'correct') continue;
      const j = ans.findIndex((ch, idx) => !used[idx] && ch === guess[i]);
      if (j >= 0) { res[i] = 'present'; used[j] = true; }
    }
    marks[row] = res;
    for (let i = 0; i < cols; i++) paintKey(guess[i], res[i]);
    renderBoard(); renderKeyboard();
    if (guess === answer) {
      ended = true; msg.textContent = '¡La palabra del amor!'; checkBtn.disabled = true;
      setTimeout(() => onWin && onWin(), 700);
      return;
    }
    row++; col = 0;
    if (row >= rows) {
      ended = true; msg.textContent = `Era: ${answer}. Pulsa reintentar`; checkBtn.disabled = true;
    } else {
      msg.textContent = 'Sigue intentando';
    }
  }

  function onPhysicalKey(e) {
    if (e.key === 'Backspace') onKey('⌫');
    else if (e.key === 'Enter') onKey('ENTER');
    else {
      const k = e.key.toUpperCase();
      if (/^[A-ZÑ]$/.test(k)) onKey(k);
    }
  }
  window.addEventListener('keydown', onPhysicalKey);
  renderBoard(); renderKeyboard();

  return () => { window.removeEventListener('keydown', onPhysicalKey); };
}
