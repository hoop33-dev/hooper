import type { ExerciseCategoryRow, ExerciseCategoryWithCount, ExerciseCategoryTreeNode } from "@hooper/db";

export function buildCategoryTree(
  rows: ExerciseCategoryWithCount[],
): ExerciseCategoryTreeNode[] {
  const map = new Map<string, ExerciseCategoryTreeNode>();
  const roots: ExerciseCategoryTreeNode[] = [];

  for (const row of rows) {
    map.set(row.id, { ...row, children: [] });
  }

  for (const node of map.values()) {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortByPosition = (nodes: ExerciseCategoryTreeNode[]) => {
    nodes.sort((a, b) => a.position - b.position);
    for (const node of nodes) sortByPosition(node.children);
  };
  sortByPosition(roots);

  return roots;
}

export function getDescendantIds(
  id: string,
  rows: ExerciseCategoryRow[],
): string[] {
  const children = rows.filter((r) => r.parent_id === id);
  return children.flatMap((c) => [c.id, ...getDescendantIds(c.id, rows)]);
}

export function flattenTree(
  nodes: ExerciseCategoryTreeNode[],
  depth = 0,
): Array<ExerciseCategoryTreeNode & { depth: number }> {
  return nodes.flatMap((node) => [
    { ...node, depth },
    ...flattenTree(node.children, depth + 1),
  ]);
}
