import { Link, useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.jpeg';

export default function Footer({ isLoggedIn: propIsLoggedIn }) {
    const navigate = useNavigate();

    // Check prop or localStorage auth token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const isAuthenticated = propIsLoggedIn !== undefined ? propIsLoggedIn : Boolean(token);

    const handleLogout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        navigate('/');
    };

    return (
        <footer className="wireframe-footer">
            <div className="footer-brand-container">
                <img src={logoImg} alt="TipTap Logo" className="footer-logo-img" />
                <span className="brand-logo footer-brand-text">TipTap</span>
            </div>

            {isAuthenticated ? (
                <nav className="footer-nav-links">
                    <Link to="/home" className="footer-link">Home</Link>                    
                    <Link to="/search" className="footer-link">Search</Link>      
                    <Link to="/profile/1" className="footer-link">Profile</Link>
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