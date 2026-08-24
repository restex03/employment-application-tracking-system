export type WorkdayJobDetail = {
  "@context": string;
  "@type": "JobPosting";

  title: string;
  description: string;

  identifier?: WorkdayJobIdentifier;

  datePosted?: string;
  validThrough?: string;
  employmentType?: string;

  hiringOrganization?: WorkdayHiringOrganization;

  jobLocation?: WorkdayJobLocation | WorkdayJobLocation[];

  jobLocationType?: string;

  applicantLocationRequirements?:
    | WorkdayApplicantLocationRequirements
    | WorkdayApplicantLocationRequirements[];
};

export type WorkdayJobIdentifier = {
  "@type": "PropertyValue";
  name: string;
  value: string;
};

export type WorkdayHiringOrganization = {
  "@type": "Organization";
  name: string;
  sameAs?: string;
};

export type WorkdayJobLocation = {
  "@type": "Place";
  address?: WorkdayPostalAddress;
};

export type WorkdayPostalAddress = {
  "@type": "PostalAddress";
  addressCountry?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  streetAddress?: string;
};

export type WorkdayApplicantLocationRequirements = {
  "@type": "Country";
  name: string;
};