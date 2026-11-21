// Audio: música de fondo (pista del usuario o melodía sintetizada) y efectos (Web Audio API)
let ctx = null;
let musicEnabled = (typeof localStorage !== 'undefined' && localStorage.getItem('adviento-music') === 'off') ? false : true;
let musicPlaying = false;
let musicSource = null; // 'track' | 'synth' | null

// Synth background
let musicTimer = null;
let musicLoopId = 0;

// User track background
let bgTrack = null;
let trackAvailable = false;
let trackPromise = null;
let trackSettled = false;

const TRACK_CANDIDATES = [
  'public/audio/musica.mp3',
  'public/audio/musica.ogg',
  'public/audio/musica.wav',
  'public/audio/music.mp3',
  'public/audio/pista.mp3'
];

function AC() { return window.AudioContext || window.webkitAudioContext; }

export function getCtx() {
  if (!ctx) {
    const C = AC();
    if (C) ctx = new C();
  }
  return ctx;
}

export function unlockAudio() {
  const c = getCtx();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
  // Si hay pista del usuario, intenta (re)producirla en contexto de interacción
  if (bgTrack && trackAvailable && musicEnabled && musicPlaying) {
    if (bgTrack.paused) {
      bgTrack.play().then(() => {
        if (musicPlaying && musicEnabled) {
          musicSource = 'track';
          stopSynthLoop();
        }
      }).catch(() => {});
    } else if (musicSource !== 'track') {
      musicSource = 'track';
      stopSynthLoop();
    }
  }
  return c;
}

export function isMusicEnabled() { return musicEnabled; }

export function setMusicEnabled(v) {
  musicEnabled = !!v;
  try { localStorage.setItem('adviento-music', musicEnabled ? 'on' : 'off'); } catch (e) {}
  if (musicEnabled) startMusic();
  else stopMusic();
}

export function toggleMusic() { setMusicEnabled(!musicEnabled); return musicEnabled; }

// --- Carga de pista de usuario ---
function tryLoadTrack(src) {
  return new Promise(resolve => {
    const a = new Audio();
    let done = false;
    const cleanup = () => { a.oncanplaythrough = null; a.onloadeddata = null; a.onerror = null; };
    const ok = () => { if (done) return; done = true; cleanup(); bgTrack = a; resolve(true); };
    const fail = () => { if (done) return; done = true; cleanup(); resolve(false); };
    a.preload = 'auto';
    a.loop = true;
    a.volume = 0.18;
    a.oncanplaythrough = ok;
    a.onloadeddata = ok;
    a.onerror = fail;
    a.src = src;
    setTimeout(() => { if (!done) fail(); }, 3000);
  });
}

function ensureTrack() {
  if (!trackPromise) {
    trackPromise = (async () => {
      for (const src of TRACK_CANDIDATES) {
        // eslint-disable-next-line no-await-in-loop
        const ok = await tryLoadTrack(src);
        if (ok) { trackAvailable = true; trackSettled = true; return true; }
      }
      trackAvailable = false;
      trackSettled = true;
      return false;
    })();
  }
  return trackPromise;
}

// --- Efectos de sonido ---
export function sfx(type = 'tap') {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') c.resume().catch(() => {});
  const t = c.currentTime;
  const out = c.createGain();
  out.gain.value = 0.7;
  out.connect(c.destination);

  function tone(freq, start, dur, gain = 0.12, wave = 'sine', slideTo = null) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = wave;
    o.frequency.setValueAtTime(freq, t + start);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t + start + dur);
    g.gain.setValueAtTime(0.0001, t + start);
    g.gain.exponentialRampToValueAtTime(gain, t + start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + start + dur);
    o.connect(g); g.connect(out);
    o.start(t + start); o.stop(t + start + dur + 0.05);
  }

  switch (type) {
    case 'tap':
      tone(880, 0, 0.08, 0.08, 'sine', 660); break;
    case 'flap':
      tone(520, 0, 0.12, 0.09, 'triangle', 720); break;
    case 'score':
    case 'coin':
      tone(988, 0, 0.1, 0.1, 'sine');
      tone(1319, 0.08, 0.14, 0.1, 'sine'); break;
    case 'success':
      tone(784, 0, 0.12, 0.1, 'sine');
      tone(988, 0.1, 0.12, 0.1, 'sine');
      tone(1175, 0.2, 0.18, 0.1, 'sine'); break;
    case 'win':
      [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.22, 0.11, 'triangle'));
      tone(1319, 0.48, 0.35, 0.09, 'sine'); break;
    case 'fail':
    case 'hit':
      tone(220, 0, 0.18, 0.12, 'sawtooth', 120);
      tone(180, 0.08, 0.22, 0.1, 'triangle', 90); break;
    case 'pop':
      tone(600, 0, 0.06, 0.1, 'sine', 1200); break;
    case 'drop':
      tone(300, 0, 0.15, 0.08, 'triangle', 180); break;
    case 'catch':
      tone(740, 0, 0.09, 0.09, 'sine');
      tone(990, 0.07, 0.12, 0.09, 'sine'); break;
    default:
      tone(660, 0, 0.08, 0.08, 'sine');
  }
}

