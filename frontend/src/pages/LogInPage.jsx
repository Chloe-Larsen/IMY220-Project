import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.jpeg';
import Footer from '../components/Footer';
import Navigation from '../components/Navigation';

export default function LoginPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        identifier: '',
        password: ''
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.identifier.trim() || !formData.password.trim()) {
            setError('Please fill in all fields.');
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) {
                navigate('/home');
            } else {
                setError(data.message || 'Login failed.');
            }
        } catch {
            setError('Backend connection error. Ensure your server is running.');
        }
    };

    return (
        <div className="app-container login-desktop-container">
            <Navigation isLoggedIn={false} />
            <main className="login-desktop-split">
                <section className="login-left-pane">
                    <form onSubmit={handleSubmit} className="login-form-content">
                        {error && <p className="form-error-msg">{error}</p>}

                        <div className="login-actions-row">
                            <button
                                type="button"
                                className="back-arrow-btn"
                                onClick={() => navigate('/')}
                                aria-label="Back"
                            >
                                ←
                            </button>
                        </div>

                        <div className="input-group">
                            <label className="wireframe-label" htmlFor="identifier">
                                Email Address/Username
                            </label>
                            <input
                                id="identifier"
                                className="form-input login-wireframe-input"
                                type="text"
                                placeholder="Input"
                                value={formData.identifier}
                                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label className="wireframe-label" htmlFor="password">
                                Password
                            </label>
                            <input
                                id="password"
                                className="form-input login-wireframe-input"
                                type="password"
                                placeholder="Input"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                            <span className="forgot-password-text">Forget Password</span>
                        </div>

                        <div className="login-actions-row">
                            <button type="submit" className="wireframe-btn login-action-btn" style={{marginBottom: '20px'}}>
                                Log In
                            </button>
                        </div>
                    </form>
                </section>

                <section className="login-right-pane">
                    <img
                        src={logoImg}
                        alt="TipTap Showcase Logo"
                        className="login-graphic-preview"
                    />
                </section>
            </main>
            <Footer isLoggedIn={false} />
        </div>
    );
}