"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Flower2, RotateCcw, Check, Lock } from "lucide-react";
import type { Level, Tile } from "@/lib/game/types";
import {
  createBoard,
  findMatches,
  isAdjacent,
  resolve,
  swapTiles,
} from "@/lib/game/engine";
import { Button } from "./ui";

// 花瓣色板统一引用 Design Token，色值只在 app/globals.css 定义
const COLORS = [
  "var(--petal-1)",
  "var(--petal-2)",
  "var(--petal-3)",
  "var(--petal-4)",
  "var(--petal-5)",
];

type Pos = [number, number];
type Status = "playing" | "won" | "lost";

const PETALS_PER_TILE = 2;

export type GameSave = {
  petals: number;
  highestLevel: number;
  unlockedDecorations: string[];
};

export function GameCanvas({
  level,
  initialPetals,
  initialHighest,
  locked,
  onUnlockCta,
  onSave,
}: {
  level: Level;
  initialPetals: number;
  initialHighest: number;
  locked: boolean;
  onUnlockCta?: () => void;
  onSave?: (data: Partial<GameSave>) => void;
}) {
  const [board, setBoard] = useState<Tile[][]>([]);
  const [selected, setSelected] = useState<Pos | null>(null);
  const [totalPetals, setTotalPetals] = useState(initialPetals);
  const [levelPetals, setLevelPetals] = useState(0);
  const [movesLeft, setMovesLeft] = useState(level.maxMoves);
  const [status, setStatus] = useState<Status>("playing");

  const startLevel = useCallback(() => {
    setBoard(createBoard(level.rows, level.cols, level.palette));
    setSelected(null);
    setLevelPetals(0);
    setMovesLeft(level.maxMoves);
    setStatus("playing");
  }, [level]);

  useEffect(() => {
    startLevel();
  }, [startLevel]);

  const handleCellClick = (r: number, c: number) => {
    if (locked || status !== "playing") return;
    if (!selected) {
      setSelected([r, c]);
      return;
    }
    if (selected[0] === r && selected[1] === c) {
      setSelected(null);
      return;
    }
    if (!isAdjacent(selected, [r, c])) {
      setSelected([r, c]);
      return;
    }
    const swapped = swapTiles(board, selected, [r, c]);
    if (findMatches(swapped).size === 0) {
      setSelected(null);
      return; // 无效交换，不消耗步数
    }
    const { board: resolved, cleared } = resolve(swapped, level.palette);
    const earned = cleared * PETALS_PER_TILE;
    const newTotal = totalPetals + earned;
    const newLevel = levelPetals + earned;
    setBoard(resolved);
    setSelected(null);
    setTotalPetals(newTotal);
    setLevelPetals(newLevel);
    setMovesLeft((m) => m - 1);
    onSave?.({ petals: newTotal });

    if (newLevel >= level.targetPetals) {
      const newHighest = Math.max(initialHighest, level.id);
      setStatus("won");
      onSave?.({ petals: newTotal, highestLevel: newHighest });
    } else if (movesLeft - 1 <= 0) {
      setStatus("lost");
    }
  };

  const gap = useMemo(() => Math.max(4, 10 - level.cols), [level.cols]);

  if (locked) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-border bg-surface-warm p-12 text-center">
        <Lock className="h-8 w-8 text-muted" strokeWidth={2} />
        <p className="font-display text-lg font-semibold">Chapter locked</p>
        <p className="max-w-xs text-sm text-muted">
          Unlock the full garden with a one-time purchase to keep playing.
        </p>
        {onUnlockCta && (
          <Button onClick={onUnlockCta} variant="primary">
            Unlock full game
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex w-full max-w-md items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-mono text-accent">
          <Flower2 className="h-4 w-4" strokeWidth={2} />
          {totalPetals}
        </span>
        <span className="text-fg-2">
          Goal {levelPetals}/{level.targetPetals} · Moves {movesLeft}
        </span>
      </div>

      <div
        className="grid rounded-lg border border-border bg-surface p-3 shadow-raised"
        style={{ gap: `${gap}px`, gridTemplateColumns: `repeat(${level.cols}, 1fr)` }}
      >
        {board.map((row, r) =>
          row.map((tile, c) => {
            const isSel = selected && selected[0] === r && selected[1] === c;
            return (
              <button
                key={tile?.id ?? `${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                aria-label={`tile ${r}-${c}`}
                className="aspect-square w-10 rounded-md transition-transform duration-[var(--motion-fast)] ease-standard sm:w-12"
                style={{
                  backgroundColor: tile ? COLORS[(tile.color - 1) % COLORS.length] : "transparent",
                  boxShadow: isSel ? "0 0 0 3px var(--accent)" : undefined,
                  transform: isSel ? "scale(1.06)" : undefined,
                }}
              />
            );
          }),
        )}
      </div>

      {status === "won" && (
        <div className="flex items-center gap-2 rounded-pill bg-success/10 px-4 py-2 text-sm font-semibold text-success">
          <Check className="h-4 w-4" strokeWidth={2} /> Chapter complete!
        </div>
      )}
      {status === "lost" && (
        <div className="flex items-center gap-2 rounded-pill bg-warn/10 px-4 py-2 text-sm font-semibold text-warn">
          Out of moves — try again
        </div>
      )}

      <Button variant="ghost" size="sm" onClick={startLevel}>
        <RotateCcw className="h-4 w-4" strokeWidth={2} /> Restart
      </Button>
    </div>
  );
}