// --- Música de fondo sintetizada (fallback) ---
const N = { C4:261.63,D4:293.66,E4:329.63,F4:349.23,G4:392,A4:440,B4:493.88,C5:523.25,D5:587.33,E5:659.25,F5:698.46,G5:783.99, R:0 };
const MELODY = [
  [N.E4,1],[N.E4,1],[N.E4,2],
  [N.E4,1],[N.E4,1],[N.E4,2],
  [N.E4,1],[N.G4,1],[N.C4,1.5],[N.D4,0.5],[N.E4,4],
  [N.F4,1],[N.F4,1],[N.F4,1.5],[N.F4,0.5],
  [N.F4,1],[N.E4,1],[N.E4,1],[N.E4,0.5],[N.E4,0.5],
  [N.E4,1],[N.D4,1],[N.D4,1],[N.E4,1],[N.D4,2],[N.G4,2],
  [N.R,1],
  [N.C5,1],[N.C5,1],[N.C5,1],[N.C5,1],
  [N.B4,1],[N.B4,1],[N.C5,0.5],[N.B4,0.5],[N.A4,2],
  [N.G4,1],[N.G4,1],[N.A4,1],[N.B4,1],[N.C5,2],[N.G4,2],
  [N.R,2],
];

function scheduleMusicLoop(loopId) {
  const c = getCtx();
  if (!c || !musicEnabled || !musicPlaying || loopId !== musicLoopId) return;
  if (musicSource !== 'synth') return;
  const tempo = 145;
  const beat = 60 / tempo;
  let t = c.currentTime + 0.05;
  for (const [freq, beats] of MELODY) {
    const dur = beats * beat;
    if (freq > 0) {
      const o = c.createOscillator();
      const g = c.createGain();
      const o2 = c.createOscillator();
      const g2 = c.createGain();
      o.type = 'triangle'; o.frequency.setValueAtTime(freq, t);
      o2.type = 'sine'; o2.frequency.setValueAtTime(freq * 2, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.015, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.95);
      g2.gain.setValueAtTime(0.0001, t);
      g2.gain.linearRampToValueAtTime(0.004, t + 0.02);
      g2.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.7);
      o.connect(g); g.connect(c.destination);
      o2.connect(g2); g2.connect(c.destination);
      o.start(t); o.stop(t + dur);
      o2.start(t); o2.stop(t + dur);
    }
    t += dur;
  }
  const totalMs = (t - c.currentTime) * 1000;
  musicTimer = setTimeout(() => scheduleMusicLoop(loopId), Math.max(0, totalMs - 50));
}

function startSynthLoop() {
  musicLoopId++;
  scheduleMusicLoop(musicLoopId);
}

function stopSynthLoop() {
  musicLoopId++;
  if (musicTimer) { clearTimeout(musicTimer); musicTimer = null; }
}

export function startMusic() {
  if (!musicEnabled) return;
  const c = getCtx();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
  if (musicPlaying) return;
  musicPlaying = true;

  const playTrack = () => {
    if (!musicPlaying || !musicEnabled) return;
    stopSynthLoop();
    const p = bgTrack.play();
    if (p && typeof p.then === 'function') {
      p.then(() => { if (musicPlaying && musicEnabled) musicSource = 'track'; }).catch(() => { musicSource = 'synth'; startSynthLoop(); });
    } else {
      musicSource = 'track';
    }
  };

  const playSynth = () => {
    if (!musicPlaying || !musicEnabled) return;
    musicSource = 'synth';
    startSynthLoop();
  };

  if (trackSettled) {
    if (trackAvailable && bgTrack) playTrack();
    else playSynth();
    return;
  }

  // Pista aún sin resolver: arranca synth para que suene ya y cambia a pista si aparece
  playSynth();
  ensureTrack().then((ok) => {
    if (!musicPlaying || !musicEnabled) return;
    if (ok && bgTrack) {
      musicSource = 'track';
      stopSynthLoop();
      bgTrack.play().catch(() => { musicSource = 'synth'; startSynthLoop(); });
    }
  }).catch(() => {});
}

export function stopMusic() {
  musicPlaying = false;
  musicSource = null;
  stopSynthLoop();
  if (bgTrack) { try { bgTrack.pause(); } catch (e) {} }
}

export function tryStartMusic() {
  if (musicEnabled) startMusic();
}

// Pre-cargar pista de usuario para que el primer gesto pueda iniciar música sin esperar
ensureTrack().catch(() => {});
