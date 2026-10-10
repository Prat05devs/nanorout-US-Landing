export type NavItem = {
  n: string;
  label: string;
  footer: string;
  /** Section to scroll to. Items without one show the "coming soon" notice. */
  target?: string;
  /** Menu drawing that redraws when this item is hovered. */
  draws?: "A" | "B" | "C";
};

export const NAV: NavItem[] = [
  { n: "01", label: "HOME", footer: "Home", target: "#top" },
  { n: "02", label: "VISION", footer: "Vision", target: "#vision" },
  { n: "03", label: "NEURO INFORMATION SYSTEM (NIS)", footer: "Neuro Information System", target: "#nis", draws: "A" },
  { n: "04", label: "RESEARCH COLLABORATION", footer: "Research Collaboration", draws: "B" },
  { n: "05", label: "INTERNSHIP", footer: "Internship" },
  { n: "06", label: "INVESTORS & STRATEGIC PARTNERSHIPS", footer: "Investors & Strategic Partnerships", draws: "C" },
  { n: "07", label: "CONTACT", footer: "Contact", target: "#contact" },
];

export const NOTICE = "COMING IN THE FULL WEBSITE";

// PLACEHOLDER: replace with client email
export const CONTACT_EMAIL = "example@example.com";
// PLACEHOLDER: replace with the client's LinkedIn page
export const LINKEDIN_URL = "#";
