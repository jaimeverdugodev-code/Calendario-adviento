import { DIAS } from './diasData.js';
import { markCompleted } from './storage.js';

let current = null; // { day, cleanup, config }

export async function openGame(day, container, onWin, onCloseReady) {
  closeCurrentGame(container);
  const config = DIAS.find(d => d.day === day);
  if (!config) return;

  container.innerHTML = '';
  container.dataset.day = String(day);

  let module;
  try {
    module = await import(`../games/${config.gameId}.js`);
  } catch (e) {
    container.innerHTML = `<div class="game-error">No se pudo cargar el juego.<br><small>${e.message}</small></div>`;
    console.error(e);
    return;
  }

  const start = module.startGame || module.default;
  if (typeof start !== 'function') {
    container.innerHTML = '<div class="game-error">Juego no disponible.</div>';
    return;
  }

  let finished = false;
  const wrappedOnWin = () => {
    if (finished) return;
    finished = true;
    markCompleted(day);
    onWin(config);
  };

  const cleanup = start(container, config, wrappedOnWin) || (() => {});
  current = { day, cleanup: typeof cleanup === 'function' ? cleanup : () => {}, config };
  if (onCloseReady) onCloseReady();
  return current;
}

export function closeCurrentGame(container) {
  if (current) {
    try { current.cleanup(); } catch (e) { console.warn('cleanup error', e); }
    current = null;
  }
  if (container) container.innerHTML = '';
}

export function getCurrentConfig() {
  return current?.config || null;
}
