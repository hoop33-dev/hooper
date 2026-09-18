export type ProgramSourceEdge = {
  source_program_id: string;
  destination_program_id: string;
};

/** All program ids reachable by walking `program_sources` edges backward
 * from `destinationId` — i.e. every program that, directly or
 * transitively, already had its weeks copied into `destinationId`.
 * Importing any of these ids into `destinationId` again would close a
 * loop (S → ... → D, then D → S). */
export function getAncestorProgramIds(
  destinationId: string,
  edges: ProgramSourceEdge[],
): Set<string> {
  const incoming = new Map<string, string[]>();
  for (const edge of edges) {
    const sources = incoming.get(edge.destination_program_id) ?? [];
    sources.push(edge.source_program_id);
    incoming.set(edge.destination_program_id, sources);
  }

  const ancestors = new Set<string>();
  const queue = [destinationId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const source of incoming.get(current) ?? []) {
      if (!ancestors.has(source)) {
        ancestors.add(source);
        queue.push(source);
      }
    }
  }
  return ancestors;
}

/** Whether `sourceId`'s weeks can be copied into `destinationId` right
 * now — false for copying a program into itself, or into any program
 * that's already (directly or transitively) one of its own ancestors. */
export function canImportProgramWeeks(
  sourceId: string,
  destinationId: string,
  edges: ProgramSourceEdge[],
): boolean {
  if (sourceId === destinationId) return false;
  return !getAncestorProgramIds(destinationId, edges).has(sourceId);
}
