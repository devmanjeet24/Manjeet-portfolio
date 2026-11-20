/** Navigation and page-section configuration. */

export interface NavLink {
  id: string;
  label: string;
}

export interface PageSection {
  id: string;
  label: string;
  /** Which navbar link is highlighted while this section is in view. */
  navId: string;
}

export const NAV_LINKS: readonly NavLink[] = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "contact", label: "Contact" },
];

export const SECTIONS: readonly PageSection[] = [
  { id: "home", label: "Home", navId: "home" },
  { id: "about", label: "About", navId: "about" },
  { id: "skills", label: "Skills", navId: "skills" },
  { id: "projects", label: "Projects", navId: "projects" },
  { id: "ai", label: "AI Projects", navId: "projects" },
  { id: "experience", label: "Experience", navId: "experience" },
  { id: "resume", label: "Resume", navId: "experience" },
  { id: "contact", label: "Contact", navId: "contact" },
];

/** Pixels added to the scroll target; negative leaves space above the section. */
export const SCROLL_OFFSET = -16;
