import type { Level } from "./types";

// 首章免费 3 关 + 付费 3 关示例；扩展到 15-20 关只需在此追加数据（引擎完全通用）。
export const LEVELS: Level[] = [
  { id: 1, title: "First Sprout", rows: 5, cols: 5, palette: 3, targetPetals: 30, maxMoves: 12, free: true },
  { id: 2, title: "Morning Dew", rows: 6, cols: 6, palette: 3, targetPetals: 45, maxMoves: 14, free: true },
  { id: 3, title: "Quiet Bloom", rows: 6, cols: 6, palette: 4, targetPetals: 60, maxMoves: 16, free: true },
  { id: 4, title: "Warm Breeze", rows: 7, cols: 7, palette: 4, targetPetals: 80, maxMoves: 18, free: false },
  { id: 5, title: "Sunlit Path", rows: 7, cols: 7, palette: 5, targetPetals: 100, maxMoves: 20, free: false },
  { id: 6, title: "Haven's Heart", rows: 8, cols: 8, palette: 5, targetPetals: 130, maxMoves: 22, free: false },
];

export const FREE_LEVELS = LEVELS.filter((l) => l.free);
export const PAID_LEVELS = LEVELS.filter((l) => !l.free);

export function getLevel(id: number): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}
