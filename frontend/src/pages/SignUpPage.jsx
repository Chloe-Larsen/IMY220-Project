import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.jpeg';
import Footer from '../components/Footer';
import Navigation from '../components/Navigation';

export default function SignUpPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
    confirmPassword: '',
    pronouns: '',
    username: '',
    bio: '',
    links: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {        
        navigate('/home');
      } else {
        setError(data.message || 'Sign up failed.');
      }
    } catch {
      setError('Backend connection error. Please ensure Express is running.');
    }
  };

  return (
    <div className="app-container signup-wireframe-screen">
      <Navigation isLoggedIn={false} />    

      <div className="signup-bottom-action-row">
        <button
          type="button"
          className="back-arrow-btn"
          onClick={() => navigate('/')}
          aria-label="Back"
        >
          ←
        </button>
      </div>

      {error && <p className="form-error-msg">{error}</p>}

      <form onSubmit={handleSubmit} className="signup-wireframe-form" style={{ paddingBottom: '20px' }}>
        <div className="signup-three-columns-wrapper">
          <div className="signup-column">
            <div className="signup-field-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Input"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="signup-field-group">
              <label htmlFor="surname">Surname</label>
              <input
                id="surname"
                name="surname"
                type="text"
                placeholder="Input"
                value={formData.surname}
                onChange={handleChange}
                required
              />
            </div>

            <div className="signup-field-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Input"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="signup-vertical-divider"></div>

          <div className="signup-column">
            <div className="signup-field-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Input"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="signup-field-group">
              <label htmlFor="confirmPassword">Password Again</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Input"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <div className="signup-field-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Input"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="signup-vertical-divider"></div>

          <div className="signup-column">
            <div className="signup-field-group">
              <label htmlFor="pronouns">Pronouns</label>
              <div className="signup-pronoun-input-container">
                <input
                  id="pronouns"
                  name="pronouns"
                  type="text"
                  placeholder="Input"
                  value={formData.pronouns}
                  onChange={handleChange}
                />
                <button type="button" className="link-plus-btn">+</button>
              </div>
            </div>

            <div className="signup-field-group">
              <label htmlFor="bio">Short Bio</label>
              <input
                id="bio"
                name="bio"
                type="text"
                placeholder="Input"
                value={formData.bio}
                onChange={handleChange}
              />
            </div>

            <div className="signup-field-group">
              <label htmlFor="links">Links</label>
              <div className="signup-link-input-container">
                <input
                  id="links"
                  name="links"
                  type="text"
                  placeholder="Input"
                  value={formData.links}
                  onChange={handleChange}
                />
                <button type="button" className="link-plus-btn">+</button>
              </div>
            </div>
          </div>
        </div>

        <div className="signup-bottom-action-row">
          <button type="submit" className="signup-green-btn" style={{marginTop: '20px'}}>
            Sign Up
          </button>
        </div>
      </form>
      <Footer isLoggedIn={false}/>
    </div>
  );
}