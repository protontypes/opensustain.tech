import type {
  EcosystemSunburstPayload,
  SunburstNode,
  ActivityFilter,
} from "./types";

/**
 * Stable node identity.
 *
 * Leaves key on `url`, which is unique across all 2,691 projects — 14 project
 * names are duplicated (Pace, SNAP, PRISM, AgML, …) and 7 collide even on
 * (category, sub_category, name), so a name-derived key would merge distinct
 * repositories into one arc.
 */
export function categoryId(name: string): string {
  return `cat:${name}`;
}

export function subCategoryId(category: string, name: string): string {
  return `sub:${category}/${name}`;
}

export const ROOT_ID = "root";

/** Builds the immutable tree once per payload. */
export function buildTree(payload: EcosystemSunburstPayload): SunburstNode {
  const root: SunburstNode = {
    id: ROOT_ID,
    name: payload.root.name,
    kind: "root",
    depth: 0,
    category: "",
    children: [],
    parent: null,
    visibleLeaves: 0,
    totalLeaves: 0,
    activeLeaves: 0,
  };

  for (const category of payload.root.children) {
    const categoryNode: SunburstNode = {
      id: categoryId(category.name),
      name: category.name,
      kind: "category",
      depth: 1,
      category: category.name,
      children: [],
      parent: root,
      visibleLeaves: 0,
      totalLeaves: 0,
      activeLeaves: 0,
    };

    for (const subCategory of category.children) {
      const subNode: SunburstNode = {
        id: subCategoryId(category.name, subCategory.name),
        name: subCategory.name,
        kind: "sub_category",
        depth: 2,
        category: category.name,
        children: [],
        parent: categoryNode,
        visibleLeaves: 0,
        totalLeaves: 0,
        activeLeaves: 0,
      };

      for (const project of subCategory.children) {
        subNode.children.push({
          id: project.url || `${subNode.id}/${project.name}`,
          name: project.name,
          kind: "project",
          depth: 3,
          category: category.name,
          project,
          children: [],
          parent: subNode,
          visibleLeaves: 0,
          totalLeaves: 1,
          activeLeaves: project.is_active_last_365d ? 1 : 0,
        });
      }

      subNode.totalLeaves = subNode.children.length;
      subNode.activeLeaves = subNode.children.reduce(
        (sum, child) => sum + child.activeLeaves,
        0,
      );
      categoryNode.children.push(subNode);
    }

    categoryNode.totalLeaves = categoryNode.children.reduce(
      (sum, child) => sum + child.totalLeaves,
      0,
    );
    categoryNode.activeLeaves = categoryNode.children.reduce(
      (sum, child) => sum + child.activeLeaves,
      0,
    );
    root.children.push(categoryNode);
  }

  root.totalLeaves = root.children.reduce((sum, c) => sum + c.totalLeaves, 0);
  root.activeLeaves = root.children.reduce((sum, c) => sum + c.activeLeaves, 0);
  return root;
}

/** Depth-first walk, parents before children. */
export function walk(node: SunburstNode, visit: (node: SunburstNode) => void) {
  visit(node);
  for (const child of node.children) walk(child, visit);
}

export function flatten(root: SunburstNode): SunburstNode[] {
  const out: SunburstNode[] = [];
  walk(root, (node) => out.push(node));
  return out;
}

export function ancestors(node: SunburstNode): SunburstNode[] {
  const chain: SunburstNode[] = [];
  let current: SunburstNode | null = node;
  while (current) {
    chain.unshift(current);
    current = current.parent;
  }
  return chain;
}

export type Filters = {
  activity: ActivityFilter;
  isolated: string[];
};

/**
 * Recomputes `visibleLeaves` in place for the given filters and returns the
 * total. Search deliberately does NOT filter — it dims, so arcs never move.
 */
export function applyFilters(root: SunburstNode, filters: Filters): number {
  const isolated = new Set(filters.isolated);
  const isolating = isolated.size > 0;

  const recurse = (node: SunburstNode): number => {
    if (node.kind === "project") {
      const project = node.project!;
      const activeOk =
        filters.activity === "all" || project.is_active_last_365d;
      const categoryOk = !isolating || isolated.has(node.category);
      node.visibleLeaves = activeOk && categoryOk ? 1 : 0;
      return node.visibleLeaves;
    }
    let sum = 0;
    for (const child of node.children) sum += recurse(child);
    node.visibleLeaves = sum;
    return sum;
  };

  return recurse(root);
}

/** Case-insensitive match over name, description and sub-category. */
export function matchesQuery(node: SunburstNode, needle: string): boolean {
  if (!needle) return false;
  if (node.name.toLowerCase().includes(needle)) return true;
  const project = node.project;
  if (!project) return false;
  return (
    project.sub_category.toLowerCase().includes(needle) ||
    project.description.toLowerCase().includes(needle)
  );
}
