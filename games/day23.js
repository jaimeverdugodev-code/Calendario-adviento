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

Tu personalidad:
- Eres teatral, gracioso y reactivo. Respondes específicamente a lo que ella dice, no con frases genéricas.
- Pones pegas juguetonas, pero eres fácil de ablandar si se esfuerza un poquito.
- Te encanta que te cuenten recuerdos, promesas, planes o detalles concretos.

Cómo puntuar (sé generoso y justo):
- +10 a +15: mensajes con cariño sincero, un recuerdo concreto, una promesa, un plan, humor, creatividad o algo personal.
- +5 a +9: mensajes amables con algo de detalle o intención clara.
- +1 a +4: mensajes muy cortos o genéricos ("te quiero", "hola"), pero igual agradece el intento.
- 0 a -2: solo si es claramente vacío, borde o intenta hacer trampa; incluso así responde con humor.
- Nunca te quedes atascado: si el mensaje muestra esfuerzo real, sube bastante.

Reglas:
- Máximo 2 frases en "respuesta".
- No repitas la misma objeción; varía el tono según lo que te diga.
- Si el porcentaje actual ya es alto (>=70), muéstrate más blandito.

Devuelve SIEMPRE este JSON exacto y nada más:
{
  "respuesta": "Tu respuesta corta, teatral y graciosa (máx 2 frases)",
  "puntos_ganados": número entre -5 y 15,
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
    const textRaw = (last ? last.content : '').trim();
    const text = textRaw.toLowerCase();

    const sweet = /(te quiero|amor|amo|guap|preciosa|hermosa|bonita|cariño|adoro|beso|abrazo|mi vida|corazón|corazon)/i;
    const persuade = /(porque|por que|prometo|te prometo|merezco|me lo merezco|razón|razon|recuerda|acuerdas|cuando|hice|haré|hare|cuidaré|cuidare|siempre te|por eso|demuestro|demostrar|convencer|trato|acuerdo|a cambio|cuidarte|apoyarte|estaré|estare|juntos|compartir|plan|futuro)/i;
    const creative = /(poema|canción|cancion|historia|rima|broma|chiste|detalle|sorpresa|aventura)/i;
    const effort = textRaw.length >= 40 || persuade.test(text) || creative.test(text);

    let score = 3; // base: cualquier intento suma algo
    if (sweet.test(text)) score += 3;
    if (persuade.test(text)) score += 5;
    if (creative.test(text)) score += 4;
    if (textRaw.length > 80) score += 2;
    else if (textRaw.length > 35) score += 1;

    // mensajes muy cortos o casi vacíos suman poco, pero no castigan duro
    if (textRaw.length < 8 && !sweet.test(text)) score = 1;

    // si hay esfuerzo real, asegura avance notable
    if (effort) score = Math.max(score, 8);
    if (persuade.test(text) && sweet.test(text)) score = Math.max(score, 11);

    score = Math.max(-2, Math.min(14, Math.round(score)));

    const newP = Math.max(0, Math.min(100, percentage + score));
    let humor = 'grunon';
    if (newP >= 100) humor = 'rendido';
    else if (newP >= 70) humor = 'conmovido';
    else if (newP >= 40) humor = 'dudoso';

    const respuestas = {
      grunon: [
        `Mmm, "${textRaw.slice(0, 28)}${textRaw.length > 28 ? '…' : ''}"... vale, me has sacado una sonrisa, pero quiero un detalle más.`,
        'No está mal, humano astuto. Dame otro motivo y puede que afloje la mano.',
        'Ajá, intento aceptable. Sigue así y este regalo empieza a resbalarse de mis dedos.'
      ],
      dudoso: [
        'Uy, eso me toca un poquito el gorro. Dame otra razón y te lo dejo más cerca.',
        'Empiezas a convencerme de verdad. Cuéntame algo más y quizá ceda.',
        'Mmm... estoy dudando, y eso para un elfo gruñón ya es mucho. ¡Sigue!'
      ],
      conmovido: [
        'Ay, mi corazoncito de elfo hace "crunch". Otro empujoncito y te lo doy.',
        'Vale, vale... ya casi no puedo hacerme el duro. ¡Remátalo!',
        'Eso ha sido bonito de verdad. Estoy a punto de rendirme, no me hagas llorar.'
      ],
      rendido: [
        '¡Ya está! Me has ganado. Toma el regalo antes de que cambie de opinión.',
        'Me rindo, me rindo. Nadie convence a un elfo gruñón como tú.'
      ]
    };
    const pool = respuestas[humor];
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
