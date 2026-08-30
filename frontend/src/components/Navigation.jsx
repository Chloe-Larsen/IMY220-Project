import { Link, useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.jpeg';
import { FiHome } from 'react-icons/fi';
import { FiSearch } from 'react-icons/fi';
import { FiLogOut } from 'react-icons/fi';
import { FiUser } from 'react-icons/fi';

export default function Navigation({ isLoggedIn: propIsLoggedIn }) {
    const navigate = useNavigate();
    
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
                        <span className="nav-icon-symbol"><FiHome size={24} /></span>
                    </Link>
                    <Link to="/search" className="nav-icon-link" title="Search / Requests">
                        <span className="nav-icon-symbol"><FiSearch size={24}/></span> 
                    </Link>
                    <Link to="/profile/1" className="nav-icon-link" title="My Profile">
                        <span className="nav-icon-symbol"><FiUser size={24}/></span>
                    </Link>
                    <button onClick={handleLogout} className="nav-icon-button" title="Log Out">
                        <span className="nav-icon-symbol"><FiLogOut size={24}/></span>
                    </button>
                </nav>
            ) : (
                <div className="nav-logged-out-actions">
                    <button className="wireframe-btn" onClick={() => navigate('/signup')}>
                        Create Account
                    </button>
                    <button className="wireframe-btn" onClick={() => navigate('/login')} style={{ backgroundColor: 'var(--tags-color)', color: 'var(--text-main)' }}>
                        Sign In
                    </button>
                </div>
            )}
        </header>
    );
}