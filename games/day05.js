// Día 5: Memory de Recuerdos - 3x4 (6 parejas)
export function startGame(container, config, onWin) {
  const rawPairs = (config.gameConfig && config.gameConfig.pairs) || ["❤️", "🎄", "⭐", "🎁", "☃️", "💌"];
  const pairs = rawPairs.map((p, idx) => {
    if (p && typeof p === 'object') {
      return { id: String(p.id ?? idx), img: p.img || '', emoji: p.emoji || '', label: p.label || '' };
    }
    const s = String(p);
    const isImg = /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(s) || s.startsWith('public/') || s.startsWith('./') || s.startsWith('http');
    return { id: String(idx), img: isImg ? s : '', emoji: isImg ? '' : s, label: isImg ? `img-${idx}` : s };
  });
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

  function renderFace(card, faceUp) {
    card.innerHTML = '';
    if (!faceUp) {
      const q = document.createElement('span');
      q.textContent = '?';
      q.style.cssText = 'font-size:1.8rem;line-height:1;color:#fdf8f5;font-weight:700;';
      card.appendChild(q);
      return;
    }
    const imgSrc = card.dataset.img || '';
    const emoji = card.dataset.emoji || '';
    if (imgSrc) {
      const im = document.createElement('img');
      im.src = imgSrc;
      im.alt = card.dataset.label || 'carta';
      im.style.cssText = 'width:72%;height:72%;object-fit:contain;pointer-events:none;display:block;';
      im.onerror = () => { card.textContent = emoji || '❤'; };
      card.appendChild(im);
    } else {
      const span = document.createElement('span');
      span.textContent = emoji || '❤';
      span.style.cssText = 'font-size:2rem;line-height:1;';
      card.appendChild(span);
    }
  }

  items.forEach((val, i) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.dataset.value = val.id;
    card.dataset.img = val.img || '';
    card.dataset.emoji = val.emoji || '';
    card.dataset.label = val.label || '';
    card.dataset.index = String(i);
    card.style.cssText = 'border:none;border-radius:12px;background:linear-gradient(160deg,#b81d33,#7a1224);color:#fdf8f5;font-size:1.8rem;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(0,0,0,0.25);border:1px solid rgba(212,175,55,0.4);transition:transform 0.2s,background 0.2s;min-height:0;overflow:hidden;padding:6px;';
    renderFace(card, false);
    card.addEventListener('click', () => flip(card));
    grid.appendChild(card);
  });

  function reveal(card, on) {
    if (on) {
      card.style.background = 'linear-gradient(160deg,#fdf8f5,#f2c6ce)';
      card.style.color = '#2c1a1d';
      card.style.transform = 'scale(1.02)';
      renderFace(card, true);
    } else {
      card.style.background = 'linear-gradient(160deg,#b81d33,#7a1224)';
      card.style.color = '#fdf8f5';
      card.style.transform = '';
      renderFace(card, false);
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
