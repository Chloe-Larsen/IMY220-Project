import { Link, useNavigate } from 'react-router-dom';
import { FiHome, FiSearch, FiUser, FiLogOut } from 'react-icons/fi';

export default function Navigation({ isLoggedIn = true, home = false, search = false, profile = false}) {
  const navigate = useNavigate();
  const loggedInUser = JSON.parse(localStorage.getItem('user')) || { username: 'avian_chloe' };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="wireframe-desktop-nav">
      {isLoggedIn ?
        (<Link to="/home" className="nav-brand-container">
          <span className="brand-logo">TipTap</span>
        </Link>) : (
          <Link to="/" className="nav-brand-container">
            <span className="brand-logo">TipTap</span>
          </Link>
        )}

      {isLoggedIn ? (
        <nav className="nav-logged-in-icons">
          <Link to="/home" className={`${home ? `nav-icon-link-current` : 'nav-icon-link'}`} title="Home">
            <FiHome className="nav-icon-symbol" />
          </Link>
          <Link to="/search" className={`${search ? `nav-icon-link-current` : 'nav-icon-link'}`} title="Search">
            <FiSearch className="nav-icon-symbol" />
          </Link>
          <Link to={`/profile/${loggedInUser.username}`} className={`${profile ? `nav-icon-link-current` : 'nav-icon-link'}`} title="My Profile">
            <FiUser className="nav-icon-symbol" />
          </Link>
          <button type="button" className="nav-icon-button" onClick={handleLogout} title="Log Out">
            <FiLogOut className="nav-icon-symbol" />
          </button>
        </nav>
      ) : (
        <div className="nav-logged-out-actions">
          <Link to="/signup" className="wireframe-btn">Create Account</Link>
          <Link to="/login" className="wireframe-btn" style={{ backgroundColor: 'var(--tags-color)', color: 'var(--text-main)' }}>Sign In</Link>
        </div>
      )}
    </header>
  );
}