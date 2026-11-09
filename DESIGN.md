---
name: Open Sustainable Technology
description: The open-source map for climate and sustainability, set in ink outlines, capitals and one mint signal around the ecosystem ring.
colors:
  ink: "#13262b"
  ground: "#ffffff"
  ground-alt: "#f3f6f5"
  text-secondary: "#4d6166"
  silver: "#e3eae8"
  border: "#dbe3e1"
  brand-blue: "#1878cf"
  link: "#145e9c"
  mint: "#47f6ad"
  wash-sky: "#d6f1ff"
  wash-mint: "#c8fbe4"
  scrim: "#13262b"
  on-scrim-muted: "#e3eae8"
  dark-ground: "#1f2629"
  dark-ground-alt: "#252d30"
  dark-card: "#283236"
  dark-ink: "#ebefec"
  dark-text: "#dce2df"
  dark-text-secondary: "#a3afae"
  dark-silver: "#38444a"
  dark-link: "#93c3ea"
  dark-wash-sky: "#1d3846"
  dark-wash-mint: "#183d35"
  cat-atmosphere: "#008fc1"
  cat-biosphere: "#51a362"
  cat-climate-change: "#e47667"
  cat-consumption: "#ef69a9"
  cat-cryosphere: "#9fd8e6"
  cat-emissions: "#de9e58"
  cat-energy-storage: "#9b8ff0"
  cat-energy-systems: "#7facff"
  cat-hydrosphere: "#2aa3a5"
  cat-industrial-ecology: "#b47144"
  cat-natural-resources: "#8f9130"
  cat-renewable-energy: "#d9a400"
  cat-sustainable-development: "#b97fc9"
typography:
  display:
    fontFamily: "Space Grotesk, Arial, sans-serif"
    fontSize: "clamp(44px, 4.6vw, 64px)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.01em"
  headline-band:
    fontFamily: "Space Grotesk, Arial, sans-serif"
    fontSize: "52px"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Space Grotesk, Arial, sans-serif"
    fontSize: "44px"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.015em"
  article-title:
    fontFamily: "Space Grotesk, Arial, sans-serif"
    fontSize: "44px"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.01em"
  figure:
    fontFamily: "Space Grotesk, Arial, sans-serif"
    fontSize: "44px"
    fontWeight: 600
    lineHeight: 1
    fontFeature: "tnum"
  title:
    fontFamily: "Space Grotesk, Arial, sans-serif"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1.1
  title-sm:
    fontFamily: "Space Grotesk, Arial, sans-serif"
    fontSize: "21px"
    fontWeight: 600
    lineHeight: 1.15
  lede:
    fontFamily: "Helvetica Neue, Arial, Helvetica, sans-serif"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "Helvetica Neue, Arial, Helvetica, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  button:
    fontFamily: "Helvetica Neue, Arial, Helvetica, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    letterSpacing: "0.03em"
  nav:
    fontFamily: "Helvetica Neue, Arial, Helvetica, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    letterSpacing: "0.03em"
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.08em"
rounded:
  pill: "999px"
  card: "20px"
  panel: "24px"
  callout: "28px"
  control: "6px"
  surface: "8px"
spacing:
  gutter: "32px"
  gap-sm: "12px"
  gap-md: "16px"
  gap-lg: "24px"
  gap-xl: "48px"
  card-pad: "20px"
  panel-pad: "28px"
  section: "96px"
  section-compact: "64px"
  container: "1100px"
components:
  pill:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "48px"
  pill-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    rounded: "{rounded.pill}"
  pill-blue:
    backgroundColor: "{colors.brand-blue}"
    textColor: "{colors.ground}"
    rounded: "{rounded.pill}"
  pill-blue-hover:
    backgroundColor: "{colors.link}"
  pill-mint:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
  search-input:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "52px"
  sub-pill:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "40px"
  sub-pill-hover:
    backgroundColor: "{colors.silver}"
  category-card:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-pad}"
  category-card-pressed:
    backgroundColor: "{colors.silver}"
  category-panel:
    backgroundColor: "{colors.ground-alt}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel-pad}"
  callout:
    backgroundColor: "{colors.scrim}"
    textColor: "{colors.ground}"
    rounded: "{rounded.callout}"
    padding: "48px"
  community-strip:
    backgroundColor: "{colors.scrim}"
    textColor: "{colors.ground}"
---

# Design System: Open Sustainable Technology

## Overview

**Creative North Star: "The Campaign Map"**

