export type Tile = { id: number; color: number };

export type Level = {
  id: number;
  title: string;
  rows: number;
  cols: number;
  palette: number;
  targetPetals: number;
  maxMoves: number;
  free: boolean; // 是否免费章节可见
};

export type DecorationItem = {
  id: string;
  name: string;
  cost: number; // 花瓣消耗
  emoji: never; // 占位：实际用 SVG/Lucide 图标，禁止 emoji
};

export type SaveData = {
  petals: number;
  unlockedDecorations: string[];
  highestLevel: number;
};
