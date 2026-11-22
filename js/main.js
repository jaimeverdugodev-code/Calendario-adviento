import { CONFIG, DIAS } from './diasData.js';
import { isCompleted, resetProgress, completedCount } from './storage.js';
import { getDayState, isAdminMode } from './calendar.js';
import { openGame, closeCurrentGame } from './engine.js';
import { vibrate, createSnow, launchConfetti, showModal, hideModal, setProgress } from './ui.js';
import { unlockAudio, tryStartMusic, toggleMusic, isMusicEnabled, isMusicPlaying, sfx } from './audio.js';

const calendarEl = document.getElementById('calendar');
const gameModal = document.getElementById('game-modal');
const rewardModal = document.getElementById('reward-modal');
const gameContainer = document.getElementById('game-container');
const gameTitle = document.getElementById('game-title');
const gameDayLabel = document.getElementById('game-day-label');
const gameRetry = document.getElementById('game-retry');
const confettiLayer = document.getElementById('confetti-layer');

let activeDayConfig = null;

function init() {
  document.getElementById('header-title').textContent = `${CONFIG.iniciales} · ${CONFIG.subtitulo}`;

  const musicBtn = document.getElementById('music-toggle');
  const syncMusicBtn = () => {
    if (!musicBtn) return;
    const on = isMusicEnabled();
    musicBtn.textContent = on ? '♪' : '♪̸';
    musicBtn.classList.toggle('off', !on);
    musicBtn.title = on ? 'Música: activada' : 'Música: desactivada';
  };
  syncMusicBtn();
  if (musicBtn) {
    musicBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      unlockAudio();
      const on = toggleMusic();
      syncMusicBtn();
      if (on) hideAudioHint();
    });
  }
  // arrancar música con la primera interacción del usuario (política de autoplay)
  const audioHint = document.getElementById('audio-hint');
  const hideAudioHint = () => { if (audioHint) audioHint.classList.add('hidden'); };
  const showAudioHint = () => { if (audioHint && isMusicEnabled()) audioHint.classList.remove('hidden'); };
  const unlockOnce = () => {
    unlockAudio();
    hideAudioHint();
    window.removeEventListener('pointerdown', unlockOnce);
    window.removeEventListener('touchstart', unlockOnce);
    window.removeEventListener('keydown', unlockOnce);
  };
  window.addEventListener('pointerdown', unlockOnce, { passive: true });
  window.addEventListener('touchstart', unlockOnce, { passive: true });
  window.addEventListener('keydown', unlockOnce);
  // Intento automático (funcionará en algunos navegadores/escritorio; en móvil mostrará aviso)
  tryStartMusic();
  setTimeout(() => {
    if (isMusicEnabled() && !isMusicPlaying()) showAudioHint();
    else hideAudioHint();
  }, 1200);

  if (isAdminMode()) {
    const resetBtn = document.getElementById('admin-reset');
    resetBtn.classList.remove('hidden');
    resetBtn.addEventListener('click', () => {
      if (confirm('¿Resetear todo el progreso?')) {
        resetProgress();
        renderCalendar();
      }
    });
  }

  document.getElementById('game-close').addEventListener('click', closeGameModal);
  document.getElementById('reward-close').addEventListener('click', closeRewardModal);
  document.getElementById('reward-ok').addEventListener('click', closeRewardModal);
  document.getElementById('reward-replay').addEventListener('click', () => {
    const cfg = activeDayConfig;
    closeRewardModal();
    if (cfg) openGameModal(cfg);
  });
  gameRetry.addEventListener('click', () => {
    if (activeDayConfig) openGameModal(activeDayConfig);
  });

  // click outside inner to close reward (optional nice UX)
  rewardModal.addEventListener('click', (e) => {
    if (e.target === rewardModal) closeRewardModal();
  });

  createSnow(document.getElementById('snow'), 45);
  renderCalendar();
  registerSW();
}

function renderCalendar() {
  calendarEl.innerHTML = '';
  for (let day = 1; day <= 24; day++) {
    const state = getDayState(day);
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `day-card ${state}`;
    card.setAttribute('aria-label', `Día ${day}`);

    const num = document.createElement('div');
    num.className = 'day-num';
    num.textContent = day;
    card.appendChild(num);

    if (state === 'locked') {
      const lock = document.createElement('div');
      lock.className = 'lock';
      lock.textContent = '🔒';
      card.appendChild(lock);
    } else if (state === 'completed') {
      const seal = document.createElement('div');
      seal.className = 'seal';
      seal.textContent = '❤';
      card.appendChild(seal);
    } else if (state === 'today') {
      const icon = document.createElement('div');
      icon.className = 'day-icon';
      icon.textContent = '✨';
      card.appendChild(icon);
    } else {
      const icon = document.createElement('div');
      icon.className = 'day-icon';
      icon.textContent = '🎁';
      card.appendChild(icon);
    }

    card.addEventListener('click', () => onDayClick(day, state, card));
    calendarEl.appendChild(card);
  }
  setProgress(completedCount(), 24);
}

function onDayClick(day, state, card) {
  const cfg = DIAS.find(d => d.day === day);
  if (!cfg) return;
  if (state === 'locked') {
    vibrate(30);
    sfx('fail');
    card.classList.remove('shake');
    // force reflow to restart animation
    void card.offsetWidth;
    card.classList.add('shake');
    setTimeout(() => card.classList.remove('shake'), 400);
    return;
  }
  sfx('tap');
  if (state === 'completed') {
    activeDayConfig = cfg;
    openRewardModal(cfg, { canReplay: true });
    return;
  }
  openGameModal(cfg);
}

async function openGameModal(cfg) {
  activeDayConfig = cfg;
  gameTitle.textContent = cfg.title;
  gameDayLabel.textContent = `Día ${cfg.day}`;
  gameRetry.classList.remove('hidden');
  showModal(gameModal);
  await openGame(cfg.day, gameContainer, handleWin);
}

function closeGameModal() {
  closeCurrentGame(gameContainer);
  hideModal(gameModal);
}

function handleWin(cfg) {
  closeGameModal();
  renderCalendar();
  sfx('win');
  openRewardModal(cfg, { canReplay: true, celebrate: true });
}

function openRewardModal(cfg, { canReplay = false, celebrate = false } = {}) {
  activeDayConfig = cfg;
  document.getElementById('reward-day').textContent = `Día ${cfg.day} · ${cfg.title}`;
  const img = document.getElementById('reward-photo');
  img.src = cfg.photo;
  img.alt = `Recuerdo del día ${cfg.day}`;
  document.getElementById('reward-message').textContent = cfg.message;
  document.getElementById('reward-replay').style.display = canReplay ? '' : 'none';
  showModal(rewardModal);
  if (celebrate) launchConfetti(confettiLayer, 90);
}

function closeRewardModal() {
  hideModal(rewardModal);
  confettiLayer.innerHTML = '';
}

function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('SW reg failed', err));
    });
  }
}

init();