The site is set like a campaign poster around a scientific chart. The ecosystem ring, sized by project count and coloured by category, is the most colourful thing on any screen; everything around it is ink on a white ground: 2px outlines round controls and cards, 1px rules between sections, short titles in grotesk capitals, and a single mint signal for the invitation to contribute. The register follows the Green Web Foundation family (thegreenwebfoundation.org, websitecarbon.com) using the site's existing brand colours.

Density is generous on the home page (96px between sections, a two-column hero) and tighter in the directory, which keeps the same outlines and capitals but reads as a working list. Depth comes from lines and washes, not shadows: a hero or band fades from the white ground into a sky or mint wash, and pressed or hovered things change fill or lift a pixel or two.

Dark theme is the same map printed on dark stock: a graphite ground, off-white ink, the same category hues, the same outlines drawn in light ink. The community strip and the contribution callout stay dark ink in both themes.

**Key Characteristics:**
- Ink outlines (2px) on controls and cards; 1px ink rules between bands and in the header and footer.
- Capitals in Space Grotesk for short page, section and card titles; sentence case for anything long enough to be read.
- Pills for every button and filter; 20px-radius cards; category dots ringed in ink.
- Brand blue for the search action, mint for "Add a project" and the dark callout, category hues only for data.
- Light is the default theme; dark is opt-in from the header toggle and never follows the OS.

## Colors

Ink and white carry the structure, one blue and one mint carry the actions, and the thirteen category hues are reserved for the data.

### Primary
- **Brand Blue** (brand-blue): the search button and the contributing-guide button, filled with white capitals (4.54:1). The same value is the default focus ring colour and the active-nav underline. It does not change in dark theme.
- **Deep Link Blue** (link): link text, footer column heads, hover colour for nav links, and the blue pill's hover fill (6.75:1 with white).

### Secondary
- **Signal Mint** (mint): the "Add a project" pill in the header and the "Find an issue" pill on the dark callout, always with ink text (11.2:1); also the small labels and focus ring on dark ink surfaces. In dark theme a mint pill draws its outline in mint rather than light ink.

### Tertiary
- **Category Hues** (cat-*): one per category, applied through `--viz-cat-<slug>` tokens derived from the category name (`lib/sunburst/color.ts`). They fill ring slices, category dots, subcategory dots and the colour bar on top of the category panel. Fixed across both themes; labels on them are always ink.

### Neutral
- **Ink** (ink): text, every outline and rule, the filled ink pill. In dark theme the ink token flips to dark-ink, so outlines become light lines on graphite.
- **Ground** (ground) and **Ground Alt** (ground-alt): the page and the opened category panel.
- **Silver** (silver): the pressed category card and the hovered subcategory pill.
- **Secondary Text** (text-secondary): labels, placeholders, subcategory counts (5.6:1 even on the sky wash).
- **Border** (border): hairlines on surfaces that predate the redesign (dialogs, tables, article header rule).
- **Sky Wash** and **Mint Wash** (wash-sky, wash-mint): the far end of a 115deg gradient from the ground, behind the hero (sky, from 45%) and the contribute band (mint, from 40%). Dark theme swaps in dark-wash-sky and dark-wash-mint.
- **Scrim** (scrim): the community strip and the contribution callout, in both themes; white text, muted copy in on-scrim-muted.

### Named Rules
**The Data Owns the Colour Rule.** Category hues appear only where they stand for a category: ring, dots, the panel bar. No button, wash or heading takes a category hue.

**The One Mint Rule.** Mint marks the invitation to contribute, and nothing else. It is never a text colour on the white ground.

**The Fixed Ink Rule.** The community strip and the callout are dark ink in both themes; they do not invert with the page.

## Typography

**Display Font:** Space Grotesk (with Arial, sans-serif), loaded from Google Fonts at weights 400 to 700.
**Body Font:** the system sans stack, Helvetica Neue, Arial, Helvetica, sans-serif.
**Label/Mono Font:** IBM Plex Mono (with ui-monospace), weights 400 and 500.

**Character:** a geometric grotesk shouting short titles in capitals, a plain sans for reading, and a mono for the small print that names things.

