export type JobPostingDetail = {
    "@context": string;
    "@type": "JobPosting";

    title: string;
    description: string;

    identifier?: JobIdentifier;

    datePosted?: string;
    validThrough?: string;

    employmentType?: string;

    hiringOrganization?: HiringOrganization;

    jobLocation?: JobLocation | JobLocation[];  

    jobLocationType?: string;

    applicantLocationRequirements?:
        | ApplicantLocationRequirements
        | ApplicantLocationRequirements[];
};

export type JobIdentifier = {
    "@type": "PropertyValue";
    name: string;
    value: string;
};

export type HiringOrganization = {
    "@type": "Organization";
    name: string;
    sameAs?: string;
};

export type JobLocation = {
    "@type": "Place";
    address?: PostalAddress;
};

export type PostalAddress = {
    "@type": "PostalAddress";

    addressCountry?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    streetAddress?: string;
};

export type ApplicantLocationRequirements = {
    "@type": "Country";
    name: string;
};