import Navigation from "../components/Navigation"
import Footer from "../components/Footer"

export default function ActivityPage() {
    return (
        <div className="app-container profile-desktop-screen">
            <Navigation isLoggedIn={true} isActivity={true} />
            <h1>Activity Page</h1>
            <Footer isLoggedIn={true} />
        </div>);
}