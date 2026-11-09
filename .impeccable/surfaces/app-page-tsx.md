---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["app/projects/page.tsx"]
---

## Scope

Home (`app/page.tsx`) and project directory (`app/projects/page.tsx`), plus the shared chrome (community strip, header, footer). Built on branch `design/site-redesign`. Home is a tool-led landing (Persuade, with the directory search as its action); the directory is Operate.

## Audience and job

People looking for an open-source tool for a sustainability problem: search or browse, compare, judge whether a project is alive. Contributors and funders are later layers.

## Pinned by the user

The "OpenSustain.tech redesign" design canvas is the design source, chosen on 9 November 2026 over two earlier prototypes. Its look is the Green Web Foundation register (references: thegreenwebfoundation.org, websitecarbon.com), using the site's existing brand colours. The sunburst ring stays the home hero, sized by project count, centre "The Open Source Ecosystem in Sustainability".

## Direction contract

THESIS: The map is the way in, set like a campaign: capitals, ink outlines and one mint signal around a ring that shows the whole ecosystem at its true proportions. Refuses the quiet grey dashboard the site was.

OWN-WORLD: White ground; ink #13262B for text, 2px outlines and 1px section rules; brand blue #1878CF for the search action; mint #47F6AD for "Add a project" and the ink callouts; sky and mint washes fading in from the ground behind the hero and the contribute band. Space Grotesk in capitals for page and section titles (article titles stay in sentence case, being a dozen words long), IBM Plex Mono capitals for kickers and labels, the system sans for reading. Pill buttons, 20px-radius outlined cards, category dots ringed in ink.

STORY: The visitor sees the whole ecosystem at once, searches or opens a category, lands in the directory filtered to it, and learns how to add what is missing or make a first contribution.

FIRST VIEWPORT: Ink community strip; header with the two-line wordmark, capitals nav and a mint "Add a project" pill. Left: mono kicker, "Open source for a sustainable planet" in large capitals, a lede between two ink rules, a pill search with a blue Search button, then "Browse the directory" and "View as a list". Right: the sunburst. The primary action is the search.

FORM: Pinned by the user's canvas; roll skipped because the user supplied the design. No seed reference. Signature interaction: the category explorer, thirteen numbered outlined cards whose chosen one opens a panel of subcategory pills that link straight into the filtered directory.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Deviations from the canvas, on purpose

- Ring slices sized by project count, not one equal slice per subcategory; the existing sunburst component is reused.
- Every figure comes from `site-totals.json` (the canvas hard-coded "~55,225" contributors).
- Footer claim "no tracking, system fonts" dropped: the site runs Umami and loads web fonts.
- Contributing link fixed to `CONTRIBUTING.md`; Discord link is the real invite.
- Category cards add the project count beside the subcategory count; subcategory pills show their counts.
- Header nav follows the canvas order (Directory, Learning, Articles & talks, Analytics, About); "Get involved" stays in the mobile menu only. The site's existing GitHub link and light/dark toggle stay in the header; dark theme ships, using the existing dark tokens plus dark washes.
- The contribute band drops the canvas line "if it's open source and it serves sustainability, it belongs on the map": CONTRIBUTING.md also requires active use or development, reusable documentation and an open licence, so the line overstates eligibility.
- Clicking a ring category zooms the ring in place (the existing explore behaviour) and also picks that category in the explorer below; the chart's own search row is hidden on the home hero so the page search is the only one in the first viewport.
- The ring and the explorer share one picked category. At the top level the ring outlines it in 3px ink and dims the other categories to 60%, as the canvas does; hovering a slice or searching takes over and the outline steps aside. The centre plate also carries the ink outline.
- Below about 112px of centre, the shared chart shows the wordmark "OpenSustain.tech" (set at 10px on phones) rather than the full "The Open Source Ecosystem in Sustainability", which does not fit legibly there. This predates the redesign.
- The provenance line states the date once when the list and metrics were read the same day, and credits Ecosyste.ms.
