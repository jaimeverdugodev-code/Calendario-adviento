// Día 23: Convence al Elfo Gruñón - usa LLM via proxy serverless (/api/chat) con fallback
import { sfx } from '../js/audio.js';

const LLM_PROXY_PATH = '/api/chat';

export function startGame(container, config, onWin) {
  const cfg = config.gameConfig || {};
  const herName = cfg.herName || 'Bea';
  const yourName = cfg.yourName || 'Jaime';

  let percentage = 15;
  let history = []; // {role:'assistant'|'user', content}
  let busy = false;
  let won = false;
  let currentHumor = 'grunon';

  const EMOJI = { grunon: '😒', dudoso: '🤨', conmovido: '🥺', rendido: '🥰' };
  const elfImgs = {}; // state -> url

  const root = document.createElement('div');
  root.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;background:linear-gradient(180deg,#1a1014,#120a0d);color:#fff;font-family:"Plus Jakarta Sans",sans-serif;';
  container.appendChild(root);

  const top = document.createElement('div');
  top.style.cssText = 'padding:10px 12px 8px;text-align:center;border-bottom:1px solid rgba(212,175,55,0.25);';
  root.appendChild(top);

  const avatar = document.createElement('div');
  avatar.style.cssText = 'height:84px;display:flex;align-items:center;justify-content:center;font-size:52px;line-height:1;margin-bottom:6px;transition:transform 0.3s ease;';
  avatar.textContent = '😒';
  top.appendChild(avatar);

  const barWrap = document.createElement('div');
  barWrap.style.cssText = 'position:relative;height:18px;background:rgba(253,248,245,0.12);border-radius:999px;overflow:hidden;border:1px solid rgba(212,175,55,0.35);margin:0 auto;max-width:360px;';
  const bar = document.createElement('div');
  bar.style.cssText = 'height:100%;width:15%;background:#7a1224;border-radius:999px;transition:width 0.5s ease, background 0.5s ease;';
  barWrap.appendChild(bar);
  const barText = document.createElement('div');
  barText.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,0.6);';
  barText.textContent = '15%';
  barWrap.appendChild(barText);
  top.appendChild(barWrap);

  const bubbleHost = document.createElement('div');
  bubbleHost.style.cssText = 'position:relative;height:0;';
  top.appendChild(bubbleHost);

  const chat = document.createElement('div');
  chat.style.cssText = 'flex:1;overflow:auto;padding:10px 10px 6px;display:flex;flex-direction:column;gap:8px;';
  root.appendChild(chat);

  const inputWrap = document.createElement('div');
  inputWrap.style.cssText = 'display:flex;gap:8px;padding:8px;border-top:1px solid rgba(212,175,55,0.25);background:rgba(0,0,0,0.15);';
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Convénceme...';
  input.style.cssText = 'flex:1;padding:10px 12px;border-radius:999px;border:1px solid rgba(212,175,55,0.35);background:rgba(253,248,245,0.08);color:#fff;font-size:0.95rem;outline:none;';
  const sendBtn = document.createElement('button');
  sendBtn.type = 'button';
  sendBtn.className = 'btn btn-primary';
  sendBtn.textContent = 'Enviar';
  sendBtn.style.cssText = 'padding:10px 14px;font-size:0.9rem;';
  inputWrap.appendChild(input); inputWrap.appendChild(sendBtn);
  root.appendChild(inputWrap);

  function canLoad(url) {
    return new Promise(resolve => {
      const im = new Image();
      im.onload = () => resolve(true);
      im.onerror = () => resolve(false);
      im.src = url;
    });
  }

  // carga imágenes personalizadas de estados si existen en public/elfo/
  (async () => {
    const states = ['grunon', 'dudoso', 'conmovido', 'rendido'];
    const exts = ['png', 'jpg', 'jpeg', 'webp', 'svg'];
    for (const st of states) {
      for (const ext of exts) {
        const url = `public/elfo/${st}.${ext}`;
        // eslint-disable-next-line no-await-in-loop
        const ok = await canLoad(url);
        if (ok) { elfImgs[st] = url; break; }
      }
    }
    renderAvatar(currentHumor);
  })();

  function stateFor(p, humor) {
    if (p >= 100 || humor === 'rendido') return 'rendido';
    if (humor === 'conmovido' || p >= 70) return 'conmovido';
    if (humor === 'dudoso' || p >= 40) return 'dudoso';
    return 'grunon';
  }

  function renderAvatar(humor) {
    currentHumor = humor;
    const st = stateFor(percentage, humor);
    const src = elfImgs[st];
    if (src) {
      avatar.style.fontSize = '0';
      avatar.innerHTML = `<img src="${src}" alt="${st}" style="width:80px;height:80px;object-fit:contain;display:block;">`;
    } else {
      avatar.innerHTML = '';
      avatar.style.fontSize = '52px';
      avatar.textContent = EMOJI[st] || '😒';
    }
  }

  function colorFor(p) {
    const t = Math.max(0, Math.min(1, p / 100));
    const r = Math.round(122 + (212 - 122) * t);
    const g = Math.round(18 + (175 - 18) * t);
    const b = Math.round(36 + (55 - 36) * t);
    return `rgb(${r},${g},${b})`;
  }

  function updateBar(humor) {
    const p = Math.max(0, Math.min(100, percentage));
    bar.style.width = p + '%';
    bar.style.background = colorFor(p);
    barText.textContent = Math.round(p) + '%';
    renderAvatar(humor);
  }

  function showFloat(text) {
    const f = document.createElement('div');
    f.textContent = text;
    f.style.cssText = 'position:absolute;left:50%;top:-8px;transform:translateX(-50%);color:#f0d77a;font-weight:700;font-size:0.95rem;pointer-events:none;animation:elfFloat 1.2s ease forwards;text-shadow:0 1px 4px rgba(0,0,0,0.6);';
    bubbleHost.appendChild(f);
    setTimeout(() => f.remove(), 1300);
  }

  function addMsg(role, text) {
    const row = document.createElement('div');
    row.style.cssText = `display:flex;${role === 'user' ? 'justify-content:flex-end;' : 'justify-content:flex-start;'}`;
    const b = document.createElement('div');
    b.style.cssText = `max-width:85%;padding:9px 12px;border-radius:14px;line-height:1.35;font-size:0.93rem;white-space:pre-wrap;` +
      (role === 'user'
        ? 'background:linear-gradient(135deg,#b81d33,#8f1830);color:#fff;border-bottom-right-radius:4px;'
        : 'background:rgba(253,248,245,0.12);color:#fdf8f5;border:1px solid rgba(212,175,55,0.25);border-bottom-left-radius:4px;');
    b.textContent = text;
    row.appendChild(b);
    chat.appendChild(row);
    chat.scrollTop = chat.scrollHeight;
  }

  function extractJSON(text) {
    if (!text) return null;
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      const fixed = match[0].replace(/'([^']+?)'\s*:/g, '"$1":').replace(/:\s*'([^']*?)'/g, (m, g1) => ': "' + g1.replace(/"/g, '\\"') + '"');
      return JSON.parse(fixed);
    } catch (e) {
      try { return JSON.parse(match[0]); } catch (e2) { return null; }
    }
  }

  function normalize(result) {
    let respuesta = typeof result.respuesta === 'string' ? result.respuesta : 'Mmm... no me convence. Ponme una razón mejor.';
    let puntos = Number(result.puntos_ganados);
    if (!Number.isFinite(puntos)) puntos = 3;
    puntos = Math.max(-5, Math.min(15, Math.round(puntos)));
    const humorOk = ['grunon', 'dudoso', 'conmovido', 'rendido'];
    let humor = humorOk.includes(result.humor) ? result.humor : 'dudoso';
    return { respuesta, puntos_ganados: puntos, humor };
  }

  function buildSystemPrompt() {
    return `Eres un elfo navideño gruñón, sarcástico pero en el fondo blandito que custodia el regalo del día para ${herName}, la novia de ${yourName}.
Tu objetivo: ponerle pegas cómicas y objeciones en cada respuesta y retarla a CONVENCERTE de algo concreto (por qué se lo merece, una promesa, un recuerdo que lo demuestre, una razón específica, resolver tu pega, etc.).
Reglas:
- No basta con piropos o "te quiero": si solo dice cosas bonitas sin argumento, da pocos o ningún punto y ponle una pega.
- Si da buenos argumentos, recuerdos concretos, promesas creíbles o te convence de verdad, da más puntos y reduce tus objeciones.
- Siempre responde con una pega/objeción o un reto (excepto si ya estás rendido al 100%).
- Sé creativo y específico en tus respuestas, reacciona a lo que ella diga (no repitas siempre lo mismo).
Devuelve SIEMPRE este JSON exacto y nada más:
{
  "respuesta": "Tu respuesta corta, teatral y graciosa con una pega u objeción (máx 2 frases)",
  "puntos_ganados": número entre -5 y 15 (0-3 si solo halagos/vago, 4-8 si argumenta, 9-15 si convence muy bien),
  "humor": "grunon" | "dudoso" | "conmovido" | "rendido"
}`;
  }

  function buildMessages() {
    return [
      { role: 'system', content: buildSystemPrompt() },
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: `Porcentaje actual: ${percentage}%. Responde SOLO con el JSON pedido, sin texto adicional.` }
    ];
  }

  async function callServerProxy() {
    const resp = await fetch(LLM_PROXY_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: buildMessages(), temperature: 0.9 })
    });
    if (!resp.ok) throw new Error('Proxy error ' + resp.status);
    const data = await resp.json();
    const json = data && typeof data.respuesta === 'string' ? data : extractJSON(data && data.text);
    if (json && typeof json.respuesta === 'string') return normalize(json);
    throw new Error('Respuesta proxy no válida');
  }

  function localFallback(hist) {
    const last = [...hist].reverse().find(m => m.role === 'user');
    const textRaw = (last ? last.content : '');
    const text = textRaw.toLowerCase().trim();
    let score = 0;

    const sweet = /(te quiero|amor|amo|guap|preciosa|hermosa|bonita|cariño|adoro|beso|abrazo|mi vida)/i;
    const persuade = /(porque|por que|prometo|te prometo|merezco|me lo merezco|razón|razon|recuerda|acuerdas|cuando|hice|haré|hare|cuidaré|cuidare|siempre te|por eso|demuestro|demostrar|convencer|trato|acuerdo|a cambio|cuidarte|apoyarte|estaré|estare|juntos|compartir)/i;
    const creative = /(poema|canción|cancion|historia|plan|futuro|sueño|detalle|sorpresa)/i;
    const generic = /^(hola|hey|vale|ok|bien|si|sí|no|porfa|please|jaja+|jeje+|xd+|gracias)$/i;

    if (generic.test(text)) score -= 1;
    if (sweet.test(text)) score += 2;
    if (persuade.test(text)) score += 7;
    if (creative.test(text)) score += 3;
    if (textRaw.length > 70) score += 2;
    else if (textRaw.length > 35) score += 1;

    if (sweet.test(text) && !persuade.test(text) && textRaw.length < 45) score = Math.min(score, 3);
    if (persuade.test(text) && (textRaw.length > 40 || creative.test(text))) score = Math.max(score, 9);

    score = Math.max(-4, Math.min(12, Math.round(score)));

    const newP = Math.max(0, Math.min(100, percentage + score));
    let humor = 'grunon';
    if (newP >= 100) humor = 'rendido';
    else if (newP >= 70) humor = 'conmovido';
    else if (newP >= 40) humor = 'dudoso';

    const objeciones = {
      grunon: [
        'Mmm, halagos bonitos, pero eso no es un motivo. ¿Qué pega me pones para que te crea? Dame una razón de verdad.',
        '¿Y por qué iba a dártelo? Puedo quedármelo yo. Convénceme con algo mejor que “te quiero”.',
        'No está mal, pero sigo sin verlo claro. ¿Qué harías o qué recuerdas que demuestre que te lo mereces?'
      ],
      dudoso: [
        'Vale, eso suena algo mejor... pero tengo otra pega: ¿por qué HOY y no mañana? Convénceme.',
        'Empiezas a convencerme, aunque no del todo. Dame un argumento más fuerte o una promesa.',
        'Mmm, puede que tengas razón, pero no me basta. ¿Qué más me dices para ganarte este regalo?'
      ],
      conmovido: [
        'Ay, eso me ha tocado... pero aún dudo un poquito. Remátalo con una razón que me deje sin pegas.',
        'Uf, casi me ganas. Dame un último motivo bien bueno y puede que me rinda.',
        'Mi corazoncito elfo se ablanda, pero quiero escucharte convencerme una vez más.'
      ],
      rendido: [
        'Está bien, me has convencido con todas las de la ley. No tengo más pegas: el regalo es tuyo.',
        'Me rindo. Tus argumentos y tu ternura ganan. Toma tu regalo, te lo mereces.'
      ]
    };
    const pool = objeciones[humor];
    const respuesta = pool[Math.floor(Math.random() * pool.length)];
    return { respuesta, puntos_ganados: score, humor };
  }

  async function askLLM() {
    // 1) Proxy serverless de Vercel (usa OPENAI_API_KEY del lado servidor)
    try {
      return await callServerProxy();
    } catch (e) {
      console.warn('Fallo proxy LLM, probando alternativas:', e);
    }
    // 2) Intentar endpoint público gratuito (Pollinations)
    try {
      const resp = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: buildMessages(), model: 'openai', temperature: 0.9 })
      });
      if (resp.ok) {
        const data = await resp.json();
        const text = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        const json = extractJSON(text);
        if (json && typeof json.respuesta === 'string') return normalize(json);
      }
    } catch (e) { /* fallback */ }
    // 3) Fallback local (sin LLM)
    return localFallback(history);
  }

  async function onSend() {
    if (busy || won) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addMsg('user', text);
    history.push({ role: 'user', content: text });
    try { sfx('tap'); } catch (e) {}
    busy = true;
    sendBtn.disabled = true;
    sendBtn.textContent = '...';

    const result = await askLLM();
    const pts = result.puntos_ganados;
    percentage = Math.max(0, Math.min(100, percentage + pts));
    const sign = pts >= 0 ? '+' : '';
    showFloat(`${sign}${pts}% ${pts >= 0 ? '❤️' : '💨'}`);
    updateBar(result.humor);
    try { sfx(pts >= 0 ? 'pop' : 'fail'); } catch (e) {}

    addMsg('assistant', result.respuesta);
    history.push({ role: 'assistant', content: result.respuesta });

    if (percentage >= 100) {
      won = true;
      percentage = 100;
      updateBar('rendido');
      input.disabled = true;
      sendBtn.disabled = true;
      sendBtn.textContent = '❤';
      setTimeout(() => onWin && onWin(), 2500);
    } else {
      busy = false;
      sendBtn.disabled = false;
      sendBtn.textContent = 'Enviar';
      input.focus();
    }
  }

  if (!document.getElementById('elf-float-style')) {
    const style = document.createElement('style');
    style.id = 'elf-float-style';
    style.textContent = '@keyframes elfFloat{0%{opacity:0;transform:translate(-50%,0)}20%{opacity:1}100%{opacity:0;transform:translate(-50%,-28px)}}';
    document.head.appendChild(style);
  }

  sendBtn.addEventListener('click', onSend);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') onSend(); });

  const initial = "¡Alto ahí! Custodio este regalo y no lo suelto tan fácil. Pega número uno: no creo que tengas motivos suficientes. Convénceme, ¿por qué debería dártelo?";
  addMsg('assistant', initial);
  history.push({ role: 'assistant', content: initial });
  updateBar('grunon');

  return () => { busy = true; };
}
