/**
 * Normalized LinkedIn profile schema.
 *
 * This is the response contract returned by the API regardless of which
 * ProfileSource implementation resolves the data underneath it. Every field
 * beyond `vanityName` is nullable/optional because real-world profiles vary
 * widely in how much is public/filled in.
 */

export interface ExperienceEntry {
    title: string;
    company: string;
    employmentType?: string | null;
    location?: string | null;
    startDate?: string | null; // ISO-ish "YYYY-MM" where available
    endDate?: string | null; // endDate=null + current=true means "Present"
    current: boolean;
    description?: string | null;
  }
  
  export interface EducationEntry {
    school: string;
    degree?: string | null;
    fieldOfStudy?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    description?: string | null;
  }
  
  export interface CertificationEntry {
    name: string;
    issuingOrganization?: string | null;
    issueDate?: string | null;
    expirationDate?: string | null;
    credentialId?: string | null;
    credentialUrl?: string | null;
  }
  
  export interface LanguageEntry {
    name: string;
    proficiency?: string | null;
  }
  
  export interface ProfileImages {
    profilePictureUrl?: string | null;
    backgroundImageUrl?: string | null;
  }
  
  export interface NormalizedProfile {
    vanityName: string;
    profileUrl: string;
    name: string;
    headline?: string | null;
    location?: string | null;
    about?: string | null;
    experience: ExperienceEntry[];
    education: EducationEntry[];
    skills: string[];
    certifications: CertificationEntry[];
    languages: LanguageEntry[];
    images: ProfileImages;
    /** Metadata about how this response was produced, for transparency. */
    meta: {
      source: "mock" | "live";
      fetchedAt: string; // ISO timestamp
    };
  }
  