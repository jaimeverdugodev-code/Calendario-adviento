export function vibrate(ms = 30) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

export function createSnow(container, count = 40) {
  for (let i = 0; i < count; i++) {
    const flake = document.createElement('span');
    flake.className = 'snowflake';
    const size = 2 + Math.random() * 4;
    flake.style.width = `${size}px`;
    flake.style.height = `${size}px`;
    flake.style.left = `${Math.random() * 100}%`;
    flake.style.animationDuration = `${6 + Math.random() * 10}s`;
    flake.style.animationDelay = `${Math.random() * 10}s`;
    flake.style.opacity = String(0.3 + Math.random() * 0.5);
    container.appendChild(flake);
  }
}

export function launchConfetti(layer, count = 80) {
  layer.innerHTML = '';
  const colors = ['#D4AF37', '#B81D33', '#F2C6CE', '#FDF8F5', '#ff6b81'];
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    const isHeart = Math.random() < 0.35;
    piece.textContent = isHeart ? '❤' : '';
    if (!isHeart) {
      piece.style.background = colors[i % colors.length];
      piece.style.width = `${6 + Math.random() * 6}px`;
      piece.style.height = `${8 + Math.random() * 8}px`;
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    } else {
      piece.style.color = colors[i % colors.length];
      piece.style.fontSize = `${10 + Math.random() * 10}px`;
    }
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.animationDelay = `${Math.random() * 0.6}s`;
    piece.style.animationDuration = `${1.8 + Math.random() * 1.8}s`;
    layer.appendChild(piece);
  }
  setTimeout(() => { layer.innerHTML = ''; }, 4000);
}

export function showModal(el) { el.classList.remove('hidden'); }
export function hideModal(el) { el.classList.add('hidden'); }

export function setProgress(completed, total = 24) {
  const fill = document.getElementById('progress-fill');
  const text = document.getElementById('progress-text');
  const pct = Math.max(0, Math.min(100, (completed / total) * 100));
  if (fill) fill.style.width = `${pct}%`;
  if (text) text.textContent = `${completed} / ${total}`;
}
