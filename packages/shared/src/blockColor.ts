export const BLOCK_COLOR_PALETTE = [
  "#F68D68", // salmon
  "#F15825", // portal orange
  "#4A7FD4", // mid blue
  "#38A169", // green
  "#0047BA", // brand blue
  "#A0522D", // rust/brown
  "#805AD5", // purple
  "#D53F8C", // pink/magenta
  "#00205C", // brand navy
  "#DD6B20", // amber
  "#319795", // teal
  "#718096", // slate
] as const;

/** Deterministic default color for a new block, based on name length. */
export function defaultBlockColor(name: string): string {
  return BLOCK_COLOR_PALETTE[name.length % BLOCK_COLOR_PALETTE.length];
}
