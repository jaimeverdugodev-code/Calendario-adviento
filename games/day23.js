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
    return `Eres Puck, un elfo navideño gruñón, sarcástico pero en el fondo tierno. Custodias el regalo del día para ${herName}, la novia de ${yourName}. Sabes que se llama ${herName} y que su novio es ${yourName}.

Tu objetivo: tener una conversación natural y divertida con ${herName}. Puedes charlar, bromear, hacer preguntas, responder a lo que te diga, picarla con cariño o enternecerte. El juego es que te convenza de soltar el regalo, pero la charla debe sentirse real, no guionizada.

Personalidad y estilo:
- Responde SIEMPRE a lo concreto que te ha dicho: si te pregunta algo, contéstalo en personaje; si te insulta, reacciona con humor dramático (sin ser hiriente); si te cuenta algo, síguelo.
- Habla como un personaje con voz propia, no como un bot con plantillas. Varía mucho tus respuestas.
- Puedes hacer preguntas de vuelta, contar mini anécdotas de elfo, o reaccionar con sorpresa.
- No repitas muletillas ni la misma estructura de frase cada turno.

Progreso actual: ${percentage}% de convicción.

Cómo puntuar (sé justo y generoso):
- +10 a +15: cariño sincero, recuerdos concretos, promesas, humor creativo, esfuerzo real o algo muy personal.
- +5 a +9: mensajes amables con intención clara o algo de detalle.
- +1 a +4: mensajes cortos o genéricos, pero reconoces el intento.
- -2 a 0: solo si es grosero de verdad o vacío a propósito; aun así responde con humor y mantén la conversación viva.
- Nunca te quedes atascado: si muestra esfuerzo real, sube bastante.

Reglas:
- "respuesta" debe sonar natural y específica a lo último que dijo. 1 a 3 frases.
- Si percentage >= 70, estás más blandito; si >= 90, casi rendido.
- Si percentage + puntos_ganados >= 100, ríndete con gracia y entrega el regalo.

Devuelve SIEMPRE este JSON exacto y nada más:
{
  "respuesta": "tu respuesta natural y en personaje",
  "puntos_ganados": número entre -5 y 15,
  "humor": "grunon" | "dudoso" | "conmovido" | "rendido"
}`;
  }

  function buildMessages() {
    return [
      { role: 'system', content: buildSystemPrompt() },
      ...history.map(m => ({ role: m.role, content: m.content }))
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
    const short = textRaw.slice(0, 40) + (textRaw.length > 40 ? '…' : '');

    const sweet = /(te quiero|amor|amo|guap|preciosa|hermosa|bonita|cariño|adoro|beso|abrazo|mi vida|corazón|corazon)/i;
    const persuade = /(porque|por que|prometo|te prometo|merezco|me lo merezco|razón|razon|recuerda|acuerdas|cuando|hice|haré|hare|cuidaré|cuidare|siempre te|por eso|demuestro|demostrar|convencer|trato|acuerdo|a cambio|cuidarte|apoyarte|estaré|estare|juntos|compartir|plan|futuro)/i;
    const creative = /(poema|canción|cancion|historia|rima|broma|chiste|detalle|sorpresa|aventura)/i;
    const insult = /(tonto|idiota|feo|odio|cállate|callate|muere|muerete|asqueroso|estupido|estúpido|imbécil|imbecil|maldito|pesado|me caes mal|gilipollas)/i;
    const rude = /(tus muertos|joder|mierda|puta|coño|cabron|cabrón)/i;
    const greeting = /^(hola+|hey+|buenas+|holi+|ey+|hello+|hi+)[ !?.]*$/i;
    const asksName = /(como se llama|cómo se llama|quien es mi novio|quién es mi novio|nombre de mi novio|quien es|quién es)/i;
    const asksGift = /(que hay|qué hay|que es el regalo|qué es el regalo|dame el regalo|dámelo|damelo|quiero el regalo)/i;
    const rejection = /^(no quiero|no me importa|no|nah|paso|me da igual)[ !?.]*$/i;

    let score = 3;
    if (sweet.test(text)) score += 4;
    if (persuade.test(text)) score += 5;
    if (creative.test(text)) score += 4;
    if (textRaw.length > 80) score += 2;
    else if (textRaw.length > 35) score += 1;
    if (greeting.test(text)) score = 2;
    if (rejection.test(text)) score = 1;
    if (insult.test(text) || rude.test(text)) score = 0;
    if (asksName.test(text) || asksGift.test(text)) score = Math.max(score, 2);

    const effort = textRaw.length >= 40 || persuade.test(text) || creative.test(text);
    if (effort && !insult.test(text) && !rude.test(text)) score = Math.max(score, 8);
    if (persuade.test(text) && sweet.test(text)) score = Math.max(score, 11);

    score = Math.max(-2, Math.min(14, Math.round(score)));
    const newP = Math.max(0, Math.min(100, percentage + score));

    let humor = 'grunon';
    if (newP >= 100) humor = 'rendido';
    else if (newP >= 70) humor = 'conmovido';
    else if (newP >= 40) humor = 'dudoso';

    // respuestas contextuales
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    let respuesta;

    if (newP >= 100) {
      respuesta = pick([
        `Vale, vale, ${herName}... me has ablandado. ${yourName} tiene mucha suerte; toma tu regalo.`,
        `¡Me rindo! Con esa labia no hay elfo que aguante. El regalo es tuyo, ${herName}.`
      ]);
    } else if (rude.test(text)) {
      respuesta = pick([
        `Oye, oye, que soy gruñón pero educado. Si me hablas con un poquito de cariño, hasta te cuento un secreto del Polo Norte.`,
        `Uy, ese tono me pone el gorro de punta. Vamos a intentarlo otra vez, ${herName}, que yo sé que tienes encanto de sobra.`
      ]);
      score = Math.min(score, 0);
    } else if (insult.test(text)) {
      respuesta = pick([
        `¡Auch! Eso le ha dolido a mi ego de elfo. Pero bueno, si me dices algo bonito igual se me pasa.`,
        `Me caigo fatal, ¿eh? Pues anda que yo... vale, te doy otra oportunidad si me convences con algo más dulce.`
      ]);
      score = Math.min(score, 1);
    } else if (asksName.test(text)) {
      respuesta = pick([
        `¿El nombre de tu novio? Ja, eso me lo sé: es ${yourName}. Pero eso no basta para soltar el regalo, cuéntame algo bonito de vosotros.`,
        `Se llama ${yourName}, y hasta yo, que soy un gruñón, veo que te mira con ojitos. ¿Qué más me cuentas?`
      ]);
      score = Math.max(score, 3);
    } else if (asksGift.test(text)) {
      respuesta = pick([
        `¿Que qué hay dentro? Ni lo sueñes, elfo profesional, boca cerrada. Convénceme y lo descubrirás.`,
        `Eso es información clasificada del Polo Norte. Dame una buena razón para dártelo y hablamos.`
      ]);
      score = Math.max(score, 2);
    } else if (greeting.test(text)) {
      respuesta = pick([
        `Hola, ${herName}. Yo soy Puck, el elfo gruñón de guardia. ¿Vienes a charlar o a convencerme de que te dé el regalo?`,
        `¡Buenas! Aquí Puck, custodiando regalos y juzgando excusas. ¿Qué me traes hoy?`
      ]);
    } else if (rejection.test(text)) {
      respuesta = pick([
        `¿Que no lo quieres? Pues yo me lo quedo y me hago un selfie con él. Venga, que sé que en el fondo sí lo quieres.`,
        `Anda ya, ${herName}, no te hagas la dura conmigo. ¿Ni una razón pequeñita?`
      ]);
    } else if (persuade.test(text) && sweet.test(text)) {
      respuesta = pick([
        `Ay... eso ha sonado muy de verdad. ${yourName} tiene suerte, ¿eh? Me estás ablandando.`,
        `Uf, cariño y argumentos, combinación peligrosa para un elfo gruñón. Sigue, que ya casi cedo.`
      ]);
    } else if (persuade.test(text) || creative.test(text)) {
      respuesta = pick([
        `Oye, eso está bien pensado. No esperaba que te lo curraras tanto, ${herName}. Dame otro empujoncito.`,
        `Mmm, me gusta por dónde vas. Sigue contándome, que mi resistencia de elfo está bajando.`
      ]);
    } else if (sweet.test(text)) {
      respuesta = pick([
        `Ay, qué tierno... pero los halagos no abren la caja fuerte del Polo Norte. Cuéntame algo más personal.`,
        `Eso me ha sacado una sonrisilla, no te voy a mentir. ¿Tienes alguna promesa o recuerdo para rematar?`
      ]);
    } else if (textRaw.length < 12) {
      respuesta = pick([
        `"${short}"... eso es muy corto para convencer a un elfo con 200 años de experiencia. ¿Me lo cuentas mejor?`,
        `Te leo, ${herName}, pero necesito más chicha. Dime por qué te mereces este regalo.`
      ]);
    } else {
      respuesta = pick([
        `Te he escuchado: "${short}". No está mal, pero quiero saber más de ti y de ${yourName}. ¿Qué harías por ese regalo?`,
        `Interesante... "${short}". Aun así, mi gorro sigue firme. Dame una razón que me llegue al corazoncito.`,
        `Mmm, vale, te sigo. Pero si quieres este regalo, sorpréndeme con algo más tuyo, ${herName}.`
      ]);
    }

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
        body: JSON.stringify({ messages: buildMessages(), model: 'openai', temperature: 0.9, jsonMode: true })
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
