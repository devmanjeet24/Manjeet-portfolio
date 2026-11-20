/**
 * REPLACE WITH REAL DATA
 * Placeholder education and certifications.
 */

export interface EducationItem {
  institution: string;
  degree: string;
  field: string;
  period: string;
  description?: string;
}

export interface Certification {
  title: string;
  issuer: string;
  year: number;
  url?: string;
}

export const education: EducationItem[] = [
  {
    institution: "University Name",
    degree: "Bachelor of Technology",
    field: "Computer Science & Engineering",
    period: "2017 - 2021",
    description: "Focused on software engineering, data structures and databases.",
  },
];

export const certifications: Certification[] = [
  {
    title: "Certification Title",
    issuer: "Issuing Organisation",
    year: 2024,
    url: "https://example.com/certificate",
  },
];
