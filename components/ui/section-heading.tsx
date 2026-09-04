type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  /**
   * The route title should be the page's `h1`. This defaults to `h2` because
   * the home page also uses SectionHeading mid-page, under its hero's `h1`.
   */
  as?: "h1" | "h2";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  as: Tag = "h2",
}: SectionHeadingProps) {
  return (
    <div className="section-heading">
      {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
      <Tag>{title}</Tag>
      {description ? <p className="section-description">{description}</p> : null}
    </div>
  );
}
