import { Link, useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.jpeg';
import Image from './Image';

export default function Footer() {
    const navigate = useNavigate();
    const loggedInUser = JSON.parse(localStorage.getItem('user'));
    const isLoggedIn = loggedInUser ? true : false;
    const isUserAdmin = loggedInUser && loggedInUser.role ? loggedInUser.role === "admin" : false;

    const handleLogout = async () => {
        try {
            await fetch('http://localhost:5000/api/auth/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (err) {
            console.error('Network error during backend logout:', err);
        } finally {            
            localStorage.removeItem('user');
            localStorage.removeItem('token');            
            navigate('/');
        }
    };

    return (
        <footer className="wireframe-footer">
            <div className="footer-brand-container">
                <Image
                    imageValue={logoImg}
                    altText="TipTap Logo"
                    className="footer-logo-img" />
                <span className="brand-logo footer-brand-text">TipTap</span>
            </div>

            {isLoggedIn ? (
                <nav className="footer-nav-links">
                    <span>© 2026 Developed by Chloe Larsen (u25004141)</span>
                    <a href="https://github.com/Chloe-Larsen/IMY220-Project" target="_blank" rel="noreferrer">GitHub Repo</a>
                    <Link to="/home" className="footer-link">Home</Link>
                    <Link to="/search" className="footer-link">Search</Link>
                    <Link to={`/profile/${loggedInUser.username}`} className="footer-link">Profile</Link>
                    <Link to="/activity" className="footer-link">Activity</Link>
                    {isUserAdmin && <Link to="/admin" className="footer-link">Admin</Link>}
                    <button onClick={handleLogout} className="footer-logout-btn">
                        Log Out
                    </button>
                </nav>
            ) : (
                <div className="footer-public-info">
                    <span>© 2026 Developed by Chloe Larsen (u25004141)</span>
                    <a href="https://github.com/Chloe-Larsen/IMY220-Project" target="_blank" rel="noreferrer">GitHub Repo</a>
                </div>
            )}
        </footer>
    );
}