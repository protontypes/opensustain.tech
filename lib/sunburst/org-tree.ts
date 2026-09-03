import { formatDecimal, formatNumber } from "@/lib/format";
import type { ProjectsByOrganizationPayload } from "@/lib/types";

import type { SunburstNode } from "./types";

export const ORG_ROOT_ID = "org-root";

/**
 * Adapts the projects-by-organization payload onto the same SunburstNode shape
 * the ecosystem chart uses, so both charts share one renderer, one geometry
 * module and one tween.
 *
 * The payload is two levels — organization → project — which maps onto the
 * root ring pair exactly.
 */
export function buildOrganizationTree(
  payload: ProjectsByOrganizationPayload,
): SunburstNode {
  const root: SunburstNode = {
    id: ORG_ROOT_ID,
    name: "Organizations",
    kind: "root",
    depth: 0,
    category: "",
    children: [],
    parent: null,
    visibleLeaves: 0,
    totalLeaves: 0,
    activeLeaves: 0,
  };

  for (const org of payload.root.children) {
    const orgNode: SunburstNode = {
      id: `org:${org.url || org.name}`,
      name: org.name,
      kind: "organization",
      depth: 1,
      // Filled in below from the org's own projects.
      category: "",
      children: [],
      parent: root,
      visibleLeaves: 0,
      totalLeaves: 0,
      activeLeaves: 0,
      detail: {
        url: org.url,
        // `subtitle` is completed below, once the dominant category is known.
        liveCountLabel: "Projects shown",
        stats: [
          { label: "Projects", value: formatNumber(org.value) },
          { label: "Total score", value: formatDecimal(org.total_score, 2) },
        ],
        hint: "Click to zoom in",
      },
    };

    const categoryTally = new Map<string, number>();

    for (const project of org.children) {
      categoryTally.set(
        project.category,
        (categoryTally.get(project.category) ?? 0) + 1,
      );
      orgNode.children.push({
        id: `${orgNode.id}/${project.url || project.name}`,
        name: project.name,
        kind: "project",
        depth: 2,
        category: project.category,
        children: [],
        parent: orgNode,
        visibleLeaves: 1,
        totalLeaves: 1,
        activeLeaves: 1,
        detail: {
          url: project.url,
          subtitle: `${project.category} › ${project.sub_category}`,
          hint: "Click to select · ⌘/Ctrl-click to open the repository",
          stats: [
            {
              label: "Total Score (All Metrics)",
              value: formatDecimal(project.total_score_combined, 2),
            },
          ],
        },
      });
    }

    // An organization takes the hue of the category it works in most, so a
    // wedge reads as "this org is mostly a climate-data shop" at a glance.
    let dominant = "";
    let best = -1;
    for (const [category, count] of categoryTally) {
      if (count > best) {
        best = count;
        dominant = category;
      }
    }
    orgNode.category = dominant;
    orgNode.detail!.subtitle = dominant
      ? `Organization · mostly ${dominant}`
      : "Organization";

    orgNode.totalLeaves = orgNode.children.length;
    orgNode.activeLeaves = orgNode.totalLeaves;
    root.children.push(orgNode);
  }

  root.totalLeaves = root.children.reduce((sum, o) => sum + o.totalLeaves, 0);
  root.activeLeaves = root.totalLeaves;
  return root;
}

/**
 * Limits the chart to the N largest organizations.
 *
 * Returns how many were dropped so the UI can say so — the previous chart hard
 * -coded topN=80 against 276 organizations and said nothing.
 */
export function limitOrganizations(
  root: SunburstNode,
  topN: number,
): { shown: number; hidden: number; hiddenProjects: number } {
  const ordered = [...root.children].sort(
    (a, b) => b.totalLeaves - a.totalLeaves || a.name.localeCompare(b.name),
  );
  let hidden = 0;
  let hiddenProjects = 0;
  ordered.forEach((org, index) => {
    const keep = index < topN;
    for (const child of org.children) child.visibleLeaves = keep ? 1 : 0;
    if (!keep) {
      hidden += 1;
      hiddenProjects += org.totalLeaves;
    }
  });
  return { shown: ordered.length - hidden, hidden, hiddenProjects };
}
