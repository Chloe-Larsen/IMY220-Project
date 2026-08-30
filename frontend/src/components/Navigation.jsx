import { Link, useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.jpeg';

export default function Navigation({ isLoggedIn: propIsLoggedIn }) {
    const navigate = useNavigate();

    // Determine auth state via prop or saved auth token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const isAuthenticated = propIsLoggedIn !== undefined ? propIsLoggedIn : Boolean(token);

    const handleLogout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        navigate('/');
    };

    return (
        <header className="wireframe-desktop-nav">
            <Link to={isAuthenticated ? '/home' : '/'} className="nav-brand-container">
                <img src={logoImg} alt="TipTap Logo" className="nav-logo-image" />
                <span className="brand-logo">TipTap</span>
            </Link>

            {isAuthenticated ? (
                <nav className="nav-logged-in-icons">
                    <Link to="/home" className="nav-icon-link" title="Home Feed">
                        <span className="nav-icon-symbol">⌂</span>
                    </Link>
                    <Link to="/requests" className="nav-icon-link" title="Search / Requests">
                        <span className="nav-icon-symbol">🔍</span>
                    </Link>
                    <Link to="/profile/1" className="nav-icon-link" title="My Profile">
                        <span className="nav-icon-symbol">👤</span>
                    </Link>
                    <button onClick={handleLogout} className="nav-icon-button" title="Log Out">
                        <span className="nav-icon-symbol">[→</span>
                    </button>
                </nav>
            ) : (
                <div className="nav-logged-out-actions">
                    <button className="wireframe-btn" onClick={() => navigate('/signup')}>
                        Create Account
                    </button>
                    <button className="wireframe-btn" onClick={() => navigate('/login')}  style={{ backgroundColor: 'var(--tags-color)', color: 'var(--text-main)' }}>
                        Sign In
                    </button>
                </div>
            )}
        </header>
    );
}