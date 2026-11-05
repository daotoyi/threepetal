import type { Tile } from "./types";

let nextId = 1;
const makeTile = (color: number): Tile => ({ id: nextId++, color });

export function createBoard(rows: number, cols: number, palette: number): Tile[][] {
  let board: Tile[][];
  do {
    board = [];
    for (let r = 0; r < rows; r++) {
      const row: Tile[] = [];
      for (let c = 0; c < cols; c++) row.push(makeTile(1 + Math.floor(Math.random() * palette)));
      board.push(row);
    }
  } while (findMatches(board).size > 0);
  return board;
}

export function findMatches(board: Tile[][]): Set<string> {
  const rows = board.length;
  const cols = board[0].length;
  const matched = new Set<string>();

  for (let r = 0; r < rows; r++) {
    let runStart = 0;
    for (let c = 1; c <= cols; c++) {
      const same =
        c < cols &&
        board[r][c] &&
        board[r][runStart] &&
        board[r][c]!.color === board[r][runStart]!.color;
      if (!same) {
        if (c - runStart >= 3) for (let k = runStart; k < c; k++) matched.add(`${r},${k}`);
        runStart = c;
      }
    }
  }

  for (let c = 0; c < cols; c++) {
    let runStart = 0;
    for (let r = 1; r <= rows; r++) {
      const same =
        r < rows &&
        board[r][c] &&
        board[runStart][c] &&
        board[r][c]!.color === board[runStart][c]!.color;
      if (!same) {
        if (r - runStart >= 3) for (let k = runStart; k < r; k++) matched.add(`${k},${c}`);
        runStart = r;
      }
    }
  }

  return matched;
}

function collapseOne(board: Tile[][], palette: number): { board: Tile[][]; cleared: number } {
  const matched = findMatches(board);
  if (matched.size === 0) return { board, cleared: 0 };

  const rows = board.length;
  const cols = board[0].length;
  const next = board.map((row) => row.slice());

  matched.forEach((key) => {
    const [r, c] = key.split(",").map(Number);
    next[r][c] = null as unknown as Tile;
  });

  for (let c = 0; c < cols; c++) {
    const stack: Tile[] = [];
    for (let r = rows - 1; r >= 0; r--) {
      if (next[r][c]) stack.push(next[r][c] as Tile);
    }
    for (let r = rows - 1, i = 0; r >= 0; r--, i++) {
      next[r][c] = i < stack.length ? stack[i] : makeTile(1 + Math.floor(Math.random() * palette));
    }
  }

  return { board: next, cleared: matched.size };
}

export function resolve(board: Tile[][], palette: number): { board: Tile[][]; cleared: number } {
  let total = 0;
  let cur = board.map((row) => row.slice());
  // 上限保护，避免极端级联死循环
  for (let i = 0; i < 50; i++) {
    const { board: b, cleared } = collapseOne(cur, palette);
    if (cleared === 0) break;
    total += cleared;
    cur = b;
  }
  return { board: cur, cleared: total };
}

export function swapTiles(board: Tile[][], a: [number, number], b: [number, number]): Tile[][] {
  const next = board.map((row) => row.slice());
  const [ar, ac] = a;
  const [br, bc] = b;
  const tmp = next[ar][ac];
  next[ar][ac] = next[br][bc];
  next[br][bc] = tmp;
  return next;
}

export function isAdjacent(a: [number, number], b: [number, number]): boolean {
  const dr = Math.abs(a[0] - b[0]);
  const dc = Math.abs(a[1] - b[1]);
  return dr + dc === 1;
}
