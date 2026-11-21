// Día 5: Memory de Recuerdos - 3x4 (6 parejas)
export function startGame(container, config, onWin) {
  const pairs = (config.gameConfig && config.gameConfig.pairs) || ["❤️","🎄","⭐","🎁","☃️","💌"];
  const items = [...pairs, ...pairs];
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  const root = document.createElement('div');
  root.style.cssText = 'position:absolute;inset:0;padding:12px;display:flex;flex-direction:column;gap:8px;';
  container.appendChild(root);

  const info = document.createElement('div');
  info.style.cssText = 'text-align:center;color:#f2c6ce;font-weight:600;';
  info.textContent = 'Encuentra las 6 parejas';
  root.appendChild(info);

  const grid = document.createElement('div');
  grid.style.cssText = 'flex:1;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(4,1fr);gap:8px;';
  root.appendChild(grid);

  let first = null, second = null, lock = false, matched = 0;

  items.forEach((val, i) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.dataset.value = val;
    card.dataset.index = i;
    card.style.cssText = 'border:none;border-radius:12px;background:linear-gradient(160deg,#b81d33,#7a1224);color:transparent;font-size:1.8rem;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(0,0,0,0.25);border:1px solid rgba(212,175,55,0.4);transition:transform 0.2s,background 0.2s;min-height:0;';
    card.textContent = val;
    card.addEventListener('click', () => flip(card));
    grid.appendChild(card);
  });

  function reveal(card, on) {
    if (on) {
      card.style.background = 'linear-gradient(160deg,#fdf8f5,#f2c6ce)';
      card.style.color = '#2c1a1d';
      card.style.transform = 'scale(1.02)';
    } else {
      card.style.background = 'linear-gradient(160deg,#b81d33,#7a1224)';
      card.style.color = 'transparent';
      card.style.transform = '';
    }
  }

  function flip(card) {
    if (lock) return;
    if (card.dataset.matched === '1') return;
    if (first === card) return;
    reveal(card, true);
    if (!first) { first = card; return; }
    second = card;
    lock = true;
    if (first.dataset.value === second.dataset.value) {
      first.dataset.matched = '1';
      second.dataset.matched = '1';
      matched++;
      info.textContent = `Parejas: ${matched} / ${pairs.length}`;
      first = null; second = null; lock = false;
      if (matched === pairs.length) {
        info.textContent = '¡Todas las parejas encontradas!';
        setTimeout(() => onWin && onWin(), 700);
      }
    } else {
      setTimeout(() => {
        reveal(first, false);
        reveal(second, false);
        first = null; second = null; lock = false;
      }, 650);
    }
  }

  return () => { root.innerHTML = ''; };
}
