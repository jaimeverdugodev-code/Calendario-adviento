// Día 3: Quiz de Recuerdos - 3 preguntas
export function startGame(container, config, onWin) {
  const questions = (config.gameConfig && config.gameConfig.questions) || [];
  let idx = 0;
  let locked = false;

  const root = document.createElement('div');
  root.className = 'game-center-col';
  root.style.cssText = 'position:absolute;inset:0;justify-content:flex-start;padding:18px 14px;overflow:auto;';
  container.appendChild(root);

  function render() {
    root.innerHTML = '';
    if (idx >= questions.length) {
      const done = document.createElement('div');
      done.className = 'game-overlay-msg';
      done.innerHTML = `<h3>¡Perfecto!</h3><p>Conoces nuestra historia de memoria.</p>`;
      root.appendChild(done);
      setTimeout(() => onWin && onWin(), 700);
      return;
    }
    const q = questions[idx];
    const prog = document.createElement('div');
    prog.style.cssText = 'color:#d4af37;font-weight:700;margin-bottom:8px;';
    prog.textContent = `Pregunta ${idx + 1} de ${questions.length}`;
    root.appendChild(prog);

    const card = document.createElement('div');
    card.style.cssText = 'background:rgba(253,248,245,0.08);border:1px solid rgba(212,175,55,0.3);border-radius:14px;padding:14px;width:100%;max-width:420px;';
    const qtext = document.createElement('div');
    qtext.style.cssText = 'font-size:1.1rem;color:#fff;margin-bottom:14px;line-height:1.35;font-weight:600;';
    qtext.textContent = q.q;
    card.appendChild(qtext);

    const opts = document.createElement('div');
    opts.style.cssText = 'display:flex;flex-direction:column;gap:10px;';
    q.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-secondary';
      btn.style.cssText = 'width:100%;text-align:left;border-radius:12px;padding:12px 14px;font-size:0.98rem;';
      btn.textContent = opt;
      btn.addEventListener('click', () => choose(i, btn, opts));
      opts.appendChild(btn);
    });
    card.appendChild(opts);
    root.appendChild(card);

    const feedback = document.createElement('div');
    feedback.id = 'quiz-feedback';
    feedback.style.cssText = 'min-height:28px;margin-top:12px;color:#f2c6ce;font-weight:600;';
    root.appendChild(feedback);
  }

  function choose(i, btn, opts) {
    if (locked) return;
    locked = true;
    const q = questions[idx];
    const buttons = Array.from(opts.querySelectorAll('button'));
    const feedback = root.querySelector('#quiz-feedback');
    if (i === q.answer) {
      btn.style.background = 'rgba(46,125,50,0.5)';
      btn.style.borderColor = '#7ed957';
      feedback.textContent = '¡Correcto! ❤';
      setTimeout(() => { idx++; locked = false; render(); }, 700);
    } else {
      btn.style.background = 'rgba(184,29,51,0.45)';
      feedback.textContent = 'Casi, inténtalo de nuevo';
      if (buttons[q.answer]) buttons[q.answer].style.borderColor = '#7ed957';
      setTimeout(() => {
        // allow retry of same question
        locked = false;
        feedback.textContent = '';
        btn.style.background = '';
        if (buttons[q.answer]) buttons[q.answer].style.borderColor = '';
      }, 900);
    }
  }

  render();
  return () => { root.innerHTML = ''; };
}
