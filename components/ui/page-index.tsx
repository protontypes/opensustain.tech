/**
 * Anchor links to a long page's sections, under its title. The deep
 * dashboards run 10,000-12,000px; this is the way to a chart without
 * scrolling past every other one.
 */
export function PageIndex({
  items,
  label = "On this page",
}: {
  items: { id: string; label: string }[];
  label?: string;
}) {
  return (
    <nav className="page-index" aria-label={label}>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`}>{item.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
