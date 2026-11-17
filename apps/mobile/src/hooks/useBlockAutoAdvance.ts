import { isBlockDone } from "@/src/hooks/useSessionPlayer";
import type { AthleteBlock } from "@hooper/api";
import { useEffect, useRef } from "react";

import type { SetRowState } from "../components/training/ExerciseSetsCard";

/**
 * Advances to the next block as soon as the one on screen becomes fully
 * done — one entry per block id, so a set getting un-done and redone
 * re-arms it, but revisiting an already-completed block (e.g. swiping back
 * to check it) doesn't push the athlete forward again.
 */
export function useBlockAutoAdvance(
  blocks: AthleteBlock[],
  blockIdx: number,
  setsByBlockExercise: Record<string, SetRowState[]>,
  onBlockIdxChange: (index: number) => void,
) {
  const autoAdvancedBlockIds = useRef(new Set<string>());
  const currentBlock = blocks[blockIdx];
  const currentBlockDone = currentBlock
    ? isBlockDone(currentBlock, setsByBlockExercise)
    : false;

  useEffect(() => {
    if (!currentBlock) return;
    if (!currentBlockDone) {
      autoAdvancedBlockIds.current.delete(currentBlock.id);
      return;
    }
    if (autoAdvancedBlockIds.current.has(currentBlock.id)) return;
    autoAdvancedBlockIds.current.add(currentBlock.id);

    const nextIdx = blockIdx + 1;
    if (nextIdx >= blocks.length) return;
    onBlockIdxChange(nextIdx);
  }, [
    currentBlock,
    currentBlockDone,
    blockIdx,
    blocks.length,
    onBlockIdxChange,
  ]);
}
