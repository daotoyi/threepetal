"use client";

import { Armchair, Lamp, Droplets, TreePine, Cat, Flower2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "./ui";

type Item = { id: string; name: string; cost: number; Icon: LucideIcon };

const ITEMS: Item[] = [
  { id: "bench", name: "Garden Bench", cost: 20, Icon: Armchair },
  { id: "lantern", name: "Paper Lantern", cost: 30, Icon: Lamp },
  { id: "fountain", name: "Stone Fountain", cost: 50, Icon: Droplets },
  { id: "tree", name: "Old Tree", cost: 80, Icon: TreePine },
  { id: "cat", name: "Sleepy Cat", cost: 120, Icon: Cat },
];

export function DecorationPanel({
  petals,
  unlocked,
  onBuy,
}: {
  petals: number;
  unlocked: string[];
  onBuy: (id: string, cost: number) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-raised">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold">Your Garden</h3>
        <span className="flex items-center gap-1.5 font-mono text-sm text-accent">
          <Flower2 className="h-4 w-4" strokeWidth={2} />
          {petals}
        </span>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {ITEMS.map((item) => {
          const owned = unlocked.includes(item.id);
          const canBuy = petals >= item.cost;
          return (
            <li
              key={item.id}
              className="flex flex-col items-center gap-2 rounded-md border border-border bg-surface-warm p-3 text-center"
            >
              <item.Icon className="h-6 w-6 text-accent" strokeWidth={2} />
              <span className="text-xs font-medium text-fg-2">{item.name}</span>
              {owned ? (
                <span className="text-xs font-semibold text-success">Owned</span>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!canBuy}
                  onClick={() => onBuy(item.id, item.cost)}
                >
                  {item.cost}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
