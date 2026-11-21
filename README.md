# Sliding Puzzles

Variations on the 15 puzzle: one missing tile, slide tiles into the gap to put them back in order, on boards of different shapes.

**Play:** https://jesskady.github.io/sliding-puzzles/ (works on phones: tap a tile, or slide your finger from the gap through tiles)

## Boards

- **Square**: the classic, 3×3 to 6×6
- **Pyramid**: triangles that flip as they slide between up- and down-pointing cells
- **Triangle stack**: separate upright triangles; each moves to any of up to 6 neighbors
- **Hexagon**: interlocking honeycomb in a hexagonal outline
- **Ring**: a square board with a hole in the middle
- **Dartboard**: concentric colored rings cut into wedges; tiles move around a ring or in/out a ring
- **Color rings**: balls in overlapping circular tracks (2 overlapping, 3 in a row, or a 4-leaf clover). No gap: drag a ring to rotate every ball on it, and balls where tracks cross belong to both rings. On the clover, side-by-side rings share a straight column of 5 balls; grab a column ball on its left or right half to choose which ring turns. Solved when every ball is back in its color zone. (No auto-solve for these.)
- **Circle twist**: overlapping disks (3 in a triangle, 4 in a square, or a 6-circle flower) that turn in 60° or 90° steps, carrying everything inside them, including parts of the disks they overlap. Drag a disk around; it follows your finger and snaps to the nearest step. The surface is a fine lattice that each step maps exactly onto itself, so turns never drift. (No auto-solve for these.)

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

## Swipecube

2×2 to 5×5 Rubik's cubes built for phones: **https://jesskady.github.io/sliding-puzzles/cube/**

An exploded view shows the front face framed by the top, bottom, left and right faces, plus an x-ray back preview. Drag any sticker and its row or column turns with your finger (R, U, F and so on, plus B from the outer rows). Pads below the cube turn the whole cube (x/y and z). On 4×4 and 5×5 a SLICE / WIDE toggle decides whether an inner row turns alone (2R) or with everything outside it (Rw). Includes scramble, a solve timer, undo, animation speed, slice mode, and a drag-to-rearrange bottom row. The whole thing is `cube/index.html`.

## Clock puzzle

A two-sided clock puzzle: **https://jesskady.github.io/sliding-puzzles/clock/**

Nine clocks on each face, four pins, four corner wheels. Get all 18 clocks to 12. Drag around a wheel to turn it, and tap a pin to push it through. Holding a wheel lights up every clock it will move, on both faces, which makes it a good way to learn how the pins and gears connect. "How it works" explains the rules. The whole thing is `clock/index.html`.
