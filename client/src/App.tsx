import JobPostsPage from "./pages/JobPostsPage";
import "./App.css";

function App() {
    return (
        <div className="app">
            <header className="app-header">
                <h1>Employment Application & Alignment Tracking System</h1>
            </header>
            <main className="app-main">
                <JobPostsPage />
            </main>
        </div>
    );
}

export default App;
