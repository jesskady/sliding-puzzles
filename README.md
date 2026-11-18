# Sliding Puzzles

Variations on the 15 puzzle: one missing tile, slide tiles into the gap to put them back in order, on boards of different shapes.

## Boards

- **Square**: the classic, 3×3 to 6×6
- **Pyramid**: triangles that flip as they slide between up- and down-pointing cells
- **Triangle stack**: separate upright triangles; each moves to any of up to 6 neighbors
- **Hexagon**: interlocking honeycomb in a hexagonal outline
- **Ring**: a square board with a hole in the middle
- **Dartboard**: concentric colored rings cut into wedges; tiles move around a ring or in/out a ring

## Features

- Click a tile next to the gap, or turn on mouse-move control and swipe from the gap into a tile
- Shuffle (random legal moves, so every scramble is solvable), Reset
- Solve: finds and plays back a solution (shortest possible when it can, otherwise a tile-by-tile strategy)
- Peek: hover to see the solved board

## Running

The solver runs in a Web Worker, so serve the folder over HTTP rather than opening the file directly:

```
npx http-server -p 8090 -c-1
```

Then open http://localhost:8090.

## Adding a board

Each board is a builder in `index.html` that returns a list of cells, each with a polygon, a center, and its neighbor cell indices. The game logic, solver, and mouse control work from that graph alone. Solved state is tile *k* in cell *k*−1, with the gap in the last cell.
