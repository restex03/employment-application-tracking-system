import { useState } from "react";
import JobPostsPage from "./pages/JobPostsPage";
import CandidateProfilesPage from "./pages/CandidateProfilesPage";
import HamburgerMenu from "./components/HamburgerMenu";
import "./App.css";

type Page = "job-posts" | "candidate-profiles";

function App() {
    const [activePage, setActivePage] = useState<Page>("job-posts");

    return (
        <div className="app">
            <header className="app-header">
                <h1>Employment Application & Alignment Tracking System</h1>
                <HamburgerMenu
                    items={[
                        {
                            label: "Job Posts",
                            active: activePage === "job-posts",
                            onSelect: () => setActivePage("job-posts"),
                        },
                        {
                            label: "Candidate Profiles",
                            active: activePage === "candidate-profiles",
                            onSelect: () => setActivePage("candidate-profiles"),
                        },
                    ]}
                />
            </header>
            <main className="app-main">
                {activePage === "job-posts" ? <JobPostsPage /> : <CandidateProfilesPage />}
            </main>
        </div>
    );
}

export default App;
