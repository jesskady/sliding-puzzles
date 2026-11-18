// Web Worker: solves a tile puzzle on any board graph.
// Input:  { neighbors: number[][], state: number[] }  (state[cell] = tile, 0 = empty;
//         solved = tile k in cell k-1, empty in the last cell)
// Output: { moves: tile numbers to slide, in order, optimal: bool } or { moves: null }
//
// Phase 1: IDA* with a node budget -> shortest solution, if the scramble is easy enough.
// Phase 2: staged solve -> places one tile at a time, working from the cells farthest
//          from the final empty cell inward. Each stage is a small weighted A* in which
//          not-yet-placed tiles are interchangeable, and already-placed tiles may be
//          disturbed but must be home again at the end of the stage.

const IDA_BUDGET = 5e6;
const STAGE_BUDGET = 400e3;

onmessage = ({ data }) => {
  const nb = data.neighbors, N = nb.length;
  const dist = nb.map((_, s) => {
    const d = new Array(N).fill(Infinity); d[s] = 0;
    const q = [s];
    for (let i = 0; i < q.length; i++) for (const v of nb[q[i]]) if (d[v] === Infinity) { d[v] = d[q[i]] + 1; q.push(v); }
    return d;
  });

  const ida = idaStar(nb, dist, data.state.slice());
  if (ida) return postMessage({ moves: ida, optimal: true });
  postMessage({ moves: staged(nb, dist, data.state), optimal: false });
};

// Sum over tiles of graph distance to home cell (admissible on any graph).
function manhattan(s, dist) {
  let h = 0;
  for (let i = 0; i < s.length; i++) if (s[i]) h += dist[i][s[i] - 1];
  return h;
}

function idaStar(nb, dist, s) {
  const path = [];
  let nodes = 0, found = null;
  function dfs(blank, g, bound, h, prev) {
    if (++nodes > IDA_BUDGET) return Infinity;
    const f = g + h;
    if (f > bound) return f;
    if (h === 0) { found = path.slice(); return -1; }
    let min = Infinity;
    for (const c of nb[blank]) {
      if (c === prev) continue;
      const t = s[c];
      s[blank] = t; s[c] = 0; path.push(t);
      const r = dfs(c, g + 1, bound, h - dist[c][t - 1] + dist[blank][t - 1], blank);
      path.pop(); s[c] = t; s[blank] = 0;
      if (r === -1) return -1;
      if (r < min) min = r;
    }
    return min;
  }
  let bound = manhattan(s, dist);
  while (nodes <= IDA_BUDGET) {
    const r = dfs(s.indexOf(0), 0, bound, manhattan(s, dist), -1);
    if (r === -1) return found;
    if (r === Infinity) return null;
    bound = r;
  }
  return null;
}

const WILD = 255; // an unplaced tile in a stage's abstract state

function staged(nb, dist, start) {
  const N = nb.length, goalBlank = N - 1;
  const order = [];
  for (let t = 1; t < N; t++) order.push(t);
  order.sort((a, b) => dist[goalBlank][b - 1] - dist[goalBlank][a - 1] || a - b);

  const s = start.slice(), out = [], placed = new Set();
  for (const target of order) {
    placed.add(target);
    const abs = s.map(v => (v === 0 || placed.has(v) ? v : WILD));
    let path = null;
    for (const w of [2, 1.3, 4]) if ((path = stageSearch(nb, dist, abs, target, w))) break;
    if (!path) return null;
    for (const c of path) { const b = s.indexOf(0); out.push(s[c]); s[b] = s[c]; s[c] = 0; }
  }
  // Drop immediate back-and-forth moves created at stage boundaries.
  const res = [];
  for (const t of out) res.length && res[res.length - 1] === t ? res.pop() : res.push(t);
  return res;
}

// Weighted A* over abstract states; returns the list of cells the blank moves into.
function stageSearch(nb, dist, start, target, w) {
  const h = s => {
    let sum = 0, tpos = -1, blank = -1;
    for (let i = 0; i < s.length; i++) {
      const v = s[i];
      if (v === 0) blank = i;
      else if (v !== WILD) { sum += dist[i][v - 1]; if (v === target) tpos = i; }
    }
    // The blank must reach the target tile before the target can move.
    if (tpos !== target - 1) sum += Math.max(0, dist[blank][tpos] - 1);
    return sum;
  };
  const enc = s => String.fromCharCode.apply(null, s);
  const keys = [], gs = [], hs = [], parent = [], cellTo = [], blanks = [];
  const best = new Map(), heap = [];
  const f = id => gs[id] + w * hs[id];
  const push = id => {
    let i = heap.push(id) - 1;
    while (i > 0) { const p = (i - 1) >> 1; if (f(heap[p]) <= f(id)) break; heap[i] = heap[p]; i = p; }
    heap[i] = id;
  };
  const pop = () => {
    const top = heap[0], last = heap.pop();
    if (heap.length) {
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i, mv = f(last);
        if (l < heap.length && f(heap[l]) < mv) { m = l; mv = f(heap[l]); }
        if (r < heap.length && f(heap[r]) < mv) m = r;
        if (m === i) break;
        heap[i] = heap[m]; i = m;
      }
      heap[i] = last;
    }
    return top;
  };
  const add = (s, g, par, cell, blank) => {
    const id = keys.length, key = enc(s);
    keys.push(key); gs.push(g); hs.push(h(s)); parent.push(par); cellTo.push(cell); blanks.push(blank);
    best.set(key, g); push(id);
  };

  add(start, 0, -1, -1, start.indexOf(0));
  while (heap.length && keys.length < STAGE_BUDGET) {
    const id = pop();
    if (best.get(keys[id]) < gs[id]) continue; // stale entry
    if (hs[id] === 0) {
      const out = [];
      for (let i = id; parent[i] !== -1; i = parent[i]) out.push(cellTo[i]);
      return out.reverse();
    }
    const s = Array.from(keys[id], ch => ch.charCodeAt(0));
    const blank = blanks[id];
    for (const c of nb[blank]) {
      s[blank] = s[c]; s[c] = 0;
      const prev = best.get(enc(s));
      if (prev === undefined || gs[id] + 1 < prev) add(s, gs[id] + 1, id, c, c);
      s[c] = s[blank]; s[blank] = 0;
    }
  }
  return null;
}
