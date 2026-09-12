/**
 * The people behind OpenSustain.tech, for the /about page.
 *
 * This is intentionally the ONLY place this data lives — one small file a
 * human can fill in later, instead of placeholders scattered across JSX.
 *
 * The task that produced this file named five people (first names only for
 * three of them) and was explicit that nothing else about them — surname,
 * role, photo, or profile links — is known. Every field below is either
 * exactly what was given, or `null`/`[]` rendered by <TeamCard> as a visible
 * "TODO: ..." placeholder. Do not fill in a guess (a plausible-looking role,
 * a GitHub handle you think might be theirs, an avatar found by searching
 * their name) — replace `null`/`[]` only with a fact one of these people (or
 * someone who can confirm it, such as `protontypes`, the org that maintains
 * https://github.com/protontypes/open-sustainable-technology) has given
 * directly.
 */

export type TeamLink = {
  /** e.g. "GitHub", "LinkedIn", "Website" */
  label: string;
  url: string;
};

export type TeamMember = {
  /** Stable key for React lists and anchors — not shown in the UI. */
  id: string;
  /** Exactly what was given about this person's name; never invented. */
  givenName: string;
  /** Full name, only once known in full. Otherwise null -> "TODO: full name". */
  fullName: string | null;
  /** Their role on the project. null -> "TODO: role". */
  role: string | null;
  /** Photo URL. null -> a placeholder avatar (initials) is rendered instead. */
  avatarUrl: string | null;
  /** Profile links (GitHub/LinkedIn/site/...). Empty -> "TODO: links". */
  links: TeamLink[];
};

export const team: TeamMember[] = [
  {
    id: "tobias",
    givenName: "Tobias",
    fullName: null,
    role: null,
    avatarUrl: null,
    links: [],
  },
  {
    id: "salam",
    givenName: "Salam",
    fullName: null,
    role: null,
    avatarUrl: null,
    links: [],
  },
  {
    id: "andrew-nesbit",
    givenName: "Andrew Nesbit",
    fullName: "Andrew Nesbit",
    role: null,
    avatarUrl: null,
    links: [],
  },
  {
    id: "chris-harris",
    givenName: "Chris Harris",
    fullName: "Chris Harris",
    role: null,
    avatarUrl: null,
    links: [],
  },
  {
    id: "pierre",
    givenName: "Pierre",
    fullName: null,
    role: null,
    avatarUrl: null,
    links: [],
  },
];