### Hierarchy
- **Display** (600, clamp(44px, 4.6vw, 64px), 1.02): the home hero title, in capitals. 40px at 600px and below.
- **Headline Band** (600, 52px, 1.05): the contribute band's title, capitals, with a hand-set line break. 40px at 600px and below.
- **Headline** (600, 44px, 1.08): section titles ("Explore by category", "Beyond the map"), capitals, sitting on a 1px ink rule. 32px at 600px and below. The callout title runs a step smaller (38px, 30px on phones).
- **Article Title** (600, 44px): blog post titles, in sentence case.
- **Figure** (600, 44px, line-height 1, tabular numerals): the home statistics; the figure leads visually though its term comes first in the markup.
- **Title** (600, 26px, 1.1): category panel title and destination-card titles, capitals.
- **Title Small** (600, 21px, 1.15): category card names, capitals.
- **Lede** (400, 20px, 1.6): the hero description, max 560px, between two 1px ink rules.
- **Body** (400, 16px, 1.6): all reading text; section intros at 17px, band text at 19px, callout body at 18px. `text-wrap: pretty` on paragraphs, `balance` on headings.
- **Button** (700, 15px, 0.03em, capitals): every pill. Card calls to action use 14px, 0.04em.
- **Nav** (500, 14px, 0.03em, capitals): header links and dropdown toggles.
- **Label** (400, 12px, 0.08em, capitals, mono): statistic terms, footer column heads, directory column heads and result count (0.06em), subcategory counts, category ordinals, the chart caption (11px). Secondary text colour by default; link blue for footer heads.

### Named Rules
**The Short Capitals Rule.** Capitals are for short page, section and card titles, buttons, nav and labels. Anything a reader must actually read (article titles, ledes, descriptions, body) stays in sentence case. Article titles run to a dozen words and are deliberately set in sentence case.

**The Label Names a Thing Rule.** The mono label names a figure, a column, a count or a group. It does not decorate or introduce a heading.

## Layout

A centred container of 1100px with 32px side padding holds every band; bands themselves run full width so their washes and 1px ink rules reach the window edges. Home sections sit 96px apart (64px at 600px and below); the hero has 88px above and 96px below (56/64px at 1024px and below); the contribute band has 88px.

The hero is a two-column grid (text 1fr, ring 1.1fr, 48px gap) with the text column stacked at 24px. When a project is picked on the ring on a wide screen (1025px and up), its details take the place of the lede, search and buttons beside the ring. Statistics run five across, separated by 1px ink rules on their left edge. The category explorer is a four-column grid of cards with a 16px gap; destination cards are three across with a 20px gap.

### Breakpoints in use
- **1180px and below:** the capitals nav no longer fits beside the two-line wordmark, so the header switches to the menu button and the mobile menu.
- **1024px and below (1025px and up for the hero swap):** hero stacks to one column, statistics go two across with rules on top instead of left, category and destination grids go two across, footer goes two across with the brand spanning.
- **600px and below:** every grid is a single column, titles step down, the callout tightens to 32px/24px padding, and the ring's smallest centre sets its wordmark at 10px.
- **560px and below:** the header's "Add a project" pill hides (it stays in the mobile menu under "Get involved") and the logo and wordmark shrink.

Earlier 768px and 640px rules from before the redesign still govern the mobile menu's own styling and older pages.

## Elevation & Depth

The system is flat. Depth is carried by ink lines, tonal fills and the two washes; there are no shadows on the redesigned surfaces. The only shadow in use is the chart tooltip's (recorded in the sidecar). The sticky header uses a near-opaque ground with an 8px backdrop blur.

### Named Rules
**The Line, Not Shadow Rule.** Separation is a 2px ink outline around a thing or a 1px ink rule between things. Raised states are a 1-2px lift on hover, not a shadow.

## Shapes

Two forms dominate: the pill (999px) for anything you press or type into, and the rounded outlined card for anything that holds content. Cards use 20px; the opened category panel 24px; the dark callout 28px. Outlines are 2px ink on pills, inputs, selects and cards; chips (subcategory pills and directory filter chips) use a lighter 1.5px ink line. Category dots are circles: 14px ringed in 2px ink on cards and directory group heads, 8px plain inside subcategory pills. The older 6px control and 8px surface radii remain on surfaces outside the redesign (skip link, dialogs, scrollbars).

### Named Rules
**The Ringed Dot Rule.** A category's colour dot is always ringed in ink where it stands alone, so pale hues (cryosphere) hold their edge on the white ground.

## Components

