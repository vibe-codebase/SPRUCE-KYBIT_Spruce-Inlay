# Spruce Inlay: design notes

**Pillars.** The classic sliding-block puzzle (Klotski, "Pennant"), made tactile: wood you can almost feel, knocks and rubs you can hear, and a reward that is literally a jewel. It should be calm, with free undo and no timer.

**Rules.**
- Pieces are 1×1, 1×2, 2×1 and the 2×2 jewel.
- A move slides one piece any distance in one direction.
- Grain pieces slide only along their grain.
- The box is solved when the jewel's top-left reaches the exit cell, just above the gap.

**Input.**
- Drag a piece; the axis is chosen once the finger has clearly moved.
- The piece follows the finger continuously, clamped to its free room with a little give at the ends, and snaps to the nearest cell on release.
- A piece with no room wiggles.

**Generation (`tools/gen.ts`).**
1. Lay the jewel at the exit, then fill the tray with random pieces. Dominoes are preferred, and a box is rejected if it has more than 5–6 little squares. Two cells are left empty.
2. Explore every arrangement the pieces can reach (look-alike pieces merged, at most 150,000 positions).
3. Search outward from every arrangement with the jewel at the exit to get each arrangement's true distance.
4. Choose a start at the far end of the template's par range, then confirm par with a forward search.

**Stars.** 3 if moves ≤ par, 2 if ≤ ⌈1.25·par⌉ + 1, else 1. A hint caps the box at 2.

**Accessibility.**
- Large drag targets, with every control 46 px+ and aria-labelled.
- Reduced motion keeps animation short.
- It plays fully offline.
