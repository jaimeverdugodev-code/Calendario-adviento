// Día 15: Puzle Deslizante 3x3 con foto
export function startGame(container, config, onWin) {
  const N = (config.gameConfig && config.gameConfig.grid) || 3;
  const size = N*N;
  let tiles = []; // 0..size-1, size-1 is empty
  let empty = size - 1;
  let won = false;

  const root = document.createElement('div');
  root.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;gap:8px;padding:10px;';
  container.appendChild(root);

  const info = document.createElement('div');
  info.style.cssText = 'color:#f2c6ce;font-weight:600;text-align:center;';
  info.textContent = 'Desliza las piezas para completar la foto';
  root.appendChild(info);

  const board = document.createElement('div');
  const boardPx = Math.min((container.clientWidth||320)-24, (container.clientHeight||380)-60, 320);
  board.style.cssText = `position:relative;width:${boardPx}px;height:${boardPx}px;background:rgba(212,175,55,0.25);border-radius:10px;padding:3px;box-shadow:inset 0 0 0 1px rgba(212,175,55,0.4);`;
  root.appendChild(board);

  const img = new Image(); img.src = config.photo || '';

  function idxToRC(i){ return {r: Math.floor(i/N), c: i%N}; }
  function rcToIdx(r,c){ return r*N+c; }
  function neighbors(i){
    const {r,c}=idxToRC(i); const out=[];
    if(r>0) out.push(rcToIdx(r-1,c)); if(r<N-1) out.push(rcToIdx(r+1,c));
    if(c>0) out.push(rcToIdx(r,c-1)); if(c<N-1) out.push(rcToIdx(r,c+1));
    return out;
  }
  function isSolved(){ for(let i=0;i<size;i++) if(tiles[i]!==i) return false; return true; }

  function shuffleSolvable(){
    tiles = Array.from({length:size}, (_,i)=>i);
    empty = size - 1;
    // do random legal moves
    let prev = -1;
    for (let m=0;m<200;m++){
      const ns = neighbors(empty).filter(x=>x!==prev);
      const pick = ns[Math.floor(Math.random()*ns.length)];
      tiles[empty]=tiles[pick]; tiles[pick]=size-1; prev=empty; empty=pick;
    }
    if (isSolved()) { // ensure not solved
      const ns = neighbors(empty); const pick = ns[0];
      tiles[empty]=tiles[pick]; tiles[pick]=size-1; empty=pick;
    }
  }

  function render(){
    board.innerHTML='';
    const gap = 3;
    const inner = boardPx - gap*2;
    const cell = inner / N;
    for (let i=0;i<size;i++){
      const val = tiles[i];
      if (val === size-1) continue;
      const {r,c} = idxToRC(i);
      const {r:sr,c:sc} = idxToRC(val);
      const tile = document.createElement('button');
      tile.type='button';
      tile.style.cssText = `position:absolute;left:${gap + c*cell}px;top:${gap + r*cell}px;width:${cell-gap}px;height:${cell-gap}px;border:none;border-radius:6px;overflow:hidden;padding:0;transition:left 0.12s ease, top 0.12s ease;`;
      const innerImg = document.createElement('img');
      innerImg.src = img.src;
      innerImg.alt='';
      innerImg.style.cssText = `position:absolute;width:${boardPx}px;height:${boardPx}px;left:${-sc*cell - gap}px;top:${-sr*cell - gap}px;object-fit:cover;pointer-events:none;`;
      innerImg.onerror = () => { tile.style.background = `hsl(${val*40},50%,45%)`; tile.textContent = val+1; tile.style.color='#fff'; tile.style.fontWeight='700'; innerImg.remove(); };
      tile.appendChild(innerImg);
      tile.addEventListener('click', () => move(i));
      board.appendChild(tile);
    }
  }

  function move(i){
    if (won) return;
    if (!neighbors(empty).includes(i)) return;
    tiles[empty]=tiles[i]; tiles[i]=size-1; empty=i;
    render();
    if (isSolved()){
      won = true; info.textContent='¡Puzle completado!';
      // show final full image overlay
      setTimeout(()=>onWin&&onWin(), 700);
    }
  }

  shuffleSolvable();
  if (img.complete) render(); else { img.onload = render; img.onerror = render; }
  return ()=>{};
}