### Buttons
- **Shape:** pill (999px), 48px tall, 24px side padding, 2px ink outline; 44px tall in the header and the category panel, 52px beside the hero search.
- **Outline (default):** ground fill, ink text. Secondary actions: "View as a list", "Open on GitHub", "Join the Discord".
- **Ink:** ink fill, ground text. "Browse the directory", "See all N projects". In dark theme it becomes a light-ink pill with graphite text.
- **Blue:** brand-blue fill and outline, white text; hover fills deep link blue. The search submit and "Read the contributing guide".
- **Mint:** mint fill, ink text; reserved for "Add a project" and "Find an issue".
- **Hover / Focus:** every pill lifts 1px (0.15s ease); focus is the global 2px outline at 2px offset.

### Chips
- **Subcategory pill:** ground fill, 1.5px ink line, 40px tall, 15px body text, an 8px category dot before the name and a mono project count after it. Hover fills silver. Each links straight into the directory filtered to that category and subcategory.
- **Directory filter chip:** the same 1.5px ink pill for active filters.

### Cards / Containers
- **Category card:** a button. 20px radius, 2px ink outline, ground fill, 20px padding, min-height 160px. Ringed category dot and two-digit ordinal on top, the name in Title Small capitals, then subcategory and project counts in tabular numerals and an arrow. Hover lifts 2px; the picked card (`aria-pressed="true"`) fills silver.
- **Category panel:** 24px radius, 2px ink outline, ground-alt fill, a 6px bar in the category hue across the top, 28px padding; title in capitals with an ink "See all N projects" pill, then the subcategory pills.
- **Destination card:** a whole-card link, 2px ink outline, 28px padding, min-height 240px; title in Title capitals, short body, call to action pinned to the bottom. Hover lifts 2px.
- **Callout:** scrim fill, 28px radius, 48px padding, white capitals title, muted body, a mint pill; focus rings inside it are mint.

### Inputs / Fields
- **Search:** a pill input, 52px tall, 2px ink outline, ground fill, 16px body text, placeholder in secondary text, with a visually hidden label. It is a plain GET form to the directory (`/projects?q=`).
- **Directory fields:** inputs and selects take the same 2px ink pill at 48px, labels in mono capitals.
- **Focus:** the global 2px outline in the focus colour (brand blue on light, #93c3ea on dark) at 2px offset.

### Navigation
- **Community strip:** scrim band above the header in both themes; a mint mono tag, white body text and a bold Discord link; dismissible, and the dismissal is applied before first paint.
- **Header:** sticky, 1px ink bottom rule, the arc logo with a two-line capitals wordmark in ink, capitals nav (Directory, Learning, Articles & talks, Analytics, About), the mint "Add a project" pill, a GitHub link and the theme toggle. The current page is underlined 2px in brand blue at 8px offset; Analytics is a disclosure button over a list of links, not an ARIA menu. "Get involved" lives only in the mobile menu.
- **Footer:** 1px ink rule on top, brand block with a two-line capitals name and an outline Discord pill, four link columns under mono heads in link blue, and a bottom row with licence and data-snapshot date over another 1px rule; links underline on hover.

### Ecosystem Ring and Category Explorer (signature)
The hero ring and the explorer below share one picked category through a small store (`lib/home/picked-category.ts`). The explorer opens on the category with the most projects and names it to the store, so the ring outlines it before any click. At the ring's top level the picked category is drawn with a 3px ink outline (the arc emphasis stroke: ink on light, light ink on dark) and every other category drops to 60% opacity. Hovering a slice or running a search takes over: the outline hides and the hover or search dimming applies. Clicking a category on the ring zooms the ring into it in place and picks it in the explorer; picking a card in the explorer moves the outline. The centre plate carries a 2px ink outline and reads "The Open Source Ecosystem in Sustainability", falling back to the "OpenSustain.tech" wordmark when the centre is too small. The chart's own search row is hidden on the home hero so the page search is the only one in the first viewport; "View as a list" jumps to the explorer as the non-pointer alternative.

## Do's and Don'ts

### Do:
- **Do** draw controls and cards with the 2px ink line and separate bands with 1px ink rules.
- **Do** set short titles in Space Grotesk capitals and keep article titles and reading text in sentence case.
- **Do** keep category hues on data only, with ink labels on them in both themes.
- **Do** give every chart a reachable list alternative and every icon-only control an accessible name.
- **Do** keep the page search as the one primary action in the first viewport.
- **Do** take every figure from the data snapshot, never hard-coded.

### Don't:
- **Don't** use shadows to separate surfaces; use the line or a tonal fill.
- **Don't** use mint as text on white or for anything other than the contribute invitation.
- **Don't** let the community strip or callout invert with the theme.
- **Don't** follow the OS colour scheme; light is the default and dark is chosen.
- **Don't** set long titles in capitals.
