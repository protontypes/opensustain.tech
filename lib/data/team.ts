/**
 * The people behind OpenSustain.tech, for the /about page.
 *
 * This is intentionally the ONLY place this data lives — one small file a
 * human can fill in later, instead of placeholders scattered across JSX.
 *
 * Every field below is either exactly what was given (fullName, role, bio,
 * avatarUrl, links), or `null`/`[]` rendered by <TeamCard> as a visible
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
  /** Short bio. null -> "TODO: bio". */
  bio: string | null;
  /** Photo URL. null -> a placeholder avatar (initials) is rendered instead. */
  avatarUrl: string | null;
  /** Profile links (GitHub/LinkedIn/site/...). Empty -> "TODO: links". */
  links: TeamLink[];
};

export const team: TeamMember[] = [
  {
    id: "tobias",
    givenName: "Tobias",
    fullName: "Tobias Augspurger",
    role: "Founder, protontypes & Open Sustainable Technology",
    bio: "Aerospace engineer working at the intersection of open source and climate technology. Founded protontypes and Open Sustainable Technology to help environmental open-source projects find funding, contributors, and visibility.",
    avatarUrl: "https://avatars.githubusercontent.com/u/6413976?v=4",
    links: [
      { label: "GitHub", url: "https://github.com/Ly0n" },
      { label: "LinkedIn", url: "https://www.linkedin.com/in/tobias-augspurger/" },
    ],
  },
  {
    id: "salam",
    givenName: "Salam",
    fullName: "Abdul Salam Issahaku",
    role: "Software Developer",
    bio: "Builds open digital infrastructure at the intersection of sustainability, AI, and data interoperability.",
    avatarUrl: "https://avatars.githubusercontent.com/u/60816007?v=4",
    links: [
      { label: "GitHub", url: "https://github.com/AbdulSalam416" },
      {
        label: "LinkedIn",
        url: "https://www.linkedin.com/in/abdul-salam-issahaku-52ab4b228/",
      },
      { label: "Website", url: "https://abdulsalam.online" },
    ],
  },
  {
    id: "andrew-nesbit",
    givenName: "Andrew Nesbit",
    fullName: "Andrew Nesbitt",
    role: "Creator of ecosyste.ms & Libraries.io",
    bio: "Open source metadata specialist behind ecosyste.ms, the open dataset and API that powers OpenSustain.tech's project and organization data. Previously built Libraries.io and worked at GitHub and Tidelift.",
    avatarUrl: "https://avatars.githubusercontent.com/u/272751?v=4",
    links: [
      { label: "GitHub", url: "https://github.com/andrewnez" },
      { label: "Website", url: "https://nesbitt.io/" },
    ],
  },
  {
    id: "chris-harris",
    givenName: "Chris Harris",
    fullName: "Chris Harris",
    role: "Founder, Ground Truth",
    bio: "Tree planter turned developer — has planted over two million trees by hand and now builds Ground Truth, bringing transparency to reforestation data.",
    avatarUrl: "https://avatars.githubusercontent.com/u/36823895?v=4",
    links: [
      { label: "GitHub", url: "https://github.com/EndlessRecess" },
      { label: "Website", url: "https://groundtruth.app" },
    ],
  },
  {
    id: "pierre",
    givenName: "Pierre",
    fullName: "Pierre V-F",
    role: "Engineer & Climate Action Consultant",
    bio: "Engineer with over a decade of R&D experience in the energy sector, now consulting on climate action and sustainable innovation. Maintains oss4climate, an open-source tool for discovering climate-relevant open source projects.",
    avatarUrl: "https://avatars.githubusercontent.com/u/74793957?v=4",
    links: [
      { label: "GitHub", url: "https://github.com/Pierre-VF" },
      { label: "Website", url: "https://www.pierrevf.com" },
    ],
  },
];
