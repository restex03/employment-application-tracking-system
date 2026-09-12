import JobPostsPage from "./pages/JobPostsPage";
import HamburgerMenu from "./components/HamburgerMenu";
import "./App.css";

function App() {
    return (
        <div className="app">
            <header className="app-header">
                <h1>Employment Application & Alignment Tracking System</h1>
                <HamburgerMenu items={[{ label: "Job Posts", active: true }]} />
            </header>
            <main className="app-main">
                <JobPostsPage />
            </main>
        </div>
    );
}

export default App;
