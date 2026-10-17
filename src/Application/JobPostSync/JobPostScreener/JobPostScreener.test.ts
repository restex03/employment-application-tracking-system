import { describe, expect, it } from "vitest";
import { JobPostScreener } from "./JobPostScreener";
import { IJobPostDiscovery } from "../../../Domain/JobPosts/IJobPostDiscovery";

describe("JobPostScreener", () => {
    const screener = new JobPostScreener();

    // Only the title is relevant to the screener.
    const screen = (title: string): boolean => screener.screenJobPost({ title } as IJobPostDiscovery);

    describe("passList", () => {
        it.each([
            // General software engineering
            "Software Engineer",
            "Senior Software Engineer",
            "Software Developer II",
            "Software Development Engineer",
            "Software Programmer",
            "Backend Engineer",
            "Back-End Developer",
            "Back End Engineer",
            "Frontend Engineer",
            "Front-End Developer",
            "Full Stack Developer",
            "Full-Stack Engineer",
            "Web Developer",
            "API Engineer",
            "Application Developer",
            "Platform Engineer",

            // Languages and frameworks
            ".NET Developer",
            "Dotnet Engineer",
            "C# Developer",
            "CSharp Developer",
            "ASP.NET Developer",
            "TypeScript Developer",
            "JavaScript Engineer",
            "Node.js Developer",
            "React Developer",
            "Java Developer",
            "Python Engineer",

            // AI and machine learning
            "AI Engineer",
            "Sr AI Software Engineer",
            "Senior AI Application Engineer",
            "GenAI Engineer",
            "Gen-AI Engineer",
            "LLM Engineer",
            "Agentic Systems Engineer",
            "AI Agent Engineer",
            "Machine Learning Engineer",
            "ML Engineer",
            "RAG Engineer",
            "Generative AI Engineer",

            // Adjacent engineering
            "Cloud Engineer",
            "Infrastructure Engineer",
            "Integration Engineer",
            "Automation Engineer",
            "Distributed Systems Engineer",
            "Systems Engineer",
            "Solutions Engineer",
            "Software Architect",
            "Member of Technical Staff",
        ])("includes relevant title: %s", title => {
            expect(screen(title)).toBe(true);
        });

        it.each([
            "Accountant",
            "Business Analyst",
            "Financial Analyst",
            "Project Manager",
            "Product Manager",
            "Human Resources Specialist",
            "Customer Service Representative",
            "Mechanical Engineer",
            "Civil Engineer",
            "Registered Nurse",
        ])("excludes title without passList match: %s", title => {
            expect(screen(title)).toBe(false);
        });
    });

    describe("failList", () => {
        it.each([
            // Unwanted job functions
            "Software Recruiter",
            "Technical Recruiting Specialist - Software",
            "Talent Acquisition - AI",
            "Software Account Executive",
            "Software Account Manager",
            "Software Executive Assistant",
            "Software Associate Director",
            "Software Senior Director",
            "Software Project Manager",
            "Director of Software Engineering",
            "Vice President of AI",
            "VP Software Development",
            "Software Engineer Intern",
            "Software Engineering Internship",

            // Geographic exclusions
            "Software Engineer - India",
            "AI Engineer - Taiwan",
            "Software Developer - China",
            "Software Engineer - Hong Kong",
            "Software Engineer - Macau",
            "Software Engineer - Macao",
            "Software Engineer - Pakistan",
            "Software Engineer - Bangladesh",
            "Software Engineer - Sri Lanka",
            "Software Engineer - Nepal",
            "Software Engineer - Singapore",
            "Software Engineer - Malaysia",
            "Software Engineer - Indonesia",
            "Software Engineer - Philippines",
            "Software Engineer - Vietnam",
            "Software Engineer - Thailand",
            "Software Engineer - Japan",
            "Software Engineer - South Korea",
            "Software Engineer - Republic of Korea",
            "Senior Engineer C# & Kafka - Bengaluru",
            "Software Engineer – Cisco IQ | Bangalore",
            "Software Engineer - Trivandrum",
            "Software Engineer - Mumbai",
            "Software Engineer - Canada",
            "Software Engineer - Ireland",
            "Software Engineer - Puerto Rico",
        ])("excludes title matching failList: %s", title => {
            expect(screen(title)).toBe(false);
        });

        it("gives failList precedence over passList", () => {
            expect(screen("Senior AI Software Engineer - India")).toBe(false);
            expect(screen("Director of Software Engineering")).toBe(false);
        });
    });

    describe("word boundaries", () => {
        it.each([
            "Training Coordinator",
            "Maintenance Technician",
            "Aircraft Mechanic",
            "Retail Associate",
            "Claims Adjuster",
        ])("does not accidentally match AI in: %s", title => {
            expect(screen(title)).toBe(false);
        });

        it.each([
            "Software Engineer - Indiana",
            "Software Engineer - Indianapolis",
            "Software Engineer - Indian Trail, NC",
            "Software Engineer - Chinatown, NYC",
            "Software Engineer - Japanese Market",
            "Software Engineer - Canadian team",
            "Software Engineer - Puerto Ricochet",
        ])("does not accidentally match geographic exclusions: %s", title => {
            expect(screen(title)).toBe(true);
        });
    });

    describe("case insensitivity", () => {
        it.each(["AI ENGINEER", "ai engineer", "Ai Engineer", "SOFTWARE DEVELOPER", "software developer"])(
            "accepts regardless of capitalization: %s",
            title => {
                expect(screen(title)).toBe(true);
            }
        );

        it.each(["SOFTWARE ENGINEER - INDIA", "software engineer - india"])(
            "rejects regardless of capitalization: %s",
            title => {
                expect(screen(title)).toBe(false);
            }
        );
    });

    describe("determinism and statelessness", () => {
        it("returns the same result across repeated calls", () => {
            const title = "Senior AI Software Engineer";

            for (let i = 0; i < 100; i++) {
                expect(screen(title)).toBe(true);
            }
        });

        it("produces consistent results across instances", () => {
            const instances = Array.from({ length: 100 }, () => new JobPostScreener());

            const jobPost = {
                title: "Senior Backend Engineer",
            } as IJobPostDiscovery;

            for (const instance of instances) {
                expect(instance.screenJobPost(jobPost)).toBe(true);
            }
        });
    });
});
